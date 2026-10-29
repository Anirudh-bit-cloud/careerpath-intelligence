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
  Key
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const TrustCenterView: React.FC = () => {
  const { toast } = useToast();
  const addToast = (msg: string, type: 'success' | 'error' = 'success') =>
    type === 'error' ? toast.error(msg) : toast.success(msg);
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

  useEffect(() => {
    loadAuditLogs();
    loadRetentionPreview();
  }, []);

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cp-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-cp-text-primary">
              Trust Center & Enterprise Governance
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Security & Privacy
            </span>
          </div>
          <p className="text-xs text-cp-text-muted mt-1">
            Security controls, immutable audit logging, GDPR Article 15 DSAR automated export, and retention management.
          </p>
        </div>
      </div>

      {/* Security Posture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cp-text-primary">Password Security</span>
            <Lock className="w-3.5 h-3.5 text-cp-accent" />
          </div>
          <div className="text-sm font-bold text-cp-accent font-mono">PBKDF2-SHA256</div>
          <div className="text-[10px] text-cp-text-muted">100,000 salt iterations per password</div>
        </div>

        <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cp-text-primary">Access Control</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono">Role-Based (RBAC)</div>
          <div className="text-[10px] text-cp-text-muted">Admin, HRBP, Analyst & Committee scopes</div>
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

      {/* GDPR Data Subject Access Request (DSAR) Utility */}
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
      </div>

      {/* Immutable Audit Log Viewer */}
      <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-cp-accent" />
              <span>Immutable Audit Trail (SQLite)</span>
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
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 px-2.5 font-semibold text-cp-text-primary">
                    {log.actor_email || 'system'}
                  </td>
                  <td className="py-2 px-2.5">
                    <span className="font-mono text-cp-accent font-semibold">{log.action}</span>
                  </td>
                  <td className="py-2 px-2.5 text-cp-text-muted">
                    {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                  </td>
                  <td className="py-2 px-2.5 font-mono text-[11px] text-cp-text-muted">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
