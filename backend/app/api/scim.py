"""
SCIM 2.0 (RFC 7643 / RFC 7644) Provisioning API Router.
Provides minimal SCIM 2.0 endpoints for Identity Provider synchronization:
- GET /scim/v2/Users — List users with filter and pagination
- GET /scim/v2/Users/{id} — Get user resource by ID
- POST /scim/v2/Users — Provision new user
- PATCH /scim/v2/Users/{id} — Partial updates (e.g. active=false for deprovisioning)
- DELETE /scim/v2/Users/{id} — Deprovision user

Authenticated via per-workspace SCIM Bearer token.
Deprovisioned users lose platform access immediately.
"""

import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.entities import User, SCIMToken, AuditLog
from backend.app.services.encryption_service import hash_token
from backend.app.core.security import ROLE_PERMISSIONS
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/scim/v2", tags=["SCIM 2.0 Provisioning"])


# ── SCIM AUTHENTICATION DEPENDENCY ───────────────────────────────────────────

def require_scim_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> str:
    """Validates SCIM bearer token and returns associated workspace_id."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid SCIM Bearer token.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
        )

    raw_token = authorization.split("Bearer ", 1)[1].strip()
    tok_hash = hash_token(raw_token)

    scim_entry = db.query(SCIMToken).filter(
        SCIMToken.token_hash == tok_hash,
        SCIMToken.revoked == False
    ).first()

    if not scim_entry:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked SCIM token.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
        )

    scim_entry.last_used_at = datetime.utcnow()
    db.commit()
    return scim_entry.workspace_id


# ── SCHEMAS ──────────────────────────────────────────────────────────────────

class SCIMUserName(BaseModel):
    formatted: Optional[str] = None
    givenName: Optional[str] = None
    familyName: Optional[str] = None


class SCIMUserEmail(BaseModel):
    value: str
    primary: Optional[bool] = True
    type: Optional[str] = "work"


class SCIMUserCreate(BaseModel):
    schemas: Optional[List[str]] = ["urn:ietf:params:scim:schemas:core:2.0:User"]
    userName: str
    name: Optional[SCIMUserName] = None
    emails: Optional[List[SCIMUserEmail]] = None
    active: Optional[bool] = True
    roles: Optional[List[Dict[str, Any]]] = None


class SCIMPatchOperation(BaseModel):
    op: str  # add, replace, remove
    path: Optional[str] = None
    value: Any


class SCIMUserPatch(BaseModel):
    schemas: Optional[List[str]] = ["urn:ietf:params:scim:api:messages:2.0:PatchOp"]
    Operations: List[SCIMPatchOperation]


# ── SCIM USER SERIALIZER ─────────────────────────────────────────────────────

def _user_to_scim(user: User) -> Dict[str, Any]:
    return {
        "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
        "id": str(user.id),
        "userName": user.email,
        "name": {
            "formatted": user.full_name,
            "givenName": user.full_name.split()[0] if user.full_name else "",
            "familyName": " ".join(user.full_name.split()[1:]) if user.full_name and len(user.full_name.split()) > 1 else ""
        },
        "emails": [{"value": user.email, "primary": True, "type": "work"}],
        "active": user.is_active,
        "roles": [{"value": user.role, "primary": True}],
        "meta": {
            "resourceType": "User",
            "created": user.created_at.isoformat() if hasattr(user, "created_at") and user.created_at else datetime.utcnow().isoformat(),
            "location": f"/scim/v2/Users/{user.id}"
        }
    }


# ── SCIM ENDPOINTS ───────────────────────────────────────────────────────────

@router.get("/Users")
def scim_list_users(
    filter: Optional[str] = None,
    startIndex: int = 1,
    count: int = 50,
    workspace_id: str = Depends(require_scim_token),
    db: Session = Depends(get_db)
):
    """SCIM 2.0 List Users with filtering support (userName eq '...')."""
    q = db.query(User).filter(User.workspace_id == workspace_id)

    if filter and "userName eq" in filter:
        # e.g. userName eq "user@example.com"
        target_email = filter.split("userName eq")[1].strip().strip('"').strip("'")
        q = q.filter(User.email == target_email)

    total_results = q.count()
    users = q.offset(max(0, startIndex - 1)).limit(count).all()

    return {
        "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
        "totalResults": total_results,
        "startIndex": startIndex,
        "itemsPerPage": len(users),
        "Resources": [_user_to_scim(u) for u in users]
    }


@router.get("/Users/{user_id}")
def scim_get_user(
    user_id: int,
    workspace_id: str = Depends(require_scim_token),
    db: Session = Depends(get_db)
):
    """SCIM 2.0 Get User by ID."""
    user = db.query(User).filter(
        User.id == user_id,
        User.workspace_id == workspace_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail={"schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"], "status": "404", "detail": "User not found."}
        )

    return _user_to_scim(user)


@router.post("/Users", status_code=201)
def scim_create_user(
    payload: SCIMUserCreate,
    workspace_id: str = Depends(require_scim_token),
    db: Session = Depends(get_db)
):
    """SCIM 2.0 Provision new user."""
    email = payload.userName.lower().strip()

    existing = db.query(User).filter(
        User.email == email,
        User.workspace_id == workspace_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail={"schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"], "status": "409", "detail": f"User {email} already exists."}
        )

    full_name = payload.name.formatted if payload.name and payload.name.formatted else email.split("@")[0].title()
    role = "hrbp"
    if payload.roles and len(payload.roles) > 0:
        candidate_role = payload.roles[0].get("value")
        if candidate_role in ROLE_PERMISSIONS:
            role = candidate_role

    user = User(
        workspace_id=workspace_id,
        email=email,
        full_name=full_name,
        password_hash="SCIM_PROVISIONED_ACCOUNT",
        role=role,
        is_active=payload.active if payload.active is not None else True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(AuditLog(
        workspace_id=workspace_id,
        user_email="scim_bridge",
        action="scim.user_created",
        entity_type="user",
        entity_id=str(user.id),
        details_json=json.dumps({"email": email, "role": role})
    ))
    db.commit()

    return _user_to_scim(user)


@router.patch("/Users/{user_id}")
def scim_patch_user(
    user_id: int,
    payload: SCIMUserPatch,
    workspace_id: str = Depends(require_scim_token),
    db: Session = Depends(get_db)
):
    """
    SCIM 2.0 Patch User — supports active=false for instant deprovisioning.
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.workspace_id == workspace_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail={"schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"], "status": "404", "detail": "User not found."}
        )

    for op in payload.Operations:
        op_name = op.op.lower()
        if op_name in ("replace", "add"):
            val = op.value
            if isinstance(val, dict):
                if "active" in val:
                    user.is_active = bool(val["active"])
                if "roles" in val and len(val["roles"]) > 0:
                    r = val["roles"][0].get("value")
                    if r in ROLE_PERMISSIONS:
                        user.role = r
            elif op.path == "active" or (isinstance(val, bool) and not op.path):
                user.is_active = bool(val)

    db.add(AuditLog(
        workspace_id=workspace_id,
        user_email="scim_bridge",
        action="scim.user_patched",
        entity_type="user",
        entity_id=str(user.id),
        details_json=json.dumps({"is_active": user.is_active, "role": user.role})
    ))
    db.commit()
    db.refresh(user)

    return _user_to_scim(user)


