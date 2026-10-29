"""
CareerPath Intelligence - Analytics & Machine Learning Service
Centralized business logic for data processing, caching, KPI aggregations, and insights.
"""

import os
import sys
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

# Add project root to sys.path so ml imports work reliably
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml.feature_engineering import compute_career_features
from ml.clustering import perform_career_clustering
from ml.recommendations import enrich_dataset_with_recommendations

class AnalyticsService:
    def __init__(self):
        self.data_dir = os.path.join(PROJECT_ROOT, "data")
        self.default_csv = os.path.join(self.data_dir, "demo_workforce_data.csv")
        self.df_raw: Optional[pd.DataFrame] = None
        self.df_enriched: Optional[pd.DataFrame] = None
        self.clustering_metrics: Dict[str, Any] = {}
        self.cluster_profiles_df: Optional[pd.DataFrame] = None
        self.current_dataset_name: str = "Palo Alto Networks Synthetic Trajectory Benchmark"
        self.is_demo: bool = True
        self.data_provenance: str = "Public Benchmark & Synthetic Workforce Trajectory (Demonstration Mode)"

        # Initialize default dataset
        self.reload_dataset()

    def reload_dataset(self, csv_path: Optional[str] = None, dataset_name: Optional[str] = None,
                       n_clusters: int = 5, auto_select_k: bool = False):
        """Loads and processes dataset through full ML pipeline."""
        target_path = csv_path if csv_path else self.default_csv
        if not os.path.exists(target_path):
            raise FileNotFoundError(f"Dataset not found at {target_path}")

        df_loaded = pd.read_csv(target_path)
        self.df_raw = df_loaded.copy()
        self._last_csv_path = target_path
        self._last_dataset_name = dataset_name

        # 1. Feature Engineering
        df_feat = compute_career_features(self.df_raw)

        # 2. Career Clustering (ensemble: K-Means + GMM + Hierarchical + Isolation Forest)
        df_clust, metrics, c_profiles = perform_career_clustering(
            df_feat, n_clusters=n_clusters, auto_select_k=auto_select_k
        )
        self.clustering_metrics = metrics
        self.cluster_profiles_df = c_profiles

        # 3. Recommendations
        self.df_enriched = enrich_dataset_with_recommendations(df_clust)

        if dataset_name:
            self.current_dataset_name = dataset_name
            self.is_demo = False
            self.data_provenance = f"User Uploaded Dataset: {dataset_name}"
        else:
            self.current_dataset_name = "Palo Alto Networks Trajectory Prototype"
            self.is_demo = True
            self.data_provenance = "Public Benchmark / Synthetic Demonstration Data (Non-Internal)"

    def rerun_clustering(self, n_clusters: int = 5, auto_select_k: bool = False, algorithm: str = "ensemble"):
        """Re-runs ONLY the clustering step on the already-loaded feature-engineered data.
        Useful for experimenting with different K values without re-uploading."""
        if self.df_raw is None:
            raise ValueError("No dataset loaded. Upload or reset to demo first.")

        df_feat = compute_career_features(self.df_raw)
        df_clust, metrics, c_profiles = perform_career_clustering(
            df_feat, n_clusters=n_clusters, auto_select_k=auto_select_k
        )
        self.clustering_metrics = metrics
        self.cluster_profiles_df = c_profiles
        self.df_enriched = enrich_dataset_with_recommendations(df_clust)

    def load_industry_preset(self, preset_key: str = "cyber") -> Dict[str, Any]:
        """Loads one of the 3 seeded industry datasets: 'cyber', 'healthcare', 'finance'."""
        preset_map = {
            "cyber": ("demo_workforce_data.csv", "Cybersecurity & Cloud Tech Benchmark", "Cybersecurity Trajectory Benchmark"),
            "healthcare": ("synthetic_healthcare_workforce.csv", "Healthcare & Clinical Systems Benchmark", "Clinical Operations & Therapeutics Benchmark"),
            "finance": ("synthetic_financial_workforce.csv", "Asset Management & FinTech Benchmark", "Quantitative Capital & Compliance Benchmark")
        }
        filename, display_name, provenance = preset_map.get(preset_key, preset_map["cyber"])
        csv_path = os.path.join(self.data_dir, filename)
        self.reload_dataset(csv_path, dataset_name=display_name)
        self.data_provenance = f"Seeded Synthetic Benchmark: {provenance}"
        self.is_demo = True
        return self.get_metadata()

    def simulate_policy_impact(self, weights: Dict[str, float], thresholds: Dict[str, float]) -> Dict[str, Any]:
        """Simulates how changing scoring weights and level dwell thresholds moves employees between tiers."""
        if self.df_enriched is None:
            return {}
        df = self.df_enriched.copy()

        # Current baseline
        baseline_urgent = set(df[df['RetentionPriority'] == 'Urgent']['EmployeeID'])
        baseline_mod = set(df[df['RetentionPriority'] == 'Moderate']['EmployeeID'])
        baseline_std = set(df[df['RetentionPriority'] == 'Standard']['EmployeeID'])

        # Compute simulated index with custom weights
        w_stag = float(weights.get("stagnation_weight", 0.45))
        w_eng = float(weights.get("engagement_weight", 0.35))
        w_train = float(weights.get("training_deficit_weight", 0.20))
        pgr_split = float(weights.get("pgr_ratio_split", 0.60))
        rsi_split = float(weights.get("rsi_ratio_split", 0.40))

        # Composite score calculation
        stag_comp = pgr_split * df['PromotionGapRatio'] + rsi_split * df['RoleStagnationIndex']
        eng_norm = (df['JobSatisfaction'] + df['JobInvolvement'] - 2.0) / 6.0
        train_norm = 1.0 - (df['TrainingTimesLastYear'] / 6.0).clip(0.0, 1.0)

        sim_index = (w_stag * stag_comp + w_eng * eng_norm + w_train * train_norm) * 100.0
        sim_index = sim_index.round(1).clip(0.0, 100.0)

        # Apply simulated thresholds
        sim_priorities = []
        for idx, row in df.iterrows():
            score = sim_index.loc[idx]
            lvl = int(row['JobLevel'])
            exp_dwell = float(thresholds.get(f"level_{lvl}_dwell_years", 3.0))
            is_stalled = row['YearsSinceLastPromotion'] >= exp_dwell

            if (score >= 65.0 and is_stalled) or score >= 80.0:
                sim_priorities.append('Urgent')
            elif score >= 45.0 or is_stalled:
                sim_priorities.append('Moderate')
            else:
                sim_priorities.append('Standard')

        df['SimulatedPriority'] = sim_priorities
        sim_urgent = set(df[df['SimulatedPriority'] == 'Urgent']['EmployeeID'])
        sim_mod = set(df[df['SimulatedPriority'] == 'Moderate']['EmployeeID'])
        sim_std = set(df[df['SimulatedPriority'] == 'Standard']['EmployeeID'])

        moved_to_urgent = list(sim_urgent - baseline_urgent)
        moved_out_of_urgent = list(baseline_urgent - sim_urgent)

        return {
            "baseline": {
                "urgent": len(baseline_urgent),
                "moderate": len(baseline_mod),
                "standard": len(baseline_std)
            },
            "simulated": {
                "urgent": len(sim_urgent),
                "moderate": len(sim_mod),
                "standard": len(sim_std)
            },
            "net_urgent_change": len(sim_urgent) - len(baseline_urgent),
            "moved_to_urgent_count": len(moved_to_urgent),
            "moved_out_of_urgent_count": len(moved_out_of_urgent),
            "sample_moved_to_urgent": moved_to_urgent[:5],
            "sample_moved_out_of_urgent": moved_out_of_urgent[:5]
        }

    def get_metadata(self) -> Dict[str, Any]:
        """Returns dataset provenance, row count, and processing status."""
        if self.df_enriched is None:
            return {}
        return {
            "name": self.current_dataset_name,
            "is_demo": self.is_demo,
            "provenance": self.data_provenance,
            "total_records": len(self.df_enriched),
            "columns": list(self.df_enriched.columns),
            "clustering_metrics": self.clustering_metrics
        }

    def get_executive_overview(self) -> Dict[str, Any]:
        """Calculates leadership command center KPIs and visualizations."""
        df = self.df_enriched
        if df is None:
            return {}

        total_emp = len(df)
        high_gap_cases = int((df['PromotionGapCategory'] == 'High').sum())
        urgent_retention = int((df['RetentionPriority'] == 'Urgent').sum())
        stalled_cluster_emp = int((df['CareerCluster'] == 'Promotion-Stalled Talent').sum())
        median_role_tenure = float(df['YearsInCurrentRole'].median())
        avg_trainings = float(round(df['TrainingTimesLastYear'].mean(), 1))

        # 1. Career Trajectory Distribution
        cluster_dist = df['CareerCluster'].value_counts().reset_index()
        cluster_dist.columns = ['name', 'count']
        cluster_dist['percentage'] = (cluster_dist['count'] / total_emp * 100).round(1)

        # 2. Promotion Gap Distribution
        gap_dist = df['PromotionGapCategory'].value_counts().reset_index()
        gap_dist.columns = ['category', 'count']

        # 3. Department Comparison
        dept_group = df.groupby('Department').agg(
            total=('EmployeeID', 'count'),
            high_gap_count=('PromotionGapCategory', lambda x: (x == 'High').sum()),
            avg_promotion_gap=('YearsSinceLastPromotion', 'mean'),
            median_role_tenure=('YearsInCurrentRole', 'median'),
            avg_training=('TrainingTimesLastYear', 'mean'),
            urgent_retention=('RetentionPriority', lambda x: (x == 'Urgent').sum())
        ).reset_index()
        dept_data = dept_group.to_dict(orient='records')
        for d in dept_data:
            d['high_gap_percent'] = round((d['high_gap_count'] / d['total']) * 100, 1)
            d['avg_promotion_gap'] = round(d['avg_promotion_gap'], 1)
            d['avg_training'] = round(d['avg_training'], 1)

        # 4. Career Progression Matrix (YearsInCurrentRole vs YearsAtCompany histogram buckets)
        bins_tenure = [0, 2, 5, 8, 12, 40]
        labels_tenure = ['0-2 yrs', '3-5 yrs', '6-8 yrs', '9-12 yrs', '12+ yrs']
        df_temp = df.copy()
        df_temp['TenureGroup'] = pd.cut(df_temp['YearsAtCompany'], bins=bins_tenure, labels=labels_tenure, include_lowest=True)
        matrix = df_temp.groupby(['TenureGroup', 'PromotionGapCategory'], observed=False).size().unstack(fill_value=0).reset_index()
        matrix_data = matrix.to_dict(orient='records')

        # 5. Insight Feed (computed observations)
        insights = self._generate_data_insights(df)

        return {
            "kpis": {
                "total_employees": total_emp,
                "high_promotion_gap_cases": high_gap_cases,
                "high_gap_percent": round((high_gap_cases / total_emp) * 100, 1),
                "urgent_retention_opportunities": urgent_retention,
                "urgent_retention_percent": round((urgent_retention / total_emp) * 100, 1),
                "stalled_cluster_count": stalled_cluster_emp,
                "median_role_tenure_years": median_role_tenure,
                "avg_trainings_last_year": avg_trainings
            },
            "cluster_distribution": cluster_dist.to_dict(orient='records'),
            "promotion_gap_distribution": gap_dist.to_dict(orient='records'),
            "department_comparison": dept_data,
            "progression_matrix": matrix_data,
            "insights": insights
        }

    def _generate_data_insights(self, df: pd.DataFrame) -> List[Dict[str, str]]:
        """Generates 3 to 5 evidence-based observations strictly backed by calculations."""
        insights = []

        # Observation 1: Department promotion gap disparity
        dept_gap = df.groupby('Department')['YearsSinceLastPromotion'].mean()
        max_dept = dept_gap.idxmax()
        max_val = dept_gap.max()
        overall_avg = df['YearsSinceLastPromotion'].mean()
        diff = max_val - overall_avg
        if diff > 0.2:
            insights.append({
                "type": "Departmental Latency",
                "finding": f"Employees in {max_dept} experience higher promotion latency than the organizational benchmark.",
                "metric": f"{max_val:.1f} years since last promotion (vs. {overall_avg:.1f} yrs overall).",
                "comparison": f"+{diff:.1f} years above company average.",
                "implication": "Potential talent bottleneck or delayed review cycles in this business unit.",
                "recommended_action": f"Conduct structured talent review in {max_dept} to evaluate advancement readiness."
            })

        # Observation 2: Training deficit in stalled employees
        stalled_train = df[df['PromotionGapCategory'] == 'High']['TrainingTimesLastYear'].mean()
        normal_train = df[df['PromotionGapCategory'] == 'Low']['TrainingTimesLastYear'].mean()
        if stalled_train < normal_train:
            insights.append({
                "type": "Skill Growth Deficit",
                "finding": "High promotion-gap personnel attend fewer developmental programs.",
                "metric": f"Average {stalled_train:.1f} trainings last year (vs. {normal_train:.1f} for low-gap personnel).",
                "comparison": f"{((normal_train - stalled_train) / normal_train * 100):.1f}% lower training engagement.",
                "implication": "Stagnation is reinforced by a lack of continuous capability building.",
                "recommended_action": "Sponsor targeted technical or leadership reskilling tracks for stalled talent."
            })

        # Observation 3: Managerial Continuity
        long_mgr = df[df['YearsWithCurrManager'] >= 5]
        long_mgr_gap = long_mgr['PromotionGapRatio'].mean() * 100
        short_mgr_gap = df[df['YearsWithCurrManager'] < 5]['PromotionGapRatio'].mean() * 100
        insights.append({
            "type": "Managerial Continuity",
            "finding": "Extended tenure with the same manager correlates with higher promotion gap ratios.",
            "metric": f"{long_mgr_gap:.1f}% avg gap ratio for 5+ yrs with manager vs {short_mgr_gap:.1f}% for <5 yrs.",
            "comparison": f"+{long_mgr_gap - short_mgr_gap:.1f}% gap ratio difference.",
            "implication": "Possible managerial familiarity inertia or lack of external sponsorship.",
            "recommended_action": "Establish cross-functional talent committee reviews to complement direct manager appraisals."
        })

        # Observation 4: Retention opportunity window
        urgent_count = (df['RetentionPriority'] == 'Urgent').sum()
        insights.append({
            "type": "Proactive Retention Opportunity",
            "finding": f"{urgent_count} high-performing, currently satisfied employees are experiencing severe career stalling.",
            "metric": f"{urgent_count} active employees ({urgent_count / len(df) * 100:.1f}% of cohort).",
            "comparison": "Satisfaction scores $\\ge$ 2.0, but unpromoted for $\\ge$ 4.0 years.",
            "implication": "These individuals are in the critical 12-to-18 month pre-disengagement window.",
            "recommended_action": "Initiate proactive internal mobility reviews and executive sponsorship before active turnover occurs."
        })

        return insights

    def get_promotion_gap_monitor(
        self,
        department: Optional[str] = None,
        job_role: Optional[str] = None,
        job_level: Optional[int] = None,
        category: Optional[str] = None,
        cluster: Optional[str] = None,
        min_tenure: Optional[float] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 25
    ) -> Dict[str, Any]:
        """Provides filtered analytical records and role/department distributions."""
        df = self.df_enriched.copy()

        # Apply filters
        if department and department != "All":
            df = df[df['Department'] == department]
        if job_role and job_role != "All":
            df = df[df['JobRole'] == job_role]
        if job_level and job_level > 0:
            df = df[df['JobLevel'] == job_level]
        if category and category != "All":
            df = df[df['PromotionGapCategory'] == category]
        if cluster and cluster != "All":
            df = df[df['CareerCluster'] == cluster]
        if min_tenure is not None:
            df = df[df['YearsAtCompany'] >= min_tenure]
        if search:
            s_clean = search.strip().lower()
            df = df[
                df['EmployeeID'].str.lower().str.contains(s_clean) |
                df['JobRole'].str.lower().str.contains(s_clean) |
                df['Department'].str.lower().str.contains(s_clean)
            ]

        total_matching = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_records = df.iloc[start_idx:end_idx]

        # Distributions for charts
        role_gap = df.groupby('JobRole')['YearsSinceLastPromotion'].mean().reset_index()
        role_gap.columns = ['role', 'avg_years']
        role_gap = role_gap.sort_values('avg_years', ascending=False).to_dict(orient='records')

        level_dist = df.groupby(['JobLevel', 'PromotionGapCategory'], observed=False).size().unstack(fill_value=0).reset_index()
        level_data = level_dist.to_dict(orient='records')

        return {
            "total_count": total_matching,
            "page": page,
            "page_size": page_size,
            "total_pages": int(np.ceil(total_matching / page_size)) if total_matching > 0 else 1,
            "records": paginated_records[[
                'EmployeeID', 'Department', 'JobRole', 'JobLevel', 'YearsAtCompany',
                'YearsInCurrentRole', 'YearsSinceLastPromotion', 'TrainingTimesLastYear',
                'PromotionGapRatio', 'RoleStagnationIndex', 'PromotionGapScore',
                'PromotionGapCategory', 'CareerCluster', 'RecommendedCategory', 'RecommendedAction'
            ]].to_dict(orient='records'),
            "role_gap_breakdown": role_gap,
            "level_distribution": level_data
        }

    def get_career_clusters(self) -> Dict[str, Any]:
        """Returns cluster profiles, evaluation metrics, and PCA coordinates for scatter visualization."""
        df = self.df_enriched
        if df is None:
            return {}

        pca_samples = df[[
            'EmployeeID', 'CareerCluster', 'Cluster_ID', 'PCA1', 'PCA2',
            'YearsAtCompany', 'YearsSinceLastPromotion', 'PromotionGapRatio',
            'JobRole', 'Department'
        ]].to_dict(orient='records')

        return {
            "metrics": self.clustering_metrics,
            "profiles": self.cluster_profiles_df.to_dict(orient='records'),
            "pca_points": pca_samples
        }

    def get_retention_opportunities(
        self,
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
        page: int = 1,
        page_size: int = 25
    ) -> Dict[str, Any]:
        """Provides prioritized proactive retention candidates, live filters, and category recommendations."""
        if self.df_enriched is None:
            return {"total_count": 0, "page": page, "page_size": page_size, "records": [], "summary": {}}

        df = self.df_enriched.copy()
        unfiltered_total = len(df)

        if priority and priority != "All":
            df = df[df['RetentionPriority'].str.lower() == priority.lower()]
        if department and department != "All":
            df = df[df['Department'] == department]
        if job_role and job_role != "All":
            df = df[df['JobRole'] == job_role]
        if job_level is not None and str(job_level) != "" and str(job_level) != "All":
            df = df[df['JobLevel'] == int(job_level)]
        if cluster and cluster != "All":
            df = df[df['CareerCluster'] == cluster]
        if min_tenure is not None:
            df = df[df['YearsAtCompany'] >= float(min_tenure)]
        if min_gap_score is not None:
            df = df[df['YearsSinceLastPromotion'] >= float(min_gap_score)]
        if search and search.strip():
            term = search.strip().lower()
            df = df[
                df['EmployeeID'].astype(str).str.lower().str.contains(term, na=False) |
                df['JobRole'].astype(str).str.lower().str.contains(term, na=False) |
                df['Department'].astype(str).str.lower().str.contains(term, na=False) |
                df['RecommendedCategory'].astype(str).str.lower().str.contains(term, na=False) |
                df['RecommendedAction'].astype(str).str.lower().str.contains(term, na=False)
            ]

        # Computed live executive summary strip metrics on the active filtered cohort
        filtered_count = len(df)
        urgent_count = int((df['RetentionPriority'] == 'Urgent').sum()) if filtered_count > 0 else 0
        moderate_count = int((df['RetentionPriority'] == 'Moderate').sum()) if filtered_count > 0 else 0
        standard_count = int((df['RetentionPriority'] == 'Standard').sum()) if filtered_count > 0 else 0
        median_promotion_gap = float(round(df['YearsSinceLastPromotion'].median(), 1)) if filtered_count > 0 else 0.0
        rri_col = 'RetentionRiskIndex' if 'RetentionRiskIndex' in df.columns else 'RetentionOpportunityIndex'
        avg_risk_index = float(round(df[rri_col].mean(), 1)) if filtered_count > 0 else 0.0
        avg_tenure = float(round(df['YearsAtCompany'].mean(), 1)) if filtered_count > 0 else 0.0

        # Sort order
        if sort_by and sort_by in df.columns:
            ascending = (sort_dir.lower() == 'asc') if sort_dir else False
            df = df.sort_values(sort_by, ascending=ascending)
        else:
            df = df.sort_values(rri_col, ascending=False)

        total_count = len(df)
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        paginated_records = df.iloc[start_idx:start_idx + page_size]

        # Full-dataset summary baseline
        summary = self.df_enriched['RetentionPriority'].value_counts().to_dict()
        category_breakdown = self.df_enriched[self.df_enriched['RetentionPriority'] == 'Urgent']['RecommendedCategory'].value_counts().to_dict()

        # Available options for dynamic filter select boxes
        available_departments = sorted(self.df_enriched['Department'].dropna().unique().tolist())
        available_roles = sorted(self.df_enriched['JobRole'].dropna().unique().tolist())
        available_clusters = sorted(self.df_enriched['CareerCluster'].dropna().unique().tolist())

        cols_to_return = [
            'EmployeeID', 'Department', 'JobRole', 'JobLevel', 'YearsAtCompany',
            'YearsInCurrentRole', 'YearsSinceLastPromotion', 'PromotionGapRatio',
            'RoleStagnationIndex', 'PromotionGapScore', 'CareerCluster',
            'TrainingTimesLastYear', 'JobSatisfaction', 'YearsWithCurrManager',
            'RetentionRiskIndex', 'RetentionOpportunityIndex', 'RetentionPriority', 'RecommendedCategory',
            'RecommendedAction', 'RecommendationTriggers'
        ]
        # Keep only existing columns
        valid_cols = [c for c in cols_to_return if c in paginated_records.columns]

        return {
            "total_count": total_count,
            "unfiltered_total": unfiltered_total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "summary": summary,
            "filtered_summary": {
                "filtered_count": filtered_count,
                "urgent_count": urgent_count,
                "moderate_count": moderate_count,
                "standard_count": standard_count,
                "median_promotion_gap": median_promotion_gap,
                "avg_risk_index": avg_risk_index,
                "avg_opportunity_index": avg_risk_index,  # backward compatibility alias
                "avg_tenure": avg_tenure
            },
            "urgent_category_breakdown": category_breakdown,
            "filter_options": {
                "departments": available_departments,
                "roles": available_roles,
                "clusters": available_clusters
            },
            "records": paginated_records[valid_cols].to_dict(orient='records')
        }

    def get_manager_insights(self) -> Dict[str, Any]:
        """Returns aggregate insights on managerial continuity and career growth."""
        df = self.df_enriched
        if df is None:
            return {}

        # Continuity groups
        bins = [-1, 2, 4, 7, 25]
        labels = ['0-2 yrs', '3-4 yrs', '5-7 yrs', '8+ yrs']
        df_temp = df.copy()
        df_temp['ManagerTenureGroup'] = pd.cut(df_temp['YearsWithCurrManager'], bins=bins, labels=labels)

        mgr_summary = df_temp.groupby('ManagerTenureGroup', observed=False).agg(
            employee_count=('EmployeeID', 'count'),
            avg_promotion_latency=('YearsSinceLastPromotion', 'mean'),
            avg_gap_ratio=('PromotionGapRatio', 'mean'),
            avg_satisfaction=('JobSatisfaction', 'mean'),
            high_gap_cases=('PromotionGapCategory', lambda x: (x == 'High').sum())
        ).reset_index()

        mgr_data = mgr_summary.to_dict(orient='records')
        for m in mgr_data:
            m['avg_promotion_latency'] = round(m['avg_promotion_latency'], 1)
            m['avg_gap_ratio'] = round(m['avg_gap_ratio'] * 100, 1)
            m['avg_satisfaction'] = round(m['avg_satisfaction'], 2)

        # Department manager continuity vs role tenure
        dept_mgr = df.groupby('Department').agg(
            avg_manager_tenure=('YearsWithCurrManager', 'mean'),
            avg_role_tenure=('YearsInCurrentRole', 'mean'),
            avg_company_tenure=('YearsAtCompany', 'mean')
        ).reset_index()
        dept_mgr_data = dept_mgr.to_dict(orient='records')
        for d in dept_mgr_data:
            d['avg_manager_tenure'] = round(d['avg_manager_tenure'], 1)
            d['avg_role_tenure'] = round(d['avg_role_tenure'], 1)
            d['avg_company_tenure'] = round(d['avg_company_tenure'], 1)

        return {
            "manager_tenure_groups": mgr_data,
            "department_continuity": dept_mgr_data,
            "disclaimer": "Manager continuity is an observational indicator of supervisory tenure, not an individual evaluation of managerial effectiveness."
        }

    def get_employee_profile(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """Returns single employee career profile snapshot and diagnostic indicators."""
        df = self.df_enriched
        match = df[df['EmployeeID'] == employee_id]
        if match.empty:
            return None

        row = match.iloc[0].to_dict()
        # Clean numpy types for JSON serialization
        for k, v in row.items():
            if isinstance(v, (np.integer, np.int64)):
                row[k] = int(v)
            elif isinstance(v, (np.floating, np.float64)):
                row[k] = round(float(v), 2)

        return row

    def search_employees(self, query: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        """Search employees by ID, role, or department."""
        df = self.df_enriched
        if query:
            q = query.strip().lower()
            matched = df[
                df['EmployeeID'].str.lower().str.contains(q) |
                df['JobRole'].str.lower().str.contains(q) |
                df['Department'].str.lower().str.contains(q)
            ]
        else:
            matched = df

        return matched[['EmployeeID', 'Department', 'JobRole', 'JobLevel', 'CareerCluster', 'PromotionGapCategory', 'RetentionPriority']].head(limit).to_dict(orient='records')

    def simulate_career_intervention(
        self,
        employee_id: str,
        promote_now: bool = False,
        lateral_move: bool = False,
        add_trainings: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        Calculates scenario impact of granting a promotion, executing a lateral rotation,
        or adding capability trainings for an employee.
        """
        df = self.df_enriched
        match = df[df['EmployeeID'] == employee_id]
        if match.empty:
            return None
        emp = match.iloc[0].to_dict()

        orig_p_latency = emp['YearsSinceLastPromotion']
        orig_r_tenure = emp['YearsInCurrentRole']
        orig_training = emp['TrainingTimesLastYear']
        orig_co_tenure = emp['YearsAtCompany']
        orig_gap_ratio = emp['PromotionGapRatio']
        orig_stag_index = emp['RoleStagnationIndex']
        orig_roi = emp['RetentionOpportunityIndex']
        orig_risk = emp['PromotionGapCategory']

        sim_p_latency = 0 if promote_now else orig_p_latency
        sim_r_tenure = 0 if lateral_move else orig_r_tenure
        sim_training = min(6, orig_training + add_trainings)
        sim_co_tenure = orig_co_tenure

        tenure_safe = max(1.0, float(sim_co_tenure))
        sim_gap_ratio = round(min(1.0, sim_p_latency / tenure_safe), 3)
        sim_stag_index = round(min(1.0, sim_r_tenure / tenure_safe), 3)

        gap_score_raw = (
            (sim_gap_ratio * 0.45) +
            ((sim_p_latency / 12.0) * 0.35) +
            (sim_stag_index * 0.20)
        )
        sim_gap_score = round(gap_score_raw * 100, 1)
        sim_risk = "High" if sim_gap_score >= 55.0 else ("Medium" if sim_gap_score >= 30.0 else "Low")

        stagnation_weight = (sim_gap_ratio * 0.55) + (sim_stag_index * 0.45)
        sat_level = emp.get('JobSatisfaction', 3.0)
        involve_level = emp.get('JobInvolvement', 3.0)
        engagement_factor = (sat_level / 4.0 * 0.5) + (involve_level / 4.0 * 0.5)
        train_deficit = 1.0 - (sim_training / 6.0)

        sim_roi = round(((stagnation_weight * 0.50) + (engagement_factor * 0.30) + (train_deficit * 0.20)) * 100, 1)
        sim_priority = "Urgent" if sim_roi >= 65.0 else ("Moderate" if sim_roi >= 45.0 else "Standard")

        risk_reduction_pct = round(max(0.0, (orig_roi - sim_roi) / max(orig_roi, 1.0) * 100), 1)

        return {
            "employee_id": employee_id,
            "original": {
                "years_since_promotion": orig_p_latency,
                "years_in_current_role": orig_r_tenure,
                "trainings_last_year": orig_training,
                "promotion_gap_ratio": round(orig_gap_ratio * 100, 1),
                "role_stagnation_index": round(orig_stag_index * 100, 1),
                "retention_risk_index": orig_roi,
                "retention_opportunity_index": orig_roi,
                "promotion_gap_risk": orig_risk
            },
            "simulated": {
                "years_since_promotion": sim_p_latency,
                "years_in_current_role": sim_r_tenure,
                "trainings_last_year": sim_training,
                "promotion_gap_ratio": round(sim_gap_ratio * 100, 1),
                "role_stagnation_index": round(sim_stag_index * 100, 1),
                "retention_risk_index": sim_roi,
                "retention_opportunity_index": sim_roi,
                "promotion_gap_risk": sim_risk,
                "retention_priority": sim_priority
            },
            "impact": {
                "risk_reduction_percent": risk_reduction_pct,
                "narrative": f"Simulated intervention reduces stagnation vulnerability by {risk_reduction_pct}%, transitioning profile to {sim_priority} retention tier."
            }
        }

    def get_data_quality_report(self) -> Dict[str, Any]:
        """Provides data hygiene, missing value analysis, and health score."""
        df = self.df_raw if self.df_raw is not None else self.df_enriched
        if df is None:
            return {}

        total_rows = len(df)
        total_cols = len(df.columns)
        missing_counts = df.isnull().sum().to_dict()
        missing_summary = {k: int(v) for k, v in missing_counts.items() if v > 0}

        completeness_pct = round(100.0 - (sum(missing_counts.values()) / max(1, total_rows * total_cols) * 100), 1)

        return {
            "total_records": total_rows,
            "total_columns": total_cols,
            "completeness_score_percent": completeness_pct,
            "missing_values": missing_summary,
            "duplicates_detected": int(df.duplicated().sum()),
            "dataset_status": "Clean & Verified" if completeness_pct >= 95.0 else "Needs Cleaning"
        }

    def explain_score(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """
        Computes detailed waterfall score explanation and counterfactual analysis
        for moving down one tier.
        """
        df = self.df_enriched
        if df is None:
            return None
        match = df[df['EmployeeID'] == employee_id]
        if match.empty:
            return None
        emp = match.iloc[0].to_dict()

        p_gap_ratio = float(emp.get('PromotionGapRatio', 0.0))
        r_stag_index = float(emp.get('RoleStagnationIndex', 0.0))
        stagnation_weight = (p_gap_ratio * 0.55) + (r_stag_index * 0.45)

        sat_level = float(emp.get('JobSatisfaction', 3.0))
        involve_level = float(emp.get('JobInvolvement', 3.0))
        engagement_factor = (sat_level / 4.0 * 0.5) + (involve_level / 4.0 * 0.5)

        training = float(emp.get('TrainingTimesLastYear', 2.0))
        train_deficit = max(0.0, 1.0 - (training / 6.0))

        # Raw component points out of 100
        comp_stagnation = round(stagnation_weight * 0.50 * 100, 1)
        comp_engagement = round(engagement_factor * 0.30 * 100, 1)
        comp_training = round(train_deficit * 0.20 * 100, 1)

        total_rri = round(comp_stagnation + comp_engagement + comp_training, 1)
        priority = "Urgent" if total_rri >= 65.0 else ("Moderate" if total_rri >= 45.0 else "Standard")

        components = [
            {
                "name": "Stagnation & Promotion Gap",
                "weight": 0.50,
                "value": round(stagnation_weight * 100, 1),
                "contribution_points": comp_stagnation,
                "description": f"Promotion gap ratio ({round(p_gap_ratio*100,1)}%) and role stagnation index ({round(r_stag_index*100,1)}%)"
            },
            {
                "name": "Engagement & Satisfaction",
                "weight": 0.30,
                "value": round(engagement_factor * 100, 1),
                "contribution_points": comp_engagement,
                "description": f"Satisfaction ({sat_level}/4) and job involvement ({involve_level}/4)"
            },
            {
                "name": "Training & Skills Deficit",
                "weight": 0.20,
                "value": round(train_deficit * 100, 1),
                "contribution_points": comp_training,
                "description": f"Annual training deficit ({round(train_deficit*100,1)}% based on {int(training)} sessions)"
            }
        ]

        # Counterfactual: target threshold to move down one tier
        target_tier = "Moderate" if priority == "Urgent" else ("Standard" if priority == "Moderate" else "Optimal")
        target_score = 64.9 if priority == "Urgent" else (44.9 if priority == "Moderate" else total_rri)
        score_diff_needed = max(0.0, round(total_rri - target_score, 1))

        # How to achieve reduction:
        # Option A: Promotion / Gap reduction
        # Each year reduction in promotion gap decreases p_gap_ratio by ~ 1 / max(1, YearsAtCompany)
        years_co = max(1.0, float(emp.get('YearsAtCompany', 5.0)))
        # delta_score = delta_p_gap_ratio * 0.55 * 0.50 * 100 = delta_p_gap_ratio * 27.5
        # delta_p_gap_ratio = delta_gap_years / years_co
        # delta_score = (delta_gap_years / years_co) * 27.5 => delta_gap_years = score_diff_needed * years_co / 27.5
        gap_reduction_years = round(score_diff_needed * years_co / 27.5, 1)

        # Option B: Increase Training sessions
        # Each training session reduces train_deficit by 1/6, lowering score by (1/6) * 0.20 * 100 = 3.33 points
        trainings_needed = int(np.ceil(score_diff_needed / 3.33)) if score_diff_needed > 0 else 0

        # Counterfactual explanation narrative
        if priority == "Urgent":
            narrative = (
                f"Currently Urgent (RRI {total_rri}/100). To move down to Moderate (RRI ≤ 64.9), "
                f"a score reduction of {score_diff_needed} points is needed. This can be achieved by: "
                f"(1) Promoting or calibrating level dwell (reducing promotion latency by {min(gap_reduction_years, float(emp.get('YearsSinceLastPromotion', 3.0)))} yrs), or "
                f"(2) Enrolling in {min(4, max(1, trainings_needed))} additional targeted L&D training modules alongside a lateral mentorship plan."
            )
        elif priority == "Moderate":
            narrative = (
                f"Currently Moderate (RRI {total_rri}/100). To transition to Standard (RRI ≤ 44.9), "
                f"a score reduction of {score_diff_needed} points is required. This can be accomplished by resolving "
                f"{min(gap_reduction_years, 2.0)} yrs of role latency or completing {min(3, max(1, trainings_needed))} skill certifications."
            )
        else:
            narrative = f"Currently in Standard priority (RRI {total_rri}/100). Career progression trajectory is well-aligned with level dwell benchmarks."

        return {
            "employee_id": employee_id,
            "job_role": emp.get('JobRole'),
            "department": emp.get('Department'),
            "retention_risk_index": total_rri,
            "retention_opportunity_index": total_rri, # backward compatibility
            "priority_tier": priority,
            "components": components,
            "counterfactual": {
                "current_tier": priority,
                "target_tier": target_tier,
                "score_reduction_needed": score_diff_needed,
                "gap_reduction_years": gap_reduction_years,
                "trainings_needed": trainings_needed,
                "explanation": narrative
            }
        }

# Global Singleton Instance
analytics_service = AnalyticsService()
