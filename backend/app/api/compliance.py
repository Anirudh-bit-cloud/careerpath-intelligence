"""
Compliance Mapping and Bias Audit Summary API Router.
Provides regulatory compliance evidence endpoints for NYC LL144, EU AI Act, and GDPR.
Restricted to admin and hrbp roles.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import PlainTextResponse
from typing import Dict, Any, List
import io
import csv
import json
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session

from backend.app.api.auth import get_current_user
from backend.app.services.fairness_service import fairness_service
from backend.app.services.analytics_service import analytics_service
from backend.app.models.entities import AuditLog
from backend.app.database.connection import get_db

router = APIRouter(prefix="/api/compliance", tags=["Compliance & Regulatory Mapping"])

_DOCS_DIR = Path(__file__).resolve().parents[3] / "docs"


def require_compliance_access(current_user: Dict[str, Any] = Depends(get_current_user)):
    role = current_user.get("role", "")
    if role not in ["admin", "hrbp"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: only 'admin' and 'hrbp' roles may view compliance documents."
        )
    return current_user


# ---------------------------------------------------------------------------
# Compliance Mapping (static + live evidence links)
# ---------------------------------------------------------------------------

_COMPLIANCE_MAP: List[Dict[str, Any]] = [
    # NYC LL144
    {"regulation": "NYC Local Law 144", "article": "§5-301(a) Bias audit", "requirement": "Annual independent bias audit by an independent auditor covering impact ratios by sex and race/ethnicity", "status": "partially_supported", "platform_feature": "Four-fifths disparate impact audit (Gender, AgeBand, Department); race/ethnicity requires customer-supplied data", "evidence_endpoint": "GET /api/fairness/summary", "gap": "Race/ethnicity dimension not in default dataset; independent auditor must be contracted by the deploying organization"},
    {"regulation": "NYC Local Law 144", "article": "§5-301(b) Summary results", "requirement": "Post bias audit summary (selection rates, impact ratios) at least 10 days before use", "status": "partially_supported", "platform_feature": "Bias Audit CSV export downloadable by admin/hrbp", "evidence_endpoint": "GET /api/fairness/export/csv", "gap": "Public posting on employer website is customer responsibility"},
    {"regulation": "NYC Local Law 144", "article": "§5-301(c) Candidate notice", "requirement": "Notify candidates/employees at least 10 business days before AEDT is applied", "status": "customer_responsibility", "platform_feature": "None — notification process is HR's obligation", "evidence_endpoint": "", "gap": "Not implemented; customer HR process"},
    {"regulation": "NYC Local Law 144", "article": "§5-301(d) Characteristics", "requirement": "Provide notice of data types and characteristics used by the tool", "status": "supported", "platform_feature": "Score explanation endpoint lists all features with contribution weights", "evidence_endpoint": "GET /api/employees/{id}/score-explanation", "gap": "None"},
    # EU AI Act
    {"regulation": "EU AI Act", "article": "Art. 9 Risk management system", "requirement": "Establish and maintain a risk management system throughout the lifecycle", "status": "partially_supported", "platform_feature": "MODEL_CARD.md documents limitations, known risks, and out-of-scope use; fairness sign-off gate", "evidence_endpoint": "GET /api/fairness/signoffs", "gap": "Deployer must document residual risks and maintain the risk management file"},
    {"regulation": "EU AI Act", "article": "Art. 10 Data governance", "requirement": "Training data relevant, representative, free of errors; bias examined", "status": "supported", "platform_feature": "Data quality report, provenance badge, protected attributes excluded from features, fairness audit", "evidence_endpoint": "GET /api/dataset/data-quality", "gap": "None on platform side"},
    {"regulation": "EU AI Act", "article": "Art. 11 Technical documentation", "requirement": "Comprehensive technical documentation before placing on market", "status": "supported", "platform_feature": "MODEL_CARD.md, README.md, COMPLIANCE_MAPPING.md, DPIA_TEMPLATE.md", "evidence_endpoint": "GET /api/compliance/model-card", "gap": "None"},
    {"regulation": "EU AI Act", "article": "Art. 12 Record-keeping / logging", "requirement": "Automatic logging of system activity sufficient for post-hoc reconstruction", "status": "supported", "platform_feature": "Immutable AuditLog; records action, entity, user, workspace, timestamp", "evidence_endpoint": "GET /api/governance/audit-logs", "gap": "None"},
    {"regulation": "EU AI Act", "article": "Art. 13 Transparency", "requirement": "Clear information to deployer including purpose, performance, limitations", "status": "supported", "platform_feature": "MODEL_CARD.md, score explanation waterfall, validation metrics with bootstrap CI", "evidence_endpoint": "GET /api/validation/metrics", "gap": "None"},
    {"regulation": "EU AI Act", "article": "Art. 14 Human oversight", "requirement": "Humans can understand, disregard, and stop the system", "status": "supported", "platform_feature": "System only produces risk tiers for HR review; no automated decisions; rollback available", "evidence_endpoint": "POST /api/models/{id}/rollback", "gap": "Designating competent oversight persons is deployer responsibility"},
    {"regulation": "EU AI Act", "article": "Art. 15 Accuracy and robustness", "requirement": "Appropriate accuracy; resilience against errors; cybersecurity", "status": "supported", "platform_feature": "C-index with bootstrap 95% CI, Brier score, ROC-AUC, temporal backtest; JWT, RBAC, security headers", "evidence_endpoint": "GET /api/validation/metrics", "gap": "Adversarial robustness testing not yet performed"},
    # GDPR
    {"regulation": "GDPR", "article": "Art. 5 Principles", "requirement": "Lawfulness, purpose limitation, data minimisation, accuracy, storage limitation, integrity", "status": "partially_supported", "platform_feature": "Configurable retention policy, data quality report, multi-tenant isolation", "evidence_endpoint": "GET /api/governance/retention-preview", "gap": "Lawful basis must be established and documented by the deploying organization"},
    {"regulation": "GDPR", "article": "Art. 15 Right of access", "requirement": "Data subject access request (DSAR) within 30 days", "status": "supported", "platform_feature": "Automated DSAR export covering all stored analytical records for the employee", "evidence_endpoint": "GET /api/governance/data-subject-export", "gap": "None"},
    {"regulation": "GDPR", "article": "Art. 17 Right to erasure", "requirement": "Erase personal data on request without undue delay", "status": "partially_supported", "platform_feature": "Data retention purge removes records older than threshold; per-employee erasure planned for v3.3", "evidence_endpoint": "POST /api/governance/enforce-retention", "gap": "Individual record erasure endpoint not yet implemented"},
    {"regulation": "GDPR", "article": "Art. 22 Automated decision-making", "requirement": "No solely automated decisions with significant legal effect; provide logic explanation", "status": "supported", "platform_feature": "No automated decisions by design; score explanation with waterfall + counterfactual", "evidence_endpoint": "GET /api/employees/{id}/score-explanation", "gap": "None"},
    {"regulation": "GDPR", "article": "Art. 30 Records of processing", "requirement": "Maintain records of processing activities (RoPA)", "status": "partially_supported", "platform_feature": "DPIA_TEMPLATE.md contains a RoPA template; audit log provides partial records", "evidence_endpoint": "GET /api/compliance/dpia-template", "gap": "DPO must complete and sign the RoPA; platform provides template only"},
    {"regulation": "GDPR", "article": "Art. 35 DPIA", "requirement": "Data Protection Impact Assessment required for large-scale systematic employee monitoring", "status": "partially_supported", "platform_feature": "Pre-filled DPIA template included in docs/DPIA_TEMPLATE.md", "evidence_endpoint": "GET /api/compliance/dpia-template", "gap": "DPO must complete, review, and sign the DPIA before going live with real data"},
]


@router.get("/mapping")
def get_compliance_mapping(
    regulation: str = Query(None, description="Filter by regulation name (e.g. 'GDPR', 'EU AI Act', 'NYC Local Law 144')"),
    status_filter: str = Query(None, alias="status", description="Filter by status: supported, partially_supported, customer_responsibility"),
    current_user: Dict[str, Any] = Depends(require_compliance_access),
    db: Session = Depends(get_db)
):
    """
    Returns the live compliance mapping table with regulatory requirements,
    platform evidence links, and gap analysis across NYC LL144, EU AI Act, and GDPR.
    """
    results = _COMPLIANCE_MAP

    if regulation:
        reg_lower = regulation.lower()
        results = [r for r in results if reg_lower in r["regulation"].lower()]

    if status_filter:
        results = [r for r in results if r["status"] == status_filter]

    db.add(AuditLog(
        workspace_id=current_user.get("workspace_id", "default"),
        user_email=current_user.get("email", "system"),
        action="compliance.mapping_viewed",
        entity_type="compliance_mapping",
        details_json=json.dumps({"count": len(results), "filter": regulation})
    ))
    db.commit()

    summary = {
        "supported": sum(1 for r in _COMPLIANCE_MAP if r["status"] == "supported"),
        "partially_supported": sum(1 for r in _COMPLIANCE_MAP if r["status"] == "partially_supported"),
        "customer_responsibility": sum(1 for r in _COMPLIANCE_MAP if r["status"] == "customer_responsibility"),
    }
    return {
        "total_requirements": len(results),
        "summary": summary,
        "disclaimer": "This mapping is provided for informational purposes only and does not constitute legal advice.",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "requirements": results,
    }


@router.get("/mapping/export/csv")
def export_compliance_mapping_csv(
    current_user: Dict[str, Any] = Depends(require_compliance_access),
    db: Session = Depends(get_db)
):
    """Exports the full compliance mapping as CSV for DPO/legal review."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Regulation", "Article", "Requirement", "Status",
        "Platform Feature", "Evidence Endpoint", "Gap"
    ])
    for r in _COMPLIANCE_MAP:
        writer.writerow([
            r["regulation"], r["article"], r["requirement"],
            r["status"].replace("_", " ").title(),
            r["platform_feature"], r["evidence_endpoint"], r["gap"]
        ])

    db.add(AuditLog(
        workspace_id=current_user.get("workspace_id", "default"),
        user_email=current_user.get("email", "system"),
        action="compliance.mapping_exported",
        entity_type="compliance_mapping"
    ))
    db.commit()

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=compliance_mapping_careerpath_v3.2.0.csv"}
    )


