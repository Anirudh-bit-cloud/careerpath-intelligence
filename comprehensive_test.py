import requests
import json
import sys

BASE = "http://127.0.0.1:8000"
headers = {}

# Test Login first to get a JWT token
print("1. Testing Authentication...")
r = requests.post(f"{BASE}/api/auth/login", json={"email": "admin@careerpath.io", "role": "admin"})
if r.status_code == 200:
    data = r.json()
    token = data.get("token") or data.get("access_token")
    headers["Authorization"] = f"Bearer {token}"
    print(f"   Logged in as admin successfully. Token acquired: {bool(token)}")
else:
    print(f"   Login response: {r.status_code} {r.text}")

passed = 0
failed = 0
errors = []

def test(name, method, url, **kwargs):
    global passed, failed, errors
    try:
        req_headers = kwargs.pop("headers", headers)
        r = requests.request(method, f"{BASE}{url}", headers=req_headers, **kwargs)
        if 200 <= r.status_code < 300:
            print(f"  [PASS] {name} ({r.status_code})")
            passed += 1
            return r
        else:
            print(f"  [FAIL] {name} ({r.status_code}) -> {r.text[:150]}")
            failed += 1
            errors.append((name, r.status_code, r.text[:200]))
            return r
    except Exception as e:
        print(f"  [ERROR] {name} -> {str(e)}")
        failed += 1
        errors.append((name, 0, str(e)))
        return None

print("\n2. Testing Analytics & Core Dashboards...")
r_meta = test("Metadata", "GET", "/api/metadata")
r_over = test("Overview KPIs", "GET", "/api/overview")
r_clust = test("Clusters", "GET", "/api/clusters")
r_elbow = test("Clusters Elbow Curve", "GET", "/api/clusters/elbow-curve")
r_recluster = test("Re-run Clustering (k=4)", "POST", "/api/rerun-clustering", json={"n_clusters": 4, "auto_select_k": False})
r_gap = test("Promotion Gap List", "GET", "/api/promotion-gap?page=1&page_size=10")
r_ro = test("Retention Opportunities List", "GET", "/api/retention-opportunities?page=1&page_size=10")
r_ro_urgent = test("Retention Opportunities (Urgent)", "GET", "/api/retention-opportunities?priority=Urgent")
r_mgr = test("Manager Insights", "GET", "/api/manager-insights")

print("\n3. Testing Succession Planning & 9-Box...")
test("Succession 9-Box Grid", "GET", "/api/succession/9-box")
test("Succession Critical Roles", "GET", "/api/succession/critical-roles")
test("Succession Intervention Effectiveness", "GET", "/api/succession/effectiveness")

print("\n4. Testing Employee Explorer & Explainability...")
r_emp = test("Employee Search", "GET", "/api/employees?query=PANW")
emp_id = "1001"
if r_gap and r_gap.status_code == 200:
    items = r_gap.json().get("items", [])
    if items:
        emp_id = str(items[0].get("EmployeeID") or items[0].get("EmployeeNumber"))
test(f"Employee Profile ({emp_id})", "GET", f"/api/employees/{emp_id}")
test(f"Employee Score Explanation ({emp_id})", "GET", f"/api/employees/{emp_id}/score-explanation")
test(f"Simulate Career ({emp_id})", "POST", "/api/simulate-career", json={"employee_id": emp_id, "promote_now": True, "add_trainings": 2})

print("\n5. Testing Interventions CRUD Workflow...")
interv = test("List Interventions", "GET", "/api/interventions")
new_int_payload = {
    "employee_id": emp_id,
    "department": "Sales",
    "job_role": "Sales Executive",
    "category": "Promotion Readiness Review",
    "status": "New",
    "priority": "Urgent",
    "action_plan": "Conduct quarterly retention check-in and career roadmap review.",
    "owner": "HR Specialist",
    "target_date": "2026-12-01",
    "notes": "Automated test intervention note."
}
create_r = test("Create Intervention", "POST", "/api/interventions", json=new_int_payload)
int_id = None
if create_r and create_r.status_code in (200, 201):
    int_id = create_r.json().get("id")
    test("Update Intervention", "PUT", f"/api/interventions/{int_id}", json={"status": "In Progress", "priority": "High"})
    test("Update Intervention Outcome", "POST", f"/api/succession/outcomes/{int_id}", json={"outcome_status": "Retained", "retained_at_90_days": True})
    test("Delete Intervention", "DELETE", f"/api/interventions/{int_id}")

