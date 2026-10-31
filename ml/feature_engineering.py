"""
CareerPath Intelligence - Feature Engineering Module
Transparent, interpretable workforce progression metrics with robust zero-handling.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any

def compute_career_features(df_input: pd.DataFrame) -> pd.DataFrame:
    """
    Computes transparent career progression indicators from raw HR attributes.
    Preserves original columns and handles zero/missing values safely.
    """
    df = df_input.copy()
    
    # Ensure numeric columns are cleanly cast and fill missing with sensible defaults
    numeric_cols = [
        'YearsAtCompany', 'YearsInCurrentRole', 'YearsSinceLastPromotion',
        'YearsWithCurrManager', 'TrainingTimesLastYear', 'JobLevel',
        'TotalWorkingYears', 'JobSatisfaction', 'EnvironmentSatisfaction',
        'JobInvolvement', 'PerformanceRating'
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Safe denominators
    tenure_safe = np.where(df['YearsAtCompany'] <= 0, 1.0, df['YearsAtCompany'])
    role_safe = np.where(df['YearsInCurrentRole'] <= 0, 1.0, df['YearsInCurrentRole'])
    tot_work_safe = np.where(df['TotalWorkingYears'] <= 0, 1.0, df['TotalWorkingYears'])
    
    # 1. Promotion Gap Ratio (PGR)
    # Proportion of tenure at the firm without vertical promotion
    df['PromotionGapRatio'] = np.where(
        df['YearsAtCompany'] <= 0,
        0.0,
        (df['YearsSinceLastPromotion'] / tenure_safe).clip(0.0, 1.0)
    )
    
    # 2. Role Stagnation Index (RSI)
    # Proportion of company tenure spent in current role
    df['RoleStagnationIndex'] = np.where(
        df['YearsAtCompany'] <= 0,
        0.0,
        (df['YearsInCurrentRole'] / tenure_safe).clip(0.0, 1.0)
    )
    
    # 3. Training Intensity Score (TIS)
    # Training sessions relative to company tenure (with documentation note: represents annualized rate)
    df['TrainingIntensityScore'] = (df['TrainingTimesLastYear'] / (df['YearsAtCompany'] + 1.0)).round(3)
    
    # 4. Manager Stability Indicator (MSI)
    # Observed manager continuity relative to current role duration
    df['ManagerStabilityIndicator'] = np.where(
        df['YearsInCurrentRole'] <= 0,
        1.0,
        (df['YearsWithCurrManager'] / role_safe).clip(0.0, 1.5)
    ).round(2)
    
    # 5. Career Velocity (Job Level relative to total professional experience)
    df['CareerVelocity'] = (df['JobLevel'] / tot_work_safe).clip(0.0, 2.0).round(2)
    
    # 6. Promotion Gap Risk Category (Low / Medium / High)
    # Continuous composite: 45% gap ratio + 35% absolute promotion years + 20% role stagnation
    gap_score_raw = (
        (df['PromotionGapRatio'] * 0.45) +
        ((df['YearsSinceLastPromotion'] / 12.0).clip(0, 1) * 0.35) +
        (df['RoleStagnationIndex'] * 0.20)
    )
    df['PromotionGapScore'] = (gap_score_raw * 100).round(1)
    
    conditions = [
        df['PromotionGapScore'] >= 55.0,
        (df['PromotionGapScore'] >= 30.0) & (df['PromotionGapScore'] < 55.0),
        df['PromotionGapScore'] < 30.0
    ]
    df['PromotionGapCategory'] = np.select(conditions, ['High', 'Medium', 'Low'], default='Low')
    
    # 7. Career Development Need Score (0 - 100)
    # Measures the structural urgency for career conversations, internal mobility, or skill refresh
    p_latency_norm = (df['YearsSinceLastPromotion'] / 10.0).clip(0, 1)
    r_tenure_norm = (df['YearsInCurrentRole'] / 10.0).clip(0, 1)
    train_deficit = (1.0 - (df['TrainingTimesLastYear'] / 6.0).clip(0, 1))
    
    dev_need_raw = (
        (p_latency_norm * 0.40) +
        (r_tenure_norm * 0.30) +
        (train_deficit * 0.20) +
        ((1.0 - df['PromotionGapRatio']) * 0.10) # balance factor
    ) * 100
    df['CareerDevelopmentNeedScore'] = dev_need_raw.round(1)
    
    # 8. Retention Risk Index (RRI, 0 - 100) — formerly Retention Opportunity Index (ROI)
    # The cornerstone metric: identifies engaged, active employees who are experiencing structural stagnation
    # Note: Not an attrition probability. Represents potential risk of departure and impact of proactive career intervention.
    attrition_val = df['Attrition'] if 'Attrition' in df.columns else 0
    is_active = (attrition_val == 0) if isinstance(attrition_val, pd.Series) else True
    
    sat_level = df['JobSatisfaction'] if 'JobSatisfaction' in df.columns else 3.0
    involve_level = df['JobInvolvement'] if 'JobInvolvement' in df.columns else 3.0
    
    is_engaged = (sat_level >= 2) & (involve_level >= 2)
    
    # Risk calculation
    stagnation_weight = (df['PromotionGapRatio'] * 0.55) + (df['RoleStagnationIndex'] * 0.45)
    engagement_factor = (sat_level / 4.0 * 0.5) + (involve_level / 4.0 * 0.5)
    
    rri_raw = ((stagnation_weight * 0.50) + (engagement_factor * 0.30) + (train_deficit * 0.20)) * 100
    # Employees who are already disengaged or departed have lower proactive retention window
    calculated_rri = np.where(is_active & is_engaged, rri_raw, rri_raw * 0.45).round(1)
    df['RetentionRiskIndex'] = calculated_rri
    # Backward compatibility alias
    df['RetentionOpportunityIndex'] = calculated_rri
    
    rri_conditions = [
        (df['RetentionRiskIndex'] >= 65.0),
        (df['RetentionRiskIndex'] >= 45.0) & (df['RetentionRiskIndex'] < 65.0),
        df['RetentionRiskIndex'] < 45.0
    ]
    df['RetentionPriority'] = np.select(rri_conditions, ['Urgent', 'Moderate', 'Standard'], default='Standard')
    
    # 9. Anonymous Employee Identifier if not present
    if 'EmployeeID' not in df.columns:
        df['EmployeeID'] = [f"PANW-{1001 + i}" for i in range(len(df))]
        
    # 10. Manager Hierarchy & Assignment
    if 'ManagerID' not in df.columns:
        if 'Department' not in df.columns:
            df['Department'] = 'Research & Development'
        if 'JobRole' not in df.columns:
            df['JobRole'] = 'Team Member'
        manager_ids_by_dept = {}
        for dept in df['Department'].dropna().unique():
            dept_df = df[df['Department'] == dept]
            mgr_candidates = dept_df[dept_df['JobRole'] == 'Manager']['EmployeeID'].tolist() if 'JobRole' in dept_df.columns else []
            if not mgr_candidates and 'JobLevel' in dept_df.columns:
                mgr_candidates = dept_df[dept_df['JobLevel'] >= 4]['EmployeeID'].tolist()
            if not mgr_candidates:
                mgr_candidates = dept_df['EmployeeID'].head(3).tolist()
            if dept == 'Research & Development' and 'PANW-1044' in dept_df['EmployeeID'].values and 'PANW-1044' not in mgr_candidates:
                mgr_candidates.insert(0, 'PANW-1044')
            manager_ids_by_dept[dept] = mgr_candidates

        assigned_managers = []
        dept_counters = {d: 0 for d in manager_ids_by_dept}
        for _, row in df.iterrows():
            emp_id = row['EmployeeID']
            dept = row.get('Department', 'Research & Development')
            mgr_list = manager_ids_by_dept.get(dept, ['PANW-1044'])
            if emp_id in mgr_list:
                director_id = mgr_list[0] if mgr_list[0] != emp_id else (mgr_list[1] if len(mgr_list) > 1 else 'PANW-EXEC-01')
                assigned_managers.append(director_id)
            else:
                idx = dept_counters[dept] % len(mgr_list)
                assigned_managers.append(mgr_list[idx])
                dept_counters[dept] += 1
        df['ManagerID'] = assigned_managers

    return df
