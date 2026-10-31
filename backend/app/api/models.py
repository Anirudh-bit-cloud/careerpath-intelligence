"""
CareerPath Intelligence - Model Registry API Routes
Endpoints for model version tracking, promote/rollback lifecycle, and PSI drift monitoring.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.app.database.connection import get_db
from backend.app.api.auth import get_current_user
from backend.app.services.model_registry_service import model_registry_service

router = APIRouter(prefix="/api/models", tags=["Model Registry & Governance"])


@router.get("")
def list_models(
    model_type: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all registered model versions for the current workspace with metrics and active status."""
    ws_id = current_user.get("workspace_id", "default")
    return model_registry_service.list_versions(db, workspace_id=ws_id, model_type=model_type)


@router.get("/{model_id}")
def get_model(
    model_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details, hyperparameters, and metrics of a specific model version."""
    ws_id = current_user.get("workspace_id", "default")
    model = model_registry_service.get_version(db, workspace_id=ws_id, version_id=model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model version {model_id} not found.")
    return model


@router.post("/{model_id}/promote")
def promote_model(
    model_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Promotes a candidate version to 'active' status for scoring.
    Automatically archives the previously active model of the same type.
    Requires admin or hr_analyst role.
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "hr_analyst"]:
        raise HTTPException(status_code=403, detail="Only Admins and People Analytics Analysts can promote models.")

    ws_id = current_user.get("workspace_id", "default")
    user_email = current_user.get("email", "system")
    try:
        return model_registry_service.promote_version(db, workspace_id=ws_id, version_id=model_id, user_email=user_email)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{model_id}/rollback")
def rollback_model(
    model_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rolls back active status to a previously archived model version.
    Requires admin or hr_analyst role.
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "hr_analyst"]:
        raise HTTPException(status_code=403, detail="Only Admins and People Analytics Analysts can rollback models.")

    ws_id = current_user.get("workspace_id", "default")
    user_email = current_user.get("email", "system")
    try:
        return model_registry_service.rollback_version(db, workspace_id=ws_id, version_id=model_id, user_email=user_email)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{model_id}/drift")
def get_model_drift(
    model_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes Population Stability Index (PSI) per feature comparing the model's
    training baseline distribution to the current active workforce dataset.
    Flags retrain needed when PSI > 0.20.
    """
    ws_id = current_user.get("workspace_id", "default")
    try:
        return model_registry_service.compute_drift(db, workspace_id=ws_id, version_id=model_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
