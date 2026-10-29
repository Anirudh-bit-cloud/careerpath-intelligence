import React, { useState, useEffect } from 'react';
import {
  Database,
  Key,
  Webhook,
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Send,
  ShieldAlert,
  Code2,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ConnectorsView: React.FC = () => {
  const { toast } = useToast();
  const addToast = (msg: string, type: 'success' | 'error' = 'success') =>
    type === 'error' ? toast.error(msg) : toast.success(msg);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // HRIS Sync Test State
  const [testingHris, setTestingHris] = useState<boolean>(false);
  const [hrisSyncResult, setHrisSyncResult] = useState<any | null>(null);

  // New API Key Modal State
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyName, setKeyName] = useState<string>('');
  const [keyRole, setKeyRole] = useState<string>('hr_analyst');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // New Webhook Modal State
  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookSecret, setWebhookSecret] = useState<string>('whsec_' + Math.random().toString(36).substring(2, 10));

  // Webhook Test State
  const [testingWebhookId, setTestingWebhookId] = useState<number | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connData, keysData, whData] = await Promise.all([
        api.getConnectorsStatus(),
        api.listApiKeys(),
        api.listWebhooks()
      ]);
      setConnectors(connData.connectors || []);
      setApiKeys(keysData || []);
      setWebhooks(whData || []);
    } catch (e: any) {
      addToast('Failed to load integration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestHrisSync = async () => {
    setTestingHris(true);
    try {
      const res = await api.testMockHris(25);
      setHrisSyncResult(res);
      addToast('HRIS sync simulation completed successfully', 'success');
    } catch (e: any) {
      addToast(e.message || 'HRIS test failed', 'error');
    } finally {
      setTestingHris(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!keyName.trim()) return;
    try {
      const res = await api.createApiKey(keyName.trim(), keyRole);
      setNewlyCreatedKey(res.api_key);
      addToast('API Key generated', 'success');
      const updated = await api.listApiKeys();
      setApiKeys(updated);
    } catch (e: any) {
      addToast(e.message || 'Failed to generate key', 'error');
    }
  };

  const handleRevokeApiKey = async (id: number) => {
    try {
      await api.revokeApiKey(id);
      addToast('API Key revoked', 'success');
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (e: any) {
      addToast(e.message || 'Failed to revoke key', 'error');
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookUrl.trim()) return;
    try {
      await api.createWebhook(
        webhookUrl.trim(),
        webhookSecret.trim(),
        ['retention.urgent_flagged', 'committee.decision_logged']
      );
      addToast('Webhook endpoint registered', 'success');
      setShowWebhookModal(false);
      setWebhookUrl('');
      const updated = await api.listWebhooks();
      setWebhooks(updated);
    } catch (e: any) {
      addToast(e.message || 'Failed to register webhook', 'error');
    }
  };

  const handleTestWebhookDispatch = async (whId: number) => {
    setTestingWebhookId(whId);
    try {
      const res = await api.testWebhook(whId, {
        event: 'retention.urgent_flagged',
        timestamp: new Date().toISOString(),
        candidate: { employee_id: 'EMP-DEMO-01', risk_score: 0.88 }
      });
      setWebhookTestResult(res);
      addToast('Dispatched test webhook with HMAC signature', 'success');
    } catch (e: any) {
      addToast(e.message || 'Webhook dispatch failed', 'error');
    } finally {
      setTestingWebhookId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cp-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-cp-text-primary">
              Connectors & Developer Integration Hub
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              API & Webhooks
            </span>
          </div>
          <p className="text-xs text-cp-text-muted mt-1">
            Standardized HRIS ingest adapters, scoped REST API keys, and HMAC-signed webhook dispatches.
          </p>
        </div>
      </div>

      {/* 3 Major Sections */}
      <div className="space-y-6">
        {/* Section 1: HRIS Ecosystem */}
        <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                <Database className="w-4 h-4 text-cp-accent" />
                <span>Enterprise HRIS Connectors</span>
              </h3>
              <p className="text-xs text-cp-text-muted mt-0.5">
                Two-way directory and tenure telemetry synchronization
              </p>
            </div>
            <button
              onClick={handleTestHrisSync}
              disabled={testingHris}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover disabled:opacity-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingHris ? 'animate-spin' : ''}`} />
              <span>{testingHris ? 'Syncing...' : 'Test Reference HRIS Sync'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {connectors.map((conn) => (
              <div key={conn.id} className="p-4 rounded-lg bg-cp-bg-app border border-cp-border/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cp-text-primary">{conn.name}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      conn.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/25'
                    }`}
                  >
                    {conn.status === 'active' ? 'Reference Adapter' : 'Roadmap'}
                  </span>
                </div>
                <div className="text-[11px] text-cp-text-muted">{conn.description}</div>
                <div className="text-[10px] text-cp-text-secondary font-mono pt-1">
                  Latency: ~{conn.avg_latency_ms}ms • Auth: {conn.auth_type}
                </div>
              </div>
            ))}
          </div>

          {/* Sync Result Output Terminal */}
          {hrisSyncResult && (
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-1.5">
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>HRIS Adapter Sync Execution Summary:</span>
              </div>
              <div className="text-zinc-300">
                Processed <strong className="text-white">{hrisSyncResult.records_synced}</strong> workforce records
                with <strong className="text-white">{hrisSyncResult.records_updated}</strong> profile updates applied.
              </div>
              <div className="text-[11px] text-zinc-500">
                Active Tenant: {hrisSyncResult.workspace_id} • Status: {hrisSyncResult.status}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Scoped REST API Keys */}
        <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                <Key className="w-4 h-4 text-cp-accent" />
                <span>Public REST API Keys</span>
              </h3>
              <p className="text-xs text-cp-text-muted mt-0.5">
                Secure programmatic access to <code className="text-cp-accent">GET /api/v1/roster</code> via <code className="text-cp-accent">X-API-Key</code>
              </p>
            </div>
            <button
              onClick={() => {
                setShowKeyModal(true);
                setNewlyCreatedKey(null);
                setKeyName('');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Key</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cp-border text-cp-text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-2.5">Key Name</th>
                  <th className="py-2 px-2.5">Prefix / Hash</th>
                  <th className="py-2 px-2.5">Role Scope</th>
                  <th className="py-2 px-2.5">Created</th>
                  <th className="py-2 px-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cp-border/50">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="text-cp-text-secondary hover:bg-cp-bg-hover">
                    <td className="py-2.5 px-2.5 font-semibold text-cp-text-primary">{key.name}</td>
                    <td className="py-2.5 px-2.5 font-mono text-cp-accent">{key.key_prefix}••••••••</td>
                    <td className="py-2.5 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cp-bg-app border border-cp-border">
                        {key.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-cp-text-muted">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={() => handleRevokeApiKey(key.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: HMAC Outgoing Webhooks */}
        <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                <Webhook className="w-4 h-4 text-cp-accent" />
                <span>HMAC-SHA256 Outgoing Webhooks</span>
              </h3>
              <p className="text-xs text-cp-text-muted mt-0.5">
                Automated event notifications dispatched to your enterprise SIEM or HCM with signed headers (<code className="text-cp-accent">X-Signature-SHA256</code>)
              </p>
            </div>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Endpoint</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cp-border text-cp-text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-2.5">Endpoint URL</th>
                  <th className="py-2 px-2.5">Events Subscribed</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cp-border/50">
                {webhooks.map((wh) => (
                  <tr key={wh.id} className="text-cp-text-secondary hover:bg-cp-bg-hover">
                    <td className="py-2.5 px-2.5 font-mono text-cp-text-primary truncate max-w-xs">{wh.endpoint_url}</td>
                    <td className="py-2.5 px-2.5 text-xs text-cp-text-muted">
                      {wh.subscribed_events?.join(', ')}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        {wh.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={() => handleTestWebhookDispatch(wh.id)}
                        disabled={testingWebhookId === wh.id}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-cp-border text-cp-text-secondary hover:text-cp-text-primary ml-auto"
                      >
                        <Send className="w-3 h-3 text-cp-accent" />
                        <span>{testingWebhookId === wh.id ? 'Sending...' : 'Test HMAC'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Webhook Test Output */}
          {webhookTestResult && (
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-1">
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>HMAC Webhook Test Transmission Successful:</span>
              </div>
              <div className="text-zinc-400 text-[11px] break-all">
                Generated Signature: <span className="text-amber-400">{webhookTestResult.computed_signature}</span>
              </div>
              <div className="text-zinc-500 text-[10px]">
                Target: {webhookTestResult.endpoint_url} • Event: {webhookTestResult.dispatched_payload?.event}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create API Key */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-cp-bg-surface border border-cp-border rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary">Generate Public REST API Key</h3>
            {!newlyCreatedKey ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cp-text-secondary">Key Identifier / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Workday Sync Pipeline"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cp-text-secondary">Role Permission Scope</label>
                  <select
                    value={keyRole}
                    onChange={(e) => setKeyRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                  >
                    <option value="hr_analyst">HR Analyst (Read analytics & rosters)</option>
                    <option value="hrbp">HRBP (Read + write interventions)</option>
                    <option value="admin">Admin (Full tenant access)</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 text-xs text-cp-text-muted hover:text-cp-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApiKey}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover"
                  >
                    Generate
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400">
                  Save this key now. It will not be shown again.
                </div>
                <div className="p-2.5 rounded-lg bg-cp-bg-app border border-cp-border font-mono text-xs text-cp-accent break-all select-all">
                  {newlyCreatedKey}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Webhook */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-cp-bg-surface border border-cp-border rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary">Register Webhook Endpoint</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cp-text-secondary">HTTPS Destination URL</label>
                <input
                  type="url"
                  placeholder="https://api.enterprise.com/webhooks/talent"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cp-text-secondary">Secret Token (for HMAC-SHA256)</label>
                <input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary font-mono focus:outline-none focus:border-cp-accent"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="px-3 py-1.5 text-xs text-cp-text-muted hover:text-cp-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
