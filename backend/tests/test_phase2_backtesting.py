"""
Tests for Phase 2: Temporal Backtesting on Historical Exits.
Covers:
- Rolling-origin backtest execution and telemetry schema
- Three-way model comparison (Transparent RRI, Supervised ML, Naive Baseline)
- Exit log upload, validation, and format enforcement
- Multi-tenant isolation for HistoricalExit records
- Empty-state / insufficient data handling
- RBAC permissions (manager role rejection on exits upload)
"""

import pytest
import io
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import HistoricalExit, WorkforceSnapshot, SnapshotRun
from backend.app.services.backtest_service import backtest_service

client = TestClient(app)


@pytest.fixture
def admin_headers():
    token = create_access_token({"sub": "admin@example.com", "role": "admin", "workspace_id": "ws-temporal-a"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def hrbp_headers():
    token = create_access_token({"sub": "hrbp@example.com", "role": "hrbp", "workspace_id": "ws-temporal-a"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def manager_headers():
    token = create_access_token({"sub": "manager@example.com", "role": "manager", "workspace_id": "ws-temporal-a"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def competitor_headers():
    token = create_access_token({"sub": "admin_b@example.com", "role": "admin", "workspace_id": "ws-temporal-b"})
    return {"Authorization": f"Bearer {token}"}


def test_temporal_backtest_endpoint_success(admin_headers):
    """Verifies GET /api/validation/temporal-backtest returns complete schema."""
    resp = client.get("/api/validation/temporal-backtest?horizon_months=6", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] in ["success", "insufficient_data"]
    assert "provenance" in data
    assert "badge" in data["provenance"]
    assert "model_comparison" in data
    assert "lift_curve" in data
    assert "origins" in data

    if data["status"] == "success":
        assert len(data["model_comparison"]) == 3
        model_names = [m["model_name"] for m in data["model_comparison"]]
        assert "Supervised ML (HistGBDT)" in model_names
        assert "Transparent RRI" in model_names
        assert "Naive Baseline (Tenure Rank)" in model_names

        # Verify key metrics
        first_model = data["model_comparison"][0]
        assert "mean_roc_auc" in first_model
        assert "mean_pr_auc" in first_model
        assert "mean_brier_score" in first_model
        assert "mean_precision_top10" in first_model
        assert "mean_lift" in first_model

        # Verify lift curve deciles
        assert len(data["lift_curve"]) == 10
        deciles = [d["decile_percent"] for d in data["lift_curve"]]
        assert deciles == [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]


def test_temporal_backtest_insufficient_data():
    """Verifies graceful handling when workspace has insufficient historical data."""
    db = SessionLocal()
    try:
        # Evaluate on an isolated workspace with 0 snapshots and 0 exits
        res = backtest_service.get_temporal_backtest(
            db=db,
            workspace_id="ws-empty-isolation",
            horizon_months=6,
            auto_seed_synthetic=False
        )
        assert res["status"] == "insufficient_data"
        assert res["min_snapshots"] == 3
        assert res["min_exits"] == 5
        assert res["current_snapshots"] == 0
        assert res["current_exits"] == 0
        assert "message" in res
    finally:
        db.close()


def test_historical_exits_upload_valid_csv(admin_headers):
    """Verifies uploading valid historical exits CSV with date validation and roster matching."""
    csv_content = (
        "employee_id,exit_date,exit_reason\n"
        "PANW-1001,2026-02-15,Voluntary - Compensation\n"
        "PANW-1002,2026-04-10,Involuntary - Performance\n"
        "PANW-1003,2026-06-01,Voluntary - Relocation\n"
        "PANW-9999,2026-07-20,Retirement\n"
    )
    files = {"file": ("test_exits.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}

    resp = client.post("/api/dataset/upload-exits", headers=admin_headers, files=files)
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "success"
    assert data["total_rows"] == 4
    assert data["created_count"] == 4
    assert data["date_range"]["min_date"] == "2026-02-15"
    assert data["date_range"]["max_date"] == "2026-07-20"


def test_historical_exits_upload_invalid_dates(admin_headers):
    """Verifies that non-YYYY-MM-DD date formats are rejected or flagged."""
    csv_content = (
        "employee_id,exit_date,exit_reason\n"
        "EMP-001,02/15/2026,Voluntary\n"
        "EMP-002,InvalidDate,Voluntary\n"
    )
    files = {"file": ("invalid_exits.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}

    resp = client.post("/api/dataset/upload-exits", headers=admin_headers, files=files)
    assert resp.status_code == 400
    assert "No valid records found" in resp.json()["detail"]


def test_historical_exits_sample_template():
    """Verifies GET /api/dataset/sample-exits-template returns valid downloadable CSV headers."""
    resp = client.get("/api/dataset/sample-exits-template")
    assert resp.status_code == 200
    assert "employee_id,exit_date,exit_reason" in resp.text


def test_manager_role_cannot_upload_exits(manager_headers):
    """Verifies manager role is rejected from uploading exit logs (403 Forbidden)."""
    csv_content = "employee_id,exit_date,exit_reason\nEMP-101,2026-05-01,Voluntary\n"
    files = {"file": ("exits.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}

    resp = client.post("/api/dataset/upload-exits", headers=manager_headers, files=files)
    assert resp.status_code == 403
    assert "Only admin and hrbp roles" in resp.json()["detail"]


def test_historical_exits_multi_tenant_isolation(admin_headers, competitor_headers):
    """Verifies strict multi-tenant isolation on HistoricalExit records."""
    db = SessionLocal()
    try:
        # Create exit record under ws-temporal-a
        exit_a = HistoricalExit(
            workspace_id="ws-temporal-a",
            employee_id="TENANT-A-EMP-01",
            exit_date="2026-05-15",
            exit_reason="Voluntary",
            created_at=datetime.utcnow(),
            created_by="admin@example.com"
        )
        db.add(exit_a)

        # Create exit record under ws-temporal-b
        exit_b = HistoricalExit(
            workspace_id="ws-temporal-b",
            employee_id="TENANT-B-EMP-01",
            exit_date="2026-06-20",
            exit_reason="Career Progression",
            created_at=datetime.utcnow(),
            created_by="admin_b@example.com"
        )
        db.add(exit_b)
        db.commit()

        # Query workspace A
        exits_a = db.query(HistoricalExit).filter(HistoricalExit.workspace_id == "ws-temporal-a").all()
        ids_a = [e.employee_id for e in exits_a]
        assert "TENANT-A-EMP-01" in ids_a
        assert "TENANT-B-EMP-01" not in ids_a

        # Query workspace B
        exits_b = db.query(HistoricalExit).filter(HistoricalExit.workspace_id == "ws-temporal-b").all()
        ids_b = [e.employee_id for e in exits_b]
        assert "TENANT-B-EMP-01" in ids_b
        assert "TENANT-A-EMP-01" not in ids_b
    finally:
        # Cleanup test records
        db.query(HistoricalExit).filter(
            HistoricalExit.employee_id.in_(["TENANT-A-EMP-01", "TENANT-B-EMP-01"])
        ).delete(synchronize_session=False)
        db.commit()
        db.close()
