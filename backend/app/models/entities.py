"""
SQLAlchemy ORM Entities for CareerPath Intelligence.
Supports Multi-Tenant Workspaces, Real RBAC Authentication, Scoring Policies,
Committee Review Sessions, Audit Logs, Webhooks, and API Keys.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey
from backend.app.database.connection import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(64), primary_key=True, index=True) # e.g. 'default', 'panw-cyber', 'fintech-apex'
    name = Column(String(128), nullable=False)
    slug = Column(String(64), unique=True, index=True, nullable=False)
    organization_name = Column(String(128), default="Palo Alto Networks")
    accent_color = Column(String(32), default="#4F75FF")
    logo_svg = Column(Text, nullable=True)
    fiscal_calendar_start = Column(String(16), default="January")
    timezone = Column(String(64), default="America/Los_Angeles")
    locale = Column(String(16), default="en-US")
    is_white_labeled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False, default="hrbp")  # admin, hr_analyst, hrbp, talent_committee, manager
    employee_id = Column(String(64), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Security hardening fields
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(64), nullable=True)
    mfa_recovery_codes_json = Column(Text, nullable=True)


class ScoringPolicy(Base):
    __tablename__ = "scoring_policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    name = Column(String(128), default="Standard Progression Policy")
    weights_json = Column(Text, nullable=False)  # JSON string of weights (e.g. stagnation: 0.45, etc.)
    thresholds_json = Column(Text, nullable=False)  # Expected dwell time per level
    rules_json = Column(Text, nullable=False)  # Enabled recommendation templates
    is_active = Column(Boolean, default=True)
    created_by = Column(String(128), default="system")
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    user_email = Column(String(128), nullable=False)
    action = Column(String(64), nullable=False)  # login, create_plan, update_policy, export_csv, etc.
    entity_type = Column(String(64), nullable=True)
    entity_id = Column(String(64), nullable=True)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(64), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow)


class InterventionRecord(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    employee_id = Column(String(64), index=True, nullable=False)
    department = Column(String(128), nullable=True)
    job_role = Column(String(128), nullable=True)
    category = Column(String(64), nullable=False, default="Career Conversation")
    status = Column(String(32), nullable=False, default="New")  # New, Under Review, Planned, Completed
    priority = Column(String(32), nullable=False, default="Moderate")  # Urgent, Moderate, Standard
    action_plan = Column(Text, nullable=False)
    owner = Column(String(128), nullable=False, default="HR Talent Partner")
    target_date = Column(String(32), nullable=True)
    notes = Column(Text, nullable=True)
    committee_review_status = Column(String(32), default="Not Requested")  # Not Requested, Requested, Approved, Declined
    committee_notes = Column(Text, nullable=True)
    outcome_status = Column(String(32), nullable=True)  # Retained, Promoted, Departed, In Progress
    outcome_date = Column(DateTime, nullable=True)
    retained_at_90_days = Column(Boolean, nullable=True)
    succession_readiness = Column(String(32), nullable=True, default="1-2 years")  # Ready Now, 1-2 years, 3+ years
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PlanComment(Base):
    __tablename__ = "plan_comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    intervention_id = Column(Integer, index=True, nullable=False)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    author_email = Column(String(128), nullable=False)
    author_name = Column(String(128), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommitteeSession(Base):
    __tablename__ = "committee_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    title = Column(String(128), nullable=False)
    session_date = Column(String(32), nullable=False)
    attendees_json = Column(Text, default="[]")
    department_scope = Column(String(128), default="All")
    status = Column(String(32), default="Scheduled")  # Scheduled, In Progress, Completed
    decisions_json = Column(Text, default="[]")
    minutes_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PilotLead(Base):
    __tablename__ = "pilot_leads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(128), nullable=False)
    work_email = Column(String(128), nullable=False)
    company_name = Column(String(128), nullable=False)
    role_title = Column(String(128), nullable=False)
    company_size = Column(String(64), default="500-2000")
    use_case = Column(Text, nullable=True)
    status = Column(String(32), default="New Lead")  # New Lead, Contacted, Pilot Active
    created_at = Column(DateTime, default=datetime.utcnow)


class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    url = Column(String(256), nullable=False)
    secret = Column(String(128), nullable=False)
    events_json = Column(Text, default='["plan.created", "plan.status_changed"]')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint_id = Column(Integer, index=True, nullable=False)
    event_type = Column(String(64), nullable=False)
    payload_json = Column(Text, nullable=False)
    status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    success = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    name = Column(String(128), nullable=False)
    key_prefix = Column(String(16), nullable=False)
    key_hash = Column(String(256), nullable=False)
    scopes_json = Column(Text, default='["read:roster", "read:plans"]')
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True)
    name = Column(String(128), nullable=False)
    source = Column(String(256), nullable=False)
    row_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    is_demo = Column(Integer, default=1)


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", unique=True, index=True, nullable=False)
    smtp_host = Column(String(128), default="smtp.internal.corp")
    smtp_port = Column(Integer, default=587)
    smtp_sender = Column(String(128), default="alerts@careerpath.corp")
    smtp_username = Column(String(128), nullable=True)
    smtp_password = Column(String(128), nullable=True)
    smtp_use_tls = Column(Boolean, default=True)
    slack_webhook_url = Column(String(256), nullable=True)
    notify_urgent_digest = Column(Boolean, default=True)
    notify_overdue_interventions = Column(Boolean, default=True)
    notify_committee_reminders = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    channel = Column(String(32), nullable=False)  # email, slack
    recipient = Column(String(256), nullable=False)
    event_type = Column(String(64), nullable=False)  # urgent_digest, overdue_reminder, committee_reminder, test_ping
    status = Column(String(32), nullable=False)  # SENT, FAILED, SIMULATED
    payload_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)


class WorkforceSnapshot(Base):
    __tablename__ = "workforce_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    snapshot_date = Column(String(10), index=True, nullable=False)  # YYYY-MM-DD
    employee_id = Column(String(64), index=True, nullable=False)
    rri = Column(Float, nullable=False)
    rri_tier = Column(String(32), nullable=False)  # Urgent, Moderate, Standard
    ml_probability = Column(Float, nullable=True)
    cluster_id = Column(Integer, nullable=True)
    job_level = Column(Integer, nullable=True)
    department = Column(String(128), nullable=True)
    promotion_gap_years = Column(Float, nullable=True)
    satisfaction = Column(Float, nullable=True)
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SnapshotRun(Base):
    __tablename__ = "snapshot_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    snapshot_date = Column(String(10), index=True, nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(128), nullable=False, default="system")
    trigger_type = Column(String(64), default="manual")  # manual, roster_upload, scheduled, synthetic_seed
    row_count = Column(Integer, nullable=False)
    model_version = Column(String(64), nullable=True, default="v3.1.0")
    policy_version = Column(Integer, nullable=True, default=1)
    is_synthetic = Column(Boolean, default=False)


class ManagerFollowUp(Base):
    __tablename__ = "manager_followups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    manager_id = Column(String(64), index=True, nullable=False)
    employee_id = Column(String(64), index=True, nullable=False)
    planned_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    topic = Column(String(256), nullable=False)
    talking_points_discussed = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(32), default="Planned")  # Planned, Completed, Cancelled
    baseline_rri = Column(Float, nullable=True)
    followup_rri = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), default="default", index=True, nullable=False)
    model_type = Column(String(32), nullable=False)  # 'cox', 'hist_gbdt'
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(128), default="system", nullable=False)
    training_data_hash = Column(String(64), nullable=False)
    row_count = Column(Integer, nullable=False)
    feature_list_json = Column(Text, nullable=False)  # JSON array of feature names
    hyperparameters_json = Column(Text, nullable=False)  # JSON dict of hyperparams
    metrics_json = Column(Text, nullable=False)  # JSON dict of c_index/roc_auc, brier, cv_mean, cv_std, pr_auc
    artifact_path = Column(String(256), nullable=False)  # disk path to joblib artifact
    status = Column(String(32), default="candidate", index=True, nullable=False)  # 'active', 'candidate', 'archived'
    dependency_versions_json = Column(Text, nullable=True)  # JSON dict of pinned library versions
    notes = Column(Text, nullable=True)


