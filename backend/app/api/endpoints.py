"""
FastAPI Route Handlers for CareerPath Intelligence.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil

from backend.app.database.connection import get_db
from backend.app.models.entities import InterventionRecord
from backend.app.schemas.domain import (
    InterventionCreate, InterventionUpdate, InterventionResponse
)
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api")


@router.get("/health")
def health_check():
    return {"status": "ok", "app": "CareerPath Intelligence API", "version": "2.0.0"}


@router.get("/metadata")
def get_metadata():
    return analytics_service.get_metadata()


@router.get("/overview")
def get_overview():
    return analytics_service.get_executive_overview()


@router.get("/clusters")
def get_clusters():
    return analytics_service.get_career_clusters()


@router.get("/clusters/elbow-curve")
def get_elbow_curve():
    """Returns pre-computed elbow / silhouette curve data for K=2..8."""
    elbow = analytics_service.clustering_metrics.get('elbow_curve', [])
    return {"elbow_curve": elbow}


class ReclusterPayload(BaseModel):
    n_clusters: int = 5
    auto_select_k: bool = False
    algorithm: str = "ensemble"


@router.post("/rerun-clustering")
def rerun_clustering(payload: ReclusterPayload):
    """Re-runs the clustering pipeline with custom parameters on the current dataset."""
    try:
        analytics_service.rerun_clustering(
            n_clusters=payload.n_clusters,
            auto_select_k=payload.auto_select_k,
            algorithm=payload.algorithm
        )
        return {
            "message": "Clustering re-executed successfully.",
            "metrics": analytics_service.clustering_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Clustering failed: {str(e)}")


@router.get("/promotion-gap")
def get_promotion_gap(
    department: Optional[str] = None,
    job_role: Optional[str] = None,
    job_level: Optional[int] = None,
    category: Optional[str] = None,
    cluster: Optional[str] = None,
    min_tenure: Optional[float] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100)
):
    return analytics_service.get_promotion_gap_monitor(
        department=department,
        job_role=job_role,
        job_level=job_level,
        category=category,
        cluster=cluster,
        min_tenure=min_tenure,
        search=search,
        page=page,
        page_size=page_size
    )


@router.get("/retention-opportunities")
def get_retention_opportunities(
    priority: Optional[str] = None,
    department: Optional[str] = None,
    job_role: Optional[str] = None,
    job_level: Optional[int] = None,
    cluster: Optional[str] = None,
    min_tenure: Optional[float] = None,
    min_gap_score: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "RetentionOpportunityIndex",
    sort_dir: Optional[str] = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100)
):
    return analytics_service.get_retention_opportunities(
        priority=priority,
        department=department,
        job_role=job_role,
        job_level=job_level,
        cluster=cluster,
        min_tenure=min_tenure,
        min_gap_score=min_gap_score,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size
    )


@router.get("/manager-insights")
def get_manager_insights():
    return analytics_service.get_manager_insights()


@router.get("/employees")
def search_employees(query: Optional[str] = "", limit: int = Query(20, ge=1, le=100)):
    return analytics_service.search_employees(query=query, limit=limit)


@router.get("/employees/{employee_id}")
def get_employee_profile(employee_id: str, db: Session = Depends(get_db)):
    profile = analytics_service.get_employee_profile(employee_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    interventions = db.query(InterventionRecord).filter(
        InterventionRecord.employee_id == employee_id
    ).all()

    profile["interventions"] = [
        {
            "id": i.id,
            "category": i.category,
            "status": i.status,
            "priority": i.priority,
            "action_plan": i.action_plan,
            "owner": i.owner,
            "target_date": i.target_date,
            "notes": i.notes,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in interventions
    ]
    return profile


@router.get("/employees/{employee_id}/score-explanation")
def get_employee_score_explanation(employee_id: str):
    """
    Returns explainable component points waterfall and counterfactual analysis
    showing how the employee can transition down one retention risk tier.
    """
    explanation = analytics_service.explain_score(employee_id)
    if not explanation:
        raise HTTPException(status_code=404, detail=f"Score explanation for employee {employee_id} not found")
    return explanation


# ==============================================================================
# PERSISTENT INTERVENTIONS WORKFLOW (CRUD)
# ==============================================================================

@router.get("/interventions", response_model=List[InterventionResponse])
def list_interventions(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InterventionRecord)
    if status_filter and status_filter != "All":
        query = query.filter(InterventionRecord.status == status_filter)
    if priority_filter and priority_filter != "All":
        query = query.filter(InterventionRecord.priority == priority_filter)
    return query.order_by(InterventionRecord.created_at.desc()).all()


@router.post("/interventions", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
def create_intervention(payload: InterventionCreate, db: Session = Depends(get_db)):
    record = InterventionRecord(
        employee_id=payload.employee_id,
        department=payload.department,
        job_role=payload.job_role,
        category=payload.category,
        status=payload.status,
        priority=payload.priority,
        action_plan=payload.action_plan,
        owner=payload.owner,
        target_date=payload.target_date,
        notes=payload.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/interventions/{intervention_id}", response_model=InterventionResponse)
def update_intervention(intervention_id: int, payload: InterventionUpdate, db: Session = Depends(get_db)):
    record = db.query(InterventionRecord).filter(InterventionRecord.id == intervention_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Intervention record not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, val)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/interventions/{intervention_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_intervention(intervention_id: int, db: Session = Depends(get_db)):
    record = db.query(InterventionRecord).filter(InterventionRecord.id == intervention_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Intervention record not found")
    db.delete(record)
    db.commit()
    return None


# ==============================================================================
# DATASET MANAGEMENT & UPLOAD
# ==============================================================================

@router.post("/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    upload_dir = os.path.join(analytics_service.data_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    temp_path = os.path.join(upload_dir, file.filename)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        analytics_service.reload_dataset(temp_path, dataset_name=file.filename)
        meta = analytics_service.get_metadata()
        return {
            "message": "Dataset uploaded and processed successfully",
            "filename": file.filename,
            "records": len(analytics_service.df_enriched),
            "columns": list(analytics_service.df_raw.columns),
            "derived_columns": list(analytics_service.df_enriched.columns),
            "clustering_metrics": analytics_service.clustering_metrics,
            "metadata": meta
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process uploaded dataset: {str(e)}")


@router.post("/dataset/reset")
def reset_to_demo_dataset():
    analytics_service.reload_dataset()
    return {"message": "Dataset reset to demo mode successfully.", "metadata": analytics_service.get_metadata()}


@router.get("/dataset/data-quality")
def get_data_quality():
    return analytics_service.get_data_quality_report()


@router.get("/dataset/sample-template")
def get_sample_template():
    csv_template = (
        "Age,Attrition,BusinessTravel,DailyRate,Department,DistanceFromHome,Education,EducationField,"
        "EnvironmentSatisfaction,Gender,HourlyRate,JobInvolvement,JobLevel,JobRole,JobSatisfaction,"
        "MaritalStatus,MonthlyIncome,MonthlyRate,NumCompaniesWorked,OverTime,PercentSalaryHike,"
        "PerformanceRating,RelationshipSatisfaction,StockOptionLevel,TotalWorkingYears,TrainingTimesLastYear,"
        "WorkLifeBalance,YearsAtCompany,YearsInCurrentRole,YearsSinceLastPromotion,YearsWithCurrManager\n"
        "38,0,Travel_Rarely,840,Research & Development,5,3,Life Sciences,3,Male,65,3,3,Research Scientist,3,Married,7200,14000,2,No,14,3,3,1,10,2,3,6,5,4,4\n"
        "31,0,Travel_Frequently,610,Sales,12,4,Marketing,2,Female,72,3,2,Sales Executive,3,Single,5400,18500,1,Yes,17,3,2,0,7,1,2,4,4,3,3\n"
        "45,0,Non-Travel,1120,Research & Development,2,4,Technical Degree,4,Male,88,4,4,Manufacturing Director,4,Married,14500,21000,3,No,13,3,4,2,22,3,3,14,8,6,7\n"
    )
    return PlainTextResponse(
        content=csv_template,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=template_workforce_data.csv"}
    )


class CareerSimulationPayload(BaseModel):
    employee_id: str
    promote_now: bool = False
    lateral_move: bool = False
    add_trainings: int = 0


@router.post("/simulate-career")
def simulate_career(payload: CareerSimulationPayload):
    result = analytics_service.simulate_career_intervention(
        employee_id=payload.employee_id,
        promote_now=payload.promote_now,
        lateral_move=payload.lateral_move,
        add_trainings=payload.add_trainings
    )
    if not result:
        raise HTTPException(status_code=404, detail=f"Employee {payload.employee_id} not found")
    return result
