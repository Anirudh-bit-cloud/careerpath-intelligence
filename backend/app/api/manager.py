"""
CareerPath Intelligence - Role-Based Manager API Routes
Provides team-scoped risk summaries, direct-report cards, supportive 1-on-1 talking points,
ethical diagnostic acknowledgements, and follow-up tracking.
Strict tenant isolation and team RBAC enforcement.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from backend.app.database.connection import get_db
from backend.app.models.entities import ManagerFollowUp, InterventionRecord, AuditLog
from backend.app.api.auth import get_current_user
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/manager", tags=["Manager Experience"])


# ── REQUEST / RESPONSE SCHEMAS ───────────────────────────────────────────────

class ManagerAcknowledgementRequest(BaseModel):
    statement: str = Field(
        default="I understand these indicators are meant to support employee growth and retention, not to evaluate performance or justify discipline."
    )
    acknowledged: bool = True


class FollowUpCreateRequest(BaseModel):
    employee_id: str
    planned_date: str  # YYYY-MM-DD
    topic: str
    talking_points_discussed: Optional[str] = None
    notes: Optional[str] = None
    create_hr_intervention: Optional[bool] = False


class FollowUpUpdateRequest(BaseModel):
    status: Optional[str] = "Completed"  # Planned, Completed, Cancelled
    notes: Optional[str] = None
    talking_points_discussed: Optional[str] = None


# ── ROUTES ───────────────────────────────────────────────────────────────────

@router.get("/my-team")
def get_my_team(
    manager_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns team overview and direct report progression cards.
    Role 'manager' is strictly scoped to their own direct and indirect team.
    Admins and HRBPs can view any manager's team or default.
    """
    user_role = current_user.get("role", "manager")
    ws_id = current_user.get("workspace_id", "default")
    user_emp_id = current_user.get("employee_id") or "PANW-1044"

    # Strict scoping for manager role
    if user_role == "manager":
        effective_manager_id = user_emp_id
    else:
        # Admin / HRBP can inspect any team
        effective_manager_id = manager_id or user_emp_id

    team_data = analytics_service.get_manager_team(effective_manager_id)

    # Attach active interventions and follow-ups for each direct report
    emp_ids = [r["employee_id"] for r in team_data.get("direct_reports", [])]
    
    interventions = db.query(InterventionRecord).filter(
        InterventionRecord.workspace_id == ws_id,
        InterventionRecord.employee_id.in_(emp_ids)
    ).all()
    int_by_emp = {}
    for i in interventions:
        int_by_emp.setdefault(i.employee_id, []).append({
            "id": i.id,
            "category": i.category,
            "status": i.status,
            "action_plan": i.action_plan,
            "target_date": i.target_date
        })

    followups = db.query(ManagerFollowUp).filter(
        ManagerFollowUp.workspace_id == ws_id,
        ManagerFollowUp.employee_id.in_(emp_ids)
    ).all()
    fu_by_emp = {}
    for f in followups:
        fu_by_emp.setdefault(f.employee_id, []).append({
            "id": f.id,
            "planned_date": f.planned_date,
            "topic": f.topic,
            "status": f.status,
            "baseline_rri": f.baseline_rri,
            "followup_rri": f.followup_rri
        })

    for r in team_data.get("direct_reports", []):
        eid = r["employee_id"]
        r["active_interventions"] = int_by_emp.get(eid, [])
        r["follow_ups"] = fu_by_emp.get(eid, [])

    return team_data


