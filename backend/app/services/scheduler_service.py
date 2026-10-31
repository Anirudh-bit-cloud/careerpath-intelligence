"""
APScheduler Background Scheduler Service.
Automates proactive enterprise workflow triggers:
1. Overdue intervention reminders
2. Weekly digest of Urgent flight risk candidates
3. Calibration committee session reminders
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from backend.app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(daemon=True)


def job_urgent_digest():
    try:
        notification_service.dispatch_urgent_digest(workspace_id="default")
    except Exception as e:
        logger.error(f"[Scheduler] Failed job_urgent_digest: {e}")


def job_overdue_interventions():
    try:
        notification_service.dispatch_overdue_reminders(workspace_id="default")
    except Exception as e:
        logger.error(f"[Scheduler] Failed job_overdue_interventions: {e}")


def job_committee_reminders():
    try:
        notification_service.dispatch_committee_reminders(workspace_id="default")
    except Exception as e:
        logger.error(f"[Scheduler] Failed job_committee_reminders: {e}")


def job_monthly_snapshot():
    try:
        from backend.app.database.connection import SessionLocal
        from backend.app.services.snapshot_service import snapshot_service
        db = SessionLocal()
        try:
            snapshot_service.create_snapshot(
                db=db,
                workspace_id="default",
                trigger_type="scheduled_monthly",
                is_synthetic=False
            )
        finally:
            db.close()
    except Exception as e:
        logger.error(f"[Scheduler] Failed job_monthly_snapshot: {e}")


def start_scheduler():
    """Configures scheduled recurring jobs and boots the background worker thread."""
    if not scheduler.running:
        # Every 7 days
        scheduler.add_job(job_urgent_digest, 'interval', days=7, id='weekly_urgent_digest', replace_existing=True)
        # Daily
        scheduler.add_job(job_overdue_interventions, 'interval', hours=24, id='daily_overdue_interventions', replace_existing=True)
        scheduler.add_job(job_committee_reminders, 'interval', hours=24, id='daily_committee_reminders', replace_existing=True)
        # Monthly Snapshot (every 30 days)
        scheduler.add_job(job_monthly_snapshot, 'interval', days=30, id='monthly_workforce_snapshot', replace_existing=True)
        
        try:
            scheduler.start()
            logger.info("[Scheduler] Background scheduler initialized successfully.")
        except Exception as e:
            logger.warning(f"[Scheduler] Could not start scheduler: {e}")


def stop_scheduler():
    """Safely shuts down the scheduler thread on application shutdown."""
    if scheduler.running:
        try:
            scheduler.shutdown(wait=False)
            logger.info("[Scheduler] Background scheduler terminated.")
        except Exception:
            pass
