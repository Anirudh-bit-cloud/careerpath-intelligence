"""
Tests for Phase 2:
- Retention Risk Index (RRI) with backward-compatible aliases for Retention Opportunity Index (ROI).
- GET /api/employees/{id}/score-explanation endpoint with waterfall components and counterfactual analysis.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_score_explanation_endpoint():
    # Pick a known employee or search for one
    search_res = client.get("/api/employees?query=PANW")
    assert search_res.status_code == 200
    employees = search_res.json()
    assert len(employees) > 0
    emp_id = employees[0]["EmployeeID"]

    # Call score-explanation endpoint
    res = client.get(f"/api/employees/{emp_id}/score-explanation")
    assert res.status_code == 200
    data = res.json()

    assert data["employee_id"] == emp_id
    assert "retention_risk_index" in data
    assert "retention_opportunity_index" in data  # backward compatibility alias
    assert data["retention_risk_index"] == data["retention_opportunity_index"]

    # Waterfall components
    assert "components" in data
    assert len(data["components"]) == 3
    for comp in data["components"]:
        assert "name" in comp
        assert "weight" in comp
        assert "contribution_points" in comp
        assert "description" in comp

    # Counterfactual
    assert "counterfactual" in data
    cf = data["counterfactual"]
    assert "current_tier" in cf
    assert "target_tier" in cf
    assert "score_reduction_needed" in cf
    assert "gap_reduction_years" in cf
    assert "trainings_needed" in cf
    assert "explanation" in cf
    assert len(cf["explanation"]) > 20


def test_rri_backward_compatibility():
    # Verify retention-opportunities endpoint returns both RRI and ROI
    res = client.get("/api/retention-opportunities?page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert "records" in data
    assert len(data["records"]) > 0
    rec = data["records"][0]
    assert "RetentionRiskIndex" in rec or "RetentionOpportunityIndex" in rec
    if "RetentionRiskIndex" in rec:
        assert rec["RetentionRiskIndex"] == rec["RetentionOpportunityIndex"]
