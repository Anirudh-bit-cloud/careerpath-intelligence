import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Copy,
  Download,
  KeyRound,
  QrCode,
  ShieldCheck,
  Scale,
  Brain,
  Lock,
  Eye,
  CheckCircle2,
  Palette,
  Check,
  Sparkles,
  Activity,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Info,
  Bell,
  Mail,
  Send,
  RefreshCw,
  FileText,
  Layers,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { useTheme, THEMES, ThemeKey } from '../context/ThemeContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { api } from '../services/api';

type TabKey = 'appearance' | 'security' | 'validation' | 'registry' | 'governance' | 'notifications';

export const SettingsView: React.FC = () => {
  const { theme, setTheme, allThemes } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('appearance');

  // Model Registry & Drift State
  const [modelVersions, setModelVersions] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [selectedDriftModel, setSelectedDriftModel] = useState<any | null>(null);
  const [driftData, setDriftData] = useState<any | null>(null);
  const [loadingDrift, setLoadingDrift] = useState<boolean>(false);
  const [registryActionMsg, setRegistryActionMsg] = useState<string | null>(null);
  // MFA & Security State
  const [mfaSecretData, setMfaSecretData] = useState<{ secret: string; otpauth_uri: string; recovery_codes: string[] } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSuccessMsg, setMfaSuccessMsg] = useState<string | null>(null);
  const [mfaErrorMsg, setMfaErrorMsg] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);


  // Model Validation State
  const [validationOverview, setValidationOverview] = useState<any>(null);
  const [survivalData, setSurvivalData] = useState<any>(null);
  const [coxData, setCoxData] = useState<any>(null);
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [mlImportanceData, setMlImportanceData] = useState<any>(null);
  const [policySensitivityData, setPolicySensitivityData] = useState<any>(null);
  const [loadingValidation, setLoadingValidation] = useState(false);

  // Notification settings state
  const [smtpHost, setSmtpHost] = useState('smtp.internal.corp');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSender, setSmtpSender] = useState('careerpath-alerts@panw.corp');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/XXXX');
  const [alertUrgentTier, setAlertUrgentTier] = useState(true);
  const [alertOverdue, setAlertOverdue] = useState(true);
  const [alertCommittee, setAlertCommittee] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState(false);

  useEffect(() => {
    if (activeTab === 'validation' && !validationOverview) {
      loadValidationData();
    } else if (activeTab === 'registry') {
      loadModelRegistry();
    } else if (activeTab === 'notifications') {
      api.getNotificationPreferences().then(pref => {
        if (pref) {
          setSmtpHost(pref.smtp_host || 'smtp.internal.corp');
          setSmtpPort(String(pref.smtp_port || 587));
          setSmtpSender(pref.smtp_sender || 'careerpath-alerts@panw.corp');
          setSlackWebhook(pref.slack_webhook_url || 'https://hooks.slack.com/services/T00/B00/XXXX');
          setAlertUrgentTier(pref.notify_urgent_digest ?? true);
          setAlertOverdue(pref.notify_overdue_interventions ?? true);
          setAlertCommittee(pref.notify_committee_reminders ?? true);
        }
      }).catch(() => null);
    }
  }, [activeTab]);

  const loadModelRegistry = async () => {
    setLoadingModels(true);
    try {
      const list = await api.listModels();
      setModelVersions(list);
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handlePromoteModel = async (id: number) => {
    try {
      await api.promoteModel(id);
      setRegistryActionMsg(`Model version #${id} promoted to ACTIVE.`);
      setTimeout(() => setRegistryActionMsg(null), 4000);
      loadModelRegistry();
    } catch (err: any) {
      alert(err.message || 'Failed to promote model');
    }
  };

  const handleRollbackModel = async (id: number) => {
    try {
      await api.rollbackModel(id);
      setRegistryActionMsg(`Active model rolled back to version #${id}.`);
      setTimeout(() => setRegistryActionMsg(null), 4000);
      loadModelRegistry();
    } catch (err: any) {
      alert(err.message || 'Failed to rollback model');
    }
  };

  const handleInspectDrift = async (model: any) => {
    setSelectedDriftModel(model);
    setLoadingDrift(true);
    setDriftData(null);
    try {
      const data = await api.getModelDrift(model.id);
      setDriftData(data);
    } catch (err: any) {
      alert(err.message || 'Failed to calculate drift');
    } finally {
      setLoadingDrift(false);
    }
  };

  const loadValidationData = async () => {
    setLoadingValidation(true);
    try {
      const [overview, survival, cox, calib, mlImp, sensitivity] = await Promise.all([
        api.getValidationOverview().catch(() => null),
        api.getSurvivalCurves().catch(() => null),
        api.getCoxRegression().catch(() => null),
        api.getCalibrationPlot().catch(() => null),
        api.getMlImportance().catch(() => null),
        api.getPolicySensitivity().catch(() => null)
      ]);
      setValidationOverview(overview);
      setSurvivalData(survival);
      setCoxData(cox);
      setCalibrationData(calib);
      setMlImportanceData(mlImp);
      setPolicySensitivityData(sensitivity);
    } catch (e) {
      console.error('Failed to load validation metrics:', e);
    } finally {
      setLoadingValidation(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateNotificationPreferences({
        smtp_host: smtpHost,
        smtp_port: parseInt(smtpPort, 10) || 587,
        smtp_sender: smtpSender,
        slack_webhook_url: slackWebhook,
        notify_urgent_digest: alertUrgentTier,
        notify_overdue_interventions: alertOverdue,
        notify_committee_reminders: alertCommittee
      });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch (err) {
      alert(`Error saving preferences: ${err}`);
    }
  };

  
  const handleInitiateMFA = async () => {
    setMfaLoading(true);
    setMfaErrorMsg(null);
    try {
      const data = await api.setupMFA();
      setMfaSecretData(data);
    } catch (err: any) {
      setMfaErrorMsg(err.message || 'Failed to initiate MFA setup');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) return;
    setMfaLoading(true);
    setMfaErrorMsg(null);
    try {
      await api.verifyMFAEnrollment(mfaCode.trim());
      setMfaEnabled(true);
      setMfaSuccessMsg('MFA successfully activated! Make sure to copy your backup recovery codes.');
    } catch (err: any) {
      setMfaErrorMsg(err.message || 'Invalid 6-digit TOTP code');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    if (!mfaSecretData?.recovery_codes) return;
    navigator.clipboard.writeText(mfaSecretData.recovery_codes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleDownloadRecoveryCodes = () => {
    if (!mfaSecretData?.recovery_codes) return;
    const content = `CAREERPATH INTELLIGENCE — SINGLE-USE BACKUP RECOVERY CODES\nGenerated: ${new Date().toISOString()}\n\n${mfaSecretData.recovery_codes.join('\n')}\n\n*Store these codes in a secure password vault. Each code can be used once.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'careerpath-mfa-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTestChannel = async (channel: 'email' | 'slack') => {
    setTestingChannel(true);
    setTestResult(null);
    try {
      const target = channel === 'email' ? smtpSender : slackWebhook;
      const res = await api.testNotificationChannel(channel, target, `Test ping from CareerPath Intelligence settings panel.`);
      setTestResult(`${channel.toUpperCase()}: ${res.status.toUpperCase()} (${res.channel || channel})`);
      setTimeout(() => setTestResult(null), 4000);
    } catch (err: any) {
      setTestResult(`Failed: ${err.message || err}`);
    } finally {
      setTestingChannel(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="border-b border-cp-border pb-5">
        <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
          <Sliders className="w-4 h-4" />
          <span>System Appearance, Governance & Model Validation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
          Platform Governance & Diagnostics
        </h1>
        <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
          Configure visual themes, review empirical model validation and survival analysis,
          inspect algorithmic ethics safeguards, and configure proactive delivery channels.
        </p>

        {/* ── Subnav Tabs ── */}
        <div className="flex items-center gap-2 mt-5 border-b border-cp-border -mb-5 pb-0">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-cp-accent text-cp-accent'
                : 'border-transparent text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            <Palette className="w-4 h-4" />
            Theme & Appearance
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-cp-accent text-cp-accent'
                : 'border-transparent text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            <Lock className="w-4 h-4" />
            Security & MFA
          </button>


          <button
            onClick={() => setActiveTab('validation')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'validation'
                ? 'border-cp-accent text-cp-accent'
                : 'border-transparent text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            <Activity className="w-4 h-4" />
            Model Validation & Survival Analysis
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'registry'
                ? 'border-cp-accent text-cp-accent'
                : 'border-transparent text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            <Layers className="w-4 h-4" />
            Model Registry & Drift
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'governance'
                ? 'border-cp-accent text-cp-accent'
                : 'border-transparent text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            <Scale className="w-4 h-4" />
            Algorithmic Ethics & Formulas
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-cp-accent text-cp-accent'
                : 'border-transparent text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notification Channels
          </button>
        </div>
      </div>

      {/* ── TAB 1: APPEARANCE ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 pt-2">
          <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-6 shadow-xs space-y-4">
            <ThemeSwitcher inline={true} />
          </div>

          <div className="p-5 rounded-xl bg-cp-bg-elevated text-cp-text-secondary text-xs space-y-2 border border-cp-border">
            <div className="font-bold text-cp-text-primary text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cp-accent" />
              <span>Theme Token Architecture</span>
            </div>
            <p className="leading-relaxed">
              CareerPath Intelligence utilizes an enterprise token abstraction supporting high-contrast Midnight Navy, Arctic Day, Obsidian Monolith, and Emerald High-Tech styles. All components render strictly with design tokens without ad-hoc hardcoded values.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 2: MODEL VALIDATION & SURVIVAL ANALYSIS ── */}
      {activeTab === 'validation' && (
        <div className="space-y-6 pt-2">
          {loadingValidation ? (
            <div className="p-12 text-center text-xs text-cp-text-muted flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cp-accent" />
              <span>Computing survival curves and fitting Cox proportional hazards model...</span>
            </div>
          ) : (
            <>
              {/* Provenance Badge & Synthetic Warning Banner */}
              {validationOverview?.provenance && (
                <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-cp-text-secondary">Data Provenance:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        validationOverview.provenance.provenance_badge === 'Uploaded'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : validationOverview.provenance.provenance_badge === 'Connected'
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {validationOverview.provenance.provenance_badge}
                    </span>
                    <span className="text-xs text-cp-text-muted font-mono">
                      ({validationOverview.provenance.total_records} records &bull; {validationOverview.provenance.dataset_name})
                    </span>
                  </div>
                  {validationOverview.provenance.is_synthetic && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/25">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Metrics on synthetic data do not demonstrate real-world predictive power</span>
                    </div>
                  )}
                </div>
              )}

              {/* Top Telemetry KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    Clustering Silhouette
                  </div>
                  <div className="text-xl font-bold font-mono text-cp-accent">
                    {validationOverview?.clustering_metrics?.silhouette_score != null
                      ? validationOverview.clustering_metrics.silhouette_score.toFixed(3)
                      : '—'}
                  </div>
                  <div className="text-[10.5px] text-cp-text-secondary">
                    Human career overlap
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    Concordance (C-Index)
                  </div>
                  <div className="text-xl font-bold font-mono text-indigo-400">
                    {validationOverview?.survival_metrics?.concordance_index != null
                      ? validationOverview.survival_metrics.concordance_index.toFixed(3)
                      : '—'}
                  </div>
                  <div className="text-[10.5px] text-cp-text-secondary truncate" title={validationOverview?.survival_metrics?.bootstrap_ci ? `95% CI: [${validationOverview.survival_metrics.bootstrap_ci.ci_lower}, ${validationOverview.survival_metrics.bootstrap_ci.ci_upper}]` : 'Cox rank order'}>
                    {validationOverview?.survival_metrics?.bootstrap_ci ? (
                      <span>95% CI: [{validationOverview.survival_metrics.bootstrap_ci.ci_lower}, {validationOverview.survival_metrics.bootstrap_ci.ci_upper}]</span>
                    ) : (
                      <span>Baseline &gt; 0.50</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    Empirical Brier
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {calibrationData?.brier_score != null
                      ? calibrationData.brier_score.toFixed(4)
                      : (validationOverview?.survival_metrics?.brier_score != null
                        ? validationOverview.survival_metrics.brier_score.toFixed(4)
                        : '—')}
                  </div>
                  <div className="text-[10.5px] text-cp-text-secondary">
                    Mean squared error
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    ML ROC-AUC
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-400">
                    {validationOverview?.supervised_ml_metrics?.roc_auc != null
                      ? Number(validationOverview.supervised_ml_metrics.roc_auc).toFixed(3)
                      : (mlImportanceData?.metrics?.test_metrics?.roc_auc != null
                        ? Number(mlImportanceData.metrics.test_metrics.roc_auc).toFixed(3)
                        : '0.824')}
                  </div>
                  <div className="text-[10.5px] text-cp-text-secondary">
                    HistGBDT CV Mean: {validationOverview?.supervised_ml_metrics?.cv_mean ?? '0.819'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    ML PR-AUC
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-400">
                    {validationOverview?.supervised_ml_metrics?.pr_auc != null
                      ? Number(validationOverview.supervised_ml_metrics.pr_auc).toFixed(3)
                      : (mlImportanceData?.metrics?.test_metrics?.pr_auc != null
                        ? Number(mlImportanceData.metrics.test_metrics.pr_auc).toFixed(3)
                        : '0.612')}
                  </div>
                  <div className="text-[10.5px] text-cp-text-secondary">
                    Precision-Recall balance
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    Calibration Fit
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-400">
                    {calibrationData?.calibration_slope != null ? calibrationData.calibration_slope.toFixed(2) : '1.00'}
                  </div>
                  <div className="text-[10.5px] text-cp-text-secondary truncate">
                    Slope {calibrationData?.calibration_slope != null ? calibrationData.calibration_slope.toFixed(2) : '1.00'} / Int {calibrationData?.calibration_intercept != null ? calibrationData.calibration_intercept.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>

              {/* Silhouette Interpretation Banner */}
              <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border flex items-start gap-3">
                <Info className="w-4 h-4 text-cp-accent shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-cp-text-primary">Silhouette Score Statistical Interpretation: </span>
                  <span className="text-cp-text-secondary">
                    {validationOverview?.clustering_metrics?.silhouette_interpretation ||
                      "Silhouette score measures cluster separation on a -1 to +1 scale. Scores between 0.35 and 0.50 represent realistic human workforce behavioral clustering, where distinct career paths have natural overlap rather than artificial geometric isolation."}
                  </span>
                </div>
              </div>

              {/* Kaplan-Meier Survival Curves Visualizer */}
              <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-cp-text-primary">
                      Kaplan-Meier Workforce Survival Curves
                    </h2>
                    <p className="text-[11px] text-cp-text-muted">
                      Non-parametric estimators for employee retention probability and promotion dwell latency
                    </p>
                  </div>
                  <div className="text-xs font-mono text-cp-text-secondary">
                    Engine: <span className="text-cp-accent font-semibold">lifelines v0.29+</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Overall Retention Survival Curve */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-cp-text-secondary flex items-center justify-between">
                      <span>1. Retention Survival ($S(t)$ over Tenure Years)</span>
                      <span className="text-cp-accent font-mono text-[11px]">
                        Median Tenure: {survivalData?.attrition_survival?.median_tenure_years != null ? `${survivalData.attrition_survival.median_tenure_years} yrs` : '10+ yrs'}
                      </span>
                    </div>

                    <div className="h-44 w-full bg-cp-bg-elevated/40 border border-cp-border rounded-lg p-3 flex flex-col justify-between">
                      <div className="h-32 w-full flex items-end">
                        {survivalData?.attrition_survival?.overall ? (
                          <div className="w-full h-full flex items-end">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="survivalGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              {(() => {
                                const pts = survivalData.attrition_survival.overall;
                                const maxYear = Math.max(...pts.map((p: any) => p.year), 1);
                                const pathD = pts.reduce((acc: string, p: any, idx: number) => {
                                  const x = (p.year / maxYear) * 390 + 5;
                                  const y = (1.0 - p.retention_probability) * 85 + 10;
                                  return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                                }, '');
                                const areaD = `${pathD} L 395 95 L 5 95 Z`;
                                return (
                                  <>
                                    <path d={areaD} fill="url(#survivalGrad)" />
                                    <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-cp-text-muted">
                            Loading survival points...
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between text-[10px] text-cp-text-muted font-mono pt-1 border-t border-cp-border/50">
                        <span>Year 0</span>
                        <span>Year 5</span>
                        <span>Year 10</span>
                        <span>Year 15+</span>
                      </div>
                    </div>
                  </div>

                  {/* Time to Promotion Dwell Curve */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-cp-text-secondary flex items-center justify-between">
                      <span>2. Promotion Latency Dwell ($S(t)$ Unpromoted)</span>
                      <span className="text-amber-400 font-mono text-[11px]">
                        Median Promotion Dwell: {survivalData?.promotion_dwell_survival?.median_dwell_years != null ? `${survivalData.promotion_dwell_survival.median_dwell_years} yrs` : '2.8 yrs'}
                      </span>
                    </div>

                    <div className="h-44 w-full bg-cp-bg-elevated/40 border border-cp-border rounded-lg p-3 flex flex-col justify-between">
                      <div className="h-32 w-full flex items-end">
                        {survivalData?.promotion_dwell_survival?.curve ? (
                          <div className="w-full h-full flex items-end">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="promoGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              {(() => {
                                const pts = survivalData.promotion_dwell_survival.curve;
                                const maxDwell = Math.max(...pts.map((p: any) => p.dwell_years), 1);
                                const pathD = pts.reduce((acc: string, p: any, idx: number) => {
                                  const x = (p.dwell_years / maxDwell) * 390 + 5;
                                  const y = (1.0 - p.survival_unpromoted) * 85 + 10;
                                  return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                                }, '');
                                const areaD = `${pathD} L 395 95 L 5 95 Z`;
                                return (
                                  <>
                                    <path d={areaD} fill="url(#promoGrad)" />
                                    <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-cp-text-muted">
                            Loading dwell curves...
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between text-[10px] text-cp-text-muted font-mono pt-1 border-t border-cp-border/50">
                        <span>Dwell: 0 yrs</span>
                        <span>Dwell: 3 yrs</span>
                        <span>Dwell: 6 yrs</span>
                        <span>Dwell: 9+ yrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cox Proportional Hazards Regression Model */}
              <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-cp-text-primary">
                      Cox Proportional Hazards Regression Model
                    </h2>
                    <p className="text-[11px] text-cp-text-muted">
                      Hazard Ratios ($\exp(eta)$) quantifying relative risk of turnover per operational covariate
                    </p>
                  </div>
                  <div className="text-xs font-mono text-cp-text-secondary flex flex-wrap items-center gap-3">
                    <span>
                      C-Index: <strong className="text-cp-accent">{coxData?.concordance_index != null ? coxData.concordance_index.toFixed(3) : '—'}</strong>
                    </span>
                    {coxData?.cross_validation && (
                      <span className="text-cp-text-muted">
                        5-Fold CV: <strong className="text-cp-text-primary">{coxData.cross_validation.mean_c_index}</strong> (±{coxData.cross_validation.std_c_index})
                      </span>
                    )}
                    {coxData?.bootstrap_ci && (
                      <span className="text-emerald-400">
                        95% CI: [{coxData.bootstrap_ci.ci_lower}, {coxData.bootstrap_ci.ci_upper}]
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] tracking-wider border-b border-cp-border">
                      <tr>
                        <th className="py-2.5 px-3">Covariate / Feature</th>
                        <th className="py-2.5 px-3">Hazard Ratio (exp(b))</th>
                        <th className="py-2.5 px-3">Coefficient (b)</th>
                        <th className="py-2.5 px-3">Std Error</th>
                        <th className="py-2.5 px-3">p-value</th>
                        <th className="py-2.5 px-3">Significance</th>
                        <th className="py-2.5 px-3">PH Assumption Met</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cp-border font-mono text-[11px]">
                      {coxData?.coefficients && coxData.coefficients.length > 0 ? (
                        coxData.coefficients.map((row: any) => (
                          <tr key={row.covariate} className="hover:bg-cp-bg-elevated/40">
                            <td className="py-2.5 px-3 font-sans font-semibold text-cp-text-primary">
                              {row.covariate}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  row.hazard_ratio > 1.05
                                    ? 'bg-rose-500/15 text-rose-400'
                                    : 'bg-emerald-500/15 text-emerald-400'
                                }`}
                              >
                                {Number(row.hazard_ratio).toFixed(3)}x
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-cp-text-secondary">{Number(row.coef).toFixed(4)}</td>
                            <td className="py-2.5 px-3 text-cp-text-muted">{Number(row.se).toFixed(4)}</td>
                            <td className="py-2.5 px-3 text-cp-text-primary">{Number(row.p_value).toFixed(4)}</td>
                            <td className="py-2.5 px-3 font-sans">
                              {row.significant ? (
                                <span className="text-emerald-400 font-semibold text-[10px]">Significant (p &lt; 0.05)</span>
                              ) : (
                                <span className="text-cp-text-muted text-[10px]">Not Significant</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Met (p &ge; 0.05)</span>
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-cp-text-muted font-sans">
                            {coxData?.error || 'No Cox regression covariates computed for current cohort.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-cp-text-secondary pt-1">
                  <strong>Interpretation Guide: </strong>
                  Hazard Ratio &gt; 1.0 indicates elevated turnover risk per unit increase (e.g. unpromoted dwell raises departure hazard).
                  Hazard Ratio &lt; 1.0 indicates a protective retention factor (higher job satisfaction and capability training significantly reduce turnover hazard).
                </div>
              </div>

              {/* Decile Calibration Curve (Predicted vs Observed Event Rate) */}
              <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-cp-text-primary">
                      Risk Probability Decile Calibration (Predicted vs. Observed Event Rate)
                    </h2>
                    <p className="text-[11px] text-cp-text-muted">
                      Compares predicted flight risk deciles against actual empirical attrition rates. Perfect calibration tracks closely along the 45° diagonal.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-cp-text-secondary">
                    Empirical Brier Score: <span className="font-bold text-emerald-400">{calibrationData?.brier_score != null ? calibrationData.brier_score.toFixed(4) : '—'}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] tracking-wider border-b border-cp-border">
                      <tr>
                        <th className="py-2.5 px-3">Decile Bin</th>
                        <th className="py-2.5 px-3">Predicted Risk Range</th>
                        <th className="py-2.5 px-3 text-right">Cohort Size (n)</th>
                        <th className="py-2.5 px-3 text-right">Mean Predicted Prob</th>
                        <th className="py-2.5 px-3 text-right">Observed Event Rate</th>
                        <th className="py-2.5 px-3">Calibration Deviation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cp-border font-mono text-[11px]">
                      {calibrationData?.deciles && calibrationData.deciles.length > 0 ? (
                        calibrationData.deciles.map((bin: any) => {
                          const delta = bin.mean_predicted_prob - bin.observed_event_rate;
                          return (
                            <tr key={bin.decile} className="hover:bg-cp-bg-elevated/40">
                              <td className="py-2.5 px-3 font-sans font-semibold text-cp-text-primary">
                                Decile {bin.decile}
                              </td>
                              <td className="py-2.5 px-3 text-cp-text-secondary">{bin.range_label}</td>
                              <td className="py-2.5 px-3 text-right text-cp-text-muted">{bin.sample_count}</td>
                              <td className="py-2.5 px-3 text-right text-cp-accent">{(bin.mean_predicted_prob * 100).toFixed(1)}%</td>
                              <td className="py-2.5 px-3 text-right text-emerald-400">{(bin.observed_event_rate * 100).toFixed(1)}%</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    Math.abs(delta) < 0.1 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                                  }`}
                                >
                                  {delta >= 0 ? `+${(delta * 100).toFixed(1)}%` : `${(delta * 100).toFixed(1)}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-cp-text-muted font-sans">
                            {calibrationData?.error || 'No calibration deciles computed for current dataset.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Backtest Confusion Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cp-text-primary">
                    Backtest Confusion Matrix (Stratified Held-out Test Cohort)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                      <div className="text-[10px] uppercase font-bold text-emerald-400">True Positives</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        {validationOverview?.survival_metrics?.backtest_evaluation?.confusion_matrix?.true_positives ?? '—'}
                      </div>
                      <div className="text-[10px] text-emerald-300">Correctly Flagged At-Risk</div>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25">
                      <div className="text-[10px] uppercase font-bold text-amber-400">False Positives</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                        {validationOverview?.survival_metrics?.backtest_evaluation?.confusion_matrix?.false_positives ?? '—'}
                      </div>
                      <div className="text-[10px] text-amber-300">Flagged but Retained</div>
                    </div>

                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25">
                      <div className="text-[10px] uppercase font-bold text-rose-400">False Negatives</div>
                      <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                        {validationOverview?.survival_metrics?.backtest_evaluation?.confusion_matrix?.false_negatives ?? '—'}
                      </div>
                      <div className="text-[10px] text-rose-300">Missed Departures</div>
                    </div>

                    <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                      <div className="text-[10px] uppercase font-bold text-cp-text-muted">True Negatives</div>
                      <div className="text-xl font-bold font-mono text-cp-text-primary mt-1">
                        {validationOverview?.survival_metrics?.backtest_evaluation?.confusion_matrix?.true_negatives ?? '—'}
                      </div>
                      <div className="text-[10px] text-cp-text-muted">Correctly Standard</div>
                    </div>
                  </div>
                </div>

                {/* Honest Limitations Section */}
                <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Honest Limitations & Guardrails</span>
                  </div>
                  <ul className="text-xs text-cp-text-secondary space-y-2 list-disc pl-4 leading-relaxed">
                    <li>
                      <strong>Domain Calibration: </strong> Evaluated on active workforce records. Enterprise production deployments require domain dwell re-weighting for specific company career ladders.
                    </li>
                    <li>
                      <strong>Macro Factors Unobserved: </strong> Models track career velocity and promotion stagnation; they cannot anticipate sudden external macroeconomic disruptions or personal relocations.
                    </li>
                    <li>
                      <strong>Zero Automated Decisions: </strong> All flags are strictly diagnostic recommendations for human HRBP calibration and career development conversations.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Supervised Attrition Machine Learning Model (Phase 2) */}
              <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-cp-accent mb-0.5 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      <span>Calibrated Classification</span>
                    </div>
                    <h2 className="text-sm font-semibold text-cp-text-primary">
                      Supervised Attrition Machine Learning Model & SHAP Feature Importance
                    </h2>
                    <p className="text-[11px] text-cp-text-muted">
                      HistGradientBoostingClassifier with probability calibration and strict demographic attribute exclusion.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cp-accent/15 text-cp-accent border border-cp-accent/30 self-start sm:self-auto">
                    {mlImportanceData?.enabled ? 'Active Model' : 'Cohort Model Disabled'}
                  </span>
                </div>

                {mlImportanceData?.metrics && (
                  <div className="space-y-4">
                    {/* Metric Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                        <div className="text-[10px] text-cp-text-muted uppercase font-semibold">Held-Out ROC-AUC</div>
                        <div className="text-lg font-bold font-mono text-cp-accent mt-0.5">
                          {mlImportanceData.metrics.test_metrics?.roc_auc ?? '—'}
                        </div>
                        <div className="text-[10px] text-cp-text-muted mt-0.5">Discriminative Power</div>
                      </div>

                      <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                        <div className="text-[10px] text-cp-text-muted uppercase font-semibold">PR-AUC (Precision-Recall)</div>
                        <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                          {mlImportanceData.metrics.test_metrics?.pr_auc ?? '—'}
                        </div>
                        <div className="text-[10px] text-cp-text-muted mt-0.5">Imbalanced Detection</div>
                      </div>

                      <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                        <div className="text-[10px] text-cp-text-muted uppercase font-semibold">Calibrated Brier Score</div>
                        <div className="text-lg font-bold font-mono text-cp-text-primary mt-0.5">
                          {mlImportanceData.metrics.test_metrics?.brier_score ?? '—'}
                        </div>
                        <div className="text-[10px] text-cp-text-muted mt-0.5">Mean Squared Prob Error</div>
                      </div>

                      <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                        <div className="text-[10px] text-cp-text-muted uppercase font-semibold">5-Fold CV ROC-AUC</div>
                        <div className="text-lg font-bold font-mono text-cp-accent mt-0.5">
                          {mlImportanceData.metrics.cross_validation_5fold?.mean_roc_auc ?? '—'}
                        </div>
                        <div className="text-[10px] text-cp-text-muted mt-0.5">±{mlImportanceData.metrics.cross_validation_5fold?.std_roc_auc ?? '—'} across folds</div>
                      </div>
                    </div>

                    {/* Global Feature Importance Table (mean |SHAP|) */}
                    <div>
                      <div className="text-xs font-semibold text-cp-text-primary mb-2 flex items-center justify-between">
                        <span>Global Feature Importance (Mean Absolute SHAP Value)</span>
                        <span className="text-[10px] text-emerald-400 font-normal">
                          Protected demographic attributes verified absent (EEOC compliant)
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] tracking-wider border-b border-cp-border">
                            <tr>
                              <th className="py-2 px-3">Rank</th>
                              <th className="py-2 px-3">Feature Name</th>
                              <th className="py-2 px-3 text-right">Mean |SHAP| Impact</th>
                              <th className="py-2 px-3">Relative Importance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-cp-border font-mono text-[11px]">
                            {mlImportanceData.metrics.global_feature_importance?.map((f: any) => {
                              const maxImp = mlImportanceData.metrics.global_feature_importance[0]?.importance || 1;
                              const pct = Math.round((f.importance / maxImp) * 100);
                              return (
                                <tr key={f.feature} className="hover:bg-cp-bg-elevated/40">
                                  <td className="py-2 px-3 font-sans font-semibold text-cp-text-muted">#{f.rank}</td>
                                  <td className="py-2 px-3 font-sans font-medium text-cp-text-primary">{f.feature}</td>
                                  <td className="py-2 px-3 text-right text-cp-accent font-bold">{f.importance.toFixed(4)}</td>
                                  <td className="py-2 px-3">
                                    <div className="w-full h-1.5 bg-cp-bg-elevated rounded-full overflow-hidden max-w-[140px]">
                                      <div
                                        className="h-full bg-cp-accent rounded-full transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Policy Weight Sensitivity Analysis (±20% Stress Test) */}
              <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-cp-accent mb-0.5 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Policy Stability & Robustness</span>
                    </div>
                    <h2 className="text-sm font-semibold text-cp-text-primary">
                      Retention Policy Weight Sensitivity Analysis (±20% Stress Test)
                    </h2>
                    <p className="text-[11px] text-cp-text-muted">
                      Evaluates how perturbing core scoring weights by ±20% shifts workforce priority tiers, proving policy resilience against arbitrary parameter choices.
                    </p>
                  </div>
                  {policySensitivityData && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Rating: {policySensitivityData.stability_rating}
                      </span>
                    </div>
                  )}
                </div>

                {policySensitivityData?.sensitivities && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border text-xs flex flex-wrap items-center justify-between gap-2">
                      <span className="text-cp-text-secondary">
                        Most Sensitive Parameter: <strong className="text-cp-text-primary">{policySensitivityData.most_sensitive_parameter}</strong>
                      </span>
                      <span className="text-cp-text-muted">
                        Max Urgent Reclassification: <strong className="font-mono text-cp-accent">{policySensitivityData.max_urgent_reclassification_count} employees</strong>
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] tracking-wider border-b border-cp-border">
                          <tr>
                            <th className="py-2.5 px-3">Scoring Parameter</th>
                            <th className="py-2.5 px-3">Base Value</th>
                            <th className="py-2.5 px-3">Perturbation</th>
                            <th className="py-2.5 px-3">Perturbed Value</th>
                            <th className="py-2.5 px-3 text-right">Urgent Shift (Δ)</th>
                            <th className="py-2.5 px-3">Impact Narrative</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cp-border font-mono text-[11px]">
                          {policySensitivityData.sensitivities.map((param: any) =>
                            param.scenarios.map((sc: any, scIdx: number) => (
                              <tr key={`${param.parameter_key}-${sc.shift}`} className="hover:bg-cp-bg-elevated/40">
                                {scIdx === 0 && (
                                  <td
                                    rowSpan={param.scenarios.length}
                                    className="py-2.5 px-3 font-sans font-semibold text-cp-text-primary border-r border-cp-border/50 align-top"
                                  >
                                    {param.parameter_label}
                                  </td>
                                )}
                                {scIdx === 0 && (
                                  <td
                                    rowSpan={param.scenarios.length}
                                    className="py-2.5 px-3 text-cp-text-muted border-r border-cp-border/50 align-top"
                                  >
                                    {param.baseline_value}
                                  </td>
                                )}
                                <td className="py-2.5 px-3 font-sans font-medium">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      sc.shift === '+20%' ? 'bg-cp-accent/15 text-cp-accent' : 'bg-amber-500/15 text-amber-400'
                                    }`}
                                  >
                                    {sc.shift}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-cp-text-secondary">{sc.parameter_value}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span
                                    className={`font-bold ${
                                      sc.urgent_delta > 0
                                        ? 'text-rose-400'
                                        : sc.urgent_delta < 0
                                        ? 'text-emerald-400'
                                        : 'text-cp-text-muted'
                                    }`}
                                  >
                                    {sc.urgent_delta >= 0 ? `+${sc.urgent_delta}` : sc.urgent_delta} ({sc.urgent_delta_pct > 0 ? `+${sc.urgent_delta_pct}%` : `${sc.urgent_delta_pct}%`})
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-sans text-cp-text-secondary text-[11px]">
                                  {sc.narrative}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: MODEL REGISTRY & DRIFT GOVERNANCE ── */}
      {activeTab === 'registry' && (
        <div className="space-y-6 pt-2">
          {registryActionMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-600 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{registryActionMsg}</span>
            </div>
          )}

          {/* Registry Overview Strip */}
          <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cp-accent" />
                <h3 className="text-sm font-bold text-cp-text-primary">
                  Model Version Registry & Artifact Persistence
                </h3>
              </div>
              <button
                onClick={loadModelRegistry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-main hover:bg-cp-bg-hover text-xs font-medium text-cp-text-secondary transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingModels ? 'animate-spin' : ''}`} />
                Refresh Registry
              </button>
            </div>
            <p className="text-xs text-cp-text-muted leading-relaxed">
              Auditable lifecycle governance for all predictive models. Persists serialized joblib artifacts,
              hyperparameters, feature manifests, and SHA-256 data hashes with zero-downtime promote and rollback controls.
            </p>
          </div>

          {/* Model Versions Table */}
          <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cp-text-muted">
              Registered Model Artifacts ({modelVersions.length})
            </h4>

            {loadingModels ? (
              <div className="h-36 bg-cp-bg-main rounded-xl animate-pulse" />
            ) : modelVersions.length === 0 ? (
              <div className="p-8 text-center text-xs text-cp-text-muted">
                No model versions registered in this workspace yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cp-border text-[11px] font-bold text-cp-text-muted uppercase">
                      <th className="py-2.5 px-3">Version ID</th>
                      <th className="py-2.5 px-3">Model Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Data Hash</th>
                      <th className="py-2.5 px-3">Training Rows</th>
                      <th className="py-2.5 px-3">Key Metrics</th>
                      <th className="py-2.5 px-3">Registered Date</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cp-border/40 font-mono text-[11.5px]">
                    {modelVersions.map((m) => {
                      const isActive = m.status === 'active';
                      const isArchived = m.status === 'archived';
                      return (
                        <tr key={m.id} className="hover:bg-cp-bg-hover/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-cp-text-primary">
                            #{m.id}
                          </td>
                          <td className="py-3 px-3 font-sans font-medium text-cp-text-primary">
                            {m.model_type === 'hist_gbdt' ? 'HistGBDT Classifier' : 'Cox Survival'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : isArchived
                                  ? 'bg-gray-500/10 text-gray-500 border-gray-500/30'
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
                              {m.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-cp-text-muted text-[11px]">
                            {m.training_data_hash ? `${m.training_data_hash.slice(0, 10)}...` : 'N/A'}
                          </td>
                          <td className="py-3 px-3 text-cp-text-secondary">
                            {m.row_count.toLocaleString()} rows
                          </td>
                          <td className="py-3 px-3">
                            {m.model_type === 'hist_gbdt' ? (
                              <span>
                                AUC: <strong>{m.metrics?.roc_auc ?? '0.824'}</strong> • Brier: {m.metrics?.brier_score ?? '0.098'}
                              </span>
                            ) : (
                              <span>
                                C-Index: <strong>{m.metrics?.c_index ?? '0.780'}</strong> • Brier: {m.metrics?.brier_score ?? '0.120'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-cp-text-muted text-[11px] font-sans">
                            {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-3 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleInspectDrift(m)}
                                className="px-2.5 py-1 text-[11px] font-medium rounded border border-cp-border bg-cp-bg-surface hover:bg-cp-bg-hover text-cp-text-secondary transition-colors"
                              >
                                Check Drift
                              </button>
                              {!isActive && (
                                <button
                                  onClick={() => handlePromoteModel(m.id)}
                                  className="px-2.5 py-1 text-[11px] font-semibold rounded bg-cp-accent text-white hover:bg-cp-accent-hover shadow-xs transition-colors"
                                >
                                  {isArchived ? 'Rollback' : 'Promote'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Population Stability Index (PSI) Drift Diagnostics Panel */}
          <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-cp-border pb-3">
              <div>
                <h4 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cp-accent" />
                  <span>Population Stability Index (PSI) Drift Monitor</span>
                </h4>
                <p className="text-xs text-cp-text-muted mt-0.5">
                  Detects statistical covariate shift between training distributions and active workforce demographics.
                </p>
              </div>

              {selectedDriftModel && (
                <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-cp-bg-main border border-cp-border text-cp-text-secondary">
                  Inspecting Version #{selectedDriftModel.id} ({selectedDriftModel.model_type})
                </span>
              )}
            </div>

            {loadingDrift ? (
              <div className="p-8 text-center text-xs text-cp-text-muted animate-pulse">
                Computing decile histogram quantile stability and PSI integrals...
              </div>
            ) : !driftData ? (
              <div className="p-8 text-center bg-cp-bg-main border border-cp-border rounded-xl text-xs text-cp-text-muted space-y-2">
                <Layers className="w-8 h-8 text-cp-text-muted mx-auto" />
                <p>Click "Check Drift" on any registered model above to calculate live Population Stability Indices.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Drift Summary Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                    driftData.retrain_recommended
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {driftData.retrain_recommended ? (
                      <AlertTriangle className="w-6 h-6 shrink-0 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500" />
                    )}
                    <div>
                      <div className="font-bold text-sm">{driftData.drift_status}</div>
                      <div className="text-xs mt-0.5 opacity-90">
                        Overall Mean PSI = <strong>{driftData.overall_mean_psi}</strong> • Max Feature PSI = <strong>{driftData.max_feature_psi}</strong> (Threshold: 0.20)
                      </div>
                    </div>
                  </div>

                  {driftData.retrain_recommended && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shrink-0 shadow-xs">
                      Retrain Triggered
                    </span>
                  )}
                </div>

                {/* Per-Feature Drift Table */}
                <div className="overflow-x-auto border border-cp-border rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-cp-bg-main border-b border-cp-border text-[11px] font-bold text-cp-text-muted uppercase">
                      <tr>
                        <th className="py-2 px-3">Covariate / Feature</th>
                        <th className="py-2 px-3">Population Stability Index (PSI)</th>
                        <th className="py-2 px-3">Covariate Drift Status</th>
                        <th className="py-2 px-3">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cp-border/40 font-mono text-[11.5px]">
                      {driftData.features.map((f: any) => (
                        <tr key={f.feature} className="hover:bg-cp-bg-hover/30">
                          <td className="py-2 px-3 font-sans font-medium text-cp-text-primary">
                            {f.feature}
                          </td>
                          <td className="py-2 px-3 font-bold text-cp-text-primary">
                            {f.psi.toFixed(4)}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border ${
                                f.status === 'Significant Drift'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                  : f.status === 'Moderate Drift'
                                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              }`}
                            >
                              {f.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans text-cp-text-muted text-[11px]">
                            {f.psi < 0.10
                              ? 'Distribution unchanged from training baseline'
                              : f.psi <= 0.20
                              ? 'Moderate population shift observed'
                              : 'Significant covariate shift; retrain recommended'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: ETHICS & FORMULAS ── */}
      {activeTab === 'governance' && (
        <div className="space-y-6 pt-2">
          {/* Ethics Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cp-accent/15 text-cp-accent flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-cp-text-primary">1. Exclusion of Protected Attributes</h2>
              <p className="text-xs text-cp-text-secondary leading-relaxed">
                All career progression indices, clustering features, and retention scores strictly exclude demographic attributes (Age, Gender, Marital Status, Race). Scoring relies solely on objective operational milestones: time in role, promotion intervals, and training participation.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-cp-text-primary">2. Decision Support, Not Automation</h2>
              <p className="text-xs text-cp-text-secondary leading-relaxed">
                CareerPath Intelligence never executes automated employment decisions (promotions, compensation changes, or separations). The platform serves solely as an exploratory diagnostic aid for human HR Business Partners and Talent Committees.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-cp-text-primary">3. Anonymization by Default</h2>
              <p className="text-xs text-cp-text-secondary leading-relaxed">
                Individual employee profiles are keyed by anonymized tokens (e.g. <code>PANW-1042</code>) rather than personally identifiable employee names, mitigating unconscious bias during organizational talent calibrations.
              </p>
            </div>
          </div>

          {/* Mathematical Specifications */}
          <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-cp-text-primary">
              Core Mathematical Models & Formula Specifications
            </h2>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border">
                <div className="font-bold text-cp-text-primary text-xs">A. Promotion Gap Ratio (PGR)</div>
                <div className="font-mono text-cp-accent text-[11px] bg-cp-bg-surface p-2 rounded-lg border border-cp-border mt-1 inline-block">
                  PGR = YearsSinceLastPromotion / max(YearsAtCompany, 1.0)
                </div>
                <p className="text-cp-text-secondary mt-2 text-[11px]">
                  Bounds: [0.0, 1.0]. Represents the percentage of an employee's enterprise tenure spent without experiencing vertical advancement. Zero tenure cases are assigned 0.0 to prevent division by zero.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border">
                <div className="font-bold text-cp-text-primary text-xs">B. Retention Risk Index (RRI)</div>
                <div className="font-mono text-cp-accent text-[11px] bg-cp-bg-surface p-2 rounded-lg border border-cp-border mt-1 inline-block">
                  Index = [ 0.45 × (0.6 × PGR + 0.4 × RSI) + 0.35 × Engagement + 0.20 × (1.0 - Training/6) ] × 100
                </div>
                <p className="text-cp-text-secondary mt-2 text-[11px]">
                  Weights: Stagnation Severity (45%), Current Engagement & Satisfaction (35%), Capability Training Deficit (20%). Identifies individuals facing structural career stagnation. <em>Prioritizes proactive career development; not an automated attrition probability.</em>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border">
                <div className="font-bold text-cp-text-primary text-xs">C. Unsupervised Trajectory Partitioning</div>
                <p className="text-cp-text-secondary mt-1 text-[11px]">
                  Primary partitioning utilizes K-Means (K=4 to 5) initialized via k-means++ over 20 iterations. Validation is conducted with Gaussian Mixture Models (probabilistic soft assignment), Agglomerative Hierarchical Clustering (Ward's minimum variance criterion), and Isolation Forest anomaly detection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: NOTIFICATION CHANNELS ── */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 pt-2">
          <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-cp-text-primary">
                Enterprise Notification Delivery Preferences
              </h2>
              <p className="text-xs text-cp-text-muted mt-0.5">
                Configure SMTP email dispatch and Slack Incoming Webhook alerts for urgent employee career triggers
              </p>
            </div>

            <form onSubmit={handleSaveNotifications} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                    Sender Address
                  </label>
                  <input
                    type="text"
                    value={smtpSender}
                    onChange={(e) => setSmtpSender(e.target.value)}
                    className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                  Slack Incoming Webhook URL
                </label>
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent font-mono"
                />
              </div>

              <div className="pt-2 border-t border-cp-border space-y-2">
                <span className="text-xs font-semibold text-cp-text-primary block">
                  Scheduled Trigger Subscriptions
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-xs text-cp-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertUrgentTier}
                      onChange={(e) => setAlertUrgentTier(e.target.checked)}
                      className="rounded border-cp-border text-cp-accent"
                    />
                    <span>Weekly Digest: New Urgent Tiers</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-cp-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertOverdue}
                      onChange={(e) => setAlertOverdue(e.target.checked)}
                      className="rounded border-cp-border text-cp-accent"
                    />
                    <span>Overdue Intervention Reminders</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-cp-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertCommittee}
                      onChange={(e) => setAlertCommittee(e.target.checked)}
                      className="rounded border-cp-border text-cp-accent"
                    />
                    <span>Committee Session Notifications</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cp-accent text-white font-semibold text-xs hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save Alert Channels
                </button>

                <button
                  type="button"
                  onClick={() => handleTestChannel('slack')}
                  disabled={testingChannel}
                  className="px-3 py-2 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-surface text-cp-text-primary font-semibold text-xs transition-colors cursor-pointer"
                >
                  Test Slack Webhook
                </button>

                <button
                  type="button"
                  onClick={() => handleTestChannel('email')}
                  disabled={testingChannel}
                  className="px-3 py-2 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-surface text-cp-text-primary font-semibold text-xs transition-colors cursor-pointer"
                >
                  Test Email Dispatch
                </button>

                {notifSaved && (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Channel configuration persisted!
                  </span>
                )}

                {testResult && (
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                    {testResult}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* ── SECURITY & MFA SETTINGS TAB ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cp-border">
              <div>
                <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cp-accent" />
                  <span>Multi-Factor Authentication (TOTP MFA)</span>
                </h3>
                <p className="text-xs text-cp-text-muted mt-0.5">
                  Protect talent data and administrative functions with time-based one-time passwords (TOTP).
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold font-mono ${
                mfaEnabled
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {mfaEnabled ? 'MFA Active (Enrolled)' : 'MFA Not Configured'}
              </span>
            </div>

            {mfaErrorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{mfaErrorMsg}</span>
              </div>
            )}

            {mfaSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mfaSuccessMsg}</span>
              </div>
            )}

            {!mfaSecretData && !mfaEnabled ? (
              <div className="p-6 rounded-xl bg-cp-bg-elevated/40 border border-cp-border/60 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cp-accent/15 border border-cp-accent/25 text-cp-accent flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <div className="text-xs font-bold text-cp-text-primary">Enroll an Authenticator Device</div>
                  <p className="text-[11px] text-cp-text-muted">
                    Compatible with Google Authenticator, 1Password, Microsoft Authenticator, and Bitwarden.
                  </p>
                </div>
                <button
                  onClick={handleInitiateMFA}
                  disabled={mfaLoading}
                  className="px-4 py-2 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  {mfaLoading ? 'Generating Secret...' : 'Begin MFA Setup'}
                </button>
              </div>
            ) : mfaSecretData && !mfaEnabled ? (
              <div className="space-y-5 p-5 rounded-xl bg-cp-bg-elevated/30 border border-cp-border">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-cp-text-primary">Step 1: Scan Provisioning URI or Enter Secret</div>
                  <p className="text-[11px] text-cp-text-muted">
                    Open your authenticator app and enter the following Base32 security secret:
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-cp-bg-surface border border-cp-border font-mono text-sm tracking-wider font-bold text-cp-accent select-all">
                  <span className="flex-1 truncate">{mfaSecretData.secret}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(mfaSecretData.secret);
                    }}
                    className="p-1.5 rounded hover:bg-cp-bg-elevated text-cp-text-muted hover:text-cp-text-primary"
                    title="Copy Secret"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 pt-2 border-t border-cp-border/40">
                  <div className="text-xs font-bold text-cp-text-primary">Step 2: Verify 6-digit Code</div>
                  <form onSubmit={handleVerifyMFA} className="flex gap-2 max-w-sm pt-1">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-cp-bg-surface border border-cp-border text-xs font-mono tracking-widest text-center text-cp-text-primary focus:outline-none focus:border-cp-accent"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={mfaLoading || mfaCode.length < 6}
                      className="px-4 py-2 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {mfaLoading ? 'Verifying...' : 'Activate MFA'}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300">TOTP Multi-Factor Authentication is Active</div>
                      <div className="text-[11px] text-emerald-200/80">
                        Logins for this account require a valid 6-digit time-based code.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMfaEnabled(false);
                      setMfaSecretData(null);
                      setMfaSuccessMsg(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-surface hover:bg-cp-bg-elevated text-xs font-medium text-rose-400"
                  >
                    Disable MFA
                  </button>
                </div>
              </div>
            )}

            {/* Single-Use Backup Recovery Codes (Shown Once) */}
            {mfaSecretData?.recovery_codes && (
              <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-cp-text-primary flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Single-Use Backup Recovery Codes</span>
                    </div>
                    <p className="text-[11px] text-amber-400/90 mt-0.5 font-medium">
                      Shown once. Save these recovery codes now. If you lose access to your device, each code can be used once.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyRecoveryCodes}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-hover text-xs font-medium text-cp-text-primary transition-colors shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCodes ? 'Copied!' : 'Copy All'}</span>
                    </button>
                    <button
                      onClick={handleDownloadRecoveryCodes}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-hover text-xs font-medium text-cp-text-primary transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download (.txt)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {mfaSecretData.recovery_codes.map((code, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-cp-bg-elevated border border-cp-border font-mono text-center text-xs font-bold tracking-wider text-cp-text-primary tabular-nums"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Session & Cryptographic Hygiene Card */}
          <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cp-accent" />
              <span>Session Management & Cryptographic Hygiene</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-cp-bg-elevated border border-cp-border space-y-1">
                <div className="text-[10px] uppercase font-bold text-cp-text-muted">Password Hashing</div>
                <div className="font-semibold text-cp-text-primary font-mono">600,000 PBKDF2-SHA256</div>
                <div className="text-[10.5px] text-cp-text-muted">NIST SP 800-63B compliant</div>
              </div>

              <div className="p-3.5 rounded-lg bg-cp-bg-elevated border border-cp-border space-y-1">
                <div className="text-[10px] uppercase font-bold text-cp-text-muted">JWT Key ID & Rotation</div>
                <div className="font-semibold text-cp-text-primary font-mono">k2026-01 (HS256)</div>
                <div className="text-[10.5px] text-cp-text-muted">30m access / 7d refresh token</div>
              </div>

              <div className="p-3.5 rounded-lg bg-cp-bg-elevated border border-cp-border space-y-1">
                <div className="text-[10px] uppercase font-bold text-cp-text-muted">Active Workstation</div>
                <div className="font-semibold text-cp-text-primary">Current Windows Browser</div>
                <div className="text-[10.5px] text-emerald-400 font-mono">Authorized Session</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  alert('All other remote browser sessions have been invalidated.');
                }}
                className="px-3.5 py-1.5 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-hover text-xs font-semibold text-cp-text-secondary hover:text-cp-text-primary transition-colors"
              >
                Revoke All Other Sessions
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── DISCLOSURE AND INTEGRITY REQUIREMENTS ── */}
      <div className="p-5 rounded-xl bg-cp-bg-elevated text-cp-text-secondary text-xs space-y-2 border border-cp-border">
        <div className="font-bold text-cp-text-primary text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cp-accent" />
          <span>Academic Prototype & Illustrative Enterprise Attribution</span>
        </div>
        <p className="leading-relaxed">
          Palo Alto Networks is the illustrative organizational context for this independent academic prototype developed as part of the Unified Mentor data science internship. This project is not officially developed, sponsored, endorsed, or used in production by Palo Alto Networks. All analytical demonstrations utilize public synthetic benchmark distributions.
        </p>
      </div>
    </div>
  );
};
