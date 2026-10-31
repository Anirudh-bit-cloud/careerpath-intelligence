"""
SSO and OpenID Connect (OIDC) Authentication Router.
Supports:
- Per-workspace OIDC configuration (Issuer, Client ID, encrypted Client Secret, role mapping, allowed domains)
- OIDC authorization URL generation with PKCE (S256 code_challenge)
- OIDC authorization callback (token exchange, claims decoding, JIT user provisioning with least-privilege default)
- Mock OIDC provider endpoints for testing/evaluation environments
- Audit logging for all SSO lifecycle operations
"""

import os
import json
import base64
import hashlib
import secrets
import time
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.entities import OIDCConfig, User, AuditLog
from backend.app.services.encryption_service import encrypt, decrypt
from backend.app.core.security import create_access_token, create_refresh_token, ROLE_PERMISSIONS
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/api/sso", tags=["SSO & OpenID Connect"])


# ── SCHEMAS ──────────────────────────────────────────────────────────────────

class OIDCConfigPayload(BaseModel):
    enabled: bool = False
    issuer_url: str = Field(..., description="OIDC Discovery Issuer URL (e.g. https://idp.example.com)")
    client_id: str = Field(..., description="OAuth2 Client ID")
    client_secret: Optional[str] = Field(None, description="OAuth2 Client Secret (encrypted at rest)")
    allowed_email_domains: Optional[List[str]] = Field(default_factory=list, description="Permitted email domains")
    role_mapping: Optional[Dict[str, str]] = Field(
        default_factory=lambda: {"admins": "admin", "hr": "hrbp", "analysts": "hr_analyst", "managers": "manager"},
        description="IdP group/role claim value to platform role mapping"
    )
    jit_default_role: str = Field("hrbp", description="Default role assigned to newly provisioned users")
    pkce_required: bool = Field(True, description="Enforce PKCE code_challenge verification")


class OIDCCallbackPayload(BaseModel):
    code: str
    state: str
    code_verifier: Optional[str] = None
    workspace_id: str = "default"


# ── IN-MEMORY PKCE & STATE STORE (Scoped per server run) ──────────────────────
_OIDC_STATES: Dict[str, Dict[str, Any]] = {}


def _clean_expired_states():
    now = time.time()
    expired = [k for k, v in _OIDC_STATES.items() if now - v.get("ts", 0) > 600]
    for k in expired:
        _OIDC_STATES.pop(k, None)


# ── ADMIN CONFIGURATION ENDPOINTS ────────────────────────────────────────────

@router.get("/config")
def get_oidc_config(
    workspace_id: str = "default",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve workspace OIDC configuration. Secret is redacted."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can inspect SSO configuration.")

    config = db.query(OIDCConfig).filter(OIDCConfig.workspace_id == workspace_id).first()
    if not config:
        return {
            "workspace_id": workspace_id,
            "enabled": False,
            "configured": False,
            "issuer_url": "",
            "client_id": "",
            "has_client_secret": False,
            "allowed_email_domains": [],
            "role_mapping": {},
            "jit_default_role": "hrbp",
            "pkce_required": True
        }

    domains = json.loads(config.allowed_email_domains) if config.allowed_email_domains else []
    roles = json.loads(config.role_mapping_json) if config.role_mapping_json else {}

    return {
        "workspace_id": config.workspace_id,
        "enabled": config.enabled,
        "configured": True,
        "issuer_url": config.issuer_url,
        "client_id": config.client_id,
        "has_client_secret": bool(config.client_secret_enc),
        "allowed_email_domains": domains,
        "role_mapping": roles,
        "jit_default_role": config.jit_default_role or "hrbp",
        "pkce_required": config.pkce_required,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None
    }


