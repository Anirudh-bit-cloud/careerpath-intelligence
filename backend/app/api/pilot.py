"""
Pilot Request Inquiries & Industry Dataset Preset Routes.
Captures real pilot lead submissions to the database and switches synthetic industry datasets.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.app.database.connection import get_db
from backend.app.models.entities import PilotLead, AuditLog
from backend.app.services.analytics_service import analytics_service
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Pilot Inquiries & Industry Datasets"])


class PilotLeadCreate(BaseModel):
    full_name: str
    work_email: str
    company_name: str
    role_title: str
    company_size: Optional[str] = "500-2000"
    use_case: Optional[str] = ""


class PresetRequest(BaseModel):
    preset_key: str  # 'cyber', 'healthcare', 'finance'


@router.post("/pilot/leads")
def submit_pilot_lead(payload: PilotLeadCreate, db: Session = Depends(get_db)):
    """Persists real pilot lead requests directly into the SQLite database."""
    lead = PilotLead(
        full_name=payload.full_name,
        work_email=str(payload.work_email),
        company_name=payload.company_name,
        role_title=payload.role_title,
        company_size=payload.company_size or "500-2000",
        use_case=payload.use_case or "",
        status="New Lead"
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    return {
        "status": "success",
        "message": f"Thank you, {payload.full_name}. Your enterprise pilot request for {payload.company_name} has been logged.",
        "lead_id": lead.id
    }


@router.get("/pilot/leads")
def list_pilot_leads(current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can view incoming pilot lead requests.")
    leads = db.query(PilotLead).order_by(PilotLead.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "full_name": l.full_name,
            "work_email": l.work_email,
            "company_name": l.company_name,
            "role_title": l.role_title,
            "company_size": l.company_size,
            "use_case": l.use_case,
            "status": l.status,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in leads
    ]


@router.post("/dataset/preset")
def switch_industry_preset(payload: PresetRequest):
    """Switches the active synthetic dataset across 3 seeded industry benchmarks."""
    meta = analytics_service.load_industry_preset(payload.preset_key)
    return {
        "message": f"Switched active dataset to {payload.preset_key} benchmark.",
        "metadata": meta
    }
