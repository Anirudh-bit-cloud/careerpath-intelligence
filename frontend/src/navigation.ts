export interface NavigationItem {
  id: string;
  title: string;
  group: 'Overview' | 'Workforce Analytics' | 'Decisions' | 'Governance & Trust' | 'Integrations' | 'Administration';
  description: string;
  defaultTitle: string;
}

export const NAVIGATION_MAP: Record<string, NavigationItem> = {
  'overview': {
    id: 'overview',
    title: 'Workforce Overview',
    group: 'Overview',
    description: 'Executive workforce metrics, risk distributions, and retention indicators',
    defaultTitle: 'Workforce Overview'
  },
  'reports': {
    id: 'reports',
    title: 'Reports & Briefings',
    group: 'Overview',
    description: 'Executive briefing memos, retention summaries, and methodology notes',
    defaultTitle: 'Reports & Briefings'
  },
  'clusters': {
    id: 'clusters',
    title: 'Career Clusters',
    group: 'Workforce Analytics',
    description: 'Unsupervised ML trajectory archetypes and progression clusters',
    defaultTitle: 'Career Clusters'
  },
  'promotion-gap': {
    id: 'promotion-gap',
    title: 'Promotion Gap Monitor',
    group: 'Workforce Analytics',
    description: 'Stagnation latency vs. peer benchmarks, hazard models, and tenure curves',
    defaultTitle: 'Promotion Gap Monitor'
  },
  'trends': {
    id: 'trends',
    title: 'Workforce Trends',
    group: 'Workforce Analytics',
    description: 'Longitudinal Retention Risk Index, tier migration matrices, and department trajectories',
    defaultTitle: 'Workforce Trends'
  },
  'manager-insights': {
    id: 'manager-insights',
    title: 'Manager Insights',
    group: 'Workforce Analytics',
    description: 'Span of control, managerial continuity, and promotion velocity distributions',
    defaultTitle: 'Manager Insights'
  },
  'my-team': {
    id: 'my-team',
    title: 'My Team & 1-on-1s',
    group: 'Decisions',
    description: 'Direct team progression diagnostics, supportive 1-on-1 talking points, and follow-up tracking',
    defaultTitle: 'My Team & 1-on-1s'
  },
  'retention-opportunities': {
    id: 'retention-opportunities',
    title: 'Retention Opportunities',
    group: 'Decisions',
    description: 'Prioritized retention candidate interventions, flight risk, and action plans',
    defaultTitle: 'Retention Opportunities'
  },
  'succession': {
    id: 'succession',
    title: 'Succession & Bench',
    group: 'Decisions',
    description: '9-Box talent calibration matrix, critical bench depth, and SPOF detection',
    defaultTitle: 'Succession & Bench'
  },
  'committee': {
    id: 'committee',
    title: 'Talent Committee Review',
    group: 'Decisions',
    description: 'Calibrated candidate review with unconscious bias mitigation and audit trail',
    defaultTitle: 'Talent Committee Review'
  },
  'impact-estimator': {
    id: 'impact-estimator',
    title: 'Impact & ROI Estimator',
    group: 'Decisions',
    description: 'Business case scenario modeling based on transparent user-provided assumptions',
    defaultTitle: 'Impact & ROI Estimator'
  },
  'employees': {
    id: 'employees',
    title: 'Employee Explorer',
    group: 'Decisions',
    description: 'Comprehensive employee profile, SHAP-style waterfall explainability, and career history',
    defaultTitle: 'Employee Explorer'
  },
  'fairness-audit': {
    id: 'fairness-audit',
    title: 'Fairness & Bias Audit',
    group: 'Governance & Trust',
    description: 'EEOC Four-Fifths rule adverse impact ratio and algorithmic disparity audits',
    defaultTitle: 'Fairness & Bias Audit'
  },
  'trust-center': {
    id: 'trust-center',
    title: 'Trust Center & Governance',
    group: 'Governance & Trust',
    description: 'Model cards, privacy compliance, data provenance, and user data rights',
    defaultTitle: 'Trust Center & Governance'
  },
  'connectors': {
    id: 'connectors',
    title: 'Connectors & Public API',
    group: 'Integrations',
    description: 'HRIS connectors (Workday, BambooHR), webhooks, and REST API access',
    defaultTitle: 'Connectors & Public API'
  },
  'data-management': {
    id: 'data-management',
    title: 'Data Management',
    group: 'Administration',
    description: 'Dataset ingestion, column mapping, schema validation, and clustering re-runs',
    defaultTitle: 'Data Management'
  },
  'design-system': {
    id: 'design-system',
    title: 'Design System & Tokens',
    group: 'Administration',
    description: 'Living component specifications, design tokens, color ramps, and accessibility tests',
    defaultTitle: 'Design System & Tokens'
  },
  'settings': {
    id: 'settings',
    title: 'Themes & Settings',
    group: 'Administration',
    description: 'Visual theme, accent palette, density, security credentials, and preferences',
    defaultTitle: 'Themes & Settings'
  }
};
