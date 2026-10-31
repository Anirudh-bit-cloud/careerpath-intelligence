"""
Fairness and Bias Audit API Router.
Endpoints restricted to 'admin' and 'hrbp' roles.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import io
import csv
import json
from sqlalchemy.orm import Session

from backend.app.api.auth import get_current_user
from backend.app.core.security import has_permission
from backend.app.services.analytics_service import analytics_service
from backend.app.services.fairness_service import FairnessAuditService, fairness_service
from backend.app.models.entities import AuditLog
from backend.app.database.connection import get_db

router = APIRouter(prefix="/api/fairness", tags=["Fairness & Algorithmic Bias Audit"])


class BiasSignoffPayload(BaseModel):
    review_type: str = Field(..., description="Review context: model_promotion, policy_update, scheduled_audit")
    target_id: str = Field(..., description="Identifier of model version, policy ID, or cycle")
    decision: str = Field(..., description="Decision: approved, rejected, conditionally_approved")
    reviewer_notes: str = Field(..., description="Compliance rationale and notes")
    acknowledged_flags: int = Field(default=0, description="Count of acknowledged disparities")


def require_fairness_audit_access(current_user: Dict[str, Any] = Depends(get_current_user)):
    role = current_user.get("role", "")
    if role not in ["admin", "hrbp"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: only 'admin' and 'hrbp' roles are authorized to view algorithmic fairness audits."
        )
    return current_user


@router.get("/summary")
def get_fairness_summary(
    current_user: Dict[str, Any] = Depends(require_fairness_audit_access),
    db: Session = Depends(get_db)
):
    """
    Returns executive fairness audit summary across all demographic attributes.
    Audit-logged for compliance.
    """
    audit_res = fairness_service.compute_fairness_audit()

    # Log audit event
    db.add(AuditLog(
        workspace_id=current_user.get("workspace_id", "default"),
        user_email=current_user.get("email", "system"),
        action="fairness.audit_viewed",
        entity_type="fairness_audit",
        details_json=json.dumps({"flags_count": audit_res.get("total_flags", 0)})
    ))
    db.commit()

    return audit_res


@router.get("/attribute/{attribute_name}")
def get_attribute_detail(
    attribute_name: str,
    current_user: Dict[str, Any] = Depends(require_fairness_audit_access)
):
    """Returns deep group-level disparate impact breakdown for a specific attribute."""
    full_audit = fairness_service.compute_fairness_audit()
    attrs = full_audit.get("attributes", {})
    if attribute_name not in attrs:
        raise HTTPException(status_code=404, detail=f"Protected attribute '{attribute_name}' not evaluated in audit.")
    res = dict(attrs[attribute_name])
    res["attribute"] = attribute_name
    return res


@router.get("/export/csv")
def export_fairness_csv(
    current_user: Dict[str, Any] = Depends(require_fairness_audit_access),
    db: Session = Depends(get_db)
):
    """Exports machine-readable disparate impact audit matrix as CSV."""
    full_audit = fairness_service.compute_fairness_audit()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Attribute", "Group", "SampleSize", "Suppressed",
        "StandardTierCount", "StandardTierPct", "UrgentTierCount", "UrgentTierPct",
        "FavorableRate", "BenchmarkGroup", "DisparateImpactRatio", "FourFifthsFlag"
    ])

    for attr, details in full_audit.get("attributes", {}).items():
        bench_grp = details.get("most_favored_group")
        for g in details.get("groups", []):
            dist = g.get("tier_distribution", {})
            writer.writerow([
                attr,
                g.get("group"),
                g.get("sample_size"),
                g.get("suppressed", False),
                dist.get("standard", ""),
                dist.get("standard_pct", ""),
                dist.get("urgent", ""),
                dist.get("urgent_pct", ""),
                g.get("favorable_rate", ""),
                bench_grp,
                g.get("disparate_impact_ratio", ""),
                "FLAGGED" if g.get("four_fifths_flag") else "COMPLIANT"
            ])

    # Log export
    db.add(AuditLog(
        workspace_id=current_user.get("workspace_id", "default"),
        user_email=current_user.get("email", "system"),
        action="fairness.csv_exported",
        entity_type="fairness_audit"
    ))
    db.commit()

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fairness_bias_audit_report.csv"}
    )


@router.get("/intersectional")
def get_intersectional_fairness(
    min_sample_size: int = Query(10, ge=5, le=50),
    current_user: Dict[str, Any] = Depends(require_fairness_audit_access),
    db: Session = Depends(get_db)
):
    """
    Evaluates intersectional demographic parity (Gender x AgeBand, Gender x Department, AgeBand x Department).
    Applies small-sample suppression (n < 10) and Benjamini-Hochberg FDR corrected p-values.
    """
    ws_id = current_user.get("workspace_id", "default")
    res = fairness_service.compute_intersectional_fairness(min_sample_size=min_sample_size)

    db.add(AuditLog(
        workspace_id=ws_id,
        user_email=current_user.get("email", "system"),
        action="fairness.intersectional_audit_viewed",
        entity_type="fairness_audit",
        details_json=json.dumps({
            "total_slices": res.get("total_slices", 0),
            "suppressed_slices_count": res.get("suppressed_slices_count", 0),
            "flagged_four_fifths_count": res.get("flagged_four_fifths_count", 0)
        })
    ))
    db.commit()

    return res


@router.get("/longitudinal")
def get_longitudinal_fairness(
    current_user: Dict[str, Any] = Depends(require_fairness_audit_access),
    db: Session = Depends(get_db)
):
    """
    Evaluates fairness drift over historical workforce snapshots.
    Tracks Disparate Impact Ratio across time for gender and departments.
    """
    ws_id = current_user.get("workspace_id", "default")
    res = fairness_service.compute_longitudinal_fairness(db=db, workspace_id=ws_id)

    db.add(AuditLog(
        workspace_id=ws_id,
        user_email=current_user.get("email", "system"),
        action="fairness.longitudinal_drift_viewed",
        entity_type="fairness_audit",
        details_json=json.dumps({
            "snapshots_evaluated": res.get("total_snapshots_evaluated", 0),
            "drift_trend": res.get("drift_trend", "unknown")
        })
    ))
    db.commit()

    return res


@router.post("/signoff")
def create_bias_signoff(
    payload: BiasSignoffPayload,
    current_user: Dict[str, Any] = Depends(require_fairness_audit_access),
    db: Session = Depends(get_db)
):
    """
    Records a formal HRBP/Compliance bias sign-off gate in the immutable audit log
    prior to model promotion or scoring policy updates.
    """
    ws_id = current_user.get("workspace_id", "default")
    user_email = current_user.get("email", "compliance@example.com")

    signoff_record = fairness_service.record_bias_signoff(
        db=db,
        workspace_id=ws_id,
        user_email=user_email,
        review_type=payload.review_type,
        target_id=payload.target_id,
        decision=payload.decision,
        reviewer_notes=payload.reviewer_notes,
        acknowledged_flags=payload.acknowledged_flags
    )
    return signoff_record


@router.get("/signoffs")
def list_bias_signoffs(
    limit: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(require_fairness_audit_access),
    db: Session = Depends(get_db)
):
    """Returns history of compliance and HRBP bias review sign-offs for this workspace."""
    ws_id = current_user.get("workspace_id", "default")
    return fairness_service.get_bias_signoffs(db=db, workspace_id=ws_id, limit=limit)
