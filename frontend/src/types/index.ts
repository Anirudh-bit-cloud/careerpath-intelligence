// ── Shared clustering metrics type (used in both DatasetMetadata and CareerClustersData) ──
export interface ClusteringMetrics {
  n_clusters: number;
  // Silhouette scores across all three models
  silhouette_score_kmeans: number;
  silhouette_score_gmm?: number;
  silhouette_score_hierarchical: number;
  silhouette_score_primary?: number;
  // Davies-Bouldin indices
  davies_bouldin_kmeans?: number;
  davies_bouldin_gmm?: number;
  davies_bouldin_index?: number; // legacy field name
  // Inertia and PCA
  inertia: number;
  pca_variance_explained: number[];
  pca_total_variance_explained?: number;
  // Ensemble details
  primary_algorithm?: string;
  features_used?: string[];
  feature_importances?: Record<string, number>;
  // Isolation Forest anomaly detection
  anomaly_count?: number;
  anomaly_rate_percent?: number;
  // Elbow curve for K selection
  elbow_curve?: Array<{ k: number; inertia: number; silhouette_score: number }>;
  auto_k_selected?: boolean;
}

export interface DatasetMetadata {
  name: string;
  is_demo: boolean;
  provenance: string;
  total_records: number;
  columns: string[];
  clustering_metrics: ClusteringMetrics;
}

export interface KPIStats {
  total_employees: number;
  high_promotion_gap_cases: number;
  high_gap_percent: number;
  urgent_retention_opportunities: number;
  urgent_retention_percent: number;
  stalled_cluster_count: number;
  median_role_tenure_years: number;
  avg_trainings_last_year: number;
}

export interface InsightItem {
  type: string;
  finding: string;
  metric: string;
  comparison: string;
  implication: string;
  recommended_action: string;
}

export interface ExecutiveOverview {
  kpis: KPIStats;
  cluster_distribution: Array<{ name: string; count: number; percentage: number }>;
  promotion_gap_distribution: Array<{ category: string; count: number }>;
  department_comparison: Array<{
    Department: string;
    total: number;
    high_gap_count: number;
    high_gap_percent: number;
    avg_promotion_gap: number;
    median_role_tenure: number;
    avg_training: number;
    urgent_retention: number;
  }>;
  progression_matrix: Array<{
    TenureGroup: string;
    High: number;
    Medium: number;
    Low: number;
  }>;
  insights: InsightItem[];
}

export interface ClusterProfile {
  Cluster_ID: number;
  Name: string;
  Count: number;
  Percentage: number;
  MedianYearsAtCompany: number;
  MedianYearsInCurrentRole: number;
  MedianYearsSinceLastPromotion: number;
  MeanPromotionGapRatio: number;
  MedianTrainingLastYear: number;
  MedianJobLevel: number;
  AvgRetentionOpportunityIndex: number;
  HighPromotionGapCount: number;
  AnomalousStagnationCount?: number;
  AvgGMMConfidence?: number;
  PrimaryCharacteristics: string;
}

export interface PCAPoint {
  EmployeeID: string;
  CareerCluster: string;
  Cluster_ID: number;
  PCA1: number;
  PCA2: number;
  YearsAtCompany: number;
  YearsSinceLastPromotion: number;
  PromotionGapRatio: number;
  JobRole: string;
  Department: string;
}

export interface CareerClustersData {
  metrics: ClusteringMetrics;
  profiles: ClusterProfile[];
  pca_points: PCAPoint[];
}

export interface EmployeeRecord {
  EmployeeID: string;
  Department: string;
  JobRole: string;
  JobLevel: number;
  YearsAtCompany: number;
  YearsInCurrentRole: number;
  YearsSinceLastPromotion: number;
  TrainingTimesLastYear: number;
  PromotionGapRatio: number;
  RoleStagnationIndex: number;
  PromotionGapScore: number;
  PromotionGapCategory: string;
  CareerCluster: string;
  RecommendedCategory: string;
  RecommendedAction: string;
  RetentionRiskIndex?: number;
  RetentionOpportunityIndex?: number; // backward compatibility alias
  RetentionPriority?: string;
  RecommendationTriggers?: string;
  JobSatisfaction?: number;
  YearsWithCurrManager?: number;
}

export interface ScoreExplanationComponent {
  name: string;
  weight: number;
  value: number;
  contribution_points: number;
  description: string;
}

export interface ScoreExplanationResponse {
  employee_id: string;
  job_role: string;
  department: string;
  retention_risk_index: number;
  retention_opportunity_index?: number;
  priority_tier: string;
  components: ScoreExplanationComponent[];
  counterfactual: {
    current_tier: string;
    target_tier: string;
    score_reduction_needed: number;
    gap_reduction_years: number;
    trainings_needed: number;
    explanation: string;
  };
}

export interface PromotionGapResponse {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: EmployeeRecord[];
  role_gap_breakdown: Array<{ role: string; avg_years: number }>;
  level_distribution: Array<{ JobLevel: number; High: number; Medium: number; Low: number }>;
}

export interface RetentionOpportunitySummary {
  filtered_count: number;
  urgent_count: number;
  moderate_count: number;
  standard_count: number;
  median_promotion_gap: number;
  avg_opportunity_index: number;
  avg_tenure: number;
}

export interface RetentionOpportunityResponse {
  total_count: number;
  unfiltered_total?: number;
  page: number;
  page_size: number;
  total_pages?: number;
  summary: Record<string, number>;
  filtered_summary?: RetentionOpportunitySummary;
  filter_options?: {
    departments: string[];
    roles: string[];
    clusters: string[];
  };
  urgent_category_breakdown: Record<string, number>;
  records: EmployeeRecord[];
}

export interface ManagerInsightsResponse {
  manager_tenure_groups: Array<{
    ManagerTenureGroup: string;
    employee_count: number;
    avg_promotion_latency: number;
    avg_gap_ratio: number;
    avg_satisfaction: number;
    high_gap_cases: number;
  }>;
  department_continuity: Array<{
    Department: string;
    avg_manager_tenure: number;
    avg_role_tenure: number;
    avg_company_tenure: number;
  }>;
  disclaimer: string;
}

export interface Intervention {
  id?: number;
  employee_id: string;
  department?: string;
  job_role?: string;
  category: string;
  status: string; // New, Under Review, Planned, Completed
  priority: string; // Urgent, Moderate, Standard
  action_plan: string;
  owner: string;
  target_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
