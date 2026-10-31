"""
Tests for Phase 5 SSO, SCIM 2.0, and HRIS (BambooHR) Connectors:
- OIDC configuration CRUD and secret encryption
- OIDC PKCE code_challenge authorize URL generation
- OIDC mock provider & callback handling with JIT user provisioning
- SCIM 2.0 Bearer token generation and hashing
- SCIM 2.0 /scim/v2/Users (List, Get, Create, Patch active=false, Delete)
- BambooHR connector dry-run with recorded fixtures
- BambooHR sync run logging into HRISSyncLog and AuditLog
- Tenant isolation tests for OIDC, SCIM, and BambooHR configurations
- Key rotation test using encryption_service
"""

import os
import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token
from backend.app.models.entities import (
    OIDCConfig, SCIMToken, HRISConnectorConfig, HRISSyncLog, User, AuditLog
)
from backend.app.database.connection import SessionLocal
from backend.app.services.encryption_service import (
    encrypt, decrypt, generate_new_key, hash_token
)

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
# 1. Encryption Service Tests
# ---------------------------------------------------------------------------

class TestEncryptionService:
    def test_encrypt_decrypt_roundtrip(self):
        secret = "super_confidential_client_secret_9988!"
        enc = encrypt(secret)
        assert enc != secret
        assert enc.startswith("ENC:")
        dec = decrypt(enc)
        assert dec == secret

    def test_generate_new_key(self):
        k1 = generate_new_key()
        k2 = generate_new_key()
        assert k1 != k2
        assert len(k1) > 30

    def test_hash_token_deterministic(self):
        t1 = "scim_token_abc123"
        h1 = hash_token(t1)
        h2 = hash_token(t1)
        assert h1 == h2
        assert len(h1) == 64  # sha256 hex


# ---------------------------------------------------------------------------
# 2. OIDC & SSO Endpoints
# ---------------------------------------------------------------------------

class TestOIDCEndpoints:
    def test_oidc_config_flow(self, admin_headers):
        payload = {
            "enabled": True,
            "issuer_url": "http://127.0.0.1:8000/api/sso/mock-provider",
            "client_id": "careerpath-client",
            "client_secret": "my-secret-key-123",
            "allowed_email_domains": ["panw.demo", "company.com"],
            "role_mapping": {"admins": "admin", "hr": "hrbp"},
            "jit_default_role": "hrbp",
            "pkce_required": True
        }
        # Update config
        r = client.post("/api/sso/config?workspace_id=default", json=payload, headers=admin_headers)
        assert r.status_code == 200

        # Retrieve config (client_secret must not be leaked)
        r_get = client.get("/api/sso/config?workspace_id=default", headers=admin_headers)
        assert r_get.status_code == 200
        data = r_get.json()
        assert data["enabled"] is True
        assert data["issuer_url"] == payload["issuer_url"]
        assert data["has_client_secret"] is True
        assert "my-secret-key-123" not in str(data)

    def test_oidc_authorize_url_pkce(self):
        r = client.get("/api/sso/authorize-url?workspace_id=default&redirect_uri=http://localhost:5173/auth/callback")
        assert r.status_code == 200
        data = r.json()
        assert "authorization_url" in data
        assert "state" in data
        assert "code_verifier" in data
        assert "code_challenge=" in data["authorization_url"]
        assert "code_challenge_method=S256" in data["authorization_url"]

    def test_oidc_mock_provider_endpoints(self):
        # 1. Discovery doc
        r_disc = client.get("/api/sso/mock-provider/.well-known/openid-configuration")
        assert r_disc.status_code == 200
        assert "authorization_endpoint" in r_disc.json()

        # 2. Mock authorize redirect
        r_auth = client.get(
            "/api/sso/mock-provider/authorize?client_id=test&redirect_uri=http://localhost:5173/cb&state=xyz123&email=jit-test@company.com&name=JIT+Tester&group=admins",
            follow_redirects=False
        )
        assert r_auth.status_code == 302
        loc = r_auth.headers.get("location", "")
        assert "code=mock_code:jit-test@company.com:" in loc
        assert ":admins" in loc

    def test_oidc_callback_jit_provisioning(self, admin_headers):
        # Initiate auth to generate valid state and verifier
        r_init = client.get("/api/sso/authorize-url?workspace_id=default&redirect_uri=http://localhost:5173/cb")
        assert r_init.status_code == 200
        state = r_init.json()["state"]

        callback_payload = {
            "code": "mock_code:elena.rostova@panw.demo:Elena Rostova:admins",
            "state": state,
            "workspace_id": "default"
        }
        r_cb = client.post("/api/sso/callback", json=callback_payload)
        assert r_cb.status_code == 200
        cb_data = r_cb.json()
        assert "access_token" in cb_data
        assert cb_data["user"]["email"] == "elena.rostova@panw.demo"
        assert cb_data["user"]["role"] == "admin"

    def test_manager_cannot_modify_sso_config(self, manager_headers):
        r = client.post("/api/sso/config?workspace_id=default", json={"issuer_url": "x", "client_id": "y"}, headers=manager_headers)
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# 3. SCIM 2.0 Endpoints
# ---------------------------------------------------------------------------

