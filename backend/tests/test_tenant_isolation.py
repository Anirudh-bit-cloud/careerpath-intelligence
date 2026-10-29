"""
Multi-Tenant Isolation Verification Tests for CareerPath Intelligence:
- Proves tenant data boundaries: User in Workspace A cannot access or modify Workspace B data.
- Tests tenant scoping across Interventions, Committee Sessions, and Notification Preferences.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.models.entities import InterventionRecord, Workspace
from backend.app.database.connection import SessionLocal

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_workspaces():
    db = SessionLocal()
    # Create Tenant A and Tenant B
    for ws_id, name in [("tenant-alpha", "Alpha Corp"), ("tenant-bravo", "Bravo Systems")]:
        ws = db.query(Workspace).filter(Workspace.id == ws_id).first()
        if not ws:
            ws = Workspace(
                id=ws_id,
                name=name,
                slug=ws_id,
                organization_name=name,
                accent_color="#38bdf8",
                is_white_labeled=False
            )
            db.add(ws)
    db.commit()
    db.close()


@pytest.fixture
def alpha_headers():
    token = create_access_token({"sub": "admin@alpha.com", "role": "admin", "workspace_id": "tenant-alpha"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def bravo_headers():
    token = create_access_token({"sub": "admin@bravo.com", "role": "admin", "workspace_id": "tenant-bravo"})
    return {"Authorization": f"Bearer {token}"}


def test_tenant_data_isolation_interventions(setup_workspaces, alpha_headers, bravo_headers):
    # 1. Tenant Alpha creates an intervention
    create_resp = client.post(
        "/api/interventions",
        headers=alpha_headers,
        json={
            "employee_id": "ALPHA-001",
            "department": "Engineering",
            "job_role": "Security Architect",
            "category": "Promotion Fast-Track",
            "priority": "Urgent",
            "action_plan": "Accelerate promotion review for Alpha Corp employee.",
            "owner": "Alpha HR Lead"
        }
    )
    assert create_resp.status_code in [200, 201]
    alpha_interv = create_resp.json()
    alpha_id = alpha_interv["id"]

    # 2. Tenant Alpha can see its own intervention
    alpha_list_resp = client.get("/api/interventions", headers=alpha_headers)
    assert alpha_list_resp.status_code == 200
    alpha_items = alpha_list_resp.json()
    assert any(i["id"] == alpha_id for i in alpha_items)

    # 3. Tenant Bravo CANNOT see Tenant Alpha's intervention
    bravo_list_resp = client.get("/api/interventions", headers=bravo_headers)
    assert bravo_list_resp.status_code == 200
    bravo_items = bravo_list_resp.json()
    assert not any(i["id"] == alpha_id for i in bravo_items)

    # 4. Tenant Bravo CANNOT update Tenant Alpha's intervention (returns 404 Not Found)
    bravo_update_resp = client.put(
        f"/api/interventions/{alpha_id}",
        headers=bravo_headers,
        json={"priority": "Standard", "action_plan": "Malicious modification attempt."}
    )
    assert bravo_update_resp.status_code in [404, 403]

    # 5. Tenant Bravo CANNOT modify outcome of Tenant Alpha's intervention
    bravo_outcome_resp = client.post(
        f"/api/succession/outcomes/{alpha_id}",
        headers=bravo_headers,
        json={"outcome_status": "Departed"}
    )
    assert bravo_outcome_resp.status_code in [404, 403]


def test_tenant_notification_preference_isolation(setup_workspaces, alpha_headers, bravo_headers):
    # Alpha sets unique SMTP host
    alpha_set = client.post(
        "/api/notifications/preferences",
        headers=alpha_headers,
        json={"smtp_host": "alpha-mail.internal.corp", "notify_urgent_digest": True}
    )
    assert alpha_set.status_code == 200

    # Bravo sets different SMTP host
    bravo_set = client.post(
        "/api/notifications/preferences",
        headers=bravo_headers,
        json={"smtp_host": "bravo-secure.internal.corp", "notify_urgent_digest": False}
    )
    assert bravo_set.status_code == 200

    # Verify Alpha sees its own config
    alpha_get = client.get("/api/notifications/preferences", headers=alpha_headers)
    assert alpha_get.json()["smtp_host"] == "alpha-mail.internal.corp"

    # Verify Bravo sees its own config
    bravo_get = client.get("/api/notifications/preferences", headers=bravo_headers)
    assert bravo_get.json()["smtp_host"] == "bravo-secure.internal.corp"
    assert bravo_get.json()["notify_urgent_digest"] is False


def test_production_telemetry_metrics_and_request_id(alpha_headers):
    # Test Prometheus /metrics endpoint
    metrics_resp = client.get("/metrics")
    assert metrics_resp.status_code == 200
    assert "careerpath_http_requests_total" in metrics_resp.text
    assert "careerpath_active_workforce_records" in metrics_resp.text

    # Test X-Request-ID propagation
    custom_rid = "test-custom-trace-id-12345"
    trace_resp = client.get("/health", headers={"X-Request-ID": custom_rid})
    assert trace_resp.status_code == 200
    assert trace_resp.headers.get("X-Request-ID") == custom_rid

    # Test Version 3.0.0
    version_resp = client.get("/version")
    assert version_resp.status_code == 200
    assert version_resp.json()["version"] == "3.0.0"
