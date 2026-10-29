"""
Tests for Phase 6 Notifications and Workflow Delivery:
- Notification preferences retrieval and updates with RBAC enforcement.
- Test notification dispatch for email and Slack channels.
- Verification of NotificationDelivery logging.
- Background scheduler service job execution.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.models.entities import NotificationPreference, NotificationDelivery, AuditLog
from backend.app.database.connection import SessionLocal
from backend.app.services.notification_service import notification_service
from backend.app.services.scheduler_service import job_urgent_digest, job_overdue_interventions

client = TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "admin", "role": "admin", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def analyst_headers():
    token = create_access_token({"sub": "analyst", "role": "hr_analyst", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


def test_get_and_update_notification_preferences(auth_headers, analyst_headers):
    # 1. Fetch preferences
    resp = client.get("/api/notifications/preferences", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "smtp_host" in data
    assert "notify_urgent_digest" in data

    # 2. Analyst role cannot update preferences (HTTP 403)
    unauth_resp = client.post(
        "/api/notifications/preferences",
        headers=analyst_headers,
        json={"smtp_host": "mail.corporate.internal", "notify_urgent_digest": True}
    )
    assert unauth_resp.status_code == 403

    # 3. Admin updates preferences
    update_resp = client.post(
        "/api/notifications/preferences",
        headers=auth_headers,
        json={
            "smtp_host": "mail.corporate.internal",
            "smtp_port": 587,
            "smtp_sender": "talent-ops@panw.corp",
            "slack_webhook_url": "https://hooks.slack.com/services/T00/B00/MOCK",
            "notify_urgent_digest": True,
            "notify_overdue_interventions": True,
            "notify_committee_reminders": True
        }
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "success"

    # 4. Verify DB persistence and AuditLog
    db = SessionLocal()
    pref = db.query(NotificationPreference).filter(NotificationPreference.workspace_id == "default").first()
    assert pref.smtp_host == "mail.corporate.internal"
    assert pref.smtp_sender == "talent-ops@panw.corp"

    audit = db.query(AuditLog).filter(
        AuditLog.action == "update_notification_preferences"
    ).order_by(AuditLog.id.desc()).first()
    assert audit is not None
    db.close()


def test_test_notification_dispatch_and_delivery_log(auth_headers):
    # 1. Test Slack dispatch
    slack_resp = client.post(
        "/api/notifications/test",
        headers=auth_headers,
        json={
            "channel": "slack",
            "target": "https://hooks.slack.com/services/T00/B00/XXXX",
            "message": "Automated verification ping."
        }
    )
    assert slack_resp.status_code == 200
    slack_data = slack_resp.json()
    assert slack_data["status"] in ["simulated", "sent"]

    # 2. Test Email dispatch
    email_resp = client.post(
        "/api/notifications/test",
        headers=auth_headers,
        json={
            "channel": "email",
            "target": "exec-review@panw.corp",
            "message": "Automated email test."
        }
    )
    assert email_resp.status_code == 200
    email_data = email_resp.json()
    assert email_data["status"] in ["simulated", "sent", "failed"]

    # 3. Verify deliveries history endpoint
    deliveries_resp = client.get("/api/notifications/deliveries", headers=auth_headers)
    assert deliveries_resp.status_code == 200
    deliveries = deliveries_resp.json()
    assert len(deliveries) >= 2
    assert any(d["channel"] == "slack" for d in deliveries)
    assert any(d["channel"] == "email" for d in deliveries)


def test_scheduler_jobs_execution():
    # Execute scheduler jobs directly to verify robust handling
    res_digest = notification_service.dispatch_urgent_digest(workspace_id="default")
    assert res_digest["status"] in ["completed", "skipped"]

    res_overdue = notification_service.dispatch_overdue_reminders(workspace_id="default")
    assert res_overdue["status"] in ["completed", "skipped"]

    # Test invoking scheduler wrapper functions
    job_urgent_digest()
    job_overdue_interventions()
