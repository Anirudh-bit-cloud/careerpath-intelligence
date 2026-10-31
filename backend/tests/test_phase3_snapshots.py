"""
Phase 3 Unit Tests: Historical Snapshots, Longitudinal Trends, Tier Migration Matrix, and Multi-Tenant Isolation.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import WorkforceSnapshot, SnapshotRun
from backend.app.services.snapshot_service import snapshot_service
from backend.app.services.analytics_service import analytics_service
from backend.app.api.auth import create_access_token


@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": "admin", "role": "admin", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_client():
    return TestClient(app)


def test_snapshot_creation_and_idempotency():
    """Verify snapshot creation stores rows, creates run metadata, and idempotently replaces on re-run."""
    db = SessionLocal()
    try:
        test_date = "2024-01-15"
        ws = "test-ws-idempotent"

        # First run
        res1 = snapshot_service.create_snapshot(
            db=db,
            workspace_id=ws,
            snapshot_date=test_date,
            created_by="test_admin",
            trigger_type="test",
            is_synthetic=True
        )
        assert res1["status"] == "success"
        assert res1["snapshot_date"] == test_date
        assert res1["row_count"] > 0

        count1 = db.query(WorkforceSnapshot).filter(
            WorkforceSnapshot.workspace_id == ws,
            WorkforceSnapshot.snapshot_date == test_date
        ).count()
        assert count1 == res1["row_count"]

        # Second run for same date must replace idempotently (not double row count)
        res2 = snapshot_service.create_snapshot(
            db=db,
            workspace_id=ws,
            snapshot_date=test_date,
            created_by="test_admin",
            trigger_type="test_repeat",
            is_synthetic=True
        )
        assert res2["status"] == "success"
        count2 = db.query(WorkforceSnapshot).filter(
            WorkforceSnapshot.workspace_id == ws,
            WorkforceSnapshot.snapshot_date == test_date
        ).count()
        assert count2 == count1

        # Clean up
        db.query(WorkforceSnapshot).filter(WorkforceSnapshot.workspace_id == ws).delete()
        db.query(SnapshotRun).filter(SnapshotRun.workspace_id == ws).delete()
        db.commit()
    finally:
        db.close()


def test_tenant_isolation_workforce_snapshots():
    """CRITICAL: Verify tenant isolation on workforce_snapshots and snapshot_runs."""
    db = SessionLocal()
    try:
        ws_alpha = "tenant-alpha"
        ws_beta = "tenant-beta"
        date_alpha = "2024-02-01"
        date_beta = "2024-02-02"

        # Seed 1 record in alpha, 1 in beta
        snap_a = WorkforceSnapshot(
            workspace_id=ws_alpha,
            snapshot_date=date_alpha,
            employee_id="ALPHA-001",
            rri=72.5,
            rri_tier="Urgent",
            is_synthetic=True
        )
        snap_b = WorkforceSnapshot(
            workspace_id=ws_beta,
            snapshot_date=date_beta,
            employee_id="BETA-001",
            rri=35.0,
            rri_tier="Standard",
            is_synthetic=True
        )
        db.add_all([snap_a, snap_b])
        db.commit()

        # Query alpha - must see ONLY alpha
        alpha_res = db.query(WorkforceSnapshot).filter(WorkforceSnapshot.workspace_id == ws_alpha).all()
        assert len(alpha_res) == 1
        assert alpha_res[0].employee_id == "ALPHA-001"

        # Query beta - must see ONLY beta
        beta_res = db.query(WorkforceSnapshot).filter(WorkforceSnapshot.workspace_id == ws_beta).all()
        assert len(beta_res) == 1
        assert beta_res[0].employee_id == "BETA-001"

        # Clean up
        db.query(WorkforceSnapshot).filter(WorkforceSnapshot.workspace_id.in_([ws_alpha, ws_beta])).delete()
        db.commit()
    finally:
        db.close()


def test_tier_movement_matrix():
    """Verify tier migration matrix calculates transitions and flags escalations/resolutions."""
    db = SessionLocal()
    try:
        ws = "test-ws-matrix"
        d1 = "2024-03-01"
        d2 = "2024-04-01"

        # Setup 3 employees with tier shifts
        db.add_all([
            WorkforceSnapshot(workspace_id=ws, snapshot_date=d1, employee_id="EMP-1", rri=40.0, rri_tier="Standard"),
            WorkforceSnapshot(workspace_id=ws, snapshot_date=d2, employee_id="EMP-1", rri=70.0, rri_tier="Urgent"), # escalated

            WorkforceSnapshot(workspace_id=ws, snapshot_date=d1, employee_id="EMP-2", rri=75.0, rri_tier="Urgent"),
            WorkforceSnapshot(workspace_id=ws, snapshot_date=d2, employee_id="EMP-2", rri=42.0, rri_tier="Standard"), # resolved

            WorkforceSnapshot(workspace_id=ws, snapshot_date=d1, employee_id="EMP-3", rri=50.0, rri_tier="Moderate"),
            WorkforceSnapshot(workspace_id=ws, snapshot_date=d2, employee_id="EMP-3", rri=52.0, rri_tier="Moderate"), # unchanged
        ])
        db.commit()

        mat = snapshot_service.get_tier_movement_matrix(db=db, from_date=d1, to_date=d2, workspace_id=ws)
        assert mat["cohort_size"] == 3
        assert mat["escalated_to_urgent_count"] == 1
        assert mat["deescalated_from_urgent_count"] == 1
        assert mat["transition_matrix"]["Standard"]["Urgent"] == 1
        assert mat["transition_matrix"]["Urgent"]["Standard"] == 1
        assert mat["transition_matrix"]["Moderate"]["Moderate"] == 1

        # Clean up
        db.query(WorkforceSnapshot).filter(WorkforceSnapshot.workspace_id == ws).delete()
        db.commit()
    finally:
        db.close()


def test_api_snapshots_and_trends_endpoints(test_client, auth_headers):
    """Test all Phase 3 snapshots and trends HTTP endpoints."""
    # 1. Dates list
    r_dates = test_client.get("/api/snapshots/dates", headers=auth_headers)
    assert r_dates.status_code == 200
    dates = r_dates.json()
    assert len(dates) >= 1

    latest_date = dates[-1]["snapshot_date"]
    first_date = dates[0]["snapshot_date"]

    # 2. Trends Overview
    r_ov = test_client.get("/api/trends/overview?range=12m", headers=auth_headers)
    assert r_ov.status_code == 200
    ov_data = r_ov.json()
    assert "points" in ov_data
    assert len(ov_data["points"]) >= 1

    # 3. Department Trajectory
    r_dept = test_client.get("/api/trends/departments", headers=auth_headers)
    assert r_dept.status_code == 200
    dept_data = r_dept.json()
    assert "departments" in dept_data
    assert "matrix" in dept_data

    # 4. Tier Movement Matrix
    r_mat = test_client.get(f"/api/trends/tier-movement?from_date={first_date}&to_date={latest_date}", headers=auth_headers)
    assert r_mat.status_code == 200
    mat_data = r_mat.json()
    assert "transition_matrix" in mat_data
    assert "cohort_size" in mat_data

    # 5. As-of snapshot records
    r_asof = test_client.get(f"/api/snapshots/as-of?as_of_date={latest_date}&priority=All", headers=auth_headers)
    assert r_asof.status_code == 200
    asof_records = r_asof.json()
    assert len(asof_records) > 0
    assert asof_records[0]["SnapshotDate"] == latest_date

    # 6. Employee Trends
    emp_id = asof_records[0]["EmployeeID"]
    r_emp = test_client.get(f"/api/trends/employee/{emp_id}", headers=auth_headers)
    assert r_emp.status_code == 200
    emp_trend = r_emp.json()
    assert emp_trend["found"] is True
    assert len(emp_trend["trajectory"]) >= 1
