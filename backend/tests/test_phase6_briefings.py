"""
Tests for Phase 6 Executive Briefings, Observational Matched Analytics & Pitch Mode:
- GET /api/briefings/executive — returns live computed briefing metrics with honest provenance
- GET /api/briefings/executive/download/md — markdown export with headers & disclosures
- POST /api/briefings/executive/email-now — dispatches briefing via notification channel
- GET /api/briefings/intervention-effectiveness — matched comparison cohort with observational caveats
- RBAC checks: managers get 403 on executive briefings
- Audit logging verification on briefing endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.models.entities import AuditLog
from backend.app.database.connection import SessionLocal

client = TestClient(app)


@pytest.fixture
def admin_headers():
    token = create_access_token({"sub": "admin", "role": "admin", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def hrbp_headers():
    token = create_access_token({"sub": "hrbp", "role": "hrbp", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def manager_headers():
    token = create_access_token({"sub": "mgr", "role": "manager", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


class TestExecutiveBriefings:
    def test_get_executive_briefing_admin(self, admin_headers):
        r = client.get("/api/briefings/executive", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "briefing_title" in data
        assert "kpis" in data
        assert "total_headcount" in data["kpis"]
        assert "urgent_tier_count" in data["kpis"]
        assert "data_provenance" in data
        assert "top_risk_departments" in data
        assert "fairness_governance" in data
        assert len(data["top_risk_departments"]) > 0

    def test_get_executive_briefing_hrbp(self, hrbp_headers):
        r = client.get("/api/briefings/executive", headers=hrbp_headers)
        assert r.status_code == 200

    def test_manager_cannot_access_executive_briefing(self, manager_headers):
        r = client.get("/api/briefings/executive", headers=manager_headers)
        assert r.status_code == 403

    def test_download_briefing_markdown(self, admin_headers):
        r = client.get("/api/briefings/executive/download/md", headers=admin_headers)
        assert r.status_code == 200
        assert "text/markdown" in r.headers.get("content-type", "")
        text = r.text
        assert "# Executive Workforce Briefing" in text
        assert "Departmental Risk Concentration" in text
        assert "Human-in-the-loop" in text

    def test_dispatch_briefing_email(self, admin_headers):
        r = client.post("/api/briefings/executive/email-now?recipient_email=leadership@company.com", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "success"
        assert "delivered_at" in data

    def test_matched_intervention_effectiveness(self, admin_headers):
        r = client.get("/api/briefings/intervention-effectiveness", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["analysis_type"] == "Observational Matched Cohort Analysis"
        assert "treated_avg_delta_rri" in data
        assert "matched_control_avg_delta_rri" in data
        assert "causality_caveat" in data
        assert "OBSERVATIONAL EVIDENCE ONLY" in data["causality_caveat"]
        assert "minimum_sample_rule" in data

    def test_briefing_view_creates_audit_log(self, admin_headers):
        db = SessionLocal()
        try:
            b_count = db.query(AuditLog).filter(AuditLog.action == "briefing.executive_viewed").count()
            client.get("/api/briefings/executive", headers=admin_headers)
            a_count = db.query(AuditLog).filter(AuditLog.action == "briefing.executive_viewed").count()
            assert a_count > b_count
        finally:
            db.close()