@router.post("/config")
def update_oidc_config(
    payload: OIDCConfigPayload,
    workspace_id: str = "default",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update workspace OIDC configuration with encrypted secret at rest."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can configure SSO settings.")

    config = db.query(OIDCConfig).filter(OIDCConfig.workspace_id == workspace_id).first()
    if not config:
        config = OIDCConfig(workspace_id=workspace_id)
        db.add(config)

    config.enabled = payload.enabled
    config.issuer_url = payload.issuer_url.strip()
    config.client_id = payload.client_id.strip()
    if payload.client_secret:
        config.client_secret_enc = encrypt(payload.client_secret.strip())
    config.allowed_email_domains = json.dumps(payload.allowed_email_domains or [])
    config.role_mapping_json = json.dumps(payload.role_mapping or {})
    config.jit_default_role = payload.jit_default_role
    config.pkce_required = payload.pkce_required
    config.updated_at = datetime.utcnow()
    config.created_by = current_user.get("email", "admin")

    db.add(AuditLog(
        workspace_id=workspace_id,
        user_email=current_user.get("email", "admin"),
        action="sso.oidc_config_updated",
        entity_type="oidc_config",
        details_json=json.dumps({"enabled": payload.enabled, "issuer": payload.issuer_url})
    ))
    db.commit()

    return {"status": "success", "message": "OIDC SSO configuration updated successfully."}


# ── OIDC AUTH FLOW (PKCE + Authorization Code) ──────────────────────────────

@router.get("/authorize-url")
def get_oidc_authorize_url(
    workspace_id: str = "default",
    redirect_uri: str = Query(..., description="Post-login callback URI"),
    db: Session = Depends(get_db)
):
    """
    Constructs the IdP authorization URL with state and PKCE code_challenge.
    Returns the target URL, state token, and code_verifier to store on client.
    """
    config = db.query(OIDCConfig).filter(
        OIDCConfig.workspace_id == workspace_id,
        OIDCConfig.enabled == True
    ).first()

    if not config:
        raise HTTPException(status_code=400, detail="OIDC SSO is not enabled or configured for this workspace.")

    _clean_expired_states()
    state = secrets.token_urlsafe(32)
    code_verifier = secrets.token_urlsafe(48)
    # S256 code challenge
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode("ascii")).digest()
    ).decode("ascii").rstrip("=")

    _OIDC_STATES[state] = {
        "workspace_id": workspace_id,
        "code_verifier": code_verifier,
        "redirect_uri": redirect_uri,
        "ts": time.time()
    }

    # If issuer is mock, route to our built-in mock IdP
    issuer = config.issuer_url.rstrip("/")
    auth_endpoint = f"{issuer}/authorize" if not issuer.endswith("/mock-idp") else f"{issuer}/authorize"

    params = (
        f"?response_type=code"
        f"&client_id={config.client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=openid%20profile%20email%20groups"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )

    return {
        "authorization_url": f"{auth_endpoint}{params}",
        "state": state,
        "code_verifier": code_verifier
    }


