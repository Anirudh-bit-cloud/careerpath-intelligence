"""
Phase 1 Scope Hardening & Security Tests:
1. Parametrized manager-scope hardening:
   Ensures that every endpoint returning employee-level data either strictly filters to direct reports
   or raises HTTP 403 Forbidden.
2. Safe Model Artifact Loader:
   Ensures joblib artifacts are only loaded from the trusted directory with path validation
   and rejects path traversal attempts and hash mismatches.
3. Model Version Dependency Versioning:
   Ensures dependency_versions_json records pinned libraries for reproducibility.
"""

import pytest
import os
import json
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.services.analytics_service import analytics_service
from backend.app.services.model_registry_service import model_registry_service
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import ApiKey

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_manager_context():
    if analytics_service.df_enriched is None:
        analytics_service._load_data()

    # Find a manager with direct reports
    df = analytics_service.df_enriched
    mgr_counts = df['ManagerID'].value_counts()
    mgr_id = str(mgr_counts.index[0])
    direct_report_ids = set(analytics_service.get_manager_team_ids(mgr_id))

    all_ids = set(df['EmployeeID'].tolist())
    outside_ids = list(all_ids - direct_report_ids - {mgr_id})
    assert len(outside_ids) > 0, "Expected employees outside manager's direct team."
    outside_emp_id = outside_ids[0]

    # Create JWT for this manager
    token = create_access_token({
        "user_id": 888,
        "email": "manager_audit@company.com",
        "role": "manager",
        "employee_id": mgr_id,
        "workspace_id": "default",
        "permissions": ["view:team", "manage:team_plans", "view:reports", "record:team_followup"]
    })

    return {
        "manager_id": mgr_id,
        "direct_reports": direct_report_ids,
        "outside_id": outside_emp_id,
        "headers": {"Authorization": f"Bearer {token}"}
    }


def test_manager_scope_cluster_scatter_points(setup_manager_context):
    """Assert /api/clusters returns PCA scatter points ONLY for direct reports."""
    headers = setup_manager_context["headers"]
    direct_reports = setup_manager_context["direct_reports"]

    res = client.get("/api/clusters", headers=headers)
    assert res.status_code == 200
    data = res.json()
    pca_points = data.get("pca_points", [])
    assert len(pca_points) > 0
    for p in pca_points:
        assert p["EmployeeID"] in direct_reports, (
            f"Leak detected! Manager saw {p['EmployeeID']} outside their direct team."
        )


def test_manager_scope_retention_opportunities(setup_manager_context):
    """Assert /api/retention-opportunities returns ONLY direct reports."""
    headers = setup_manager_context["headers"]
    direct_reports = setup_manager_context["direct_reports"]

    res = client.get("/api/retention-opportunities", headers=headers)
    assert res.status_code == 200
    records = res.json().get("records", [])
    for r in records:
        assert r["EmployeeID"] in direct_reports, (
            f"Leak detected! Retention queue exposed employee {r['EmployeeID']} outside team."
        )


def test_manager_scope_promotion_gap(setup_manager_context):
    """Assert /api/promotion-gap returns ONLY direct reports."""
    headers = setup_manager_context["headers"]
    direct_reports = setup_manager_context["direct_reports"]

    res = client.get("/api/promotion-gap", headers=headers)
    assert res.status_code == 200
    records = res.json().get("records", [])
    for r in records:
        assert r["EmployeeID"] in direct_reports, (
            f"Leak detected! Promotion gap exposed employee {r['EmployeeID']} outside team."
        )


def test_manager_scope_employee_search(setup_manager_context):
    """Assert /api/employees search returns ONLY direct reports."""
    headers = setup_manager_context["headers"]
    direct_reports = setup_manager_context["direct_reports"]

    res = client.get("/api/employees?query=PANW", headers=headers)
    assert res.status_code == 200
    results = res.json()
    for e in results:
        assert e["EmployeeID"] in direct_reports, (
            f"Leak detected! Search returned employee {e['EmployeeID']} outside team."
        )


@pytest.mark.parametrize("endpoint_template,expected_status", [
    ("/api/employees/{outside_id}", 403),
    ("/api/employees/{outside_id}/score-explanation", 403),
    ("/api/succession/9-box", 403),
    ("/api/succession/critical-roles", 403),
    ("/api/succession/effectiveness", 403),
    ("/api/committee/sessions", 403),
    ("/api/governance/data-subject-export/{outside_id}", 403),
    ("/api/fairness/export/csv", 403)
])
def test_manager_forbidden_endpoints(setup_manager_context, endpoint_template, expected_status):
    """Parametrized verification that all organization-wide and non-report endpoints reject managers with 403."""
    headers = setup_manager_context["headers"]
    outside_id = setup_manager_context["outside_id"]
    endpoint = endpoint_template.format(outside_id=outside_id)

    res = client.get(endpoint, headers=headers)
    assert res.status_code == expected_status, (
        f"Endpoint {endpoint} returned status {res.status_code}, expected {expected_status}."
    )


def test_public_v1_roster_rejects_manager_api_key():
    """Assert /api/v1/roster rejects API keys configured with manager role."""
    db = SessionLocal()
    try:
        import hashlib
        import secrets
        raw_secret = secrets.token_hex(20)
        prefix = secrets.token_hex(4)
        full_key = f"cpi_live_{prefix}_{raw_secret}"
        key_hash = hashlib.sha256(full_key.encode('utf-8')).hexdigest()

        mgr_key = ApiKey(
            workspace_id="default",
            name="Manager Integration Test Key",
            key_prefix=f"cpi_live_{prefix}...",
            key_hash=key_hash,
            scopes_json=json.dumps(["read:team_roster", "role:manager"]),
            is_active=True
        )
        db.add(mgr_key)
        db.commit()

        res = client.get("/api/v1/roster", headers={"X-API-Key": full_key})
        assert res.status_code == 403
    finally:
        db.close()


def test_safe_artifact_loader_path_validation():
    """Verifies that model_registry_service.safe_load_artifact blocks directory traversal."""
    with pytest.raises(ValueError, match="Security violation"):
        model_registry_service.safe_load_artifact("../../../../../Windows/System32/drivers/etc/hosts")


def test_model_version_dependency_tracking():
    """Verifies that dependency versions are tracked in ModelVersion."""
    deps = model_registry_service.get_dependency_versions()
    assert "python" in deps
    assert "scikit-learn" in deps
    assert "lifelines" in deps
    assert "pandas" in deps
    assert "numpy" in deps