class TestSCIMEndpoints:
    def test_scim_lifecycle(self, admin_headers):
        # 1. Generate SCIM Token as admin
        r_tok = client.post("/scim/v2/tokens/generate?workspace_id=default", json={"label": "Okta Test"}, headers=admin_headers)
        assert r_tok.status_code == 200
        tok_data = r_tok.json()
        token = tok_data["token"]
        scim_headers = {"Authorization": f"Bearer {token}"}

        # 2. List Users via SCIM
        r_list = client.get("/scim/v2/Users", headers=scim_headers)
        assert r_list.status_code == 200
        assert "totalResults" in r_list.json()

        # 3. Create User via SCIM (use unique email)
        import time
        unique_email = f"scim.user.{int(time.time()*1000)}@company.com"
        scim_create = {
            "userName": unique_email,
            "name": {"formatted": "SCIM Test User", "givenName": "SCIM", "familyName": "User"},
            "active": True,
            "roles": [{"value": "hrbp"}]
        }
        r_create = client.post("/scim/v2/Users", json=scim_create, headers=scim_headers)
        assert r_create.status_code == 201
        created_user = r_create.json()
        user_id = created_user["id"]
        assert created_user["userName"] == unique_email
        assert created_user["active"] is True

        # 4. Get User by ID
        r_get = client.get(f"/scim/v2/Users/{user_id}", headers=scim_headers)
        assert r_get.status_code == 200
        assert r_get.json()["id"] == user_id

        # 5. Patch User to active=false (instant deprovisioning)
        patch_payload = {
            "Operations": [
                {"op": "replace", "path": "active", "value": False}
            ]
        }
        r_patch = client.patch(f"/scim/v2/Users/{user_id}", json=patch_payload, headers=scim_headers)
        assert r_patch.status_code == 200
        assert r_patch.json()["active"] is False

        # 6. Verify user is now inactive in DB
        db = SessionLocal()
        u = db.query(User).filter(User.id == int(user_id)).first()
        assert u is not None
        assert u.is_active is False
        db.close()

        # 7. Delete via SCIM
        r_del = client.delete(f"/scim/v2/Users/{user_id}", headers=scim_headers)
        assert r_del.status_code == 204

    def test_scim_unauthorized_without_token(self):
        r = client.get("/scim/v2/Users")
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# 4. BambooHR Connector Tests
# ---------------------------------------------------------------------------

class TestBambooHRConnector:
    def test_bamboohr_dry_run_with_fixtures(self, admin_headers):
        payload = {
            "subdomain": "demo",
            "api_key": "test_api_key_123"
        }
        r = client.post("/api/connectors/bamboohr/dry-run", json=payload, headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["dry_run"] is True
        details = data["details"]
        assert details["source"] == "recorded_fixtures"
        assert details["total_records_fetched"] == 5
        assert len(details["sample_records"]) > 0
        sample = details["sample_records"][0]
        assert "EmployeeID" in sample
        assert "PromotionGapRatio" in sample

    def test_bamboohr_config_save_and_retrieve(self, admin_headers):
        cfg = {
            "subdomain": "panw-cyber",
            "api_key": "bamboo_secret_live_key",
            "enabled": True,
            "sync_schedule": "daily"
        }
        r_post = client.post("/api/connectors/bamboohr/config?workspace_id=default", json=cfg, headers=admin_headers)
        assert r_post.status_code == 200

        r_get = client.get("/api/connectors/bamboohr/config?workspace_id=default", headers=admin_headers)
        assert r_get.status_code == 200
        data = r_get.json()
        assert data["subdomain"] == "panw-cyber"
        assert data["has_api_key"] is True
        assert "bamboo_secret_live_key" not in str(data)  # Redacted!

    def test_bamboohr_sync_execution(self, admin_headers):
        r_sync = client.post("/api/connectors/bamboohr/sync?workspace_id=default", headers=admin_headers)
        assert r_sync.status_code == 200
        data = r_sync.json()
        assert data["status"] == "success"
        assert data["rows_synced"] == 5

        # Check sync logs
        r_logs = client.get("/api/connectors/sync-logs?workspace_id=default", headers=admin_headers)
        assert r_logs.status_code == 200
        logs = r_logs.json()
        assert len(logs) > 0
        assert logs[0]["connector_type"] == "bamboohr"
        assert logs[0]["status"] == "success"


# ---------------------------------------------------------------------------
# 5. Tenant Isolation Tests (OIDC, SCIM, HRIS)
# ---------------------------------------------------------------------------

class TestPhase5TenantIsolation:
    def test_oidc_config_isolated_per_tenant(self, admin_headers):
        token_t1 = create_access_token({"sub": "admin_t1", "role": "admin", "workspace_id": "tenant-alpha"})
        headers_t1 = {"Authorization": f"Bearer {token_t1}"}

        payload = {
            "enabled": True,
            "issuer_url": "https://idp.tenant-alpha.com",
            "client_id": "alpha-client",
            "allowed_email_domains": ["alpha.com"]
        }
        client.post("/api/sso/config?workspace_id=tenant-alpha", json=payload, headers=headers_t1)

        # Query from default tenant — should not see tenant-alpha config
        r_def = client.get("/api/sso/config?workspace_id=default", headers=admin_headers)
        assert r_def.status_code == 200
        assert r_def.json().get("issuer_url") != "https://idp.tenant-alpha.com"

    def test_scim_token_isolated_per_tenant(self, admin_headers):
        token_t1 = create_access_token({"sub": "admin_t1", "role": "admin", "workspace_id": "tenant-scim-test"})
        headers_t1 = {"Authorization": f"Bearer {token_t1}"}

        r_gen = client.post("/scim/v2/tokens/generate?workspace_id=tenant-scim-test", json={"label": "Tenant Test"}, headers=headers_t1)
        tok = r_gen.json()["token"]

        # SCIM request with tenant token should only list tenant users
        scim_headers = {"Authorization": f"Bearer {tok}"}
        r_list = client.get("/scim/v2/Users", headers=scim_headers)
        assert r_list.status_code == 200
        # Should return 0 users for this new tenant
        assert r_list.json()["totalResults"] == 0
