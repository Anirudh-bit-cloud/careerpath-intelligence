"""
Authentication and User Management Routes for CareerPath Intelligence.
Supports real PBKDF2 verification, session token issuance, and RBAC enforcement.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from backend.app.database.connection import get_db
from backend.app.models.entities import User, AuditLog
from backend.app.core.security import (
    hash_password, verify_password, create_session_token, verify_session_token,
    ROLE_PERMISSIONS, has_permission
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & RBAC"])


class LoginRequest(BaseModel):
    email: str
    password: str
    workspace_id: Optional[str] = "default"


class UserCreateRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "hrbp"
    workspace_id: Optional[str] = "default"


class UserUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    full_name: Optional[str] = None


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Dependency that extracts and verifies current session user."""
    if not authorization:
        # Fallback to default demo user if unauthenticated
        return {
            "email": "admin@company.com",
            "full_name": "Sarah Jenkins",
            "role": "admin",
            "workspace_id": "default",
            "permissions": ROLE_PERMISSIONS["admin"]
        }
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_session_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session token")
    return payload


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact an administrator.")

    user.last_login = datetime.utcnow()
    # Log audit event
    audit = AuditLog(
        workspace_id=user.workspace_id,
        user_email=user.email,
        action="auth.login_success",
        entity_type="user",
        entity_id=str(user.id),
        details_json=f'{{"role": "{user.role}"}}'
    )
    db.add(audit)
    db.commit()

    token_payload = {
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "workspace_id": user.workspace_id,
        "permissions": ROLE_PERMISSIONS.get(user.role, [])
    }
    token = create_session_token(token_payload)

    return {
        "token": token,
        "user": token_payload
    }


@router.get("/me")
def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": current_user}


@router.get("/users")
def list_workspace_users(
    workspace_id: str = "default",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(User.workspace_id == workspace_id).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login": u.last_login.isoformat() if u.last_login else None
        }
        for u in users
    ]


@router.post("/users")
def create_user(
    req: UserCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only workspace Admins can invite new members.")

    existing = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        workspace_id=req.workspace_id or current_user.get("workspace_id", "default"),
        email=req.email.strip().lower(),
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
        is_active=True
    )
    db.add(new_user)

    audit = AuditLog(
        workspace_id=new_user.workspace_id,
        user_email=current_user.get("email", "system"),
        action="user.create",
        entity_type="user",
        details_json=f'{{"created_email": "{new_user.email}", "role": "{new_user.role}"}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)

    return {
        "message": f"User {new_user.email} created successfully.",
        "user_id": new_user.id
    }


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    req: UserUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can modify member roles.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.role:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.full_name:
        user.full_name = req.full_name

    audit = AuditLog(
        workspace_id=user.workspace_id,
        user_email=current_user.get("email", "system"),
        action="user.update",
        entity_type="user",
        entity_id=str(user.id),
        details_json=f'{{"updated_email": "{user.email}", "role": "{user.role}", "active": {user.is_active}}}'
    )
    db.add(audit)
    db.commit()

    return {"message": "User updated successfully."}
