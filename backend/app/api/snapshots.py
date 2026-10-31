"""
API Routes for Historical Workforce Snapshots and Longitudinal Trends.
Provides endpoints for capturing snapshots, evaluating RRI trajectories over time,
analyzing department trends, and computing tier migration matrices.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from backend.app.database.connection import get_db
from backend.app.api.auth import get_current_user
from backend.app.services.snapshot_service import snapshot_service

router = APIRouter(tags=["Historical Snapshots & Workforce Trends"])


class SnapshotCreateRequest(BaseModel):
    snapshot_date: Optional[str] = None
    workspace_id: Optional[str] = None
    is_synthetic: Optional[bool] = False


@router.post("/api/snapshots")
def create_snapshot(
    req: Optional[SnapshotCreateRequest] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Captures the current state of the workforce as a point-in-time snapshot.
    Enforces idempotency for (workspace, date).
    """
    workspace_id = (req.workspace_id if req and req.workspace_id else current_user.get("workspace_id", "default"))
    snapshot_date = req.snapshot_date if req else None
    is_synthetic = req.is_synthetic if req else False
    user_email = current_user.get("email", current_user.get("sub", "system"))

    res = snapshot_service.create_snapshot(
        db=db,
        workspace_id=workspace_id,
        snapshot_date=snapshot_date,
        created_by=user_email,
        trigger_type="manual",
        is_synthetic=is_synthetic
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.get("/api/snapshots/dates")
def list_snapshot_dates(
    workspace_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all recorded snapshot dates and run metadata for the workspace."""
    ws = workspace_id or current_user.get("workspace_id", "default")
    return snapshot_service.list_snapshot_dates(db=db, workspace_id=ws)


@router.get("/api/snapshots/as-of")
def get_as_of_snapshot_records(
    as_of_date: str = Query(..., description="Snapshot date (YYYY-MM-DD)"),
    priority: Optional[str] = Query("All", description="Filter by risk tier"),
    workspace_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns employee retention records as of a past snapshot date."""
    ws = workspace_id or current_user.get("workspace_id", "default")
    return snapshot_service.get_as_of_retention_opportunities(
        db=db, as_of_date=as_of_date, workspace_id=ws, priority=priority
    )


@router.post("/api/snapshots/seed-demo")
def seed_demo_history(
    workspace_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Seeds 12 monthly historical snapshots for the workspace.
    Explicitly flags all seeded snapshots with is_synthetic=True.
    """
    ws = workspace_id or current_user.get("workspace_id", "default")
    res = snapshot_service.seed_12_month_history(db=db, workspace_id=ws)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.get("/api/trends/overview")
def get_trends_overview(
    range_filter: Optional[str] = Query("12m", alias="range", description="3m, 6m, 12m, all"),
    workspace_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns longitudinal workforce trends:
    Total Headcount, Mean RRI, and Tier distributions over time.
    """
    ws = workspace_id or current_user.get("workspace_id", "default")
    return snapshot_service.get_trends_overview(db=db, workspace_id=ws, range_filter=range_filter)


@router.get("/api/trends/departments")
def get_trends_departments(
    workspace_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns department trajectory heatmap data across snapshots."""
    ws = workspace_id or current_user.get("workspace_id", "default")
    return snapshot_service.get_trends_departments(db=db, workspace_id=ws)


@router.get("/api/trends/employee/{employee_id}")
def get_trends_employee(
    employee_id: str,
    workspace_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns single employee's longitudinal progression trajectory."""
    ws = workspace_id or current_user.get("workspace_id", "default")
    res = snapshot_service.get_trends_employee(db=db, employee_id=employee_id, workspace_id=ws)
    if not res.get("found"):
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found in snapshot history")
    return res


@router.get("/api/trends/tier-movement")
def get_tier_movement_matrix(
    from_date: str = Query(..., description="Starting snapshot date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="Ending snapshot date (YYYY-MM-DD)"),
    workspace_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes tier migration transition matrix between any two snapshots.
    Tracks employees moving between Standard, Moderate, and Urgent tiers.
    """
    ws = workspace_id or current_user.get("workspace_id", "default")
    res = snapshot_service.get_tier_movement_matrix(
        db=db, from_date=from_date, to_date=to_date, workspace_id=ws
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res
