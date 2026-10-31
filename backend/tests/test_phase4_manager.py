"""
Phase 4 Tests: Role-Based Manager Experience & Scoping
- Manager authentication & JWT claims (role='manager', employee_id)
- Manager team data retrieval & KPI benchmarking
- Strict negative tests: manager CANNOT access employees outside team (403 Forbidden)
- Manager CAN access employees on their direct team (200 OK)
- Audit logging on employee score inspection
- Decision support framing acknowledgement
- Manager 1-on-1 follow-up tracking and multi-tenant isolation
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import json

from backend.app.main import app
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import User, ManagerFollowUp, AuditLog
from backend.app.core.security import hash_password, create_access_token
from backend.app.services.analytics_service import analytics_service

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_manager_data():
    db = SessionLocal()
    try:
        # Create or fetch demo manager user
        mgr_user = db.query(User).filter(User.email == "test_mgr_phase4@company.com").first()
        if not mgr_user:
            mgr_user = User(
                workspace_id="default",
                email="test_mgr_phase4@company.com",
                password_hash=hash_password("manager123"),
                full_name="Alex Morgan (Engineering Manager)",
                role="manager",
                employee_id="PANW-1044",
                is_active=True
            )
            db.add(mgr_user)
            db.commit()
            db.refresh(mgr_user)

        # Generate tokens
        mgr_token = create_access_token({
            "user_id": mgr_user.id,
            "email": mgr_user.email,
            "full_name": mgr_user.full_name,
            "role": "manager",
            "employee_id": "PANW-1044",
            "workspace_id": "default",
            "permissions": ["view:team", "manage:team_plans", "view:reports", "record:team_followup"]
        })

        admin_token = create_access_token({
            "user_id": 999,
            "email": "admin@company.com",
            "full_name": "Sarah Jenkins",
            "role": "admin",
            "employee_id": "PANW-1002",
            "workspace_id": "default",
            "permissions": ["view:analytics", "manage:users"]
        })

        yield {
            "mgr_token": mgr_token,
            "admin_token": admin_token,
            "mgr_id": "PANW-1044"
        }
    finally:
        db.close()


def test_manager_token_claims_and_login(setup_manager_data):
    """Verifies manager can log in and token includes role and employee_id claims."""
    res = client.post("/api/auth/login", json={
        "email": "test_mgr_phase4@company.com",
        "password": "manager123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["role"] == "manager"
    assert data["user"]["employee_id"] == "PANW-1044"


def test_get_my_team_and_talking_points(setup_manager_data):
    """Verifies manager team overview returns team KPIs and direct report cards with talking points."""
    headers = {"Authorization": f"Bearer {setup_manager_data['mgr_token']}"}
    res = client.get("/api/manager/my-team", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["manager_id"] == "PANW-1044"
    assert data["headcount"] > 0
    assert "team_mean_rri" in data
    assert "company_mean_rri" in data
    assert "rri_delta" in data

    # Check direct reports structure
    direct_reports = data["direct_reports"]
    assert len(direct_reports) > 0
    rep = direct_reports[0]
    assert "employee_id" in rep
    assert "rri_score" in rep
    assert "rri_tier" in rep
    assert "talking_points" in rep
    assert isinstance(rep["talking_points"], list)
    assert len(rep["talking_points"]) > 0
    # Ensure talking points are supportive, non-punitive
    tp_text = " ".join(rep["talking_points"]).lower()
    assert not any(punitive in tp_text for punitive in ["terminate", "fire", "discipline", "demote", "punish"])


def test_negative_manager_cannot_read_outside_team_record(setup_manager_data):
    """
    STRICT NEGATIVE TEST:
    Asserts that a manager cannot read an employee record outside their team.
    PANW-1044 manages a specific team. Employee PANW-1002 reports to another manager.
    Requesting PANW-1002 MUST return 403 Forbidden.
    """
    mgr_headers = {"Authorization": f"Bearer {setup_manager_data['mgr_token']}"}

    # Find an employee definitely outside PANW-1044's team
    team_ids = set(analytics_service.get_manager_team_ids("PANW-1044"))
    outside_emp = None
    for emp_id in ["PANW-1002", "PANW-1003", "PANW-1004", "PANW-1005"]:
        if emp_id not in team_ids:
            outside_emp = emp_id
            break

    assert outside_emp is not None, "Failed to identify outside employee for negative test"

    # 1. Negative test on /api/employees/{id}
    res = client.get(f"/api/employees/{outside_emp}", headers=mgr_headers)
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

    # 2. Negative test on /api/employees/{id}/score-explanation
    res_expl = client.get(f"/api/employees/{outside_emp}/score-explanation", headers=mgr_headers)
    assert res_expl.status_code == 403

    # 3. Negative test on /api/employees/{id}/ml-explanation
    res_ml = client.get(f"/api/employees/{outside_emp}/ml-explanation", headers=mgr_headers)
    assert res_ml.status_code == 403


def test_manager_can_read_direct_report_record(setup_manager_data):
    """Positive test: Manager can access an employee who IS on their team."""
    mgr_headers = {"Authorization": f"Bearer {setup_manager_data['mgr_token']}"}
    team_ids = analytics_service.get_manager_team_ids("PANW-1044")
    assert len(team_ids) > 0
    team_emp = team_ids[0]

    res = client.get(f"/api/employees/{team_emp}", headers=mgr_headers)
    assert res.status_code == 200
    assert res.json()["EmployeeID"] == team_emp


def test_individual_score_view_audit_logged(setup_manager_data):
    """Asserts that viewing an employee score creates an audit log with viewer_id, target, and purpose."""
    mgr_headers = {"Authorization": f"Bearer {setup_manager_data['mgr_token']}"}
    team_ids = analytics_service.get_manager_team_ids("PANW-1044")
    team_emp = team_ids[0]

    # Perform view
    res = client.get(f"/api/employees/{team_emp}/score-explanation", headers=mgr_headers)
    assert res.status_code == 200

    # Verify audit log in DB
    db = SessionLocal()
    try:
        log = db.query(AuditLog).filter(
            AuditLog.entity_id == team_emp,
            AuditLog.action == "employee_score.viewed"
        ).order_by(AuditLog.timestamp.desc()).first()
        assert log is not None
        details = json.loads(log.details_json)
        assert details["target_employee_id"] == team_emp
        assert "purpose" in details
    finally:
        db.close()


def test_manager_acknowledgement(setup_manager_data):
    """Verifies manager can record agreement to non-punitive decision support framing."""
    mgr_headers = {"Authorization": f"Bearer {setup_manager_data['mgr_token']}"}
    res = client.post("/api/manager/acknowledgement", headers=mgr_headers, json={
        "acknowledged": True,
        "statement": "I understand these indicators are meant to support employee growth and retention, not to evaluate performance or justify discipline."
    })
    assert res.status_code == 200
    assert res.json()["status"] == "acknowledged"


def test_manager_followup_lifecycle_and_tenant_isolation(setup_manager_data):
    """Tests scheduling a 1-on-1 follow-up, updating it with post-intervention RRI, and verifying tenant isolation."""
    mgr_headers = {"Authorization": f"Bearer {setup_manager_data['mgr_token']}"}
    team_ids = analytics_service.get_manager_team_ids("PANW-1044")
    team_emp = team_ids[0]

    # Create follow-up
    create_res = client.post("/api/manager/follow-ups", headers=mgr_headers, json={
        "employee_id": team_emp,
        "planned_date": "2026-11-20",
        "topic": "Career progression to Senior & Cloud Architecture stretch rotation",
        "talking_points_discussed": "Reviewed milestone goals and recommended cloud cert program.",
        "create_hr_intervention": True
    })
    assert create_res.status_code == 201
    followup_id = create_res.json()["id"]
    assert "baseline_rri" in create_res.json()

    # List follow-ups
    list_res = client.get("/api/manager/follow-ups", headers=mgr_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item["id"] == followup_id for item in items)

    # Complete follow-up
    update_res = client.put(f"/api/manager/follow-ups/{followup_id}", headers=mgr_headers, json={
        "status": "Completed",
        "notes": "1-on-1 completed. Employee agreed to begin cloud certification pathway."
    })
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Completed"
    assert update_res.json()["completed_at"] is not None

    # Multi-tenant isolation test: another workspace cannot access this follow-up
    other_tenant_token = create_access_token({
        "user_id": 888,
        "email": "mgr@isolated-tenant.com",
        "role": "manager",
        "employee_id": "PANW-1044",
        "workspace_id": "isolated-tenant",
        "permissions": ["view:team"]
    })
    other_headers = {"Authorization": f"Bearer {other_tenant_token}"}
    other_list = client.get("/api/manager/follow-ups", headers=other_headers)
    assert other_list.status_code == 200
    assert not any(item["id"] == followup_id for item in other_list.json())
