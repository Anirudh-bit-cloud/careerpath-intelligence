"""
Tests for Phase 5 Succession Planning and Outcome Tracking:
- 9-box talent matrix calculation and drilldown tokens.
- Critical roles bench strength pipeline and SPOF (Single Point of Failure) detection.
- Longitudinal intervention effectiveness reporting with small sample size caveats.
- Outcome tracking update endpoint with RBAC and AuditLog verification.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.models.entities import InterventionRecord, AuditLog
from backend.app.database.connection import SessionLocal

client = TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "admin", "role": "admin", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def analyst_headers():
    token = create_access_token({"sub": "analyst", "role": "hr_analyst", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


def test_nine_box_grid_endpoint(auth_headers):
    resp = client.get("/api/succession/9-box", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "boxes" in data
    assert len(data["boxes"]) == 9
    assert "total_workforce" in data

    # Verify key box properties
    box_ids = [b["id"] for b in data["boxes"]]
    assert "high_pot_high_perf" in box_ids
    assert "low_pot_low_perf" in box_ids

    star_box = next(b for b in data["boxes"] if b["id"] == "high_pot_high_perf")
    assert star_box["performance"] == "High"
    assert star_box["potential"] == "High"
    assert "sample_employee_ids" in star_box


def test_critical_roles_endpoint(auth_headers):
    resp = client.get("/api/succession/critical-roles", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "total_critical_roles" in data
    assert "single_points_of_failure" in data
    assert "roles" in data
    assert len(data["roles"]) > 0

    first_role = data["roles"][0]
    assert "job_role" in first_role
    assert "bench_strength" in first_role
    assert "ready_now" in first_role["bench_strength"]
    assert "is_single_point_of_failure" in first_role
    assert "mitigation_strategy" in first_role


def test_intervention_effectiveness_endpoint(auth_headers):
    resp = client.get("/api/succession/effectiveness", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "categories" in data
    assert len(data["categories"]) > 0
    assert "overall_summary" in data
    assert "average_retention_rate" in data["overall_summary"]
    assert "longitudinal_disclosure" in data

    first_cat = data["categories"][0]
    assert "retained_percentage" in first_cat
    assert "promoted_percentage" in first_cat
    assert "is_small_sample" in first_cat
    assert "caveat" in first_cat


def test_update_intervention_outcome_rbac_and_audit(auth_headers, analyst_headers):
    db = SessionLocal()
    # Create or get an intervention record
    rec = db.query(InterventionRecord).first()
    if not rec:
        rec = InterventionRecord(
            workspace_id="default",
            employee_id="PANW-1042",
            department="R&D",
            job_role="Research Scientist",
            category="Career Conversation",
            action_plan="Quarterly trajectory checkin",
            owner="HRBP Lead"
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
    interv_id = rec.id
    db.close()

    # 1. Analyst role should be rejected (HTTP 403)
    unauth_resp = client.post(
        f"/api/succession/outcomes/{interv_id}",
        headers=analyst_headers,
        json={"outcome_status": "Retained", "retained_at_90_days": True}
    )
    assert unauth_resp.status_code == 403

    # 2. Admin role should succeed
    auth_resp = client.post(
        f"/api/succession/outcomes/{interv_id}",
        headers=auth_headers,
        json={
            "outcome_status": "Retained",
            "retained_at_90_days": True,
            "succession_readiness": "Ready Now",
            "notes": "Employee successfully retained following level recalibration."
        }
    )
    assert auth_resp.status_code == 200
    res_data = auth_resp.json()
    assert res_data["status"] == "success"
    assert res_data["outcome_status"] == "Retained"
    assert res_data["retained_at_90_days"] is True

    # 3. Verify database persistence and AuditLog entry
    verify_db = SessionLocal()
    updated = verify_db.query(InterventionRecord).filter(InterventionRecord.id == interv_id).first()
    assert updated.outcome_status == "Retained"
    assert updated.retained_at_90_days is True

    audit = verify_db.query(AuditLog).filter(
        AuditLog.action == "update_intervention_outcome",
        AuditLog.entity_id == str(interv_id)
    ).first()
    assert audit is not None
    assert "update_intervention_outcome" in audit.action
    verify_db.close()
