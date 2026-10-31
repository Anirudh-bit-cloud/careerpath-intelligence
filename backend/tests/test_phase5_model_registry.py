"""
Phase 5 Tests: Model Registry, Governance & Training Reproducibility
- Model version persistence, schema verification & tenant isolation
- Model listing, promote, and rollback lifecycles
- Population Stability Index (PSI) drift monitoring
- Training Reproducibility Test: train with fixed random seed & data hash,
  re-train with identical seed and assert metrics match to 4 decimal places.
"""

import pytest
from fastapi.testclient import TestClient
import numpy as np
import pandas as pd
import json

from backend.app.main import app
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import ModelVersion, AuditLog
from backend.app.core.security import create_access_token
from backend.app.services.analytics_service import analytics_service
from backend.app.services.model_registry_service import model_registry_service
from ml.attrition_model import AttritionModelService

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_registry_tokens():
    admin_token = create_access_token({
        "user_id": 1,
        "email": "admin@company.com",
        "role": "admin",
        "workspace_id": "default",
        "permissions": ["manage:org", "view:validation"]
    })
    analyst_token = create_access_token({
        "user_id": 2,
        "email": "analyst@company.com",
        "role": "hr_analyst",
        "workspace_id": "default",
        "permissions": ["view:validation"]
    })
    other_tenant_token = create_access_token({
        "user_id": 99,
        "email": "admin@tenant-beta.corp",
        "role": "admin",
        "workspace_id": "tenant-beta",
        "permissions": ["manage:org"]
    })
    return {
        "admin_headers": {"Authorization": f"Bearer {admin_token}"},
        "analyst_headers": {"Authorization": f"Bearer {analyst_token}"},
        "other_tenant_headers": {"Authorization": f"Bearer {other_tenant_token}"}
    }


def test_list_models_and_initial_seeding(setup_registry_tokens):
    """Verifies that listing models automatically registers active baseline models."""
    res = client.get("/api/models", headers=setup_registry_tokens["admin_headers"])
    assert res.status_code == 200
    models = res.json()
    assert len(models) >= 2

    # Check for active GBDT and Cox models
    types = [m["model_type"] for m in models]
    assert "hist_gbdt" in types
    assert "cox" in types

    # Check structure
    active_m = next(m for m in models if m["status"] == "active")
    assert "training_data_hash" in active_m
    assert "metrics" in active_m
    assert "features" in active_m
    assert len(active_m["features"]) > 0