# ---------------------------------------------------------------------------
# Bias Audit Summary — NYC LL144 Format
# ---------------------------------------------------------------------------

@router.get("/bias-audit-summary")
def get_bias_audit_summary(
    current_user: Dict[str, Any] = Depends(require_compliance_access),
    db: Session = Depends(get_db)
):
    """
    Returns a bias audit summary in the format required by NYC Local Law 144:
    impact ratios per category with sample sizes, date, and platform version.
    """
    full_audit = fairness_service.compute_fairness_audit()
    df = analytics_service.df_raw

    rows = []
    for attr, details in full_audit.get("attributes", {}).items():
        bench_grp = details.get("most_favored_group", "N/A")
        for g in details.get("groups", []):
            rows.append({
                "attribute": attr,
                "group": g.get("group", ""),
                "sample_size": g.get("sample_size", 0),
                "suppressed": g.get("suppressed", False),
                "favorable_rate": g.get("favorable_rate"),
                "disparate_impact_ratio": g.get("disparate_impact_ratio"),
                "benchmark_group": bench_grp,
                "four_fifths_compliant": not g.get("four_fifths_flag", False),
                "flag": "FLAGGED" if g.get("four_fifths_flag") else "COMPLIANT",
            })

    db.add(AuditLog(
        workspace_id=current_user.get("workspace_id", "default"),
        user_email=current_user.get("email", "system"),
        action="compliance.bias_audit_summary_viewed",
        entity_type="compliance_bias_audit"
    ))
    db.commit()

    return {
        "audit_date": datetime.utcnow().isoformat() + "Z",
        "platform_version": "3.2.0",
        "dataset_size": int(len(df)) if df is not None else 0,
        "data_provenance": analytics_service.data_provenance if hasattr(analytics_service, "data_provenance") else "Synthetic",
        "overall_status": full_audit.get("overall_status", "unknown"),
        "total_flags": full_audit.get("total_flags", 0),
        "legal_notice": (
            "This bias audit summary is generated by the CareerPath Intelligence platform "
            "using Four-Fifths Rule (80% Rule) disparate impact analysis. "
            "NYC Local Law 144 requires this audit to be conducted by an independent auditor. "
            "This automated summary supports, but does not replace, the mandatory independent audit. "
            "Race/ethnicity categories are not included in the default dataset; the deploying "
            "organization must supply this data for a fully compliant LL144 audit."
        ),
        "impact_ratios": rows,
    }


