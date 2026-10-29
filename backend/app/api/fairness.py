"""
Fairness and Bias Audit API Router.
Endpoints restricted to 'admin' and 'hrbp' roles.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from typing import Dict, Any, Optional
import io
import csv

from backend.app.api.auth import get_current_user
from backend.app.core.security import has_permission
from backend.app.services.analytics_service import analytics_service
from backend.app.services.fairness_service import FairnessAuditService
from backend.app.models.entities import AuditLog
from backend.app.database.connection import get_db
from sqlalchemy.orm import Session
import json

router = APIRouter(prefix="/api/fairness", tags=["Fairness & Algorithmic Bias Audit"])
fairness_service = FairnessAuditService(analytics_service=analytics_service)


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
    return attrs[attribute_name]


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