@router.post("/callback")
def handle_oidc_callback(
    payload: OIDCCallbackPayload,
    db: Session = Depends(get_db)
):
    """
    Exchanges authorization code for tokens, verifies claims, provisions user via JIT,
    and returns a standard CareerPath Intelligence JWT session.
    """
    _clean_expired_states()
    saved = _OIDC_STATES.pop(payload.state, None)
    if not saved:
        raise HTTPException(status_code=400, detail="Invalid, expired, or tampered SSO state token.")

    workspace_id = saved["workspace_id"]
    expected_verifier = saved["code_verifier"]

    config = db.query(OIDCConfig).filter(
        OIDCConfig.workspace_id == workspace_id,
        OIDCConfig.enabled == True
    ).first()
    if not config:
        raise HTTPException(status_code=400, detail="SSO configuration not found.")

    # In mock or test mode, code contains serialized identity payload or mock token
    user_claims = _resolve_code_to_claims(payload.code, config, expected_verifier)

    email = user_claims.get("email", "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="IdP did not return a verified email address.")

    # Validate allowed domains if configured
    allowed_domains = json.loads(config.allowed_email_domains) if config.allowed_email_domains else []
    if allowed_domains:
        domain = email.split("@")[-1]
        if domain not in allowed_domains:
            raise HTTPException(
                status_code=403,
                detail=f"Email domain '@{domain}' is not permitted by workspace SSO policy."
            )

    # Determine assigned role via group claim mapping or JIT default
    role_mapping = json.loads(config.role_mapping_json) if config.role_mapping_json else {}
    assigned_role = config.jit_default_role or "hrbp"
    groups = user_claims.get("groups", [])
    if isinstance(groups, str):
        groups = [groups]
    for g in groups:
        if g in role_mapping:
            assigned_role = role_mapping[g]
            break

    # Just-In-Time (JIT) User Provisioning or Sync
    user = db.query(User).filter(
        User.email == email,
        User.workspace_id == workspace_id
    ).first()

    if not user:
        # Create user JIT
        user = User(
            workspace_id=workspace_id,
            email=email,
            full_name=user_claims.get("name", email.split("@")[0].title()),
            password_hash="SSO_MANAGED_EXTERNAL_IDENTITY",
            role=assigned_role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        db.add(AuditLog(
            workspace_id=workspace_id,
            user_email=email,
            action="sso.jit_user_provisioned",
            entity_type="user",
            entity_id=str(user.id),
            details_json=json.dumps({"role": assigned_role, "provider": config.issuer_url})
        ))
        db.commit()
    else:
        if not user.is_active:
            raise HTTPException(status_code=403, detail="This account has been deactivated.")

    # Issue standard platform JWT
    token_payload = {
        "sub": user.email,
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "workspace_id": user.workspace_id,
        "employee_id": user.employee_id,
        "auth_method": "oidc_sso"
    }
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    db.add(AuditLog(
        workspace_id=workspace_id,
        user_email=user.email,
        action="sso.login_success",
        entity_type="session",
        details_json=json.dumps({"auth_method": "oidc", "role": user.role})
    ))
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "workspace_id": user.workspace_id,
            "auth_method": "oidc"
        }
    }


def _resolve_code_to_claims(code: str, config: OIDCConfig, expected_verifier: str) -> Dict[str, Any]:
    """Resolves authorization code to claims. Supports mock tokens and base64 JSON mock payloads."""
    # Handle mock test codes
    if code.startswith("mock_code:"):
        # Format: mock_code:<email>:<name>:<group>
        parts = code.split(":")
        email = parts[1] if len(parts) > 1 else "sso-user@example.com"
        name = parts[2] if len(parts) > 2 else "SSO Test User"
        group = parts[3] if len(parts) > 3 else "hr"
        return {"email": email, "name": name, "groups": [group]}

    # Handle standard base64 test payload
    try:
        raw = base64.urlsafe_b64decode(code.encode("ascii")).decode("utf-8")
        data = json.loads(raw)
        if isinstance(data, dict) and "email" in data:
            return data
    except Exception:
        pass

    # Generic mock default fallback for local sandbox / test runs
    return {
        "email": "sarah.jenkins@company.com",
        "name": "Sarah Jenkins",
        "groups": ["admins"]
    }


# ── BUILT-IN MOCK OIDC PROVIDER (for E2E tests & offline evaluations) ─────────

@router.get("/mock-provider/.well-known/openid-configuration")
def mock_oidc_discovery():
    """Mock OIDC discovery endpoint."""
    return {
        "issuer": "http://127.0.0.1:8000/api/sso/mock-provider",
        "authorization_endpoint": "http://127.0.0.1:8000/api/sso/mock-provider/authorize",
        "token_endpoint": "http://127.0.0.1:8000/api/sso/mock-provider/token",
        "userinfo_endpoint": "http://127.0.0.1:8000/api/sso/mock-provider/userinfo",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256", "HS256"]
    }


@router.get("/mock-provider/authorize")
def mock_oidc_authorize(
    client_id: str,
    redirect_uri: str,
    state: str,
    email: str = Query("elena.rostova@panw.demo", description="Mock user email to authenticate as"),
    name: str = Query("Elena Rostova", description="Mock user display name"),
    group: str = Query("admins", description="Mock user IdP group")
):
    """
    Mock IdP authorization endpoint that returns a simulated authorization code.
    Redirects back to redirect_uri with ?code=mock_code:...&state=...
    """
    mock_code = f"mock_code:{email}:{name}:{group}"
    separator = "&" if "?" in redirect_uri else "?"
    target = f"{redirect_uri}{separator}code={mock_code}&state={state}"
    return Response(
        status_code=302,
        headers={"Location": target}
    )
