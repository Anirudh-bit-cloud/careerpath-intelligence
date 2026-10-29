"""
Pydantic schemas for data validation and API request/response models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class InterventionBase(BaseModel):
    employee_id: str
    department: Optional[str] = None
    job_role: Optional[str] = None
    category: str = "Career Conversation"
    status: str = "New"
    priority: str = "Moderate"
    action_plan: str
    owner: str = "HR Talent Partner"
    target_date: Optional[str] = None
    notes: Optional[str] = None

class InterventionCreate(InterventionBase):
    pass

class InterventionUpdate(BaseModel):
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    action_plan: Optional[str] = None
    owner: Optional[str] = None
    target_date: Optional[str] = None
    notes: Optional[str] = None

class InterventionResponse(InterventionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ClusteringConfigRequest(BaseModel):
    n_clusters: int = Field(default=5, ge=2, le=10)
    features: Optional[List[str]] = None

class FilterParams(BaseModel):
    department: Optional[str] = None
    job_role: Optional[str] = None
    career_cluster: Optional[str] = None
    promotion_gap_category: Optional[str] = None
    retention_priority: Optional[str] = None
    min_tenure: Optional[float] = None
    max_gap_ratio: Optional[float] = None
    search: Optional[str] = None
    page: int = 1
    page_size: int = 25
