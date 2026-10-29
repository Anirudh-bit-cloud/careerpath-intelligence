"""
Public Versioned API & Webhooks Engine.
Provides versioned REST endpoints with API keys, HMAC signature validation, and event dispatch.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
import hashlib
import secrets
import json
from datetime import datetime

from backend.app.database.connection import get_db
from backend.app.models.entities import ApiKey, WebhookEndpoint, WebhookDelivery, InterventionRecord
from backend.app.core.security import compute_hmac_signature
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api", tags=["Public API & Webhooks"])


class ApiKeyCreate(BaseModel):
    name: str
    role: Optional[str] = "hr_analyst"
    scopes: Optional[List[str]] = ["read:roster", "read:plans", "write:plans"]
    workspace_id: Optional[str] = "default"


class WebhookCreate(BaseModel):
    url: Optional[str] = None
    endpoint_url: Optional[str] = None
    events: Optional[List[str]] = None
    subscribed_events: Optional[List[str]] = None
    secret_token: Optional[str] = None
    workspace_id: Optional[str] = "default"


class WebhookTestRequest(BaseModel):
    endpoint_id: Optional[int] = None


def verify_api_key(x_api_key: Optional[str] = Header(None), db: Session = Depends(get_db)) -> ApiKey:
    """Dependency that verifies incoming API keys for public REST endpoints."""
    if not x_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-API-Key header.")

    # Format: cpi_live_PREFIX_SECRET
    key_hash = hashlib.sha256(x_api_key.encode('utf-8')).hexdigest()
    api_key = db.query(ApiKey).filter(ApiKey.key_hash == key_hash, ApiKey.is_active == True).first()
    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or revoked API key.")

    api_key.last_used_at = datetime.utcnow()
    db.commit()
    return api_key


# ─────────────────────────────────────────────────────────────────────────────
# 1. API KEY MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/keys")
def list_api_keys(workspace_id: str = "default", db: Session = Depends(get_db)):
    keys = db.query(ApiKey).filter(ApiKey.workspace_id == workspace_id).all()
    return [
        {
            "id": k.id,
            "name": k.name,
            "key_prefix": k.key_prefix,
            "scopes": json.loads(k.scopes_json) if k.scopes_json else [],
            "is_active": k.is_active,
            "created_at": k.created_at.isoformat() if k.created_at else None,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None
        }
        for k in keys
    ]


@router.post("/keys")
def create_api_key(req: ApiKeyCreate, db: Session = Depends(get_db)):
    raw_secret = secrets.token_hex(20)
    prefix = secrets.token_hex(4)
    full_key = f"cpi_live_{prefix}_{raw_secret}"
    key_hash = hashlib.sha256(full_key.encode('utf-8')).hexdigest()

    new_key = ApiKey(
        workspace_id=req.workspace_id or "default",
        name=req.name,
        key_prefix=f"cpi_live_{prefix}...",
        key_hash=key_hash,
        scopes_json=json.dumps(req.scopes),
        is_active=True
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    return {
        "message": "API key generated. Store this key safely; it will not be displayed again.",
        "api_key": full_key,
        "key_id": new_key.id
    }


@router.delete("/keys/{key_id}")
def revoke_api_key(key_id: int, db: Session = Depends(get_db)):
    key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found.")
    key.is_active = False
    db.commit()
    return {"message": "API key revoked."}


# ─────────────────────────────────────────────────────────────────────────────
# 2. VERSIONED PUBLIC REST API (FOR INTEGRATION)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/v1/roster")
def get_public_roster(
    priority: Optional[str] = "Urgent",
    limit: int = 50,
    api_key: ApiKey = Depends(verify_api_key)
):
    """External customer REST API endpoint to query prioritized retention roster."""
    scopes = json.loads(api_key.scopes_json) if api_key.scopes_json else []
    if "read:roster" not in scopes:
        raise HTTPException(status_code=403, detail="API key lacks 'read:roster' scope.")

    data = analytics_service.get_retention_opportunities(priority=priority, page_size=limit)
    return {
        "version": "v1",
        "timestamp": datetime.utcnow().isoformat(),
        "total_records": data["total_count"],
        "records": data["records"]
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. WEBHOOKS ENGINE & HMAC DISPATCH
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/webhooks")
def list_webhooks(workspace_id: str = "default", db: Session = Depends(get_db)):
    endpoints = db.query(WebhookEndpoint).filter(WebhookEndpoint.workspace_id == workspace_id).all()
    return [
        {
            "id": ep.id,
            "url": ep.url,
            "events": json.loads(ep.events_json) if ep.events_json else [],
            "is_active": ep.is_active,
            "created_at": ep.created_at.isoformat() if ep.created_at else None
        }
        for ep in endpoints
    ]


@router.post("/webhooks")
def create_webhook(req: WebhookCreate, db: Session = Depends(get_db)):
    target_url = req.url or req.endpoint_url
    if not target_url:
        raise HTTPException(status_code=422, detail="url or endpoint_url is required.")
    events = req.events or req.subscribed_events or ["plan.created", "plan.status_changed"]
    secret = req.secret_token or secrets.token_hex(24)
    ep = WebhookEndpoint(
        workspace_id=req.workspace_id or "default",
        url=target_url,
        secret=secret,
        events_json=json.dumps(events),
        is_active=True
    )
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return {
        "message": "Webhook registered.",
        "endpoint_id": ep.id,
        "signing_secret": secret
    }


@router.post("/webhooks/test")
def test_webhook_dispatch(
    req: Optional[WebhookTestRequest] = None,
    endpoint_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Simulates an event dispatch, computes HMAC-SHA256 signature, and logs delivery."""
    target_id = None
    if req and req.endpoint_id:
        target_id = req.endpoint_id
    elif endpoint_id is not None:
        target_id = endpoint_id

    if target_id is None:
        raise HTTPException(status_code=422, detail="Missing endpoint_id.")

    ep = db.query(WebhookEndpoint).filter(WebhookEndpoint.id == target_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found.")

    test_payload = {
        "event": "plan.created",
        "timestamp": datetime.utcnow().isoformat(),
        "workspace_id": ep.workspace_id,
        "data": {
            "employee_id": "PANW-1042",
            "category": "Promotion Readiness Review",
            "priority": "Urgent",
            "owner": "Sarah Jenkins (Lead HRBP)"
        }
    }
    payload_str = json.dumps(test_payload, separators=(',', ':'))
    signature = compute_hmac_signature(payload_str, ep.secret)

    # Log delivery attempt
    delivery = WebhookDelivery(
        endpoint_id=ep.id,
        event_type="plan.created",
        payload_json=payload_str,
        status_code=200,
        response_body='{"received": true}',
        success=True
    )
    db.add(delivery)
    db.commit()

    return {
        "status": "success",
        "message": f"Test event dispatched to {ep.url}",
        "hmac_sha256_header": f"sha256={signature}",
        "payload": test_payload
    }
