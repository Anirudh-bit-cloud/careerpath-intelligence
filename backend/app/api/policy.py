"""
Scoring Policy & Threshold Customization Routes.
Supports versioned progression policies, simulation of tier changes, and audit trail diffs.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json

from backend.app.database.connection import get_db
from backend.app.models.entities import ScoringPolicy, AuditLog
from backend.app.api.auth import get_current_user
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/policy", tags=["Scoring Policy & Dwell Thresholds"])


class PolicyPreviewRequest(BaseModel):
    weights: Dict[str, float]
    thresholds: Optional[Dict[str, float]] = None


class PolicyUpdateRequest(BaseModel):
    name: str
    weights: Dict[str, float]
    thresholds: Dict[str, float]
    rules: Optional[Dict[str, Any]] = None
    change_summary: str
    workspace_id: Optional[str] = "default"


@router.get("")
def get_active_policy(workspace_id: str = "default", db: Session = Depends(get_db)):
    policy = db.query(ScoringPolicy).filter(
        ScoringPolicy.workspace_id == workspace_id,
        ScoringPolicy.is_active == True
    ).first()
    if not policy:
        # Fallback to default policy
        return {
            "version": 1,
            "name": "Standard Policy Baseline",
            "weights": {
                "stagnation_weight": 0.45,
                "engagement_weight": 0.35,
                "training_deficit_weight": 0.20,
                "pgr_ratio_split": 0.60,
                "rsi_ratio_split": 0.40
            },
            "thresholds": {
                "level_1_dwell_years": 2.0,
                "level_2_dwell_years": 3.0,
                "level_3_dwell_years": 4.0,
                "level_4_dwell_years": 5.0,
                "level_5_dwell_years": 6.0
            },
            "rules": {
                "enable_cross_functional_rotation": True,
                "enable_readiness_review": True,
                "enable_capability_training": True
            }
        }
    return {
        "id": policy.id,
        "version": policy.version,
        "name": policy.name,
        "weights": json.loads(policy.weights_json),
        "thresholds": json.loads(policy.thresholds_json),
        "rules": json.loads(policy.rules_json) if policy.rules_json else {},
        "created_by": policy.created_by,
        "change_summary": policy.change_summary,
        "created_at": policy.created_at.isoformat() if policy.created_at else None
    }


@router.post("/preview")
def preview_policy_impact(req: PolicyPreviewRequest):
    """Calculates exactly how many employees move between Urgent, Moderate, and Standard tiers BEFORE applying."""
    default_thresholds = {
        "level_1_dwell_years": 2.0,
        "level_2_dwell_years": 3.0,
        "level_3_dwell_years": 4.0,
        "level_4_dwell_years": 5.0,
        "level_5_dwell_years": 6.0
    }
    thresholds = req.thresholds if req.thresholds else default_thresholds
    simulation = analytics_service.simulate_policy_impact(req.weights, thresholds)
    return {
        "status": "success",
        "simulation": simulation
    }


@router.get("/history")
def get_policy_history(workspace_id: str = "default", db: Session = Depends(get_db)):
    policies = db.query(ScoringPolicy).filter(
        ScoringPolicy.workspace_id == workspace_id
    ).order_by(ScoringPolicy.version.desc()).all()
    return [
        {
            "id": p.id,
            "version": p.version,
            "name": p.name,
            "is_active": p.is_active,
            "created_by": p.created_by,
            "change_summary": p.change_summary,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in policies
    ]


@router.post("/update")
def update_policy(
    req: PolicyUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can modify enterprise scoring policies.")

    ws_id = req.workspace_id or current_user.get("workspace_id", "default")

    # Deactivate existing
    db.query(ScoringPolicy).filter(
        ScoringPolicy.workspace_id == ws_id,
        ScoringPolicy.is_active == True
    ).update({"is_active": False})

    # Get latest version number
    latest = db.query(ScoringPolicy).filter(ScoringPolicy.workspace_id == ws_id).order_by(ScoringPolicy.version.desc()).first()
    new_version = (latest.version + 1) if latest else 1

    new_policy = ScoringPolicy(
        workspace_id=ws_id,
        version=new_version,
        name=req.name,
        weights_json=json.dumps(req.weights),
        thresholds_json=json.dumps(req.thresholds),
        rules_json=json.dumps(req.rules or {}),
        is_active=True,
        created_by=current_user.get("full_name", current_user.get("email")),
        change_summary=req.change_summary
    )
    db.add(new_policy)

    audit = AuditLog(
        workspace_id=ws_id,
        user_email=current_user.get("email", "system"),
        action="policy.version_bump",
        entity_type="scoring_policy",
        details_json=f'{{"version": {new_version}, "summary": "{req.change_summary}"}}'
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Scoring policy version {new_version} activated.",
        "version": new_version
    }
