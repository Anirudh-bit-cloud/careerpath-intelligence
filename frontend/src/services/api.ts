
import mockMetadataData from './mockMetadata.json';
import mockOverviewData from './mockOverview.json';
import mockClustersData from './mockClusters.json';
import mockPromotionGapData from './mockPromotionGap.json';
import mockRetentionData from './mockRetention.json';
import mockManagerData from './mockManager.json';
import mockFairnessData from './mockFairness.json';
import mockInterventionsData from './mockInterventions.json';
import mockEmployeesData from './mockEmployees.json';
import mockAuditLogsData from './mockAuditLogs.json';
import mockBiasSummaryData from './mockBiasSummary.json';
import mockComplianceMappingData from './mockComplianceMapping.json';


import {
  DatasetMetadata,
  ExecutiveOverview,
  CareerClustersData,
  PromotionGapResponse,
  RetentionOpportunityResponse,
  ManagerInsightsResponse,
  Intervention
} from '../types';

const RAW_API_BASE = import.meta.env.VITE_API_URL || '';
const API_BASE = RAW_API_BASE ? `${RAW_API_BASE.replace(/\/+$/, '')}/api` : '/api';

let activeMetadata: DatasetMetadata = mockMetadataData as unknown as DatasetMetadata;


export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('cp_session_token');
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cp:auth:expired', { detail: { status: 401, url } }));
    }
  } else if (res.status === 423) {
    if (typeof window !== 'undefined') {
      const clone = res.clone();
      clone.json().then(body => {
        window.dispatchEvent(new CustomEvent('cp:auth:lockout', { detail: { status: 423, detail: body.detail } }));
      }).catch(() => {
        window.dispatchEvent(new CustomEvent('cp:auth:lockout', { detail: { status: 423, detail: 'Account temporarily locked out.' } }));
      });
    }
  }
  return res;
}


