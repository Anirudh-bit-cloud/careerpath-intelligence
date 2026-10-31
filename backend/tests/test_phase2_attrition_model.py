"""
Phase 2 Unit Tests: Supervised Attrition ML, Explainability, Fairness Equal Opportunity Difference, and Weight Sensitivity.
Ensures strict exclusion of protected attributes and compliance with decision-support principles.
"""

import pytest
from fastapi.testclient import TestClient
from ml.attrition_model import validate_features_no_protected, AttritionModelService, PROTECTED_ATTRIBUTES_CANONICAL
from backend.app.main import app
from backend.app.services.analytics_service import analytics_service
from backend.app.services.fairness_service import FairnessAuditService
from backend.app.api.auth import create_access_token


@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": "admin", "role": "admin", "workspace_id": "default"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_client():
    return TestClient(app)


def test_protected_attributes_strict_prohibition():
    """CRITICAL: Assert that passing any protected attribute into feature validation raises ValueError."""
    forbidden = ["gender", "Gender", "sex", "Age", "age_band", "marital_status", "MaritalStatus", "Race", "ethnicity"]
    for col in forbidden:
        with pytest.raises(ValueError, match="Protected"):
            validate_features_no_protected(["YearsAtCompany", col, "JobLevel"])

    # Objective non-protected features must pass cleanly
    valid_features = [
        "YearsAtCompany", "YearsInCurrentRole", "YearsSinceLastPromotion",
        "YearsWithCurrManager", "TrainingTimesLastYear", "JobLevel",
        "JobSatisfaction", "PerformanceRating"
    ]
    validate_features_no_protected(valid_features)


def test_supervised_attrition_training_and_metrics():
    """Verify supervised model trains, calculates calibrated probabilities, and outputs evaluation metrics."""
    service = AttritionModelService(analytics_service=analytics_service)
    metrics = service.train_or_update()

    assert "test_metrics" in metrics or "message" in metrics
    if "test_metrics" in metrics:
        test_m = metrics["test_metrics"]
        assert "roc_auc" in test_m
        assert "pr_auc" in test_m
        assert "brier_score" in test_m
        assert 0.0 <= test_m["brier_score"] <= 1.0

        # Cross validation
        cv = metrics["cross_validation_5fold"]
        assert "mean_roc_auc" in cv
        assert "std_roc_auc" in cv

        # Verify no protected features in trained feature list
        for f in metrics["features"]:
            assert f.lower() not in PROTECTED_ATTRIBUTES_CANONICAL


def test_employee_ml_explanation_and_agreement():
    """Verify per-employee calibrated probability, SHAP drivers, and RRI agreement indicator."""
    service = AttritionModelService(analytics_service=analytics_service)
    service.train_or_update()

    # Get sample employee ID
    emp_id = analytics_service.df_enriched.iloc[0]["EmployeeID"]
    explanation = service.get_employee_ml_explanation(emp_id)

    assert explanation["employee_id"] == emp_id
    assert 0.0 <= explanation["ml_probability"] <= 1.0
    assert explanation["ml_risk_tier"] in ["Urgent", "Moderate", "Standard"]
    assert "agreement" in explanation
    assert "disagreement_flag" in explanation
    assert "disagreement_note" in explanation
    assert "governance_disclosure" in explanation

    # SHAP drivers
    assert "top_positive_drivers" in explanation
    assert "top_negative_drivers" in explanation
    assert len(explanation["top_positive_drivers"]) <= 3
    assert len(explanation["top_negative_drivers"]) <= 3

    for driver in explanation["top_positive_drivers"]:
        assert driver["shap_impact"] > 0
        assert driver["direction"] == "increases_risk"


def test_weight_sensitivity_analysis():
    """Verify +/- 20% weight sensitivity simulates tier movements across all core parameters."""
    res = analytics_service.compute_weight_sensitivity(delta_pct=0.20)

    assert "sensitivities" in res
    assert len(res["sensitivities"]) >= 3
    assert "baseline_distribution" in res
    assert "stability_rating" in res
    assert "most_sensitive_parameter" in res

    for sens in res["sensitivities"]:
        assert "parameter_key" in sens
        assert len(sens["scenarios"]) == 2  # +20% and -20%
        for sc in sens["scenarios"]:
            assert "urgent_delta" in sc
            assert "simulated_distribution" in sc
            assert "narrative" in sc


def test_fairness_equal_opportunity_difference():
    """Verify fairness service computes Equal Opportunity Difference (TPR gap) with sample size threshold."""
    fairness = FairnessAuditService(analytics_service=analytics_service)
    res = fairness.compute_fairness_audit(min_sample_size=10)

    assert "equal_opportunity_status" in res
    assert "flagged_eod_disparities" in res
    assert "attributes" in res

    for attr, attr_res in res["attributes"].items():
        assert "groups" in attr_res
        for group in attr_res["groups"]:
            if not group.get("suppressed"):
                assert "favorable_rate" in group
                # If exits are evaluated, TPR should be present or None
                if attr_res.get("equal_opportunity_evaluated"):
                    assert "true_positive_rate" in group
                    assert "equal_opportunity_diff" in group


def test_api_endpoints_phase2(test_client, auth_headers):
    """Test new Phase 2 API endpoints."""
    # 1. ML Global Importance
    resp_imp = test_client.get("/api/validation/ml-importance", headers=auth_headers)
    assert resp_imp.status_code == 200
    imp_data = resp_imp.json()
    assert "enabled" in imp_data

    # 2. Employee ML Explanation
    emp_id = analytics_service.df_enriched.iloc[0]["EmployeeID"]
    resp_exp = test_client.get(f"/api/employees/{emp_id}/ml-explanation", headers=auth_headers)
    assert resp_exp.status_code == 200
    exp_data = resp_exp.json()
    assert "ml_probability" in exp_data
    assert "top_positive_drivers" in exp_data

    # 3. Policy Sensitivity
    resp_sens = test_client.get("/api/policy/sensitivity", headers=auth_headers)
    assert resp_sens.status_code == 200
    sens_data = resp_sens.json()
    assert "sensitivities" in sens_data
    assert "most_sensitive_parameter" in sens_data
