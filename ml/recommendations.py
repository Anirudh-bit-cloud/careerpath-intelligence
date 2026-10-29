"""
CareerPath Intelligence - Explainable Retention & Development Recommendation Engine
Generates transparent, evidence-based recommendations without demographic bias.
"""

import pandas as pd
from typing import Dict, Any, List

INTERVENTION_CATEGORIES = [
    "Career Conversation",
    "Learning and Development",
    "Internal Mobility Review",
    "Promotion Readiness Review",
    "Manager-Supported Development Plan"
]

def generate_recommendations(row: pd.Series) -> Dict[str, Any]:
    """
    Evaluates individual career metrics and produces transparent recommendation metadata.
    Does NOT inspect protected attributes (Age, Gender, MaritalStatus, etc.).
    """
    p_latency = row.get('YearsSinceLastPromotion', 0)
    p_gap_ratio = row.get('PromotionGapRatio', 0)
    r_stagnation = row.get('RoleStagnationIndex', 0)
    training = row.get('TrainingTimesLastYear', 0)
    roi = row.get('RetentionOpportunityIndex', 0)
    tenure = row.get('YearsAtCompany', 0)
    
    triggers = []
    
    if p_latency >= 4.0 or p_gap_ratio >= 0.60:
        triggers.append(f"Promotion latency ({p_latency:.0f} yrs unpromoted) exceeds benchmark cycle")
    if r_stagnation >= 0.70 and tenure >= 3.0:
        triggers.append(f"Extended time in same role ({row.get('YearsInCurrentRole', 0):.0f} yrs)")
    if training <= 1:
        triggers.append(f"Low recent training participation ({training} sessions last year)")
        
    # Primary intervention category selection
    if p_latency >= 4.5 and roi >= 60:
        category = "Promotion Readiness Review"
        action = "Initiate formal promotion velocity calibration and executive review."
    elif r_stagnation >= 0.70:
        category = "Internal Mobility Review"
        action = "Explore cross-functional rotational assignment or lateral project placement."
    elif training <= 1:
        category = "Learning and Development"
        action = "Enroll in specialized technical certification or advanced leadership program."
    elif p_latency >= 3.0:
        category = "Career Conversation"
        action = "Schedule dedicated structured career pathway discussion between manager & talent partner."
    else:
        category = "Manager-Supported Development Plan"
        action = "Maintain regular quarterly development milestones and feedback loops."
        
    return {
        "RecommendedCategory": category,
        "RecommendedAction": action,
        "Triggers": triggers if triggers else ["Standard career progression cadence"],
        "ReviewPriority": "Urgent" if roi >= 65 else ("Moderate" if roi >= 45 else "Standard")
    }

def enrich_dataset_with_recommendations(df: pd.DataFrame) -> pd.DataFrame:
    """Applies recommendation engine to entire dataset."""
    df = df.copy()
    categories = []
    actions = []
    triggers_list = []
    
    for _, row in df.iterrows():
        rec = generate_recommendations(row)
        categories.append(rec["RecommendedCategory"])
        actions.append(rec["RecommendedAction"])
        triggers_list.append(" | ".join(rec["Triggers"]))
        
    df['RecommendedCategory'] = categories
    df['RecommendedAction'] = actions
    df['RecommendationTriggers'] = triggers_list
    return df
