"""
Notification Channels and Workflow Delivery API Router.
Mounted under /api/notifications
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.app.api.auth import get_current_user
from backend.app.database.connection import get_db
from backend.app.models.entities import NotificationPreference, NotificationDelivery, AuditLog
from backend.app.services.notification_service import notification_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications & Workflows"])


class NotificationPreferencesRequest(BaseModel):
    smtp_host: Optional[str] = "smtp.internal.corp"
    smtp_port: Optional[int] = 587
    smtp_sender: Optional[str] = "alerts@careerpath.corp"
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: Optional[bool] = True
    slack_webhook_url: Optional[str] = None
    notify_urgent_digest: Optional[bool] = True
    notify_overdue_interventions: Optional[bool] = True
    notify_committee_reminders: Optional[bool] = True


class NotificationTestRequest(BaseModel):
    channel: str = Field(..., description="Channel type: 'email' or 'slack'")
    target: str = Field(..., description="Destination email address or Slack webhook URL")
    message: Optional[str] = "Test notification ping from CareerPath Intelligence alert dispatcher."


@router.get("/preferences")
def get_preferences(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetches notification preferences for the current tenant workspace."""
    workspace_id = current_user.get("workspace_id", "default")
    pref = notification_service.get_preferences(db, workspace_id)
    return {
        "workspace_id": pref.workspace_id,
        "smtp_host": pref.smtp_host,
        "smtp_port": pref.smtp_port,
        "smtp_sender": pref.smtp_sender,
        "smtp_username": pref.smtp_username,
        "smtp_use_tls": pref.smtp_use_tls,
        "slack_webhook_url": pref.slack_webhook_url,
        "notify_urgent_digest": pref.notify_urgent_digest,
        "notify_overdue_interventions": pref.notify_overdue_interventions,
        "notify_committee_reminders": pref.notify_committee_reminders,
        "updated_at": pref.updated_at.isoformat() if pref.updated_at else None
    }


@router.post("/preferences")
def update_preferences(
    payload: NotificationPreferencesRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates notification channels and triggers. Restricted to admin or hrbp roles."""
    role = current_user.get("role")
    if role not in ["admin", "hrbp"]:
        raise HTTPException(status_code=403, detail="Admin or HRBP role required to update notification preferences.")

    workspace_id = current_user.get("workspace_id", "default")
    pref = notification_service.get_preferences(db, workspace_id)

    pref.smtp_host = payload.smtp_host or pref.smtp_host
    pref.smtp_port = payload.smtp_port or pref.smtp_port
    pref.smtp_sender = payload.smtp_sender or pref.smtp_sender
    if payload.smtp_username is not None:
        pref.smtp_username = payload.smtp_username
    if payload.smtp_password is not None:
        pref.smtp_password = payload.smtp_password
    if payload.smtp_use_tls is not None:
        pref.smtp_use_tls = payload.smtp_use_tls
    if payload.slack_webhook_url is not None:
        pref.slack_webhook_url = payload.slack_webhook_url
    if payload.notify_urgent_digest is not None:
        pref.notify_urgent_digest = payload.notify_urgent_digest
    if payload.notify_overdue_interventions is not None:
        pref.notify_overdue_interventions = payload.notify_overdue_interventions
    if payload.notify_committee_reminders is not None:
        pref.notify_committee_reminders = payload.notify_committee_reminders

    pref.updated_at = datetime.utcnow()

    audit = AuditLog(
        workspace_id=workspace_id,
        user_email=current_user.get("sub", "system"),
        action="update_notification_preferences",
        entity_type="notification_preference",
        entity_id=str(pref.id),
        details_json=f'{{"smtp_host": "{pref.smtp_host}", "has_slack": {bool(pref.slack_webhook_url)}}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(pref)

    return {"status": "success", "message": "Notification preferences updated successfully."}


@router.post("/test")
def test_notification_dispatch(
    payload: NotificationTestRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Dispatches an on-demand test alert to verify channel connectivity."""
    workspace_id = current_user.get("workspace_id", "default")
    if payload.channel.lower() == "slack":
        res = notification_service.send_slack_alert(
            db, workspace_id, payload.message or "Test ping", event_type="test_ping", webhook_url=payload.target
        )
    elif payload.channel.lower() == "email":
        res = notification_service.send_email_alert(
            db, workspace_id, recipient=payload.target, subject="[Test] CareerPath Alert", body=payload.message or "Test", event_type="test_ping"
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported channel. Choose 'email' or 'slack'.")

    return res


@router.get("/deliveries")
def get_recent_deliveries(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists recent notification attempts and delivery status for the workspace."""
    workspace_id = current_user.get("workspace_id", "default")
    deliveries = db.query(NotificationDelivery).filter(
        NotificationDelivery.workspace_id == workspace_id
    ).order_by(NotificationDelivery.sent_at.desc()).limit(limit).all()

    return [
        {
            "id": d.id,
            "channel": d.channel,
            "recipient": d.recipient,
            "event_type": d.event_type,
            "status": d.status,
            "error_message": d.error_message,
            "sent_at": d.sent_at.isoformat() if d.sent_at else None
        }
        for d in deliveries
    ]
