"""
Notification Service for CareerPath Intelligence.
Dispatches alerts via SMTP Email and Slack Incoming Webhooks.
Tracks all delivery events in NotificationDelivery entity.
"""

import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session

from backend.app.database.connection import SessionLocal
from backend.app.models.entities import (
    NotificationPreference, NotificationDelivery, InterventionRecord, CommitteeSession, AuditLog
)
from backend.app.services.analytics_service import analytics_service


class NotificationService:
    def get_preferences(self, db: Session, workspace_id: str = "default") -> NotificationPreference:
        pref = db.query(NotificationPreference).filter(
            NotificationPreference.workspace_id == workspace_id
        ).first()
        if not pref:
            pref = NotificationPreference(workspace_id=workspace_id)
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    def log_delivery(
        self,
        db: Session,
        workspace_id: str,
        channel: str,
        recipient: str,
        event_type: str,
        status: str,
        payload: Dict[str, Any],
        error_message: Optional[str] = None
    ) -> NotificationDelivery:
        delivery = NotificationDelivery(
            workspace_id=workspace_id,
            channel=channel,
            recipient=recipient,
            event_type=event_type,
            status=status,
            payload_json=json.dumps(payload),
            error_message=error_message,
            sent_at=datetime.utcnow()
        )
        db.add(delivery)
        db.commit()
        db.refresh(delivery)
        return delivery

    def send_slack_alert(
        self,
        db: Session,
        workspace_id: str,
        message: str,
        event_type: str = "slack_notification",
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        if not webhook_url:
            pref = self.get_preferences(db, workspace_id)
            webhook_url = pref.slack_webhook_url

        if not webhook_url or "XXXX" in webhook_url or "example" in webhook_url:
            # Simulated delivery for demo / test setups
            self.log_delivery(
                db,
                workspace_id=workspace_id,
                channel="slack",
                recipient=webhook_url or "slack:unconfigured",
                event_type=event_type,
                status="SIMULATED",
                payload={"text": message},
                error_message="Simulation: Webhook URL is demo/placeholder"
            )
            return {"status": "simulated", "channel": "slack", "message": "Simulated Slack delivery logged."}

        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.post(webhook_url, json={"text": message})
                if res.status_code in [200, 204]:
                    self.log_delivery(
                        db,
                        workspace_id=workspace_id,
                        channel="slack",
                        recipient=webhook_url,
                        event_type=event_type,
                        status="SENT",
                        payload={"text": message}
                    )
                    return {"status": "sent", "channel": "slack"}
                else:
                    err = f"HTTP {res.status_code}: {res.text[:100]}"
                    self.log_delivery(
                        db,
                        workspace_id=workspace_id,
                        channel="slack",
                        recipient=webhook_url,
                        event_type=event_type,
                        status="FAILED",
                        payload={"text": message},
                        error_message=err
                    )
                    return {"status": "failed", "error": err}
        except Exception as e:
            err = str(e)
            self.log_delivery(
                db,
                workspace_id=workspace_id,
                channel="slack",
                recipient=webhook_url,
                event_type=event_type,
                status="FAILED",
                payload={"text": message},
                error_message=err
            )
            return {"status": "failed", "error": err}

    def send_email_alert(
        self,
        db: Session,
        workspace_id: str,
        recipient: str,
        subject: str,
        body: str,
        event_type: str = "email_notification"
    ) -> Dict[str, Any]:
        pref = self.get_preferences(db, workspace_id)
        
        # In testing/internal environments or if SMTP host is placeholder:
        if (
            pref.smtp_host in ["smtp.internal.corp", "localhost", "127.0.0.1", "none"]
            or pref.smtp_host.endswith(".internal")
            or pref.smtp_host.endswith(".corp")
        ):
            self.log_delivery(
                db,
                workspace_id=workspace_id,
                channel="email",
                recipient=recipient,
                event_type=event_type,
                status="SIMULATED",
                payload={"subject": subject, "body": body},
                error_message="Simulation: SMTP host is internal/test domain"
            )
            return {"status": "simulated", "channel": "email", "message": "Email simulation recorded."}

        try:
            msg = MIMEMultipart()
            msg["From"] = pref.smtp_sender
            msg["To"] = recipient
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(pref.smtp_host, pref.smtp_port, timeout=4.0) as server:
                if pref.smtp_use_tls:
                    server.starttls()
                if pref.smtp_username and pref.smtp_password:
                    server.login(pref.smtp_username, pref.smtp_password)
                server.send_message(msg)

            self.log_delivery(
                db,
                workspace_id=workspace_id,
                channel="email",
                recipient=recipient,
                event_type=event_type,
                status="SENT",
                payload={"subject": subject, "recipient": recipient}
            )
            return {"status": "sent", "channel": "email"}
        except Exception as e:
            err = str(e)
            self.log_delivery(
                db,
                workspace_id=workspace_id,
                channel="email",
                recipient=recipient,
                event_type=event_type,
                status="FAILED",
                payload={"subject": subject, "recipient": recipient},
                error_message=err
            )
            return {"status": "failed", "error": err}

    def dispatch_urgent_digest(self, workspace_id: str = "default") -> Dict[str, Any]:
        db = SessionLocal()
        try:
            pref = self.get_preferences(db, workspace_id)
            if not pref.notify_urgent_digest:
                return {"status": "skipped", "reason": "Urgent digest notification disabled"}

            df = analytics_service.df_enriched
            urgent_count = 0
            if df is not None and 'RetentionPriority' in df.columns:
                urgent_count = int((df['RetentionPriority'] == 'Urgent').sum())

            msg = (
                f"🚨 [CareerPath Intelligence] Weekly Urgent Flight Risk Digest\n"
                f"Workspace: {workspace_id}\n"
                f"Identified {urgent_count} employees in Urgent Retention Risk Tier.\n"
                f"Please review talent trajectories and schedule calibration sessions."
            )

            # Slack
            slack_res = self.send_slack_alert(db, workspace_id, msg, event_type="urgent_digest")
            # Email
            email_res = self.send_email_alert(
                db, workspace_id, pref.smtp_sender, "Weekly CareerPath Urgent Flight Risk Digest", msg, event_type="urgent_digest"
            )

            return {"status": "completed", "urgent_count": urgent_count, "slack": slack_res, "email": email_res}
        finally:
            db.close()

    def dispatch_overdue_reminders(self, workspace_id: str = "default") -> Dict[str, Any]:
        db = SessionLocal()
        try:
            pref = self.get_preferences(db, workspace_id)
            if not pref.notify_overdue_interventions:
                return {"status": "skipped", "reason": "Overdue reminders disabled"}

            overdue_plans = db.query(InterventionRecord).filter(
                InterventionRecord.workspace_id == workspace_id,
                InterventionRecord.status != "Completed"
            ).all()

            msg = (
                f"⚠️ [CareerPath Intelligence] Overdue Intervention Reminder\n"
                f"There are currently {len(overdue_plans)} active intervention plans requiring review."
            )

            res = self.send_slack_alert(db, workspace_id, msg, event_type="overdue_reminder")
            return {"status": "completed", "overdue_count": len(overdue_plans), "slack": res}
        finally:
            db.close()

    def dispatch_committee_reminders(self, workspace_id: str = "default") -> Dict[str, Any]:
        db = SessionLocal()
        try:
            pref = self.get_preferences(db, workspace_id)
            if not pref.notify_committee_reminders:
                return {"status": "skipped", "reason": "Committee reminders disabled"}

            sessions = db.query(CommitteeSession).filter(
                CommitteeSession.workspace_id == workspace_id,
                CommitteeSession.status == "Scheduled"
            ).all()

            msg = (
                f"📅 [CareerPath Intelligence] Upcoming Talent Review Sessions\n"
                f"{len(sessions)} committee calibrations currently scheduled. Ensure candidate pseudonymization is verified."
            )

            res = self.send_slack_alert(db, workspace_id, msg, event_type="committee_reminder")
            return {"status": "completed", "sessions_count": len(sessions), "slack": res}
        finally:
            db.close()


notification_service = NotificationService()