export const api = {
  async getMetadata(): Promise<DatasetMetadata> {
    try {
      const res = await authFetch(`${API_BASE}/metadata`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /metadata unreachable, using embedded benchmark fallback', e);
    }
    return activeMetadata;
  },

  async getOverview(): Promise<ExecutiveOverview> {
    try {
      const res = await authFetch(`${API_BASE}/overview`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /overview unreachable, using embedded benchmark fallback', e);
    }
    return mockOverviewData as unknown as ExecutiveOverview;
  },

  async getClusters(): Promise<CareerClustersData> {
    try {
      const res = await authFetch(`${API_BASE}/clusters`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /clusters unreachable, using embedded benchmark fallback', e);
    }
    return mockClustersData as unknown as CareerClustersData;
  },

  async getElbowCurve(): Promise<{ elbow_curve: Array<{ k: number; inertia: number; silhouette_score: number }> }> {
    try {
      const res = await authFetch(`${API_BASE}/clusters/elbow-curve`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /clusters/elbow-curve unreachable, using fallback', e);
    }
    return {
      elbow_curve: (mockMetadataData as any).clustering_metrics?.elbow_curve || []
    };
  },

  async recluster(params: { n_clusters?: number; auto_select_k?: boolean; algorithm?: string } = {}): Promise<any> {
    const res = await authFetch(`${API_BASE}/rerun-clustering`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).detail || 'Reclustering failed');
    }
    return res.json();
  },

  async getPromotionGap(params: Record<string, any> = {}): Promise<PromotionGapResponse> {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          query.append(k, String(v));
        }
      });
      const res = await authFetch(`${API_BASE}/promotion-gap?${query.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /promotion-gap unreachable, using embedded benchmark fallback', e);
    }
    return mockPromotionGapData as unknown as PromotionGapResponse;
  },

  async getRetentionOpportunities(params: Record<string, any> = {}): Promise<RetentionOpportunityResponse> {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          query.append(k, String(v));
        }
      });
      const res = await authFetch(`${API_BASE}/retention-opportunities?${query.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /retention-opportunities unreachable, using embedded benchmark fallback', e);
    }
    return mockRetentionData as unknown as RetentionOpportunityResponse;
  },

  async getManagerInsights(): Promise<ManagerInsightsResponse> {
    try {
      const res = await authFetch(`${API_BASE}/manager-insights`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /manager-insights unreachable, using embedded benchmark fallback', e);
    }
    return mockManagerData as unknown as ManagerInsightsResponse;
  },

  async getEmployeeProfile(employeeId: string): Promise<any> {
    try {
      const res = await authFetch(`${API_BASE}/employees/${employeeId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`API /employees/${employeeId} unreachable, using fallback`, e);
    }
    const foundInGap = (mockPromotionGapData as any).records?.find((r: any) => r.EmployeeID === employeeId);
    if (foundInGap) return foundInGap;
    const foundInRet = (mockRetentionData as any).records?.find((r: any) => r.EmployeeID === employeeId);
    if (foundInRet) return foundInRet;
    const foundInEmp = (mockEmployeesData as any[])?.find((r: any) => r.EmployeeID === employeeId);
    if (foundInEmp) return foundInEmp;
    return (mockPromotionGapData as any).records?.[0] || {};
  },

  async getScoreExplanation(employeeId: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/employees/${employeeId}/score-explanation`);
    if (!res.ok) throw new Error(`Failed to fetch score explanation for ${employeeId}`);
    return res.json();
  },

  async getEmployeeMlExplanation(employeeId: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/employees/${employeeId}/ml-explanation`);
    if (!res.ok) throw new Error(`Failed to fetch ML explanation for ${employeeId}`);
    return res.json();
  },

  async searchEmployees(query: string = ''): Promise<any[]> {
    try {
      const res = await authFetch(`${API_BASE}/employees?query=${encodeURIComponent(query)}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /employees unreachable, using embedded fallback', e);
    }
    const list = (mockEmployeesData as any[]) || [];
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((emp: any) =>
      (emp.EmployeeID && emp.EmployeeID.toLowerCase().includes(q)) ||
      (emp.JobRole && emp.JobRole.toLowerCase().includes(q)) ||
      (emp.Department && emp.Department.toLowerCase().includes(q))
    );
  },

  // Interventions Workflow
  async getInterventions(statusFilter: string = 'All'): Promise<Intervention[]> {
    try {
      const query = statusFilter !== 'All' ? `?status_filter=${statusFilter}` : '';
      const res = await authFetch(`${API_BASE}/interventions${query}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /interventions unreachable, using embedded fallback', e);
    }
    const all = (mockInterventionsData as unknown as Intervention[]) || [];
    if (statusFilter === 'All') return all;
    return all.filter((item: any) => item.status === statusFilter);
  },

  async createIntervention(data: Intervention): Promise<Intervention> {
    const res = await authFetch(`${API_BASE}/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create intervention');
    return res.json();
  },

  async updateIntervention(id: number, data: Partial<Intervention>): Promise<Intervention> {
    const res = await authFetch(`${API_BASE}/interventions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update intervention');
    return res.json();
  },

  async deleteIntervention(id: number): Promise<void> {
    const res = await authFetch(`${API_BASE}/interventions/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete intervention');
  },

  // Dataset Management
  async uploadDataset(file: File): Promise<{
    message: string;
    filename: string;
    records: number;
    columns: string[];
    derived_columns: string[];
    clustering_metrics: Record<string, any>;
    metadata: DatasetMetadata;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch(`${API_BASE}/dataset/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).detail || 'Upload failed');
    }
    return res.json();
  },

  async resetToDemo(): Promise<any> {
    const res = await authFetch(`${API_BASE}/dataset/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset dataset');
    return res.json();
  },

  async getDataQuality(): Promise<any> {
    const res = await authFetch(`${API_BASE}/dataset/data-quality`);
    if (!res.ok) throw new Error('Failed to fetch data quality report');
    return res.json();
  },

  async simulateCareer(payload: {
    employee_id: string;
    promote_now?: boolean;
    lateral_move?: boolean;
    add_trainings?: number;
  }): Promise<any> {
    const res = await authFetch(`${API_BASE}/simulate-career`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to simulate career scenario');
    return res.json();
  },

  // ── Authentication & RBAC ───────────────────────────────────────────
  async login(email: string, role: string = 'admin'): Promise<{ user: any; token: string }> {
    const res = await authFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async getProfile(): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to get user profile');
    return res.json();
  },

  async listUsers(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to list users');
    return res.json();
  },

  // ── Multi-Tenant Workspaces ─────────────────────────────────────────
  async listWorkspaces(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/workspaces`);
    if (!res.ok) throw new Error('Failed to list workspaces');
    return res.json();
  },

  async updateWorkspaceBranding(workspaceId: string, branding: {
    org_name?: string;
    primary_color?: string;
    logo_svg_url?: string;
    custom_domain?: string;
  }): Promise<any> {
    const res = await authFetch(`${API_BASE}/workspaces/${workspaceId}/branding`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding)
    });
    if (!res.ok) throw new Error('Failed to update workspace branding');
    return res.json();
  },

  // ── Industry Dataset Presets ────────────────────────────────────────
  async switchIndustryPreset(industry: 'cyber' | 'healthcare' | 'finance'): Promise<{
    message: string;
    industry: string;
    records: number;
    metadata: DatasetMetadata;
  }> {
    const res = await authFetch(`${API_BASE}/dataset/preset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to switch industry preset');
    }
    return res.json();
  },

  // ── Scoring Policy Engine & Tier Simulator ──────────────────────────
  async getActivePolicy(): Promise<any> {
    const res = await authFetch(`${API_BASE}/policy`);
    if (!res.ok) throw new Error('Failed to fetch active policy');
    return res.json();
  },

  async previewPolicyImpact(weights: {
    weights: {
      gap_weight: number;
      cluster_risk_weight: number;
      satisfaction_inv_weight: number;
      tenure_weight: number;
      training_deficit_weight: number;
    };
    thresholds?: Record<string, number>;
  }): Promise<{
    total_evaluated: number;
    tier_distribution: Record<string, number>;
    tier_movement: {
      promoted_to_urgent: number;
      dropped_from_urgent: number;
      unchanged: number;
    };
  }> {
    const res = await authFetch(`${API_BASE}/policy/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights)
    });
    if (!res.ok) throw new Error('Failed to preview policy impact');
    return res.json();
  },

  async updatePolicy(policyData: any): Promise<any> {
    const res = await authFetch(`${API_BASE}/policy/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyData)
    });
    if (!res.ok) throw new Error('Failed to update scoring policy');
    return res.json();
  },

  async getPolicyHistory(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/policy/history`);
    if (!res.ok) throw new Error('Failed to fetch policy history');
    return res.json();
  },

  async getPolicySensitivity(): Promise<any> {
    const res = await authFetch(`${API_BASE}/policy/sensitivity`);
    if (!res.ok) throw new Error('Failed to fetch policy sensitivity');
    return res.json();
  },

  // ── Talent Committee Review Mode ────────────────────────────────────
  async listCommitteeSessions(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/committee/sessions`);
    if (!res.ok) throw new Error('Failed to list committee sessions');
    return res.json();
  },

  async createCommitteeSession(title: string, scheduledDate?: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/committee/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, scheduled_date: scheduledDate })
    });
    if (!res.ok) throw new Error('Failed to create committee session');
    return res.json();
  },

  async logCommitteeDecision(sessionId: number, decision: {
    employee_id: string;
    intervention_id?: number;
    decision: 'approved' | 'rejected' | 'deferred';
    notes?: string;
    decided_by?: string;
  }): Promise<any> {
    const res = await authFetch(`${API_BASE}/committee/sessions/${sessionId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decision)
    });
    if (!res.ok) throw new Error('Failed to log committee decision');
    return res.json();
  },

  async updateCommitteeMinutes(sessionId: number, minutes: string, status?: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/committee/sessions/${sessionId}/minutes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes, status })
    });
    if (!res.ok) throw new Error('Failed to update committee minutes');
    return res.json();
  },

  async getPlanComments(planId: number): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/committee/plans/${planId}/comments`);
    if (!res.ok) throw new Error('Failed to get plan comments');
    return res.json();
  },

  async addPlanComment(planId: number, authorEmail: string, authorName: string, commentText: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/committee/plans/${planId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author_email: authorEmail,
        author_name: authorName,
        comment_text: commentText
      })
    });
    if (!res.ok) throw new Error('Failed to add plan comment');
    return res.json();
  },

  // ── Pilot Lead Submissions & Inquiries ──────────────────────────────
  async submitPilotLead(lead: {
    full_name: string;
    work_email: string;
    company_name: string;
    company_size?: string;
    primary_interest?: string;
    notes?: string;
  }): Promise<any> {
    const res = await authFetch(`${API_BASE}/pilot/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
    if (!res.ok) throw new Error('Failed to submit pilot lead');
    return res.json();
  },

  async listPilotLeads(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/pilot/leads`);
    if (!res.ok) throw new Error('Failed to list pilot leads');
    return res.json();
  },

  // ── HRIS Connectors & Integration Adapter ──────────────────────────
  async getConnectorsStatus(): Promise<any> {
    const res = await authFetch(`${API_BASE}/connectors/status`);
    if (!res.ok) throw new Error('Failed to fetch connectors status');
    return res.json();
  },

  async testMockHris(syncCount: number = 25): Promise<any> {
    const res = await authFetch(`${API_BASE}/connectors/test-hris?sync_count=${syncCount}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('HRIS adapter test failed');
    return res.json();
  },

  // ── Public API Keys & Webhooks ──────────────────────────────────────
  async listApiKeys(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/keys`);
    if (!res.ok) throw new Error('Failed to list API keys');
    return res.json();
  },

  async createApiKey(name: string, role: string = 'hr_analyst'): Promise<any> {
    const res = await authFetch(`${API_BASE}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role })
    });
    if (!res.ok) throw new Error('Failed to generate API key');
    return res.json();
  },

  async revokeApiKey(keyId: number): Promise<void> {
    const res = await authFetch(`${API_BASE}/keys/${keyId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to revoke API key');
  },

  async listWebhooks(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/webhooks`);
    if (!res.ok) throw new Error('Failed to list webhooks');
    return res.json();
  },

  async createWebhook(endpointUrl: string, secretToken: string, subscribedEvents: string[]): Promise<any> {
    const res = await authFetch(`${API_BASE}/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint_url: endpointUrl,
        secret_token: secretToken,
        subscribed_events: subscribedEvents
      })
    });
    if (!res.ok) throw new Error('Failed to create webhook');
    return res.json();
  },

  async testWebhook(endpointId: number, testPayload?: any): Promise<any> {
    const res = await authFetch(`${API_BASE}/webhooks/test?endpoint_id=${endpointId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload || { test: true })
    });
    if (!res.ok) throw new Error('Webhook dispatch test failed');
    return res.json();
  },

  // ── Security, Audit Logs & Privacy Compliance ───────────────────────
  async getAuditLogs(limit: number = 50): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/governance/audit-logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async previewRetention(retentionDays: number = 365): Promise<any> {
    const res = await authFetch(`${API_BASE}/governance/retention-preview?retention_days=${retentionDays}`);
    if (!res.ok) throw new Error('Failed to preview retention cleanup');
    return res.json();
  },

  async exportDataSubject(employeeId: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/governance/data-subject-export?employee_id=${encodeURIComponent(employeeId)}`);
    if (!res.ok) throw new Error(`Failed to export data subject ${employeeId}`);
    return res.json();
  },

  // ── Fairness & Algorithmic Bias Audit ──────────────────────────────
  async getFairnessSummary(): Promise<any> {
    try {
      const token = localStorage.getItem('cp_session_token');
      const res = await authFetch(`${API_BASE}/fairness/summary`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /fairness/summary unreachable, using embedded fallback', e);
    }
    return mockFairnessData;
  },

  async getFairnessAttribute(attributeName: string): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/fairness/attribute/${attributeName}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error(`Failed to fetch fairness data for ${attributeName}`);
    return res.json();
  },

  async getIntersectionalFairness(minSampleSize: number = 10): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/fairness/intersectional?min_sample_size=${minSampleSize}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch intersectional fairness audit');
    return res.json();
  },

  async getLongitudinalFairness(): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/fairness/longitudinal`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch longitudinal fairness drift');
    return res.json();
  },

  async submitBiasSignoff(data: {
    review_type: string;
    target_id: string;
    decision: string;
    reviewer_notes: string;
    acknowledged_flags?: number;
  }): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/fairness/signoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit bias sign-off');
    }
    return res.json();
  },

  async listBiasSignoffs(limit: number = 20): Promise<any[]> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/fairness/signoffs?limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch bias review sign-offs');
    return res.json();
  },

  // ── Model Validation & Survival Analysis ───────────────────────────
  async getValidationOverview(): Promise<any> {
    const res = await authFetch(`${API_BASE}/validation/metrics`);
    if (!res.ok) throw new Error('Failed to fetch validation telemetry');
    return res.json();
  },

  async getSurvivalCurves(): Promise<any> {
    const res = await authFetch(`${API_BASE}/validation/survival-curves`);
    if (!res.ok) throw new Error('Failed to fetch survival curves');
    return res.json();
  },

  async getCoxRegression(): Promise<any> {
    const res = await authFetch(`${API_BASE}/validation/cox-regression`);
    if (!res.ok) throw new Error('Failed to fetch Cox regression');
    return res.json();
  },

  async getCalibrationPlot(nBins: number = 10): Promise<any> {
    const res = await authFetch(`${API_BASE}/validation/calibration-plot?n_bins=${nBins}`);
    if (!res.ok) throw new Error('Failed to fetch calibration plot');
    return res.json();
  },

  async getMlImportance(): Promise<any> {
    const res = await authFetch(`${API_BASE}/validation/ml-importance`);
    if (!res.ok) throw new Error('Failed to fetch ML feature importance');
    return res.json();
  },

  async getBacktest(trainFraction: number = 0.75): Promise<any> {
    const res = await authFetch(`${API_BASE}/validation/backtest?train_fraction=${trainFraction}`);
    if (!res.ok) throw new Error('Failed to run backtest');
    return res.json();
  },

  // ── Succession Planning & Outcome Tracking ─────────────────────────
  async getNineBoxGrid(): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/succession/9-box`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch 9-box talent grid');
    return res.json();
  },

  async getCriticalRoles(): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/succession/critical-roles`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch critical roles');
    return res.json();
  },

  async getInterventionEffectiveness(): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/succession/effectiveness`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch intervention effectiveness');
    return res.json();
  },

  async updateInterventionOutcome(interventionId: number, payload: {
    outcome_status: string;
    retained_at_90_days?: boolean;
    succession_readiness?: string;
    notes?: string;
  }): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/succession/outcomes/${interventionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record intervention outcome');
    return res.json();
  },

  // ── Proactive Notification Channels ───────────────────────────────
  async getNotificationPreferences(): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/notifications/preferences`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch notification preferences');
    return res.json();
  },

  async updateNotificationPreferences(payload: any): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/notifications/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update notification preferences');
    }
    return res.json();
  },

  async testNotificationChannel(channel: 'email' | 'slack', target: string, message?: string): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ channel, target, message })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to dispatch test notification');
    }
    return res.json();
  },

  async getNotificationDeliveries(limit: number = 20): Promise<any[]> {
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/notifications/deliveries?limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to fetch notification deliveries');
    return res.json();
  },

  // ── Multi-Factor Authentication & Profile ───────────────────────────
  async setupMFA(): Promise<{ secret: string; otpauth_uri: string; recovery_codes: string[]; message: string }> {
    const res = await authFetch(`${API_BASE}/auth/mfa/setup`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to initiate MFA setup');
    }
    return res.json();
  },

  async verifyMFAEnrollment(totp_code: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/auth/mfa/verify-enrollment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totp_code })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to verify MFA enrollment code');
    }
    return res.json();
  },

  async disableMFA(): Promise<any> {
    const res = await authFetch(`${API_BASE}/auth/mfa/disable`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to disable MFA');
    }
    return res.json();
  },

  // ── Historical Snapshots & Workforce Trends (Phase 3) ───────────────
  async getTrendsOverview(range: string = '12m'): Promise<any> {
    const res = await authFetch(`${API_BASE}/trends/overview?range=${range}`);
    if (!res.ok) throw new Error('Failed to fetch workforce trends overview');
    return res.json();
  },

  async getTrendsDepartments(): Promise<any> {
    const res = await authFetch(`${API_BASE}/trends/departments`);
    if (!res.ok) throw new Error('Failed to fetch department trends');
    return res.json();
  },

  async getTrendsEmployee(employeeId: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/trends/employee/${encodeURIComponent(employeeId)}`);
    if (!res.ok) throw new Error(`Failed to fetch trends for employee ${employeeId}`);
    return res.json();
  },

  async getTierMovement(fromDate: string, toDate: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/trends/tier-movement?from_date=${fromDate}&to_date=${toDate}`);
    if (!res.ok) throw new Error('Failed to fetch tier movement matrix');
    return res.json();
  },

  async getSnapshotDates(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/snapshots/dates`);
    if (!res.ok) throw new Error('Failed to fetch snapshot dates');
    return res.json();
  },

  async getAsOfSnapshots(asOfDate: string, priority: string = 'All'): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/snapshots/as-of?as_of_date=${asOfDate}&priority=${priority}`);
    if (!res.ok) throw new Error(`Failed to fetch as-of snapshot records for ${asOfDate}`);
    return res.json();
  },

  async createSnapshot(snapshotDate?: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot_date: snapshotDate })
    });
    if (!res.ok) throw new Error('Failed to trigger workforce snapshot');
    return res.json();
  },

  async seedDemoSnapshots(): Promise<any> {
    const res = await authFetch(`${API_BASE}/snapshots/seed-demo`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to seed historical snapshots');
    return res.json();
  },

  // ── Role-Based Manager Experience & Follow-ups ──────────────────────
  async getMyTeam(managerId?: string): Promise<any> {
    const url = managerId ? `${API_BASE}/manager/my-team?manager_id=${encodeURIComponent(managerId)}` : `${API_BASE}/manager/my-team`;
    const res = await authFetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch manager team data');
    }
    return res.json();
  },

  async recordManagerAcknowledgement(statement?: string): Promise<any> {
    const res = await authFetch(`${API_BASE}/manager/acknowledgement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acknowledged: true,
        statement: statement || 'I understand these indicators are meant to support employee growth and retention, not to evaluate performance or justify discipline.'
      })
    });
    if (!res.ok) throw new Error('Failed to record diagnostic acknowledgement');
    return res.json();
  },

  async listFollowUps(): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/manager/follow-ups`);
    if (!res.ok) throw new Error('Failed to list 1-on-1 follow-ups');
    return res.json();
  },

  async createFollowUp(data: {
    employee_id: string;
    planned_date: string;
    topic: string;
    talking_points_discussed?: string;
    notes?: string;
    create_hr_intervention?: boolean;
  }): Promise<any> {
    const res = await authFetch(`${API_BASE}/manager/follow-ups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create follow-up');
    }
    return res.json();
  },

  async updateFollowUp(id: number, data: {
    status?: string;
    notes?: string;
    talking_points_discussed?: string;
  }): Promise<any> {
    const res = await authFetch(`${API_BASE}/manager/follow-ups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update follow-up');
    }
    return res.json();
  },

  // ── Model Registry & Drift Governance ────────────────────────────────
  async listModels(modelType?: string): Promise<any[]> {
    const url = modelType ? `${API_BASE}/models?model_type=${modelType}` : `${API_BASE}/models`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch registered models');
    return res.json();
  },

  async getModel(id: number): Promise<any> {
    const res = await authFetch(`${API_BASE}/models/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch model version ${id}`);
    return res.json();
  },

  async promoteModel(id: number): Promise<any> {
    const res = await authFetch(`${API_BASE}/models/${id}/promote`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to promote model');
    }
    return res.json();
  },

  async rollbackModel(id: number): Promise<any> {
    const res = await authFetch(`${API_BASE}/models/${id}/rollback`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to rollback model');
    }
    return res.json();
  },

  async getModelDrift(id: number): Promise<any> {
    const res = await authFetch(`${API_BASE}/models/${id}/drift`);
    if (!res.ok) throw new Error(`Failed to compute drift for model ${id}`);
    return res.json();
  },

  // ── Temporal Backtesting & Historical Exits (Phase 2) ───────────────
  async getTemporalBacktest(horizonMonths: number = 6): Promise<any> {
    const res = await authFetch(`${API_BASE}/validation/temporal-backtest?horizon_months=${horizonMonths}`);
    if (!res.ok) throw new Error('Failed to fetch temporal backtest telemetry');
    return res.json();
  },

  async uploadHistoricalExits(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('cp_session_token');
    const res = await authFetch(`${API_BASE}/dataset/upload-exits`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Historical exits upload failed');
    }
    return res.json();
  },

  // ── Compliance & Regulatory Mapping (Phase 4) ──────────────────────────────
  async getComplianceMapping(regulation?: string, statusFilter?: string): Promise<any> {
    const params = new URLSearchParams();
    if (regulation) params.set('regulation', regulation);
    if (statusFilter) params.set('status', statusFilter);
    const url = params.toString() ? `${API_BASE}/compliance/mapping?${params}` : `${API_BASE}/compliance/mapping`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch compliance mapping');
    return res.json();
  },

  async getBiasAuditSummary(): Promise<any> {
    const res = await authFetch(`${API_BASE}/compliance/bias-audit-summary`);
    if (!res.ok) throw new Error('Failed to fetch bias audit summary');
    return res.json();
  },

  downloadComplianceMappingCsv(): string {
    return `${API_BASE}/compliance/mapping/export/csv`;
  },

  downloadBiasAuditCsv(): string {
    return `${API_BASE}/compliance/bias-audit-summary/export/csv`;
  },

  downloadModelCard(): string {
    return `${API_BASE}/compliance/model-card`;
  },

  downloadDpiaTemplate(): string {
    return `${API_BASE}/compliance/dpia-template`;
  },

  downloadComplianceMappingDoc(): string {
    return `${API_BASE}/compliance/compliance-mapping-doc`;
  },

  // ── SSO, SCIM 2.0 & BambooHR Connector (Phase 5) ──────────────────────────
  async getOIDCConfig(workspaceId: string = 'default'): Promise<any> {
    const res = await authFetch(`${API_BASE}/sso/config?workspace_id=${workspaceId}`);
    if (!res.ok) throw new Error('Failed to fetch OIDC configuration');
    return res.json();
  },

  async updateOIDCConfig(data: any, workspaceId: string = 'default'): Promise<any> {
    const res = await authFetch(`${API_BASE}/sso/config?workspace_id=${workspaceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update OIDC configuration');
    }
    return res.json();
  },

  async getOIDCAuthorizeUrl(redirectUri: string, workspaceId: string = 'default'): Promise<any> {
    const res = await authFetch(`${API_BASE}/sso/authorize-url?workspace_id=${workspaceId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
    if (!res.ok) throw new Error('Failed to get OIDC authorize URL');
    return res.json();
  },

  async handleOIDCCallback(payload: { code: string; state: string; code_verifier?: string; workspace_id?: string }): Promise<any> {
    const res = await authFetch(`${API_BASE}/sso/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'OIDC callback failed');
    }
    return res.json();
  },

  async listSCIMTokens(workspaceId: string = 'default'): Promise<any[]> {
    const res = await authFetch(`/scim/v2/tokens?workspace_id=${workspaceId}`);
    if (!res.ok) throw new Error('Failed to list SCIM tokens');
    return res.json();
  },

  async generateSCIMToken(label: string, workspaceId: string = 'default'): Promise<any> {
    const res = await authFetch(`/scim/v2/tokens/generate?workspace_id=${workspaceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate SCIM token');
    }
    return res.json();
  },

  async revokeSCIMToken(tokenId: number, workspaceId: string = 'default'): Promise<any> {
    const res = await authFetch(`/scim/v2/tokens/${tokenId}?workspace_id=${workspaceId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to revoke SCIM token');
    return res.json();
  },

  async getBambooHRConfig(workspaceId: string = 'default'): Promise<any> {
    const res = await authFetch(`${API_BASE}/connectors/bamboohr/config?workspace_id=${workspaceId}`);
    if (!res.ok) throw new Error('Failed to fetch BambooHR config');
    return res.json();
  },

  async saveBambooHRConfig(data: any, workspaceId: string = 'default'): Promise<any> {
    const res = await authFetch(`${API_BASE}/connectors/bamboohr/config?workspace_id=${workspaceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save BambooHR config');
    }
    return res.json();
  },

  async dryRunBambooHR(data: { subdomain: string; api_key?: string; field_mapping?: any }): Promise<any> {
    const res = await authFetch(`${API_BASE}/connectors/bamboohr/dry-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'BambooHR dry-run failed');
    }
    return res.json();
  },

  async syncBambooHR(workspaceId: string = 'default'): Promise<any> {
    const res = await authFetch(`${API_BASE}/connectors/bamboohr/sync?workspace_id=${workspaceId}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'BambooHR sync failed');
    }
    return res.json();
  },

  async getHRISSyncLogs(workspaceId: string = 'default', limit: number = 10): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/connectors/sync-logs?workspace_id=${workspaceId}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch HRIS sync logs');
    return res.json();
  }
};
