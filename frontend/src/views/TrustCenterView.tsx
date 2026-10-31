import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  FileText,
  UserCheck,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Key,
  Scale,
  ExternalLink,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

type TabId = 'security' | 'compliance' | 'dsar';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  supported: {
    label: 'Supported',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  partially_supported: {
    label: 'Partial',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  customer_responsibility: {
    label: 'Customer',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    icon: <UserCheck className="w-3 h-3" />,
  },
};

export const TrustCenterView: React.FC = () => {
  const { toast } = useToast();
  const addToast = (msg: string, type: 'success' | 'error' = 'success') =>
    type === 'error' ? toast.error(msg) : toast.success(msg);

  const [activeTab, setActiveTab] = useState<TabId>('security');

  // Security tab state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchLog, setSearchLog] = useState<string>('');

  // GDPR DSAR state
  const [dsarEmpId, setDsarEmpId] = useState<string>('');
  const [exportingDsar, setExportingDsar] = useState<boolean>(false);
  const [dsarResult, setDsarResult] = useState<any | null>(null);

  // Retention Preview
  const [retentionDays, setRetentionDays] = useState<number>(365);
  const [retentionPreview, setRetentionPreview] = useState<any | null>(null);

  // Compliance tab state
  const [complianceData, setComplianceData] = useState<any | null>(null);
  const [complianceLoading, setComplianceLoading] = useState<boolean>(false);
  const [complianceFilter, setComplianceFilter] = useState<string>('');
  const [regulationFilter, setRegulationFilter] = useState<string>('');
  const [biasAuditSummary, setBiasAuditSummary] = useState<any | null>(null);
  const [biasAuditLoading, setBiasAuditLoading] = useState<boolean>(false);

  useEffect(() => {
    loadAuditLogs();
    loadRetentionPreview();
  }, []);

  useEffect(() => {
    if (activeTab === 'compliance' && !complianceData) {
      loadComplianceData();
    }
  }, [activeTab]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const logs = await api.getAuditLogs(50);
      setAuditLogs(logs);
    } catch (e: any) {
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRetentionPreview = async () => {
    try {
      const prev = await api.previewRetention(retentionDays);
      setRetentionPreview(prev);
    } catch (e: any) {
      console.error(e);
    }
  };

  const loadComplianceData = async () => {
    setComplianceLoading(true);
    try {
      const data = await api.getComplianceMapping();
      setComplianceData(data);
    } catch (e: any) {
      addToast('Failed to load compliance mapping', 'error');
    } finally {
      setComplianceLoading(false);
    }
  };

  const loadBiasAuditSummary = async () => {
    setBiasAuditLoading(true);
    try {
      const data = await api.getBiasAuditSummary();
      setBiasAuditSummary(data);
    } catch (e: any) {
      addToast('Failed to load bias audit summary', 'error');
    } finally {
      setBiasAuditLoading(false);
    }
  };

  const handleExportDsar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsarEmpId.trim()) return;
    setExportingDsar(true);
    try {
      const res = await api.exportDataSubject(dsarEmpId.trim());
      setDsarResult(res);
      addToast(`GDPR Article 15 export compiled for ${dsarEmpId}`, 'success');

      // Trigger file download
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gdpr-article-15-${dsarEmpId}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      addToast(e.message || 'DSAR export failed', 'error');
    } finally {
      setExportingDsar(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchLog) return true;
    const term = searchLog.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.actor_email?.toLowerCase().includes(term) ||
      log.resource_type?.toLowerCase().includes(term)
    );
  });

  const filteredRequirements = (complianceData?.requirements || []).filter((r: any) => {
    const matchesReg = !regulationFilter || r.regulation === regulationFilter;
    const matchesStatus = !complianceFilter || r.status === complianceFilter;
    return matchesReg && matchesStatus;
  });

  const uniqueRegulations = Array.from(
    new Set<string>((complianceData?.requirements || []).map((r: any) => r.regulation as string))
  );

  const downloadWithAuth = async (url: string, filename: string) => {
    try {
      const token = localStorage.getItem('cp_session_token');
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      addToast(`${filename} downloaded`, 'success');
    } catch {
      addToast('Download failed', 'error');
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'security', label: 'Security & Audit', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'compliance', label: 'Compliance', icon: <Scale className="w-3.5 h-3.5" /> },
    { id: 'dsar', label: 'DSAR & Privacy', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cp-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-cp-text-primary">
              Trust Center &amp; Enterprise Governance
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Security &amp; Privacy
            </span>
          </div>
          <p className="text-xs text-cp-text-muted mt-1">
            Security controls, regulatory compliance mapping (NYC LL144, EU AI Act, GDPR), audit trail, and DSAR automation.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-cp-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-cp-accent text-cp-accent'
                : 'border-transparent text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SECURITY & AUDIT TAB ────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Posture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cp-text-primary">Password Security</span>
                <Lock className="w-3.5 h-3.5 text-cp-accent" />
              </div>
              <div className="text-sm font-bold text-cp-accent font-mono">PBKDF2-SHA256</div>
              <div className="text-[10px] text-cp-text-muted">600,000 iterations per password</div>
            </div>

            <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cp-text-primary">Access Control</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-emerald-400 font-mono">Role-Based (RBAC)</div>
              <div className="text-[10px] text-cp-text-muted">Admin, HRBP, Analyst &amp; Committee scopes</div>
            </div>

            <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cp-text-primary">Data Isolation</span>
                <Database className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-sm font-bold text-indigo-400 font-mono">Tenant Partitioned</div>
              <div className="text-[10px] text-cp-text-muted">Strict workspace_id boundary validation</div>
            </div>

            <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cp-text-primary">Integration Security</span>
                <Key className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-amber-400 font-mono">HMAC-SHA256</div>
              <div className="text-[10px] text-cp-text-muted">Cryptographic signature on all webhooks</div>
            </div>
          </div>

          {/* Immutable Audit Log */}
          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cp-accent" />
                  <span>Immutable Audit Trail</span>
                </h3>
                <p className="text-xs text-cp-text-muted mt-0.5">
                  Append-only event log capturing analytical queries, model policy updates, and committee decisions.
                </p>
              </div>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-cp-text-muted" />
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-cp-border text-cp-text-muted uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-2.5">Timestamp</th>
                    <th className="py-2 px-2.5">Actor</th>
                    <th className="py-2 px-2.5">Action</th>
                    <th className="py-2 px-2.5">Resource</th>
                    <th className="py-2 px-2.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border/50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="text-cp-text-secondary hover:bg-cp-bg-hover">
                      <td className="py-2 px-2.5 font-mono text-[11px] text-cp-text-muted whitespace-nowrap">
                        {new Date(log.created_at || log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 font-semibold text-cp-text-primary">
                        {log.actor_email || log.user_email || 'system'}
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="font-mono text-cp-accent font-semibold">{log.action}</span>
                      </td>
                      <td className="py-2 px-2.5 text-cp-text-muted">
                        {log.resource_type || log.entity_type}{' '}
                        {log.resource_id || log.entity_id ? `#${log.resource_id || log.entity_id}` : ''}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[11px] text-cp-text-muted">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPLIANCE TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/80">
              <strong>Disclaimer:</strong> This mapping is provided for informational purposes only and does not constitute legal advice.
              Organizations should consult qualified legal counsel to assess their specific obligations.
              Status labels reflect platform capability only — deployers bear full compliance responsibility.
            </p>
          </div>

          {/* Document Downloads */}
          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cp-accent" />
              Compliance Documentation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Compliance Mapping', desc: 'NYC LL144, EU AI Act, GDPR — full requirement table', file: 'COMPLIANCE_MAPPING.md', fn: () => downloadWithAuth(api.downloadComplianceMappingDoc(), 'COMPLIANCE_MAPPING.md') },
                { label: 'DPIA Template', desc: 'GDPR Art. 35 pre-filled for this platform', file: 'DPIA_TEMPLATE.md', fn: () => downloadWithAuth(api.downloadDpiaTemplate(), 'DPIA_TEMPLATE.md') },
                { label: 'Model Card', desc: 'EU AI Act Art. 11 technical documentation', file: 'MODEL_CARD.md', fn: () => downloadWithAuth(api.downloadModelCard(), 'MODEL_CARD.md') },
                { label: 'Bias Audit CSV', desc: 'NYC LL144 impact ratios per category (live)', file: 'bias_audit_ll144.csv', fn: () => downloadWithAuth(api.downloadBiasAuditCsv(), 'bias_audit_ll144.csv') },
                { label: 'Compliance Mapping CSV', desc: 'Full mapping table for legal review', file: 'compliance_mapping.csv', fn: () => downloadWithAuth(api.downloadComplianceMappingCsv(), 'compliance_mapping_v3.2.0.csv') },
              ].map((doc) => (
                <button
                  key={doc.label}
                  onClick={doc.fn}
                  className="flex items-start gap-3 p-3 rounded-lg bg-cp-bg-app border border-cp-border hover:border-cp-accent/50 transition-colors text-left group"
                >
                  <Download className="w-3.5 h-3.5 text-cp-accent mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-cp-text-primary">{doc.label}</div>
                    <div className="text-[11px] text-cp-text-muted mt-0.5">{doc.desc}</div>
                    <div className="text-[10px] font-mono text-cp-accent mt-1">{doc.file}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bias Audit Summary (NYC LL144) */}
          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                <Scale className="w-4 h-4 text-cp-accent" />
                NYC Local Law 144 — Bias Audit Summary
              </h3>
              {!biasAuditSummary && (
                <button
                  onClick={loadBiasAuditSummary}
                  disabled={biasAuditLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover disabled:opacity-50 transition-colors"
                >
                  {biasAuditLoading ? 'Loading...' : 'Load Bias Audit'}
                </button>
              )}
            </div>
            {biasAuditSummary && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Audit Date', value: new Date(biasAuditSummary.audit_date).toLocaleDateString() },
                    { label: 'Dataset Size', value: biasAuditSummary.dataset_size?.toLocaleString() },
                    { label: 'Data Provenance', value: biasAuditSummary.data_provenance },
                    { label: 'Overall Status', value: biasAuditSummary.overall_status?.toUpperCase(), accent: biasAuditSummary.overall_status === 'compliant' ? 'text-emerald-400' : 'text-amber-400' },
                  ].map((m) => (
                    <div key={m.label} className="p-3 rounded-lg bg-cp-bg-app border border-cp-border">
                      <div className="text-[10px] text-cp-text-muted uppercase tracking-wider">{m.label}</div>
                      <div className={`text-sm font-bold font-mono mt-1 ${(m as any).accent || 'text-cp-text-primary'}`}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-200/80">
                  {biasAuditSummary.legal_notice}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-cp-border text-cp-text-muted uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-2.5">Attribute</th>
                        <th className="py-2 px-2.5">Group</th>
                        <th className="py-2 px-2.5 text-right">n</th>
                        <th className="py-2 px-2.5 text-right">Favorable Rate</th>
                        <th className="py-2 px-2.5 text-right">DIR</th>
                        <th className="py-2 px-2.5">Benchmark</th>
                        <th className="py-2 px-2.5">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cp-border/50">
                      {(biasAuditSummary.impact_ratios || []).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-cp-bg-hover">
                          <td className="py-2 px-2.5 font-semibold text-cp-text-primary">{row.attribute}</td>
                          <td className="py-2 px-2.5 text-cp-text-secondary">{row.group}</td>
                          <td className="py-2 px-2.5 text-right font-mono text-cp-text-muted">
                            {row.suppressed ? '<10' : row.sample_size}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono">
                            {row.suppressed ? '—' : (row.favorable_rate != null ? `${(row.favorable_rate * 100).toFixed(1)}%` : '—')}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold">
                            {row.suppressed ? '—' : (row.disparate_impact_ratio != null ? row.disparate_impact_ratio.toFixed(3) : '—')}
                          </td>
                          <td className="py-2 px-2.5 text-cp-text-muted text-[11px]">{row.benchmark_group}</td>
                          <td className="py-2 px-2.5">
                            {row.suppressed ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">Suppressed</span>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${row.four_fifths_compliant ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                                {row.flag}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Compliance Mapping Table */}
          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                <Eye className="w-4 h-4 text-cp-accent" />
                Regulatory Compliance Mapping
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={regulationFilter}
                  onChange={(e) => setRegulationFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                >
                  <option value="">All Regulations</option>
                  {uniqueRegulations.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={complianceFilter}
                  onChange={(e) => setComplianceFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                >
                  <option value="">All Statuses</option>
                  <option value="supported">Supported</option>
                  <option value="partially_supported">Partially Supported</option>
                  <option value="customer_responsibility">Customer Responsibility</option>
                </select>
              </div>
            </div>

            {/* Summary Pills */}
            {complianceData && (
              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.color}`}>
                    {cfg.icon}
                    <span>{cfg.label}: {complianceData.summary[key]}</span>
                  </div>
                ))}
              </div>
            )}

            {complianceLoading ? (
              <div className="text-xs text-cp-text-muted animate-pulse">Loading compliance mapping…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cp-border text-cp-text-muted uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-2.5 w-28">Regulation</th>
                      <th className="py-2 px-2.5 w-32">Article</th>
                      <th className="py-2 px-2.5">Requirement</th>
                      <th className="py-2 px-2.5 w-24">Status</th>
                      <th className="py-2 px-2.5">Platform Feature</th>
                      <th className="py-2 px-2.5 w-36">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cp-border/50">
                    {filteredRequirements.map((req: any, i: number) => {
                      const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.customer_responsibility;
                      return (
                        <tr key={i} className="hover:bg-cp-bg-hover align-top">
                          <td className="py-2.5 px-2.5">
                            <span className="text-[10px] font-bold text-cp-text-muted">{req.regulation}</span>
                          </td>
                          <td className="py-2.5 px-2.5 text-[11px] text-cp-text-muted font-mono">{req.article}</td>
                          <td className="py-2.5 px-2.5 text-cp-text-secondary">{req.requirement}</td>
                          <td className="py-2.5 px-2.5">
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold w-fit ${cfg.color}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-cp-text-secondary text-[11px]">
                            {req.platform_feature}
                            {req.gap && req.gap !== 'None' && (
                              <div className="mt-1 text-[10px] text-amber-400/80">⚠ {req.gap}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5">
                            {req.evidence_endpoint ? (
                              <span className="font-mono text-[10px] text-cp-accent">{req.evidence_endpoint}</span>
                            ) : (
                              <span className="text-[10px] text-cp-text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DSAR & PRIVACY TAB ──────────────────────────────────────────────── */}
      {activeTab === 'dsar' && (
        <div className="space-y-6">
          {/* GDPR Data Subject Access Request */}
          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <div>
              <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-cp-accent" />
                <span>GDPR Article 15 — Automated Data Subject Access Request (DSAR)</span>
              </h3>
              <p className="text-xs text-cp-text-muted mt-0.5">
                Instantly compile and export an employee's complete analytical footprint, tenure logs, and model evaluations in machine-readable JSON.
              </p>
            </div>

            <form onSubmit={handleExportDsar} className="flex items-center gap-3 max-w-md">
              <input
                type="text"
                required
                placeholder="Enter Employee ID (e.g. 1001 or EMP-DEMO-01)"
                value={dsarEmpId}
                onChange={(e) => setDsarEmpId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent font-mono"
              />
              <button
                type="submit"
                disabled={exportingDsar}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover disabled:opacity-50 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingDsar ? 'Exporting...' : 'Export DSAR JSON'}</span>
              </button>
            </form>

            {dsarResult && (
              <div className="p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-semibold">
                  ✓ DSAR export compiled for {dsarEmpId} — downloaded as JSON
                </p>
                <p className="text-[11px] text-cp-text-muted mt-1">
                  Includes: {Object.keys(dsarResult).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Retention Preview */}
          {retentionPreview && (
            <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-3">
              <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                <Database className="w-4 h-4 text-cp-accent" />
                Data Retention Preview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(retentionPreview).filter(([k]) => !k.includes('_')).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-cp-bg-app border border-cp-border">
                    <div className="text-[10px] text-cp-text-muted capitalize">{key.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-bold font-mono text-cp-text-primary mt-1">{String(val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
