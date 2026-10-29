"""
Tests for Phase 3 Fairness and Algorithmic Bias Audit:
- Calculation of disparate impact ratio across protected attributes.
- Suppression of cohorts where sample size n < 10.
- Detection of Four-Fifths rule violations (< 0.80) with an engineered synthetic dataset.
- RBAC restriction enforcement (admin/hrbp allowed, analyst/guest rejected).
- CSV export endpoint.
"""

import pytest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.fairness_service import FairnessAuditService
from backend.app.core.security import create_access_token

client = TestClient(app)


def test_fairness_synthetic_flag_detection():
    # Construct a synthetic dataset engineered to trigger a disparate impact violation (< 0.80)
    # Group A: 100 employees, 80 in Standard (favorable_rate = 0.80)
    # Group B: 100 employees, 40 in Standard (favorable_rate = 0.40) -> ratio = 0.40 / 0.80 = 0.50 (< 0.80 FLAG!)
    # Group C: 5 employees (sample size < 10 -> SUPPRESSED!)
    data = []
    # Group A
    for i in range(80):
        data.append({"EmployeeID": f"A-{i}", "Gender": "Female", "Age": 32, "Department": "R&D", "RetentionPriority": "Standard"})
    for i in range(20):
        data.append({"EmployeeID": f"A-urg-{i}", "Gender": "Female", "Age": 32, "Department": "R&D", "RetentionPriority": "Urgent"})

    # Group B
    for i in range(40):
        data.append({"EmployeeID": f"B-{i}", "Gender": "Male", "Age": 45, "Department": "Sales", "RetentionPriority": "Standard"})
    for i in range(60):
        data.append({"EmployeeID": f"B-urg-{i}", "Gender": "Male", "Age": 45, "Department": "Sales", "RetentionPriority": "Urgent"})

    # Group C (small cohort)
    for i in range(5):
        data.append({"EmployeeID": f"C-{i}", "Gender": "Non-Binary", "Age": 28, "Department": "Support", "RetentionPriority": "Standard"})

    synth_df = pd.DataFrame(data)

    service = FairnessAuditService()
    result = service.compute_fairness_audit(custom_df=synth_df, min_sample_size=10)

    assert result["overall_status"] == "FLAGGED_DISPARITIES_DETECTED"
    assert result["total_flags"] >= 1

    # Check Gender breakdown
    gender_audit = result["attributes"]["Gender"]
    groups = {g["group"]: g for g in gender_audit["groups"]}

    assert groups["Female"]["favorable_rate"] == 0.80
    assert groups["Male"]["favorable_rate"] == 0.40
    assert groups["Male"]["disparate_impact_ratio"] == 0.50
    assert groups["Male"]["four_fifths_flag"] is True

    # Check suppression for Non-Binary cohort (n=5 < 10)
    assert groups["Non-Binary"]["suppressed"] is True
    assert groups["Non-Binary"]["sample_size"] == 5
    assert groups["Non-Binary"]["four_fifths_flag"] is False


def test_fairness_api_rbac_and_endpoints():
    # 1. Unauthenticated or unprivileged role (e.g. hr_analyst without audit:fairness)
    analyst_token = create_access_token({"user_id": 2, "email": "analyst@company.com", "role": "hr_analyst", "workspace_id": "default"})
    res_forbidden = client.get("/api/fairness/summary", headers={"Authorization": f"Bearer {analyst_token}"})
    assert res_forbidden.status_code == 403

    # 2. Authorized role (admin)
    admin_token = create_access_token({"user_id": 1, "email": "admin@company.com", "role": "admin", "workspace_id": "default"})
    res_admin = client.get("/api/fairness/summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "overall_status" in data
    assert "attributes" in data
    assert "legal_notice" in data

    # 3. Attribute detail endpoint
    if "Gender" in data["attributes"]:
        detail_res = client.get("/api/fairness/attribute/Gender", headers={"Authorization": f"Bearer {admin_token}"})
        assert detail_res.status_code == 200
        attr_data = detail_res.json()
        assert attr_data["attribute"] == "Gender"
        assert "groups" in attr_data

    # 4. CSV export endpoint
    csv_res = client.get("/api/fairness/export/csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "DisparateImpactRatio" in csv_res.text
