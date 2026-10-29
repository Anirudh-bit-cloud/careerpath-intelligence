"""
Comprehensive Automated Tests for CareerPath Intelligence.
Tests feature engineering, zero-denominator safeguards, clustering, and API endpoints.
"""

import os
import sys

# Ensure careerpath-intelligence root is on sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from ml.feature_engineering import compute_career_features
from ml.clustering import perform_career_clustering
from ml.recommendations import generate_recommendations
from backend.app.main import app
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import InterventionRecord

client = TestClient(app)

def test_feature_engineering_zero_tenure():
    """Verify zero tenure handles division safely without NaN or infinite values."""
    raw_data = pd.DataFrame([{
        'YearsAtCompany': 0,
        'YearsInCurrentRole': 0,
        'YearsSinceLastPromotion': 0,
        'YearsWithCurrManager': 0,
        'TrainingTimesLastYear': 2,
        'JobLevel': 1,
        'TotalWorkingYears': 0,
        'JobSatisfaction': 3,
        'JobInvolvement': 3,
        'Attrition': 0
    }])
    df_feat = compute_career_features(raw_data)
    
    assert df_feat['PromotionGapRatio'].iloc[0] == 0.0
    assert df_feat['RoleStagnationIndex'].iloc[0] == 0.0
    assert not np.isinf(df_feat['TrainingIntensityScore'].iloc[0])
    assert not np.isnan(df_feat['PromotionGapScore'].iloc[0])
    assert df_feat['PromotionGapCategory'].iloc[0] in ['Low', 'Medium', 'High']

def test_feature_engineering_stagnation_logic():
    """Verify an employee with long promotion latency receives High Promotion Gap Risk."""
    raw_data = pd.DataFrame([{
        'YearsAtCompany': 8,
        'YearsInCurrentRole': 7,
        'YearsSinceLastPromotion': 6,
        'YearsWithCurrManager': 6,
        'TrainingTimesLastYear': 1,
        'JobLevel': 2,
        'TotalWorkingYears': 10,
        'JobSatisfaction': 3,
        'JobInvolvement': 3,
        'Attrition': 0
    }])
    df_feat = compute_career_features(raw_data)
    
    # 6 years unpromoted out of 8 at company = 0.75 gap ratio
    assert df_feat['PromotionGapRatio'].iloc[0] == 0.75
    assert df_feat['PromotionGapCategory'].iloc[0] == 'High'
    assert df_feat['RetentionPriority'].iloc[0] == 'Urgent'

def test_clustering_execution():
    """Verify K-Means clustering runs and generates silhouette metrics & PCA coordinates."""
    df_sample = pd.DataFrame({
        'YearsAtCompany': [1, 2, 8, 12, 15, 3, 7, 9, 14, 2],
        'YearsInCurrentRole': [1, 1, 6, 8, 10, 2, 5, 7, 12, 1],
        'YearsSinceLastPromotion': [0, 1, 6, 7, 9, 1, 4, 6, 8, 0],
        'YearsWithCurrManager': [1, 1, 5, 7, 9, 2, 4, 6, 10, 1],
        'TrainingTimesLastYear': [3, 2, 1, 2, 1, 4, 2, 1, 1, 3],
        'PromotionGapRatio': [0.0, 0.5, 0.75, 0.58, 0.60, 0.33, 0.57, 0.66, 0.57, 0.0],
        'RoleStagnationIndex': [1.0, 0.5, 0.75, 0.66, 0.66, 0.66, 0.71, 0.77, 0.85, 0.5],
        'JobLevel': [1, 1, 2, 4, 5, 2, 3, 3, 5, 1],
        'RetentionOpportunityIndex': [30, 45, 78, 55, 60, 35, 70, 75, 50, 28],
        'PromotionGapCategory': ['Low', 'Medium', 'High', 'High', 'High', 'Low', 'High', 'High', 'High', 'Low'],
        'EmployeeID': [f'TEST-{i}' for i in range(10)]
    })
    
    df_res, metrics, profiles = perform_career_clustering(df_sample, n_clusters=3, random_state=42)
    assert 'CareerCluster' in df_res.columns
    assert 'PCA1' in df_res.columns
    assert 'PCA2' in df_res.columns
    assert metrics['n_clusters'] == 3
    assert len(profiles) == 3

def test_api_health_and_metadata():
    """Verify health and metadata endpoints."""
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"
    
    res_meta = client.get("/api/metadata")
    assert res_meta.status_code == 200
    assert "total_records" in res_meta.json()

def test_api_overview():
    """Verify Executive Overview calculations."""
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "cluster_distribution" in data
    assert "insights" in data
    assert len(data["insights"]) >= 3