print("\n6. Testing Committee Review Sessions...")
test("List Committee Sessions", "GET", "/api/committee/sessions")
create_comm = test("Create Committee Session", "POST", "/api/committee/sessions", json={"title": "Q4 Talent Review Board", "scheduled_date": "2026-11-15"})
comm_id = None
if create_comm and create_comm.status_code in (200, 201):
    comm_id = create_comm.json().get("session_id") or create_comm.json().get("id")
    test("Log Committee Decision", "POST", f"/api/committee/sessions/{comm_id}/decisions", json={"employee_id": emp_id, "decision": "approved", "notes": "Approved for promotion review"})
    test("Update Committee Minutes", "PATCH", f"/api/committee/sessions/{comm_id}/minutes", json={"minutes": "Session completed with 1 candidate approved.", "status": "Completed"})

print("\n7. Testing Fairness & Bias Audit...")
test("Fairness Summary", "GET", "/api/fairness/summary")
test("Fairness Attribute (Gender)", "GET", "/api/fairness/attribute/Gender")
test("Fairness Attribute (Department)", "GET", "/api/fairness/attribute/Department")
test("Fairness CSV Export", "GET", "/api/fairness/export/csv")

print("\n8. Testing Model Validation & Survival Analysis...")
test("Validation Overview Metrics", "GET", "/api/validation/metrics")
test("Validation Survival Curves", "GET", "/api/validation/survival-curves")
test("Validation Cox Regression", "GET", "/api/validation/cox-regression")
test("Validation Backtest", "GET", "/api/validation/backtest?train_fraction=0.75")

print("\n9. Testing Governance, Trust & Audit Logs...")
test("Audit Logs", "GET", "/api/governance/audit-logs?limit=10")
test("Retention Preview", "GET", "/api/governance/retention-preview?retention_days=180")
test("Data Subject Export (DSAR)", "GET", f"/api/governance/data-subject-export?employee_id={emp_id}")

print("\n10. Testing Connectors, Webhooks & API Keys...")
test("Connectors Status", "GET", "/api/connectors/status")
test("Test Mock HRIS", "POST", "/api/connectors/test-hris?sync_count=5")
test("List API Keys", "GET", "/api/keys")
key_r = test("Create API Key", "POST", "/api/keys", json={"name": "Test Integration Key", "role": "hr_analyst"})
if key_r and key_r.status_code in (200, 201):
    k_id = key_r.json().get("id")
    if k_id:
        test("Revoke API Key", "DELETE", f"/api/keys/{k_id}")

test("List Webhooks", "GET", "/api/webhooks")
wh_r = test("Create Webhook", "POST", "/api/webhooks", json={"endpoint_url": "https://example.com/webhook", "secret_token": "whsec_test123", "subscribed_events": ["retention.alert"]})
if wh_r and wh_r.status_code in (200, 201):
    wh_id = wh_r.json().get("id")
    if wh_id:
        test("Test Webhook Dispatch", "POST", f"/api/webhooks/test?endpoint_id={wh_id}", json={"event": "test"})

print("\n11. Testing Policy Engine...")
test("Get Active Policy", "GET", "/api/policy")
test("Policy History", "GET", "/api/policy/history")
test("Policy Preview", "POST", "/api/policy/preview", json={
    "weights": {
        "gap_weight": 0.35,
        "cluster_risk_weight": 0.25,
        "satisfaction_inv_weight": 0.15,
        "tenure_weight": 0.15,
        "training_deficit_weight": 0.10
    }
})

print("\n12. Testing Notification Channels...")
test("Get Notification Preferences", "GET", "/api/notifications/preferences")
test("Test Notification Channel", "POST", "/api/notifications/test", json={"channel": "email", "target": "test@careerpath.io", "message": "Test notification"})
test("Notification Deliveries Log", "GET", "/api/notifications/deliveries?limit=5")

print("\n13. Testing Data Management Quality & Preset Switch...")
test("Data Quality Report", "GET", "/api/dataset/data-quality")
test("Sample Template Download", "GET", "/api/dataset/sample-template")
test("Switch Industry Preset (healthcare)", "POST", "/api/dataset/preset", json={"industry": "healthcare"})
test("Switch Industry Preset (finance)", "POST", "/api/dataset/preset", json={"industry": "finance"})
test("Reset to Demo", "POST", "/api/dataset/reset")

print("\n" + "="*50)
print(f"RESULTS: {passed} PASSED, {failed} FAILED")
print("="*50)
if errors:
    print("FAILED ENDPOINTS:")
    for err in errors:
        print(f" - {err[0]} ({err[1]}): {err[2]}")
else:
    print("ALL ENDPOINTS AND FEATURES TESTED 100% CLEAN!")