@router.delete("/Users/{user_id}", status_code=204)
def scim_delete_user(
    user_id: int,
    workspace_id: str = Depends(require_scim_token),
    db: Session = Depends(get_db)
):
    """SCIM 2.0 Delete/Deprovision User."""
    user = db.query(User).filter(
        User.id == user_id,
        User.workspace_id == workspace_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail={"schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"], "status": "404", "detail": "User not found."}
        )

    # Soft delete / deactivate so audit logs stay intact, or hard delete
    user.is_active = False

    db.add(AuditLog(
        workspace_id=workspace_id,
        user_email="scim_bridge",
        action="scim.user_deprovisioned",
        entity_type="user",
        entity_id=str(user.id),
        details_json=json.dumps({"email": user.email})
    ))
    db.commit()
    return Response(status_code=204)


# ── SCIM TOKEN MANAGEMENT (Admin Only) ────────────────────────────────────────

class SCIMTokenCreate(BaseModel):
    label: str = Field(..., description="Friendly label (e.g. 'Okta Production SCIM')")


@router.post("/tokens/generate")
def generate_scim_token(
    payload: SCIMTokenCreate,
    workspace_id: str = "default",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates a new SCIM 2.0 Bearer token. Secret is displayed once and hashed in DB."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can issue SCIM tokens.")

    import secrets
    raw_token = f"scim_{secrets.token_urlsafe(32)}"
    tok_hash = hash_token(raw_token)

    entry = SCIMToken(
        workspace_id=workspace_id,
        token_hash=tok_hash,
        label=payload.label.strip(),
        revoked=False
    )
    db.add(entry)
    db.add(AuditLog(
        workspace_id=workspace_id,
        user_email=current_user.get("email", "admin"),
        action="scim.token_generated",
        entity_type="scim_token",
        details_json=json.dumps({"label": payload.label})
    ))
    db.commit()

    return {
        "status": "success",
        "token": raw_token,
        "token_id": entry.id,
        "label": entry.label,
        "note": "Copy this token now. It cannot be recovered once dismissed."
    }


@router.get("/tokens")
def list_scim_tokens(
    workspace_id: str = "default",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists issued SCIM tokens for this workspace."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can inspect SCIM tokens.")

    tokens = db.query(SCIMToken).filter(
        SCIMToken.workspace_id == workspace_id,
        SCIMToken.revoked == False
    ).order_by(SCIMToken.created_at.desc()).all()

    return [
        {
            "id": t.id,
            "label": t.label,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "last_used_at": t.last_used_at.isoformat() if t.last_used_at else None
        }
        for t in tokens
    ]


@router.delete("/tokens/{token_id}")
def revoke_scim_token(
    token_id: int,
    workspace_id: str = "default",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revokes a SCIM token immediately."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can revoke SCIM tokens.")

    entry = db.query(SCIMToken).filter(
        SCIMToken.id == token_id,
        SCIMToken.workspace_id == workspace_id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="SCIM token not found.")

    entry.revoked = True
    db.add(AuditLog(
        workspace_id=workspace_id,
        user_email=current_user.get("email", "admin"),
        action="scim.token_revoked",
        entity_type="scim_token",
        entity_id=str(token_id)
    ))
    db.commit()

    return {"status": "success", "message": "SCIM token revoked."}
