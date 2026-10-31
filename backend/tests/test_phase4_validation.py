"""
Tests for Phase 4 Survival Analysis, Cox Proportional Hazards, and Model Validation:
- Metrics overview with Silhouette interpretation and C-Index.
- Kaplan-Meier survival curves (overall, department, promotion dwell).
- Cox regression coefficients, hazard ratios, and proportional hazards test.
- Backtest evaluation split with Precision, Recall, F1, and Confusion Matrix.
- Graceful empty data handling.
"""

import pytest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.survival_service import SurvivalValidationService
from backend.app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "admin", "role": "admin", "workspace_id": "ws-panw"})
    return {"Authorization": f"Bearer {token}"}


def test_validation_metrics_endpoint(auth_headers):
    resp = client.get("/api/validation/metrics", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "clustering_metrics" in data
    assert "silhouette_score" in data["clustering_metrics"]
    assert "silhouette_interpretation" in data["clustering_metrics"]
    assert "survival_metrics" in data
    assert "concordance_index" in data["survival_metrics"]
    assert "limitations" in data
    assert len(data["limitations"]) > 0


def test_survival_curves_endpoint(auth_headers):
    resp = client.get("/api/validation/survival-curves", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "attrition_survival" in data
    assert "overall" in data["attrition_survival"]
    assert len(data["attrition_survival"]["overall"]) > 0
    assert "promotion_dwell_survival" in data
    assert "curve" in data["promotion_dwell_survival"]


def test_cox_regression_endpoint(auth_headers):
    resp = client.get("/api/validation/cox-regression", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "concordance_index" in data or "error" in data
    if "coefficients" in data:
        assert len(data["coefficients"]) > 0
        first_cov = data["coefficients"][0]
        assert "hazard_ratio" in first_cov
        assert "p_value" in first_cov


def test_backtest_endpoint(auth_headers):
    resp = client.get("/api/validation/backtest?train_fraction=0.7", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "metrics" in data
    assert "precision" in data["metrics"]
    assert "recall" in data["metrics"]
    assert "f1_score" in data["metrics"]
    assert "confusion_matrix" in data
    assert "true_positives" in data["confusion_matrix"]
    assert "brier_score" in data
    assert "bootstrap_ci" in data
    assert "ci_lower" in data["bootstrap_ci"]


def test_calibration_plot_endpoint(auth_headers):
    resp = client.get("/api/validation/calibration-plot?n_bins=10", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "brier_score" in data
    assert "deciles" in data
    assert len(data["deciles"]) == 10
    first_decile = data["deciles"][0]
    assert "range_label" in first_decile
    assert "mean_predicted_prob" in first_decile
    assert "observed_event_rate" in first_decile
    assert "provenance" in data
    assert "provenance_badge" in data["provenance"]


def test_cox_regression_cross_validation_and_bootstrap(auth_headers):
    resp = client.get("/api/validation/cox-regression", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    if "cross_validation" in data:
        assert "mean_c_index" in data["cross_validation"]
        assert "fold_c_indices" in data["cross_validation"]
    if "bootstrap_ci" in data:
        assert "ci_lower" in data["bootstrap_ci"]
        assert "ci_upper" in data["bootstrap_ci"]
        assert data["bootstrap_ci"]["ci_lower"] <= data["bootstrap_ci"]["ci_upper"]


def test_survival_service_empty_df():
    svc = SurvivalValidationService(analytics_service=None)
    res_km = svc.get_kaplan_meier_analysis()
    assert "error" in res_km

    res_cox = svc.get_cox_proportional_hazards()
    assert "error" in res_cox

    res_bt = svc.run_backtest_evaluation()
    assert "error" in res_bt
