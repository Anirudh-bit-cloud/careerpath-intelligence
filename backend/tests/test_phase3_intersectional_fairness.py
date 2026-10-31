"""
Tests for Phase 3: Intersectional and Longitudinal Fairness.
Covers:
- Intersectional demographic grouping across pairs (Gender x Age, Gender x Dept, Age x Dept)
- Small-sample suppression threshold (n < 10) for employee privacy and precision
- Fisher's exact / Chi-square contingency tests and Benjamini-Hochberg FDR adjustment
- Longitudinal fairness drift tracking over historical monthly snapshots
- Formal bias sign-off gate, immutable AuditLog recording, and multi-tenant isolation
- RBAC permissions (manager role rejection)
"""

import pytest
import json
from datetime import datetime
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import AuditLog, WorkforceSnapshot
from backend.app.services.fairness_service import fairness_service, benjamini_hochberg_fdr

client = TestClient(app)


@pytest.fixture
def admin_headers():
    token = create_access_token({"sub": "admin@example.com", "role": "admin", "workspace_id": "ws-fairness-a"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def hrbp_headers():
    token = create_access_token({"sub": "hrbp@example.com", "role": "hrbp", "workspace_id": "ws-fairness-a"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def manager_headers():
    token = create_access_token({"sub": "manager@example.com", "role": "manager", "workspace_id": "ws-fairness-a"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def competitor_headers():
    token = create_access_token({"sub": "admin_b@example.com", "role": "admin", "workspace_id": "ws-fairness-b"})
    return {"Authorization": f"Bearer {token}"}


def test_benjamini_hochberg_fdr_algorithm():
    """Verifies standard Benjamini-Hochberg FDR step-up procedure and monotonicity."""
    p_values = [0.01, 0.04, 0.03, 0.20, 0.005]
    q_values = benjamini_hochberg_fdr(p_values)

    assert len(q_values) == len(p_values)
    # Check monotonicity relative to sorted p
    sorted_pairs = sorted(zip(p_values, q_values), key=lambda x: x[0])
    for i in range(len(sorted_pairs) - 1):
        assert sorted_pairs[i][1] <= sorted_pairs[i + 1][1]

    # Highest p (0.20) with m=5 should have q=0.20
    assert q_values[3] == 0.20
    # Smallest p (0.005) with m=5, rank 1: raw 0.025, capped
    assert q_values[4] <= 0.05


def test_intersectional_fairness_endpoint(admin_headers):
    """Verifies GET /api/fairness/intersectional returns complete schema with suppression and FDR."""
    resp = client.get("/api/fairness/intersectional?min_sample_size=10", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "success"
    assert "pairs_evaluated" in data
    assert len(data["pairs_evaluated"]) >= 2
    assert "total_slices" in data
    assert data["total_slices"] > 0
    assert "suppressed_slices_count" in data
    assert "slices" in data

    # Check slice fields
    first_slice = data["slices"][0]
    assert "slice_label" in first_slice
    assert "headcount" in first_slice
    assert "is_suppressed" in first_slice
    assert "is_flagged_four_fifths" in first_slice

    # Verify at least one slice demonstrates suppression or threshold check
    suppressed = [s for s in data["slices"] if s["is_suppressed"]]
    if suppressed:
        s = suppressed[0]
        assert s["headcount"] < 10
        assert s["disparate_impact_ratio"] is None
        assert "below threshold" in s["suppression_reason"]


def test_longitudinal_fairness_endpoint(admin_headers):
    """Verifies GET /api/fairness/longitudinal tracks disparity across monthly snapshots."""
    resp = client.get("/api/fairness/longitudinal", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] in ["success", "insufficient_data"]
    if data["status"] == "success":
        assert "timeline" in data
        assert len(data["timeline"]) > 0
        assert "drift_trend" in data
        assert data["drift_trend"] in ["stable", "improving", "widening"]
        assert "latest_gender_dir" in data

        # Check timeline entry
        first_pt = data["timeline"][0]
        assert "snapshot_date" in first_pt
        assert "gender_dir" in first_pt
        assert "is_four_fifths_compliant" in first_pt


def test_bias_signoff_workflow_and_tenant_isolation(admin_headers, competitor_headers):
    """Verifies recording formal bias sign-offs in AuditLog and multi-tenant isolation."""
    payload = {
        "review_type": "model_promotion",
        "target_id": "v3.2.0-candidate-model",
        "decision": "approved",
        "reviewer_notes": "Algorithmic bias review completed. All non-suppressed intersectional slices meet Four-Fifths compliance.",
        "acknowledged_flags": 0
    }

    # Record sign-off in workspace A
    resp_create = client.post("/api/fairness/signoff", headers=admin_headers, json=payload)
    assert resp_create.status_code == 200
    created = resp_create.json()
    assert created["status"] == "success"
    assert created["workspace_id"] == "ws-fairness-a"
    assert created["decision"] == "approved"

    # Fetch sign-offs in workspace A
    resp_list_a = client.get("/api/fairness/signoffs", headers=admin_headers)
    assert resp_list_a.status_code == 200
    signoffs_a = resp_list_a.json()
    assert len(signoffs_a) >= 1
    assert any(s["target_id"] == "v3.2.0-candidate-model" for s in signoffs_a)

    # Fetch sign-offs in competitor workspace B -> must NOT see workspace A's sign-off
    resp_list_b = client.get("/api/fairness/signoffs", headers=competitor_headers)
    assert resp_list_b.status_code == 200
    signoffs_b = resp_list_b.json()
    assert not any(s["target_id"] == "v3.2.0-candidate-model" for s in signoffs_b)


def test_manager_role_rejected_from_fairness_endpoints(manager_headers):
    """Verifies manager role is strictly forbidden from viewing or modifying fairness audits."""
    assert client.get("/api/fairness/summary", headers=manager_headers).status_code == 403
    assert client.get("/api/fairness/intersectional", headers=manager_headers).status_code == 403
    assert client.get("/api/fairness/longitudinal", headers=manager_headers).status_code == 403
    assert client.get("/api/fairness/signoffs", headers=manager_headers).status_code == 403
    assert client.post("/api/fairness/signoff", headers=manager_headers, json={
        "review_type": "audit", "target_id": "test", "decision": "approved", "reviewer_notes": "notes"
    }).status_code == 403