@router.post("/acknowledgement")
def record_manager_acknowledgement(
    req: ManagerAcknowledgementRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Records that the manager has acknowledged the decision support and non-punitive framing
    before accessing sensitive workforce progression indicators.
    """
    if not req.acknowledged:
        raise HTTPException(
            status_code=400,
            detail="Acknowledgement must be confirmed before viewing team progression data."
        )

    audit = AuditLog(
        workspace_id=current_user.get("workspace_id", "default"),
        user_email=current_user.get("email", "manager@company.com"),
        action="manager.acknowledgement_signed",
        entity_type="manager_compliance",
        entity_id=current_user.get("employee_id") or current_user.get("email", "unknown"),
        details_json=json.dumps({
            "statement": req.statement,
            "acknowledged_at": datetime.utcnow().isoformat(),
            "role": current_user.get("role")
        })
    )
    db.add(audit)
    db.commit()

    return {
        "status": "acknowledged",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Ethical diagnostic framing acknowledged successfully."
    }


@router.get("/follow-ups")
def list_followups(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List 1-on-1 career follow-ups for the current manager's team with tenant isolation."""
    ws_id = current_user.get("workspace_id", "default")
    user_role = current_user.get("role")
    emp_id = current_user.get("employee_id") or "PANW-1044"

    query = db.query(ManagerFollowUp).filter(ManagerFollowUp.workspace_id == ws_id)
    if user_role == "manager":
        query = query.filter(ManagerFollowUp.manager_id == emp_id)

    followups = query.order_by(ManagerFollowUp.planned_date.desc()).all()
    return [
        {
            "id": f.id,
            "workspace_id": f.workspace_id,
            "manager_id": f.manager_id,
            "employee_id": f.employee_id,
            "planned_date": f.planned_date,
            "topic": f.topic,
            "talking_points_discussed": f.talking_points_discussed,
            "notes": f.notes,
            "status": f.status,
            "baseline_rri": f.baseline_rri,
            "followup_rri": f.followup_rri,
            "created_at": f.created_at.isoformat() if f.created_at else None,
            "completed_at": f.completed_at.isoformat() if f.completed_at else None
        }
        for f in followups
    ]


@router.post("/follow-ups", status_code=status.HTTP_201_CREATED)
def create_followup(
    req: FollowUpCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a planned 1-on-1 development conversation and snapshot baseline RRI."""
    ws_id = current_user.get("workspace_id", "default")
    user_role = current_user.get("role")
    mgr_id = current_user.get("employee_id") or "PANW-1044"

    # Enforce team membership check for managers
    if user_role == "manager":
        team_ids = analytics_service.get_manager_team_ids(mgr_id)
        clean_target = str(req.employee_id).strip()
        allowed = (
            clean_target in team_ids or
            clean_target == mgr_id or
            f"PANW-{clean_target}" in team_ids or
            clean_target.replace("PANW-", "") in team_ids
        )
        if not allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied: employee {req.employee_id} is not on your direct team."
            )

    # Fetch current baseline RRI from profile
    profile = analytics_service.get_employee_profile(req.employee_id)
    baseline_rri = float(profile.get("RetentionRiskIndex", 50.0)) if profile else None

    followup = ManagerFollowUp(
        workspace_id=ws_id,
        manager_id=mgr_id,
        employee_id=req.employee_id,
        planned_date=req.planned_date,
        topic=req.topic,
        talking_points_discussed=req.talking_points_discussed,
        notes=req.notes,
        status="Planned",
        baseline_rri=baseline_rri,
        created_at=datetime.utcnow()
    )
    db.add(followup)

    # Optionally sync with central HR Intervention table
    if req.create_hr_intervention:
        hr_intervention = InterventionRecord(
            workspace_id=ws_id,
            employee_id=req.employee_id,
            department=profile.get("Department", "Engineering") if profile else "Engineering",
            job_role=profile.get("JobRole", "Team Member") if profile else "Team Member",
            category="Manager 1-on-1 Follow-up",
            status="Planned",
            priority="Moderate",
            action_plan=f"1-on-1 Career Check-in: {req.topic}",
            owner=current_user.get("full_name") or f"Manager ({mgr_id})",
            target_date=req.planned_date,
            notes=req.notes or req.talking_points_discussed
        )
        db.add(hr_intervention)

    audit = AuditLog(
        workspace_id=ws_id,
        user_email=current_user.get("email", "unknown"),
        action="manager.followup_created",
        entity_type="manager_followup",
        entity_id=req.employee_id,
        details_json=json.dumps({
            "manager_id": mgr_id,
            "target_employee": req.employee_id,
            "topic": req.topic,
            "planned_date": req.planned_date
        })
    )
    db.add(audit)
    db.commit()
    db.refresh(followup)

    return {
        "id": followup.id,
        "message": f"Follow-up for {req.employee_id} scheduled for {req.planned_date}.",
        "baseline_rri": baseline_rri,
        "status": followup.status
    }


@router.put("/follow-ups/{followup_id}")
def update_followup(
    followup_id: int,
    req: FollowUpUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete or update a follow-up, recording post-intervention RRI to track improvement."""
    ws_id = current_user.get("workspace_id", "default")
    user_role = current_user.get("role")
    mgr_id = current_user.get("employee_id") or "PANW-1044"

    query = db.query(ManagerFollowUp).filter(
        ManagerFollowUp.id == followup_id,
        ManagerFollowUp.workspace_id == ws_id
    )
    if user_role == "manager":
        query = query.filter(ManagerFollowUp.manager_id == mgr_id)

    followup = query.first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found or access denied.")

    if req.status:
        followup.status = req.status
    if req.notes:
        followup.notes = req.notes
    if req.talking_points_discussed:
        followup.talking_points_discussed = req.talking_points_discussed

    if req.status == "Completed":
        followup.completed_at = datetime.utcnow()
        # Measure current RRI
        profile = analytics_service.get_employee_profile(followup.employee_id)
        if profile:
            followup.followup_rri = float(profile.get("RetentionRiskIndex", followup.baseline_rri or 50.0))

    db.commit()
    db.refresh(followup)

    return {
        "id": followup.id,
        "status": followup.status,
        "baseline_rri": followup.baseline_rri,
        "followup_rri": followup.followup_rri,
        "completed_at": followup.completed_at.isoformat() if followup.completed_at else None
    }
