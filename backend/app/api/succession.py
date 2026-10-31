"""
Succession Planning and Intervention Outcomes API Router.
Mounted under /api/succession
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.api.auth import get_current_user
from backend.app.services.analytics_service import analytics_service
from backend.app.services.succession_service import SuccessionService
from backend.app.database.connection import get_db
from backend.app.models.entities import InterventionRecord, AuditLog

router = APIRouter(prefix="/api/succession", tags=["Succession & Outcomes"])
succession_service = SuccessionService(analytics_service=analytics_service)


class OutcomeUpdateRequest(BaseModel):
    outcome_status: str  # Retained, Promoted, Departed, In Progress
    retained_at_90_days: Optional[bool] = None
    succession_readiness: Optional[str] = "1-2 years"
    notes: Optional[str] = None


@router.get("/9-box")
def get_nine_box_grid(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns 9-box talent matrix calibration with drilldown IDs."""
    if current_user.get("role") == "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: managers cannot access organization-wide succession planning.")
    return succession_service.get_nine_box_grid()


@router.get("/critical-roles")
def get_critical_roles(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns mission-critical roles, incumbent flight risks, bench strength, and SPOF flags."""
    if current_user.get("role") == "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: managers cannot access organization-wide critical roles.")
    return succession_service.get_critical_roles()


@router.get("/effectiveness")
def get_intervention_effectiveness(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns longitudinal effectiveness tracking by intervention category with sample size caveats."""
    if current_user.get("role") == "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: managers cannot access succession effectiveness analytics.")
    workspace_id = current_user.get("workspace_id", "default")
    return succession_service.get_intervention_effectiveness(db, workspace_id=workspace_id)


@router.post("/outcomes/{intervention_id}")
def update_intervention_outcome(
    intervention_id: int,
    payload: OutcomeUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates the longitudinal outcome status for a career intervention."""
    role = current_user.get("role")
    if role not in ["admin", "hrbp", "talent_committee"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions to record intervention outcomes.")

    workspace_id = current_user.get("workspace_id", "default")
    rec = db.query(InterventionRecord).filter(
        InterventionRecord.id == intervention_id,
        InterventionRecord.workspace_id == workspace_id
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Intervention record not found.")

    rec.outcome_status = payload.outcome_status
    rec.outcome_date = datetime.utcnow()
    if payload.retained_at_90_days is not None:
        rec.retained_at_90_days = payload.retained_at_90_days
    if payload.succession_readiness:
        rec.succession_readiness = payload.succession_readiness
    if payload.notes:
        rec.notes = (rec.notes or "") + f"\n[Outcome Note {datetime.utcnow().strftime('%Y-%m-%d')}]: {payload.notes}"

    audit = AuditLog(
        workspace_id=workspace_id,
        user_email=current_user.get("sub", "system"),
        action="update_intervention_outcome",
        entity_type="intervention",
        entity_id=str(intervention_id),
        details_json=f'{{"outcome_status": "{payload.outcome_status}", "retained_at_90_days": {payload.retained_at_90_days}}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(rec)

    return {
        "status": "success",
        "intervention_id": intervention_id,
        "outcome_status": rec.outcome_status,
        "retained_at_90_days": rec.retained_at_90_days
    }
