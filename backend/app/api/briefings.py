"""
Executive Briefings and Matched Intervention Analytics API Router.
Endpoints for:
- GET /api/briefings/executive — live computed JSON briefing
- GET /api/briefings/executive/download/md — markdown briefing download
- POST /api/briefings/executive/email-now — trigger email delivery of briefing
- GET /api/briefings/intervention-effectiveness — matched comparison cohort analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from typing import Dict, Any, Optional
from datetime import datetime
import json
from sqlalchemy.orm import Session

from backend.app.api.auth import get_current_user
from backend.app.database.connection import get_db
from backend.app.models.entities import AuditLog
from backend.app.services.briefing_service import (
    compute_executive_briefing, generate_briefing_markdown,
    compute_matched_intervention_effectiveness
)
from backend.app.services.notification_service import notification_service

router = APIRouter(prefix="/api/briefings", tags=["Executive Briefings & Observational Analytics"])


def require_executive_access(current_user: Dict[str, Any] = Depends(get_current_user)):
    role = current_user.get("role", "")
    if role not in ["admin", "hrbp", "hr_analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: only 'admin', 'hrbp', or 'hr_analyst' roles may generate executive briefings."
        )
    return current_user


@router.get("/executive")
def get_executive_briefing_json(
    current_user: Dict[str, Any] = Depends(require_executive_access),
    db: Session = Depends(get_db)
):
    """Returns live computed executive workforce briefing with KPIs and risk concentrations."""
    ws_id = current_user.get("workspace_id", "default")
    briefing = compute_executive_briefing(workspace_id=ws_id, db=db)

    db.add(AuditLog(
        workspace_id=ws_id,
        user_email=current_user.get("email", "system"),
        action="briefing.executive_viewed",
        entity_type="executive_briefing"
    ))
    db.commit()

    return briefing


@router.get("/executive/download/md")
def download_executive_briefing_md(
    current_user: Dict[str, Any] = Depends(require_executive_access),
    db: Session = Depends(get_db)
):
    """Downloads executive briefing formatted in GitHub Flavored Markdown."""
    ws_id = current_user.get("workspace_id", "default")
    briefing = compute_executive_briefing(workspace_id=ws_id, db=db)
    md_content = generate_briefing_markdown(briefing)

    db.add(AuditLog(
        workspace_id=ws_id,
        user_email=current_user.get("email", "system"),
        action="briefing.executive_downloaded_md",
        entity_type="executive_briefing"
    ))
    db.commit()

    filename = f"executive_briefing_{datetime.utcnow().strftime('%Y_%m')}.md"
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/executive/email-now")
def email_executive_briefing_now(
    recipient_email: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_executive_access),
    db: Session = Depends(get_db)
):
    """Dispatches live executive briefing via configured email notification channel."""
    ws_id = current_user.get("workspace_id", "default")
    target = recipient_email or current_user.get("email", "leadership@company.com")

    briefing = compute_executive_briefing(workspace_id=ws_id, db=db)
    md_content = generate_briefing_markdown(briefing)

    # Deliver via notification service
    notification_service.send_email_alert(
        db=db,
        workspace_id=ws_id,
        recipient=target,
        subject=f"CareerPath Executive Workforce Briefing — {datetime.utcnow().strftime('%B %Y')}",
        body=md_content,
        event_type="executive_briefing_digest"
    )

    db.add(AuditLog(
        workspace_id=ws_id,
        user_email=current_user.get("email", "system"),
        action="briefing.executive_emailed",
        entity_type="executive_briefing",
        details_json=json.dumps({"recipient": target})
    ))
    db.commit()

    return {
        "status": "success",
        "message": f"Executive briefing dispatched to {target}.",
        "delivered_at": datetime.utcnow().isoformat() + "Z"
    }


@router.get("/intervention-effectiveness")
def get_matched_intervention_effectiveness(
    current_user: Dict[str, Any] = Depends(require_executive_access),
    db: Session = Depends(get_db)
):
    """
    Evaluates before/after RRI trajectory against a matched observational control cohort.
    Clearly discloses observational caveats and selection bias.
    """
    ws_id = current_user.get("workspace_id", "default")
    return compute_matched_intervention_effectiveness(db=db, workspace_id=ws_id)