def test_intervention_crud_lifecycle():
    """Test creating, updating, and querying an intervention in SQLite."""
    # 1. Create
    payload = {
        "employee_id": "PANW-TEST-999",
        "department": "Engineering",
        "job_role": "Security Researcher",
        "category": "Promotion Readiness Review",
        "status": "New",
        "priority": "Urgent",
        "action_plan": "Test promotion review plan",
        "owner": "HRBP Test",
        "target_date": "2026-12-31",
        "notes": "Automated test note"
    }
    create_res = client.post("/api/interventions", json=payload)
    assert create_res.status_code == 201
    created_item = create_res.json()
    item_id = created_item["id"]
    assert created_item["employee_id"] == "PANW-TEST-999"
    
    # 2. Update
    update_payload = {"status": "Completed", "notes": "Intervention successfully completed."}
    update_res = client.put(f"/api/interventions/{item_id}", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Completed"
    
    # 3. Clean up
    del_res = client.delete(f"/api/interventions/{item_id}")
    assert del_res.status_code == 204

def test_retention_opportunities_filtering_and_summary():
    """Verify retention opportunities endpoint supports multi-criteria filtering and returns dynamic executive summary strip metrics."""
    res = client.get("/api/retention-opportunities?priority=Urgent&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "total_count" in data
    assert "filtered_summary" in data
    assert "filter_options" in data
    assert data["filtered_summary"]["urgent_count"] == data["total_count"]
    assert "median_promotion_gap" in data["filtered_summary"]
    assert "avg_opportunity_index" in data["filtered_summary"]
    assert len(data["records"]) <= 10
    if len(data["records"]) > 0:
        first = data["records"][0]
        assert first["RetentionPriority"] == "Urgent"
        assert "RetentionOpportunityIndex" in first
        assert "YearsWithCurrManager" in first

def test_enterprise_auth_and_rbac():
    """Verify PBKDF2 password verification and signed session token issuance."""
    login_res = client.post("/api/auth/login", json={"email": "admin@company.com", "password": "admin123"})
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "token" in login_data
    token = login_data["token"]
    
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    user_data = me_res.json()["user"]
    assert user_data["email"] == "admin@company.com"
    assert "manage:org" in user_data["permissions"]

def test_workspaces_and_policy_preview():
    """Verify multi-tenant workspace listing and scoring policy preview simulation."""
    ws_res = client.get("/api/workspaces")
    assert ws_res.status_code == 200
    assert len(ws_res.json()) >= 1

    sim_payload = {
        "weights": {"stagnation_weight": 0.50, "engagement_weight": 0.30, "training_deficit_weight": 0.20},
        "thresholds": {"level_1_dwell_years": 2.0, "level_2_dwell_years": 3.0, "level_3_dwell_years": 4.0}
    }
    prev_res = client.post("/api/policy/preview", json=sim_payload)
    assert prev_res.status_code == 200
    prev_data = prev_res.json()
    assert "simulation" in prev_data
    assert "baseline" in prev_data["simulation"]
    assert "simulated" in prev_data["simulation"]

def test_committee_and_pilot_lead_flows():
    """Verify committee sessions, decision logging, and pilot lead persistence."""
    # 1. Committee Session
    sess_res = client.get("/api/committee/sessions")
    assert sess_res.status_code == 200
    assert len(sess_res.json()) >= 1
    session_id = sess_res.json()[0]["id"]

    dec_res = client.post(f"/api/committee/sessions/{session_id}/decisions", json={
        "employee_id": "PANW-TEST-DECISION",
        "decision": "Approved Lateral Rotation",
        "rationale": "High role stagnation test case."
    })
    assert dec_res.status_code == 200

    # 2. Pilot Lead Submission
    lead_res = client.post("/api/pilot/leads", json={
        "full_name": "VP Talent Test",
        "work_email": "vptalent@enterprise.com",
        "company_name": "Apex Enterprise Systems",
        "role_title": "VP Human Capital",
        "company_size": "2000-5000",
        "use_case": "Quarterly calibration"
    })
    assert lead_res.status_code == 200
    assert "Apex Enterprise Systems" in lead_res.json()["message"]

def test_connectors_and_industry_preset():
    """Verify connectors status and synthetic industry preset switching."""
    conn_res = client.get("/api/connectors/status")
    assert conn_res.status_code == 200
    assert len(conn_res.json()["connectors"]) >= 5

    switch_res = client.post("/api/dataset/preset", json={"preset_key": "healthcare"})
    assert switch_res.status_code == 200
    assert "healthcare" in switch_res.json()["message"]
    # Switch back to cyber for consistency
    client.post("/api/dataset/preset", json={"preset_key": "cyber"})
