"""
Tests for Phase 4 Compliance Mapping:
- GET /api/compliance/mapping — returns full mapping with regulation/status breakdown
- GET /api/compliance/mapping?regulation=GDPR — filters by regulation
- GET /api/compliance/mapping/export/csv — returns CSV
- GET /api/compliance/bias-audit-summary — returns NYC LL144 bias audit with impact ratios
- GET /api/compliance/bias-audit-summary/export/csv — returns CSV
- GET /api/compliance/model-card — downloads MODEL_CARD.md
- GET /api/compliance/dpia-template — downloads DPIA_TEMPLATE.md
- GET /api/compliance/compliance-mapping-doc — downloads COMPLIANCE_MAPPING.md
- RBAC: manager role should get 403
- Audit log: compliance.mapping_viewed written on GET /mapping
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


# ---------------------------------------------------------------------------
# Compliance Mapping
# ---------------------------------------------------------------------------

class TestComplianceMappingEndpoint:
    def test_get_full_mapping_admin(self, admin_headers):
        r = client.get("/api/compliance/mapping", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "requirements" in data
        assert "summary" in data
        assert len(data["requirements"]) > 0
        # Should cover all three regulations
        regs = {req["regulation"] for req in data["requirements"]}
        assert "GDPR" in regs
        assert "EU AI Act" in regs
        assert "NYC Local Law 144" in regs

    def test_get_full_mapping_hrbp(self, hrbp_headers):
        r = client.get("/api/compliance/mapping", headers=hrbp_headers)
        assert r.status_code == 200

    def test_mapping_filter_by_regulation(self, admin_headers):
        r = client.get("/api/compliance/mapping?regulation=GDPR", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert all("GDPR" in req["regulation"] for req in data["requirements"])
        assert len(data["requirements"]) > 0

    def test_mapping_filter_by_status(self, admin_headers):
        r = client.get("/api/compliance/mapping?status=supported", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert all(req["status"] == "supported" for req in data["requirements"])

    def test_mapping_summary_counts(self, admin_headers):
        r = client.get("/api/compliance/mapping", headers=admin_headers)
        assert r.status_code == 200
        summary = r.json()["summary"]
        assert "supported" in summary
        assert "partially_supported" in summary
        assert "customer_responsibility" in summary
        total = sum(summary.values())
        assert total > 0

    def test_mapping_has_disclaimer(self, admin_headers):
        r = client.get("/api/compliance/mapping", headers=admin_headers)
        data = r.json()
        assert "disclaimer" in data
        assert "not constitute legal advice" in data["disclaimer"]

    def test_manager_cannot_access_compliance_mapping(self, manager_headers):
        r = client.get("/api/compliance/mapping", headers=manager_headers)
        assert r.status_code == 403

    def test_analyst_cannot_access_compliance_mapping(self):
        """hr_analyst role should be blocked from compliance endpoints."""
        token = create_access_token({"sub": "analyst", "role": "hr_analyst", "workspace_id": "default"})
        headers = {"Authorization": f"Bearer {token}"}
        r = client.get("/api/compliance/mapping", headers=headers)
        assert r.status_code == 403


class TestComplianceMappingCsvExport:
    def test_export_csv_returns_csv(self, admin_headers):
        r = client.get("/api/compliance/mapping/export/csv", headers=admin_headers)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        lines = r.text.strip().split("\n")
        assert len(lines) > 1  # header + data rows
        header = lines[0]
        assert "Regulation" in header
        assert "Status" in header
        assert "Evidence Endpoint" in header

    def test_manager_cannot_export_compliance_csv(self, manager_headers):
        r = client.get("/api/compliance/mapping/export/csv", headers=manager_headers)
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# Bias Audit Summary (NYC LL144)
# ---------------------------------------------------------------------------

class TestBiasAuditSummary:
    def test_bias_audit_summary_returns_data(self, admin_headers):
        r = client.get("/api/compliance/bias-audit-summary", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "impact_ratios" in data
        assert "overall_status" in data
        assert "audit_date" in data
        assert "dataset_size" in data
        assert isinstance(data["impact_ratios"], list)
        assert len(data["impact_ratios"]) > 0

    def test_bias_audit_has_legal_notice(self, admin_headers):
        r = client.get("/api/compliance/bias-audit-summary", headers=admin_headers)
        data = r.json()
        assert "legal_notice" in data
        assert "NYC Local Law 144" in data["legal_notice"] or "independent auditor" in data["legal_notice"]

    def test_bias_audit_impact_ratio_fields(self, admin_headers):
        r = client.get("/api/compliance/bias-audit-summary", headers=admin_headers)
        data = r.json()
        row = data["impact_ratios"][0]
        assert "attribute" in row
        assert "group" in row
        assert "sample_size" in row
        assert "flag" in row
        assert row["flag"] in ("FLAGGED", "COMPLIANT")

    def test_manager_cannot_access_bias_audit_summary(self, manager_headers):
        r = client.get("/api/compliance/bias-audit-summary", headers=manager_headers)
        assert r.status_code == 403

    def test_bias_audit_summary_csv_export(self, admin_headers):
        r = client.get("/api/compliance/bias-audit-summary/export/csv", headers=admin_headers)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        lines = r.text.strip().split("\n")
        assert len(lines) > 1
        header = lines[0]
        assert "BiasAuditDate" in header
        assert "DisparateImpactRatio" in header
        assert "FourFifthsCompliant" in header


# ---------------------------------------------------------------------------
# Document Downloads
# ---------------------------------------------------------------------------

class TestComplianceDocumentDownloads:
    def test_download_model_card(self, admin_headers):
        r = client.get("/api/compliance/model-card", headers=admin_headers)
        assert r.status_code == 200
        assert len(r.content) > 100  # non-empty markdown file

    def test_download_dpia_template(self, admin_headers):
        r = client.get("/api/compliance/dpia-template", headers=admin_headers)
        assert r.status_code == 200
        assert "DPIA" in r.text
        assert "Data Protection Impact Assessment" in r.text

    def test_download_compliance_mapping_doc(self, admin_headers):
        r = client.get("/api/compliance/compliance-mapping-doc", headers=admin_headers)
        assert r.status_code == 200
        assert "NYC Local Law 144" in r.text or "GDPR" in r.text

    def test_manager_cannot_download_model_card(self, manager_headers):
        r = client.get("/api/compliance/model-card", headers=manager_headers)
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# Audit Log Integration
# ---------------------------------------------------------------------------

class TestComplianceAuditLogging:
    def test_mapping_view_creates_audit_log(self, admin_headers):
        db = SessionLocal()
        try:
            before_count = db.query(AuditLog).filter(
                AuditLog.action == "compliance.mapping_viewed"
            ).count()
            r = client.get("/api/compliance/mapping", headers=admin_headers)
            assert r.status_code == 200
            after_count = db.query(AuditLog).filter(
                AuditLog.action == "compliance.mapping_viewed"
            ).count()
            assert after_count > before_count
        finally:
            db.close()

    def test_bias_audit_summary_creates_audit_log(self, admin_headers):
        db = SessionLocal()
        try:
            before_count = db.query(AuditLog).filter(
                AuditLog.action == "compliance.bias_audit_summary_viewed"
            ).count()
            r = client.get("/api/compliance/bias-audit-summary", headers=admin_headers)
            assert r.status_code == 200
            after_count = db.query(AuditLog).filter(
                AuditLog.action == "compliance.bias_audit_summary_viewed"
            ).count()
            assert after_count > before_count
        finally:
            db.close()
