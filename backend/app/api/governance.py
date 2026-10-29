"""
Enterprise Governance, Audit Trail & Compliance Routes.
Supports immutable audit logging, data-subject access exports, and data retention policies.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from backend.app.database.connection import get_db
from backend.app.models.entities import AuditLog, InterventionRecord, PlanComment
from backend.app.api.auth import get_current_user
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/governance", tags=["Governance & Compliance"])


class RetentionPolicyRequest(BaseModel):
    retention_months: int = 24
    purge_completed_plans: bool = False


@router.get("/audit-logs")
def get_audit_logs(
    workspace_id: str = "default",
    action: Optional[str] = None,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can inspect the system audit trail.")

    q = db.query(AuditLog).filter(AuditLog.workspace_id == workspace_id)
    if action and action != "All":
        q = q.filter(AuditLog.action.contains(action))

    logs = q.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "user_email": l.user_email,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details_json,
            "ip_address": l.ip_address
        }
        for l in logs
    ]


@router.get("/audit-logs/export")
def export_audit_logs_csv(
    workspace_id: str = "default",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can export audit logs.")

    logs = db.query(AuditLog).filter(AuditLog.workspace_id == workspace_id).order_by(AuditLog.timestamp.desc()).all()
    csv_rows = ["ID,Timestamp,UserEmail,Action,EntityType,EntityID,IPAddress"]
    for l in logs:
        csv_rows.append(f'{l.id},"{l.timestamp}","{l.user_email}","{l.action}","{l.entity_type or ""}","{l.entity_id or ""}","{l.ip_address}"')

    return PlainTextResponse(
        content="\n".join(csv_rows),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit_trail_{workspace_id}.csv"}
    )


@router.api_route("/retention-preview", methods=["GET", "POST"])
def preview_data_retention(
    req: Optional[RetentionPolicyRequest] = None,
    retention_days: Optional[int] = Query(None),
    retention_months: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Previews how many records exceed the data retention threshold without purging."""
    months = 24
    if req and req.retention_months:
        months = req.retention_months
    elif retention_months:
        months = retention_months
    elif retention_days:
        months = max(1, round(retention_days / 30))

    cutoff_date = datetime.utcnow() - timedelta(days=months * 30)
    eligible_plans = db.query(InterventionRecord).filter(InterventionRecord.created_at < cutoff_date).count()
    return {
        "retention_threshold_months": months,
        "cutoff_date": cutoff_date.strftime("%Y-%m-%d"),
        "records_exceeding_threshold": eligible_plans,
        "action_required": "Confirmation token required to execute purge."
    }


@router.get("/data-subject-export")
@router.get("/data-subject-export/{employee_id}")
def export_data_subject(
    employee_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports all stored records for an employee for data privacy & subject access compliance."""
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID required.")
    profile = analytics_service.get_employee_profile(employee_id)
    plans = db.query(InterventionRecord).filter(InterventionRecord.employee_id == employee_id).all()

    return {
        "subject_id": employee_id,
        "export_timestamp": datetime.utcnow().isoformat(),
        "exported_by": current_user.get("email"),
        "trajectory_profile": profile,
        "intervention_records": [
            {
                "id": p.id,
                "category": p.category,
                "status": p.status,
                "priority": p.priority,
                "action_plan": p.action_plan,
                "owner": p.owner,
                "target_date": p.target_date,
                "notes": p.notes,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in plans
        ]
    }