def test_promote_and_rollback_lifecycle(setup_registry_tokens):
    """Verifies promoting a candidate sets it active, archives previous, and rollback restores it."""
    db = SessionLocal()
    try:
        # Create a candidate model version
        candidate = ModelVersion(
            workspace_id="default",
            model_type="hist_gbdt",
            created_by="analyst@company.com",
            training_data_hash="abc123hash456",
            row_count=1470,
            feature_list_json=json.dumps(["YearsAtCompany", "PromotionGapRatio"]),
            hyperparameters_json=json.dumps({"max_iter": 150}),
            metrics_json=json.dumps({"roc_auc": 0.835, "brier_score": 0.092}),
            artifact_path="artifacts/models/default/candidate_test.joblib",
            status="candidate",
            notes="Test candidate version"
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        candidate_id = candidate.id
    finally:
        db.close()

    # 1. Promote candidate
    promote_res = client.post(f"/api/models/{candidate_id}/promote", headers=setup_registry_tokens["admin_headers"])
    assert promote_res.status_code == 200
    assert promote_res.json()["status"] == "active"

    # Verify previous active version was archived
    db = SessionLocal()
    try:
        active_versions = db.query(ModelVersion).filter(
            ModelVersion.workspace_id == "default",
            ModelVersion.model_type == "hist_gbdt",
            ModelVersion.status == "active"
        ).all()
        assert len(active_versions) == 1
        assert active_versions[0].id == candidate_id

        # Find archived version
        archived = db.query(ModelVersion).filter(
            ModelVersion.workspace_id == "default",
            ModelVersion.model_type == "hist_gbdt",
            ModelVersion.status == "archived"
        ).first()
        assert archived is not None
        archived_id = archived.id
    finally:
        db.close()

    # 2. Rollback to previous version
    rollback_res = client.post(f"/api/models/{archived_id}/rollback", headers=setup_registry_tokens["admin_headers"])
    assert rollback_res.status_code == 200
    assert rollback_res.json()["status"] == "active"

    db = SessionLocal()
    try:
        rolled_back = db.query(ModelVersion).filter(ModelVersion.id == archived_id).first()
        assert rolled_back.status == "active"
        promoted_prev = db.query(ModelVersion).filter(ModelVersion.id == candidate_id).first()
        assert promoted_prev.status == "archived"
    finally:
        db.close()


def test_psi_drift_calculation(setup_registry_tokens):
    """Verifies PSI calculation on feature distributions and drift thresholds."""
    # Test identical distributions -> PSI should be ~0.0
    arr = np.random.normal(10, 2, 500)
    psi_identical = model_registry_service.calculate_feature_psi(arr, arr)
    assert psi_identical < 0.05

    # Test shifted distribution -> PSI should be > 0.20
    shifted_arr = np.random.normal(20, 5, 500)
    psi_shifted = model_registry_service.calculate_feature_psi(arr, shifted_arr)
    assert psi_shifted > 0.20

    # API test for model drift
    models = client.get("/api/models", headers=setup_registry_tokens["admin_headers"]).json()
    active_m = models[0]
    drift_res = client.get(f"/api/models/{active_m['id']}/drift", headers=setup_registry_tokens["admin_headers"])
    assert drift_res.status_code == 200
    drift_data = drift_res.json()
    assert "overall_mean_psi" in drift_data
    assert "drift_status" in drift_data
    assert "features" in drift_data
    assert len(drift_data["features"]) > 0


def test_tenant_isolation_model_registry(setup_registry_tokens):
    """Asserts that another workspace cannot access model versions from default workspace."""
    other_res = client.get("/api/models", headers=setup_registry_tokens["other_tenant_headers"])
    assert other_res.status_code == 200
    other_models = other_res.json()
    for m in other_models:
        assert m["workspace_id"] == "tenant-beta"


def test_training_reproducibility():
    """
    CRITICAL REPRODUCIBILITY TEST (Phase 5 Requirement #3):
    Trains AttritionModelService on the current dataset with a fixed seed, records metrics,
    re-trains with the same random seed and data hash, and asserts that metrics match to 4 decimal places.
    """
    if analytics_service.df_enriched is None:
        analytics_service._load_data()
    df = analytics_service.df_enriched.copy()

    # Run 1: Fixed random seed 42
    svc1 = AttritionModelService(analytics_service=analytics_service, random_state=42)
    metrics1 = svc1.train(df)

    # Run 2: Same fixed random seed 42
    svc2 = AttritionModelService(analytics_service=analytics_service, random_state=42)
    metrics2 = svc2.train(df)

    # Assert exact match to 4 decimal places
    assert round(metrics1["roc_auc"], 4) == round(metrics2["roc_auc"], 4), (
        f"ROC-AUC mismatch: {metrics1['roc_auc']} vs {metrics2['roc_auc']}"
    )
    assert round(metrics1["brier_score"], 4) == round(metrics2["brier_score"], 4), (
        f"Brier score mismatch: {metrics1['brier_score']} vs {metrics2['brier_score']}"
    )
    assert round(metrics1["cv_mean"], 4) == round(metrics2["cv_mean"], 4), (
        f"CV Mean mismatch: {metrics1['cv_mean']} vs {metrics2['cv_mean']}"
    )
    assert round(metrics1["cv_std"], 4) == round(metrics2["cv_std"], 4), (
        f"CV Std mismatch: {metrics1['cv_std']} vs {metrics2['cv_std']}"
    )
    if "pr_auc" in metrics1 and "pr_auc" in metrics2:
        assert round(metrics1["pr_auc"], 4) == round(metrics2["pr_auc"], 4)
