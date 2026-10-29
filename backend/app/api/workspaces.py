"""
Workspace Management & White-Label Organization Configuration Routes.
Supports multi-tenant segregation, custom branding, and taxonomy settings.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.app.database.connection import get_db
from backend.app.models.entities import Workspace, AuditLog
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces & White-Labeling"])


class WorkspaceCreate(BaseModel):
    name: str
    organization_name: str
    slug: str
    accent_color: Optional[str] = "#4F75FF"
    fiscal_calendar_start: Optional[str] = "January"
    timezone: Optional[str] = "America/Los_Angeles"


class WorkspaceBrandingUpdate(BaseModel):
    name: Optional[str] = None
    organization_name: Optional[str] = None
    accent_color: Optional[str] = None
    logo_svg: Optional[str] = None
    is_white_labeled: Optional[bool] = None
    fiscal_calendar_start: Optional[str] = None
    timezone: Optional[str] = None
    locale: Optional[str] = None


@router.get("")
def list_workspaces(db: Session = Depends(get_db)):
    workspaces = db.query(Workspace).all()
    return [
        {
            "id": ws.id,
            "name": ws.name,
            "slug": ws.slug,
            "organization_name": ws.organization_name,
            "accent_color": ws.accent_color,
            "logo_svg": ws.logo_svg,
            "is_white_labeled": ws.is_white_labeled,
            "fiscal_calendar_start": ws.fiscal_calendar_start,
            "timezone": ws.timezone,
            "locale": ws.locale,
            "created_at": ws.created_at.isoformat() if ws.created_at else None
        }
        for ws in workspaces
    ]


@router.post("")
def create_workspace(
    payload: WorkspaceCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can establish new enterprise workspaces.")

    existing = db.query(Workspace).filter(Workspace.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Workspace slug already in use.")

    ws_id = payload.slug.lower().replace(" ", "-")
    new_ws = Workspace(
        id=ws_id,
        name=payload.name,
        slug=payload.slug,
        organization_name=payload.organization_name,
        accent_color=payload.accent_color or "#4F75FF",
        fiscal_calendar_start=payload.fiscal_calendar_start or "January",
        timezone=payload.timezone or "America/Los_Angeles"
    )
    db.add(new_ws)

    audit = AuditLog(
        workspace_id=ws_id,
        user_email=current_user.get("email", "system"),
        action="workspace.create",
        entity_type="workspace",
        entity_id=ws_id,
        details_json=f'{{"name": "{new_ws.name}", "org": "{new_ws.organization_name}"}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(new_ws)

    return {"message": "Workspace initialized successfully.", "workspace": {"id": new_ws.id, "name": new_ws.name}}


@router.get("/{workspace_id}")
def get_workspace(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    return {
        "id": ws.id,
        "name": ws.name,
        "slug": ws.slug,
        "organization_name": ws.organization_name,
        "accent_color": ws.accent_color,
        "logo_svg": ws.logo_svg,
        "is_white_labeled": ws.is_white_labeled,
        "fiscal_calendar_start": ws.fiscal_calendar_start,
        "timezone": ws.timezone,
        "locale": ws.locale
    }


@router.put("/{workspace_id}/branding")
def update_branding(
    workspace_id: str,
    payload: WorkspaceBrandingUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can modify organizational branding.")

    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(ws, field, val)

    audit = AuditLog(
        workspace_id=workspace_id,
        user_email=current_user.get("email", "system"),
        action="workspace.update_branding",
        entity_type="workspace",
        entity_id=workspace_id,
        details_json=f'{{"org": "{ws.organization_name}", "white_labeled": {ws.is_white_labeled}}}'
    )
    db.add(audit)
    db.commit()

    return {"message": "Branding configuration saved.", "workspace_id": workspace_id}
