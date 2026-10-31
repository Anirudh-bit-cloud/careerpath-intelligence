"""
Talent Review Committee & Plan Collaboration Routes.
Supports review session management, decision logging, meeting minutes, and plan comments.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
from datetime import datetime

from backend.app.database.connection import get_db
from backend.app.models.entities import CommitteeSession, InterventionRecord, PlanComment, AuditLog
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/api/committee", tags=["Committee Reviews & Collaboration"])


class SessionCreateRequest(BaseModel):
    title: str
    session_date: Optional[str] = None
    scheduled_date: Optional[str] = None
    attendees: Optional[List[str]] = None
    department_scope: Optional[str] = "All"
    workspace_id: Optional[str] = "default"


class DecisionLogRequest(BaseModel):
    employee_id: str
    decision: str  # Accelerated Promotion, Approved Lateral Rotation, Targeted L&D, Monitor
    rationale: Optional[str] = None
    notes: Optional[str] = None
    assigned_owner: Optional[str] = "Talent Lead"


class MinutesUpdateRequest(BaseModel):
    minutes_text: Optional[str] = None
    minutes: Optional[str] = None
    status: Optional[str] = "Completed"


class CommentCreateRequest(BaseModel):
    comment: str


@router.get("/sessions")
def list_sessions(
    workspace_id: str = "default",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") == "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: managers cannot access Talent Committee reviews.")
    ws_id = current_user.get("workspace_id") or workspace_id
    sessions = db.query(CommitteeSession).filter(
        CommitteeSession.workspace_id == ws_id
    ).order_by(CommitteeSession.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "session_date": s.session_date,
            "attendees": json.loads(s.attendees_json) if s.attendees_json else [],
            "department_scope": s.department_scope,
            "status": s.status,
            "decision_count": len(json.loads(s.decisions_json)) if s.decisions_json else 0,
            "minutes_text": s.minutes_text,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in sessions
    ]


@router.post("/sessions")
def create_session(
    req: SessionCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") == "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: managers cannot create Talent Committee reviews.")
    ws_id = req.workspace_id or current_user.get("workspace_id", "default")
    sess_date = req.session_date or req.scheduled_date or datetime.utcnow().strftime("%Y-%m-%d")
    attendees = req.attendees if req.attendees is not None else ["Committee Chair", "HRBP Lead"]
    session = CommitteeSession(
        workspace_id=ws_id,
        title=req.title,
        session_date=sess_date,
        attendees_json=json.dumps(attendees),
        department_scope=req.department_scope or "All",
        status="Scheduled",
        decisions_json="[]"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"message": "Committee session scheduled.", "session_id": session.id, "id": session.id}


@router.get("/sessions/{session_id}")
def get_session(
    session_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") == "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: managers cannot view Talent Committee details.")
    s = db.query(CommitteeSession).filter(CommitteeSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Committee session not found.")
    return {
        "id": s.id,
        "title": s.title,
        "session_date": s.session_date,
        "attendees": json.loads(s.attendees_json) if s.attendees_json else [],
        "department_scope": s.department_scope,
        "status": s.status,
        "decisions": json.loads(s.decisions_json) if s.decisions_json else [],
        "minutes_text": s.minutes_text,
        "created_at": s.created_at.isoformat() if s.created_at else None
    }


@router.post("/sessions/{session_id}/decisions")
def log_decision(
    session_id: int,
    req: DecisionLogRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s = db.query(CommitteeSession).filter(CommitteeSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")

    decisions = json.loads(s.decisions_json) if s.decisions_json else []
    rationale_text = req.rationale or req.notes or ""
    new_dec = {
        "employee_id": req.employee_id,
        "decision": req.decision,
        "rationale": rationale_text,
        "assigned_owner": req.assigned_owner,
        "recorded_by": current_user.get("full_name", current_user.get("email")),
        "timestamp": datetime.utcnow().isoformat()
    }
    # Update or append
    decisions = [d for d in decisions if d.get("employee_id") != req.employee_id]
    decisions.append(new_dec)
    s.decisions_json = json.dumps(decisions)

    # Sync to intervention record if one exists
    intervention = db.query(InterventionRecord).filter(
        InterventionRecord.employee_id == req.employee_id
    ).first()
    if intervention:
        intervention.committee_review_status = "Approved" if "Approved" in req.decision or "Accelerate" in req.decision else "Reviewed"
        intervention.committee_notes = f"Decision: {req.decision} ({rationale_text})"

    audit = AuditLog(
        workspace_id=s.workspace_id,
        user_email=current_user.get("email", "system"),
        action="committee.decision",
        entity_type="employee",
        entity_id=req.employee_id,
        details_json=f'{{"decision": "{req.decision}", "session_id": {session_id}}}'
    )
    db.add(audit)
    db.commit()

    return {"message": "Committee decision recorded successfully.", "decisions": decisions}


@router.put("/sessions/{session_id}/minutes")
@router.patch("/sessions/{session_id}/minutes")
def update_minutes(
    session_id: int,
    req: MinutesUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s = db.query(CommitteeSession).filter(CommitteeSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")
    s.minutes_text = req.minutes_text or req.minutes or ""
    if req.status:
        s.status = req.status
    db.commit()
    return {"message": "Meeting minutes ratified."}


@router.get("/plans/{plan_id}/comments")
def get_plan_comments(plan_id: int, db: Session = Depends(get_db)):
    comments = db.query(PlanComment).filter(PlanComment.intervention_id == plan_id).order_by(PlanComment.created_at.asc()).all()
    return [
        {
            "id": c.id,
            "author_name": c.author_name,
            "author_email": c.author_email,
            "comment": c.comment,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in comments
    ]


@router.post("/plans/{plan_id}/comments")
def add_plan_comment(
    plan_id: int,
    req: CommentCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = PlanComment(
        intervention_id=plan_id,
        workspace_id=current_user.get("workspace_id", "default"),
        author_email=current_user.get("email", "anonymous"),
        author_name=current_user.get("full_name", "HR Partner"),
        comment=req.comment
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"message": "Comment posted.", "comment_id": comment.id}
