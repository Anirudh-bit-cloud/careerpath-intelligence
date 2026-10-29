import {
  DatasetMetadata,
  ExecutiveOverview,
  CareerClustersData,
  PromotionGapResponse,
  RetentionOpportunityResponse,
  ManagerInsightsResponse,
  Intervention
} from '../types';

const API_BASE = '/api';

export const api = {
  async getMetadata(): Promise<DatasetMetadata> {
    const res = await fetch(`${API_BASE}/metadata`);
    if (!res.ok) throw new Error('Failed to fetch dataset metadata');
    return res.json();
  },

  async getOverview(): Promise<ExecutiveOverview> {
    const res = await fetch(`${API_BASE}/overview`);
    if (!res.ok) throw new Error('Failed to fetch executive overview');
    return res.json();
  },

  async getClusters(): Promise<CareerClustersData> {
    const res = await fetch(`${API_BASE}/clusters`);
    if (!res.ok) throw new Error('Failed to fetch career clusters');
    return res.json();
  },

  async getElbowCurve(): Promise<{ elbow_curve: Array<{ k: number; inertia: number; silhouette_score: number }> }> {
    const res = await fetch(`${API_BASE}/clusters/elbow-curve`);
    if (!res.ok) throw new Error('Failed to fetch elbow curve');
    return res.json();
  },

  async recluster(params: { n_clusters?: number; auto_select_k?: boolean; algorithm?: string } = {}): Promise<any> {
    const res = await fetch(`${API_BASE}/rerun-clustering`, {
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
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        query.append(k, String(v));
      }
    });
    const res = await fetch(`${API_BASE}/promotion-gap?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch promotion gap records');
    return res.json();
  },

  async getRetentionOpportunities(params: Record<string, any> = {}): Promise<RetentionOpportunityResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        query.append(k, String(v));
      }
    });
    const res = await fetch(`${API_BASE}/retention-opportunities?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch retention opportunities');
    return res.json();
  },

  async getManagerInsights(): Promise<ManagerInsightsResponse> {
    const res = await fetch(`${API_BASE}/manager-insights`);
    if (!res.ok) throw new Error('Failed to fetch manager insights');
    return res.json();
  },

  async getEmployeeProfile(employeeId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/employees/${employeeId}`);
    if (!res.ok) throw new Error(`Failed to fetch profile for ${employeeId}`);
    return res.json();
  },

  async getScoreExplanation(employeeId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/employees/${employeeId}/score-explanation`);
    if (!res.ok) throw new Error(`Failed to fetch score explanation for ${employeeId}`);
    return res.json();
  },

  async searchEmployees(query: string = ''): Promise<any[]> {
    const res = await fetch(`${API_BASE}/employees?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search employees');
    return res.json();
  },

  // Interventions Workflow
  async getInterventions(statusFilter: string = 'All'): Promise<Intervention[]> {
    const query = statusFilter !== 'All' ? `?status_filter=${statusFilter}` : '';
    const res = await fetch(`${API_BASE}/interventions${query}`);
    if (!res.ok) throw new Error('Failed to fetch interventions');
    return res.json();
  },

  async createIntervention(data: Intervention): Promise<Intervention> {
    const res = await fetch(`${API_BASE}/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create intervention');
    return res.json();
  },

  async updateIntervention(id: number, data: Partial<Intervention>): Promise<Intervention> {
    const res = await fetch(`${API_BASE}/interventions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update intervention');
    return res.json();
  },

  async deleteIntervention(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/interventions/${id}`, {
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
    const res = await fetch(`${API_BASE}/dataset/upload`, {
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
    const res = await fetch(`${API_BASE}/dataset/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset dataset');
    return res.json();
  },

  async getDataQuality(): Promise<any> {
    const res = await fetch(`${API_BASE}/dataset/data-quality`);
    if (!res.ok) throw new Error('Failed to fetch data quality report');
    return res.json();
  },

  async simulateCareer(payload: {
    employee_id: string;
    promote_now?: boolean;
    lateral_move?: boolean;
    add_trainings?: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/simulate-career`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to simulate career scenario');
    return res.json();
  },

  // ── Authentication & RBAC ───────────────────────────────────────────
  async login(email: string, role: string = 'admin'): Promise<{ user: any; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
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
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to get user profile');
    return res.json();
  },

  async listUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to list users');
    return res.json();
  },

  // ── Multi-Tenant Workspaces ─────────────────────────────────────────
  async listWorkspaces(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/workspaces`);
    if (!res.ok) throw new Error('Failed to list workspaces');
    return res.json();
  },

  async updateWorkspaceBranding(workspaceId: string, branding: {
    org_name?: string;
    primary_color?: string;
    logo_svg_url?: string;
    custom_domain?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/branding`, {
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
    const res = await fetch(`${API_BASE}/dataset/preset`, {
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
    const res = await fetch(`${API_BASE}/policy`);
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
    const res = await fetch(`${API_BASE}/policy/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights)
    });
    if (!res.ok) throw new Error('Failed to preview policy impact');
    return res.json();
  },

  async updatePolicy(policyData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/policy/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyData)
    });
    if (!res.ok) throw new Error('Failed to update scoring policy');
    return res.json();
  },

  async getPolicyHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/policy/history`);
    if (!res.ok) throw new Error('Failed to fetch policy history');
    return res.json();
  },

  // ── Talent Committee Review Mode ────────────────────────────────────
  async listCommitteeSessions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/committee/sessions`);
    if (!res.ok) throw new Error('Failed to list committee sessions');
    return res.json();
  },

  async createCommitteeSession(title: string, scheduledDate?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/committee/sessions`, {
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
    const res = await fetch(`${API_BASE}/committee/sessions/${sessionId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decision)
    });
    if (!res.ok) throw new Error('Failed to log committee decision');
    return res.json();
  },

  async updateCommitteeMinutes(sessionId: number, minutes: string, status?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/committee/sessions/${sessionId}/minutes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes, status })
    });
    if (!res.ok) throw new Error('Failed to update committee minutes');
    return res.json();
  },

  async getPlanComments(planId: number): Promise<any[]> {
    const res = await fetch(`${API_BASE}/committee/plans/${planId}/comments`);
    if (!res.ok) throw new Error('Failed to get plan comments');
    return res.json();
  },

  async addPlanComment(planId: number, authorEmail: string, authorName: string, commentText: string): Promise<any> {
    const res = await fetch(`${API_BASE}/committee/plans/${planId}/comments`, {
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
    const res = await fetch(`${API_BASE}/pilot/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
    if (!res.ok) throw new Error('Failed to submit pilot lead');
    return res.json();
  },

  async listPilotLeads(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/pilot/leads`);
    if (!res.ok) throw new Error('Failed to list pilot leads');
    return res.json();
  },

  // ── HRIS Connectors & Integration Adapter ──────────────────────────
  async getConnectorsStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/connectors/status`);
    if (!res.ok) throw new Error('Failed to fetch connectors status');
    return res.json();
  },

  async testMockHris(syncCount: number = 25): Promise<any> {
    const res = await fetch(`${API_BASE}/connectors/test-hris?sync_count=${syncCount}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('HRIS adapter test failed');
    return res.json();
  },

  // ── Public API Keys & Webhooks ──────────────────────────────────────
  async listApiKeys(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/keys`);
    if (!res.ok) throw new Error('Failed to list API keys');
    return res.json();
  },

  async createApiKey(name: string, role: string = 'hr_analyst'): Promise<any> {
    const res = await fetch(`${API_BASE}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role })
    });
    if (!res.ok) throw new Error('Failed to generate API key');
    return res.json();
  },

  async revokeApiKey(keyId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/keys/${keyId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to revoke API key');
  },

  async listWebhooks(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/webhooks`);
    if (!res.ok) throw new Error('Failed to list webhooks');
    return res.json();
  },

  async createWebhook(endpointUrl: string, secretToken: string, subscribedEvents: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/webhooks`, {
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
    const res = await fetch(`${API_BASE}/webhooks/test?endpoint_id=${endpointId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload || { test: true })
    });
    if (!res.ok) throw new Error('Webhook dispatch test failed');
    return res.json();
  },

  // ── Security, Audit Logs & Privacy Compliance ───────────────────────
  async getAuditLogs(limit: number = 50): Promise<any[]> {
    const res = await fetch(`${API_BASE}/governance/audit-logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async previewRetention(retentionDays: number = 365): Promise<any> {
    const res = await fetch(`${API_BASE}/governance/retention-preview?retention_days=${retentionDays}`);
    if (!res.ok) throw new Error('Failed to preview retention cleanup');
    return res.json();
  },

  async exportDataSubject(employeeId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/governance/data-subject-export?employee_id=${encodeURIComponent(employeeId)}`);
    if (!res.ok) throw new Error(`Failed to export data subject ${employeeId}`);
    return res.json();
  },

  // ── Fairness & Algorithmic Bias Audit ──────────────────────────────
  async getFairnessSummary(): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await fetch(`${API_BASE}/fairness/summary`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch fairness audit summary');
    }
    return res.json();
  },

  async getFairnessAttribute(attributeName: string): Promise<any> {
    const token = localStorage.getItem('cp_session_token');
    const res = await fetch(`${API_BASE}/fairness/attribute/${attributeName}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error(`Failed to fetch fairness data for ${attributeName}`);
    return res.json();
  }
};
