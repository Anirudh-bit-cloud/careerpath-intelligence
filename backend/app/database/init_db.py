"""
Database initialization and schema migration for CareerPath Intelligence.
Safely migrates existing tables and seeds default workspaces, users, and policies.
"""

import os
import json
from sqlalchemy import text
from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.models.entities import (
    Workspace, User, ScoringPolicy, CommitteeSession, PilotLead, InterventionRecord,
    NotificationPreference, NotificationDelivery, WorkforceSnapshot, SnapshotRun
)
from backend.app.core.security import hash_password


def init_and_migrate_db():
    """Initializes tables, migrates missing columns, and seeds default records."""
    # 1. Create all tables defined in Base
    Base.metadata.create_all(bind=engine)

    # 2. Check and migrate interventions table for workspace_id if missing
    with engine.connect() as conn:
        try:
            # Check if workspace_id column exists
            result = conn.execute(text("PRAGMA table_info(interventions);")).fetchall()
            columns = [row[1] for row in result]
            if "workspace_id" not in columns:
                conn.execute(text("ALTER TABLE interventions ADD COLUMN workspace_id VARCHAR(64) DEFAULT 'default';"))
                conn.commit()
            if "committee_review_status" not in columns:
                conn.execute(text("ALTER TABLE interventions ADD COLUMN committee_review_status VARCHAR(32) DEFAULT 'Not Requested';"))
                conn.commit()
            if "committee_notes" not in columns:
                conn.execute(text("ALTER TABLE interventions ADD COLUMN committee_notes TEXT;"))
                conn.commit()
            if "outcome_status" not in columns:
                conn.execute(text("ALTER TABLE interventions ADD COLUMN outcome_status VARCHAR(32);"))
                conn.commit()
            if "outcome_date" not in columns:
                conn.execute(text("ALTER TABLE interventions ADD COLUMN outcome_date DATETIME;"))
                conn.commit()
            if "retained_at_90_days" not in columns:
                conn.execute(text("ALTER TABLE interventions ADD COLUMN retained_at_90_days BOOLEAN;"))
                conn.commit()
            if "succession_readiness" not in columns:
                conn.execute(text("ALTER TABLE interventions ADD COLUMN succession_readiness VARCHAR(32) DEFAULT '1-2 years';"))
                conn.commit()

            # Check and migrate users table for security hardening columns
            user_cols_res = conn.execute(text("PRAGMA table_info(users);")).fetchall()
            user_cols = [row[1] for row in user_cols_res]
            if "failed_login_attempts" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;"))
                conn.commit()
            if "locked_until" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME;"))
                conn.commit()
            if "mfa_enabled" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0;"))
                conn.commit()
            if "mfa_secret" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(64);"))
                conn.commit()
            if "mfa_recovery_codes_json" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN mfa_recovery_codes_json TEXT;"))
                conn.commit()
        except Exception as e:
            print(f"[Migration Notice] Interventions column check: {e}")

    # 3. Seed default records
    db = SessionLocal()
    try:
        # A. Default Workspace
        default_ws = db.query(Workspace).filter(Workspace.id == "default").first()
        if not default_ws:
            ws = Workspace(
                id="default",
                name="Cybersecurity Operations",
                slug="panw-cyber",
                organization_name="Palo Alto Networks",
                accent_color="#4F75FF",
                is_white_labeled=False,
                fiscal_calendar_start="August",
                timezone="America/Los_Angeles",
                locale="en-US"
            )
            db.add(ws)

        # B. Default Users (Admin, Analyst, HRBP, Committee)
        default_users = [
            ("admin@company.com", "admin123", "Sarah Jenkins", "admin"),
            ("analyst@company.com", "analyst123", "Marcus Vance", "hr_analyst"),
            ("hrbp@company.com", "hrbp123", "Elena Rostova", "hrbp"),
            ("committee@company.com", "committee123", "David Chen", "talent_committee")
        ]
        for email, pwd, name, role in default_users:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                u = User(
                    workspace_id="default",
                    email=email,
                    password_hash=hash_password(pwd),
                    full_name=name,
                    role=role,
                    is_active=True
                )
                db.add(u)

        # C. Default Scoring Policy
        existing_policy = db.query(ScoringPolicy).filter(
            ScoringPolicy.workspace_id == "default",
            ScoringPolicy.is_active == True
        ).first()
        if not existing_policy:
            initial_weights = {
                "stagnation_weight": 0.45,
                "engagement_weight": 0.35,
                "training_deficit_weight": 0.20,
                "pgr_ratio_split": 0.60,
                "rsi_ratio_split": 0.40
            }
            initial_thresholds = {
                "level_1_dwell_years": 2.0,
                "level_2_dwell_years": 3.0,
                "level_3_dwell_years": 4.0,
                "level_4_dwell_years": 5.0,
                "level_5_dwell_years": 6.0
            }
            initial_rules = {
                "enable_cross_functional_rotation": True,
                "enable_readiness_review": True,
                "enable_capability_training": True,
                "enable_executive_sponsorship": True
            }
            policy = ScoringPolicy(
                workspace_id="default",
                version=1,
                name="PANW Standard Career Dwell Policy v1.0",
                weights_json=json.dumps(initial_weights),
                thresholds_json=json.dumps(initial_thresholds),
                rules_json=json.dumps(initial_rules),
                is_active=True,
                created_by="System Initializer",
                change_summary="Initial calibrated enterprise scoring baseline."
            )
            db.add(policy)

        # D. Seed a Sample Committee Session
        existing_session = db.query(CommitteeSession).filter(CommitteeSession.workspace_id == "default").first()
        if not existing_session:
            sample_session = CommitteeSession(
                workspace_id="default",
                title="Q4 Talent Calibration & Career Mobility Review",
                session_date="2026-11-15",
                attendees_json=json.dumps(["David Chen (VP People)", "Sarah Jenkins (Head Talent)", "Elena Rostova (Lead HRBP)"]),
                department_scope="Research & Development",
                status="Scheduled",
                decisions_json=json.dumps([
                    {"employee_id": "PANW-1042", "decision": "Accelerate Promotion Readiness", "rationale": "Sustained high performance over 4 yrs unpromoted."},
                    {"employee_id": "PANW-1482", "decision": "Approve Cross-Functional Rotation", "rationale": "High stagnation index in single role."}
                ]),
                minutes_text="Committee reviewed top 10 urgent candidates in Research & Development. Two immediate actions ratified."
            )
            db.add(sample_session)

        db.commit()
    except Exception as e:
        print(f"[Init DB Notice] Seeding defaults: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_and_migrate_db()
    print("Database initialization and migration complete.")