@router.get("/bias-audit-summary/export/csv")
def export_bias_audit_summary_csv(
    current_user: Dict[str, Any] = Depends(require_compliance_access),
    db: Session = Depends(get_db)
):
    """Exports bias audit impact ratios in machine-readable CSV (NYC LL144 format)."""
    full_audit = fairness_service.compute_fairness_audit()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "BiasAuditDate", "PlatformVersion", "Attribute", "Group",
        "SampleSize", "Suppressed", "FavorableRate", "BenchmarkGroup",
        "DisparateImpactRatio", "FourFifthsCompliant", "Flag"
    ])

    audit_date = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    for attr, details in full_audit.get("attributes", {}).items():
        bench_grp = details.get("most_favored_group", "N/A")
        for g in details.get("groups", []):
            writer.writerow([
                audit_date, "3.2.0", attr,
                g.get("group", ""),
                g.get("sample_size", ""),
                g.get("suppressed", False),
                g.get("favorable_rate", ""),
                bench_grp,
                g.get("disparate_impact_ratio", ""),
                "YES" if not g.get("four_fifths_flag", False) else "NO",
                "FLAGGED" if g.get("four_fifths_flag") else "COMPLIANT",
            ])

    db.add(AuditLog(
        workspace_id=current_user.get("workspace_id", "default"),
        user_email=current_user.get("email", "system"),
        action="compliance.bias_audit_csv_exported",
        entity_type="compliance_bias_audit"
    ))
    db.commit()

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=bias_audit_ll144_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )


