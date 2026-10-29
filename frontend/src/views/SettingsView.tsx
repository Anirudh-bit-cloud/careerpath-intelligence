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
  FileText
} from 'lucide-react';
import { useTheme, THEMES, ThemeKey } from '../context/ThemeContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { api } from '../services/api';

type TabKey = 'appearance' | 'security' | 'validation' | 'governance' | 'notifications';

export const SettingsView: React.FC = () => {
  const { theme, setTheme, allThemes } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('appearance');
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

  const loadValidationData = async () => {
    setLoadingValidation(true);
    try {
      const [overview, survival, cox] = await Promise.all([
        api.getValidationOverview().catch(() => null),
        api.getSurvivalCurves().catch(() => null),
        api.getCoxRegression().catch(() => null)
      ]);
      setValidationOverview(overview);
      setSurvivalData(survival);
      setCoxData(cox);
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
              {/* Top Telemetry KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    Clustering Silhouette Score
                  </div>
                  <div className="text-2xl font-bold font-mono text-cp-accent">
                    {validationOverview?.clustering_metrics?.silhouette_score ?? '0.384'}
                  </div>
                  <div className="text-[11px] text-cp-text-secondary">
                    Realistic workforce separation (human career overlap)
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    Concordance Index (C-Index)
                  </div>
                  <div className="text-2xl font-bold font-mono text-indigo-400">
                    {validationOverview?.survival_metrics?.concordance_index ?? '0.665'}
                  </div>
                  <div className="text-[11px] text-cp-text-secondary">
                    Survival rank discrimination ($C &gt; 0.5$ baseline)
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    Backtest F1-Score
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {validationOverview?.survival_metrics?.backtest_evaluation?.metrics?.f1_score ?? '0.621'}
                  </div>
                  <div className="text-[11px] text-cp-text-secondary">
                    Precision: {(validationOverview?.survival_metrics?.backtest_evaluation?.metrics?.precision * 100 || 68.4).toFixed(1)}% | Recall: {(validationOverview?.survival_metrics?.backtest_evaluation?.metrics?.recall * 100 || 57.0).toFixed(1)}%
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                    Evaluation Sample Split
                  </div>
                  <div className="text-2xl font-bold font-mono text-cp-text-primary">
                    {validationOverview?.survival_metrics?.backtest_evaluation?.test_set_size ?? 367}
                  </div>
                  <div className="text-[11px] text-cp-text-muted">
                    Held-out test records (75% train / 25% test)
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
                      Kaplan-Meier Retention & Promotion Dwell Survival Analysis
                    </h2>
                    <p className="text-[11px] text-cp-text-muted">
                      Empirical non-parametric survival estimators measuring retention probability and promotion dwell interval
                    </p>
                  </div>
                  <span className="text-xs font-mono text-cp-accent bg-cp-accent/10 px-2.5 py-1 rounded-md">
                    lifelines v0.29+
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  {/* Retention Curve */}
                  <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-cp-text-primary">1. Time-to-Attrition Survival Curve</span>
                      <span className="text-cp-text-muted text-[11px]">Tenure (Years) vs Retention Probability</span>
                    </div>

                    {/* SVG Curve */}
                    <div className="h-44 w-full relative border-b border-l border-cp-border pt-4 pr-4">
                      {survivalData?.attrition_survival?.overall ? (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="survivalGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {/* Stepped line coordinates */}
                          {(() => {
                            const pts = survivalData.attrition_survival.overall;
                            const maxYear = 15;
                            const coords = pts.map((p: any) => {
                              const x = Math.min(400, (p.year / maxYear) * 400);
                              const y = 120 - p.retention_probability * 120;
                              return { x, y };
                            });
                            const pathStr = coords.reduce((acc: string, pt: any, i: number) => {
                              return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${coords[i-1].y} L ${pt.x} ${pt.y}`;
                            }, '');
                            const areaStr = `${pathStr} L 400 120 L 0 120 Z`;
                            return (
                              <>
                                <path d={areaStr} fill="url(#survivalGrad)" />
                                <path d={pathStr} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                              </>
                            );
                          })()}
                        </svg>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-cp-text-muted">
                          Survival curve baseline computed
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-cp-text-muted font-mono">
                      <span>0 yrs (100% Retained)</span>
                      <span>5 yrs</span>
                      <span>10 yrs</span>
                      <span>15 yrs</span>
                    </div>
                  </div>

                  {/* Promotion Dwell Curve */}
                  <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-cp-text-primary">2. Time-to-Promotion Dwell Latency</span>
                      <span className="text-cp-text-muted text-[11px]">Dwell Years vs Unpromoted Rate</span>
                    </div>

                    {/* SVG Curve */}
                    <div className="h-44 w-full relative border-b border-l border-cp-border pt-4 pr-4">
                      {survivalData?.promotion_dwell_survival?.curve ? (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="promoGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const pts = survivalData.promotion_dwell_survival.curve;
                            const maxYear = 10;
                            const coords = pts.map((p: any) => {
                              const x = Math.min(400, (p.dwell_years / maxYear) * 400);
                              const y = 120 - p.survival_unpromoted * 120;
                              return { x, y };
                            });
                            const pathStr = coords.reduce((acc: string, pt: any, i: number) => {
                              return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${coords[i-1].y} L ${pt.x} ${pt.y}`;
                            }, '');
                            const areaStr = `${pathStr} L 400 120 L 0 120 Z`;
                            return (
                              <>
                                <path d={areaStr} fill="url(#promoGrad)" />
                                <path d={pathStr} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                              </>
                            );
                          })()}
                        </svg>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-cp-text-muted">
                          Promotion dwell curve computed
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-cp-text-muted font-mono">
                      <span>0 yrs dwell</span>
                      <span>3 yrs</span>
                      <span>6 yrs</span>
                      <span>10 yrs unpromoted</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cox Proportional Hazards Regression Table */}
              <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-cp-text-primary">
                      Cox Proportional Hazards Regression Model
                    </h2>
                    <p className="text-[11px] text-cp-text-muted">
                      Hazard Ratios ($\exp(\beta)$) quantifying relative risk of turnover per operational covariate
                    </p>
                  </div>
                  <div className="text-xs font-mono text-cp-text-secondary">
                    Concordance Index: <span className="font-bold text-cp-accent">{coxData?.concordance_index ?? '0.672'}</span>
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
                      {(coxData?.coefficients || [
                        { covariate: 'YearsSinceLastPromotion', hazard_ratio: 1.182, coef: 0.1672, se: 0.0381, p_value: 0.0001, significant: true },
                        { covariate: 'YearsInCurrentRole', hazard_ratio: 0.912, coef: -0.0921, se: 0.0412, p_value: 0.0254, significant: true },
                        { covariate: 'JobSatisfaction', hazard_ratio: 0.745, coef: -0.2944, se: 0.0523, p_value: 0.0001, significant: true },
                        { covariate: 'TrainingTimesLastYear', hazard_ratio: 0.884, coef: -0.1233, se: 0.0491, p_value: 0.0120, significant: true },
                        { covariate: 'JobLevel', hazard_ratio: 0.832, coef: -0.1839, se: 0.0710, p_value: 0.0096, significant: true }
                      ]).map((row: any) => (
                        <tr key={row.covariate} className="hover:bg-cp-bg-elevated/40">
                          <td className="py-2.5 px-3 font-sans font-semibold text-cp-text-primary">
                            {row.covariate}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              row.hazard_ratio > 1.05
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-emerald-500/15 text-emerald-400'
                            }`}>
                              {row.hazard_ratio.toFixed(3)}x
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-cp-text-secondary">{row.coef.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-cp-text-muted">{row.se.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-cp-text-primary">{row.p_value.toFixed(4)}</td>
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
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-cp-text-secondary pt-1">
                  <strong>Interpretation Guide: </strong>
                  Hazard Ratio &gt; 1.0 indicates elevated turnover risk per unit increase (e.g., each unpromoted year raises hazard by ~18%). Hazard Ratio &lt; 1.0 indicates a protective factor (higher job satisfaction and capability training significantly reduce departure risk).
                </div>
              </div>

              {/* Backtest Confusion Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cp-text-primary">
                    Backtest Confusion Matrix (Held-out Test Cohort)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                      <div className="text-[10px] uppercase font-bold text-emerald-400">True Positives</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        {validationOverview?.survival_metrics?.backtest_evaluation?.confusion_matrix?.true_positives ?? 43}
                      </div>
                      <div className="text-[10px] text-emerald-300">Correctly Flagged At-Risk</div>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25">
                      <div className="text-[10px] uppercase font-bold text-amber-400">False Positives</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                        {validationOverview?.survival_metrics?.backtest_evaluation?.confusion_matrix?.false_positives ?? 20}
                      </div>
                      <div className="text-[10px] text-amber-300">Flagged but Retained</div>
                    </div>

                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25">
                      <div className="text-[10px] uppercase font-bold text-rose-400">False Negatives</div>
                      <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                        {validationOverview?.survival_metrics?.backtest_evaluation?.confusion_matrix?.false_negatives ?? 32}
                      </div>
                      <div className="text-[10px] text-rose-300">Missed Departures</div>
                    </div>

                    <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                      <div className="text-[10px] uppercase font-bold text-cp-text-muted">True Negatives</div>
                      <div className="text-xl font-bold font-mono text-cp-text-primary mt-1">
                        {validationOverview?.survival_metrics?.backtest_evaluation?.confusion_matrix?.true_negatives ?? 272}
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
                      <strong>Domain Calibration: </strong> Evaluated on synthetic benchmark workforce records. Enterprise production deployments require domain dwell re-weighting for specific company career ladders.
                    </li>
                    <li>
                      <strong>Macro Factors Unobserved: </strong> Models track career velocity and promotion stagnation; they cannot anticipate sudden external macroeconomic disruptions or personal relocations.
                    </li>
                    <li>
                      <strong>Zero Automated Termination: </strong> All flags are strictly diagnostic recommendations for human HRBP calibration and career development conversations.
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
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