# ---------------------------------------------------------------------------
# Documentation Downloads
# ---------------------------------------------------------------------------

@router.get("/model-card")
def get_model_card(current_user: Dict[str, Any] = Depends(require_compliance_access)):
    """Downloads MODEL_CARD.md for AI system documentation (EU AI Act Art. 11)."""
    # Try docs/ first, then repo root as fallback
    path = _DOCS_DIR / "MODEL_CARD.md"
    if not path.exists():
        path = _DOCS_DIR.parent / "MODEL_CARD.md"
    if not path.exists():
        raise HTTPException(status_code=404, detail="MODEL_CARD.md not found.")
    content = path.read_text(encoding="utf-8")
    return Response(content=content, media_type="text/markdown",
                    headers={"Content-Disposition": "attachment; filename=MODEL_CARD.md"})


@router.get("/dpia-template")
def get_dpia_template(current_user: Dict[str, Any] = Depends(require_compliance_access)):
    """Downloads the GDPR Art. 35 DPIA template pre-filled for this platform."""
    path = _DOCS_DIR / "DPIA_TEMPLATE.md"
    if not path.exists():
        raise HTTPException(status_code=404, detail="DPIA_TEMPLATE.md not found in docs/.")
    content = path.read_text(encoding="utf-8")
    return Response(content=content, media_type="text/markdown",
                    headers={"Content-Disposition": "attachment; filename=DPIA_TEMPLATE.md"})


@router.get("/compliance-mapping-doc")
def get_compliance_mapping_doc(current_user: Dict[str, Any] = Depends(require_compliance_access)):
    """Downloads COMPLIANCE_MAPPING.md for legal review."""
    path = _DOCS_DIR / "COMPLIANCE_MAPPING.md"
    if not path.exists():
        raise HTTPException(status_code=404, detail="COMPLIANCE_MAPPING.md not found in docs/.")
    content = path.read_text(encoding="utf-8")
    return Response(content=content, media_type="text/markdown",
                    headers={"Content-Disposition": "attachment; filename=COMPLIANCE_MAPPING.md"})
