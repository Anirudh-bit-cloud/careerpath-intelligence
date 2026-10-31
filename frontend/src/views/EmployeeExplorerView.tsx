import React, { useState, useEffect } from 'react';
import {
  UserSearch,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
  GraduationCap,
  Clock,
  Target,
  Sparkles,
  Save,
  CheckCircle2,
  Calendar,
  FileEdit,
  ArrowLeft,
  RotateCcw,
  Zap,
  ShieldAlert,
  Scale,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';
import { EmployeeRecord, Intervention } from '../types';

interface EmployeeExplorerViewProps {
  initialEmployeeId?: string | null;
  onClearInitialEmployee?: () => void;
  dataVersion?: number;
}

export const EmployeeExplorerView: React.FC<EmployeeExplorerViewProps> = ({
  initialEmployeeId,
  onClearInitialEmployee,
  dataVersion = 0
}) => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialEmployeeId || null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scoreExplanation, setScoreExplanation] = useState<any | null>(null);
  const [mlExplanation, setMlExplanation] = useState<any | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);

  // Development Plan Editor State
  const [devGoal, setDevGoal] = useState<string>('');
  const [devAction, setDevAction] = useState<string>('');
  const [devOwner, setDevOwner] = useState<string>('Talent Partner & Manager');
  const [devDate, setDevDate] = useState<string>('');
  const [devStatus, setDevStatus] = useState<string>('Planned');
  const [devNotes, setDevNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [savingPlan, setSavingPlan] = useState<boolean>(false);

  // Career What-If Simulator State
  const [simPromote, setSimPromote] = useState<boolean>(true);
  const [simLateral, setSimLateral] = useState<boolean>(false);
  const [simTrainings, setSimTrainings] = useState<number>(2);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  const handleRunSimulation = async () => {
    if (!selectedId) return;
    setSimulating(true);
    try {
      const res = await api.simulateCareer({
        employee_id: selectedId,
        promote_now: simPromote,
        lateral_move: simLateral,
        add_trainings: simTrainings
      });
      setSimulationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  // Fetch employee list
  const fetchList = async () => {
    setLoadingList(true);
    try {
      const res = await api.getPromotionGap({
        page,
        page_size: 15,
        search: search.trim() || undefined
      });
      setEmployees(res.records);
      setTotalPages(res.total_pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, dataVersion]);

  // Handle direct selection or initialEmployeeId
  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  // Fetch Profile when selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setProfileData(null);
      return;
    }

    const fetchProfile = async () => {
      setLoadingProfile(true);
      setSaveSuccess(false);
      try {
        const [p, exp, mlExp] = await Promise.all([
          api.getEmployeeProfile(selectedId),
          api.getScoreExplanation(selectedId).catch(() => null),
          api.getEmployeeMlExplanation(selectedId).catch(() => null)
        ]);
        setProfileData(p);
        setScoreExplanation(exp);
        setMlExplanation(mlExp);

        // Prepopulate plan editor
        setDevGoal(`Resolve ${p.PromotionGapCategory} Promotion Stagnation & Elevate Capability`);
        setDevAction(p.RecommendedAction || 'Conduct talent trajectory review.');
        setDevDate(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setDevStatus('Planned');
        setDevNotes(`Identified with ${p.YearsSinceLastPromotion} years since promotion and ${p.YearsInCurrentRole} years in current role.`);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [selectedId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchList();
  };

  const handleSaveDevelopmentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setSavingPlan(true);
    try {
      const newPlan: Intervention = {
        employee_id: selectedId,
        department: profileData?.Department,
        job_role: profileData?.JobRole,
        category: profileData?.RecommendedCategory || 'Career Conversation',
        status: devStatus,
        priority: profileData?.RetentionPriority || 'Urgent',
        action_plan: `${devGoal} — ${devAction}`,
        owner: devOwner,
        target_date: devDate,
        notes: devNotes
      };

      await api.createIntervention(newPlan);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      // Re-fetch profile to show updated intervention history
      const updated = await api.getEmployeeProfile(selectedId);
      setProfileData(updated);
    } catch (err) {
      alert(`Error saving development plan: ${err}`);
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── DETAIL PROFILE VIEW ── */}
      {selectedId && profileData ? (
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => {
              setSelectedId(null);
              if (onClearInitialEmployee) onClearInitialEmployee();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cp-text-secondary hover:text-cp-text-primary bg-cp-bg-surface border border-cp-border px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Employee Directory</span>
          </button>

          {/* Decision Support Only Notice */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-start gap-2.5 text-xs shadow-2xs">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold">Human-in-the-Loop Decision Support Notice:</span>
              <p className="text-[11px] text-amber-200/90">
                This dossier and all analytical metrics are strictly for managerial coaching, retention planning, and career development support. No automated employment decisions, adverse actions, or compensation reductions may be taken based solely on algorithmic indices.
              </p>
            </div>
          </div>

          {/* Profile Header Card */}
          <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-cp-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cp-accent/15 border border-cp-accent/30 text-cp-accent flex items-center justify-center font-mono font-bold text-base shadow-xs">
                  {profileData.EmployeeID.split('-')[1]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-cp-text-primary font-mono">
                      {profileData.EmployeeID}
                    </h1>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cp-accent/15 text-cp-accent border border-cp-accent/30">
                      {profileData.CareerCluster}
                    </span>
                  </div>
                  <div className="text-xs text-cp-text-muted mt-0.5">
                    {profileData.JobRole} • {profileData.Department} • Level {profileData.JobLevel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-cp-text-muted">Retention Opportunity Index</div>
                  <div className="text-xl font-bold font-mono text-rose-400">
                    {profileData.RetentionOpportunityIndex} / 100
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${
                  profileData.RetentionPriority === 'Urgent'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {profileData.RetentionPriority} Review
                </div>
              </div>
            </div>

            {/* KEY TENURE & TRAJECTORY METRICS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-5">
              <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                <div className="text-[10px] font-bold uppercase text-cp-text-muted">Company Tenure</div>
                <div className="text-lg font-bold font-mono text-cp-text-primary mt-0.5">
                  {profileData.YearsAtCompany} yrs
                </div>
                <div className="text-[10px] text-cp-text-muted">At Palo Alto Networks</div>
              </div>

              <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                <div className="text-[10px] font-bold uppercase text-cp-text-muted">In Current Role</div>
                <div className="text-lg font-bold font-mono text-cp-text-primary mt-0.5">
                  {profileData.YearsInCurrentRole} yrs
                </div>
                <div className="text-[10px] text-cp-text-muted">
                  {((profileData.RoleStagnationIndex || 0) * 100).toFixed(0)}% of tenure
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25">
                <div className="text-[10px] font-bold uppercase text-rose-400">Promotion Latency</div>
                <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                  {profileData.YearsSinceLastPromotion} yrs
                </div>
                <div className="text-[10px] text-rose-300 font-medium">
                  {((profileData.PromotionGapRatio || 0) * 100).toFixed(0)}% tenure unpromoted
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                <div className="text-[10px] font-bold uppercase text-cp-text-muted">Manager Tenure</div>
                <div className="text-lg font-bold font-mono text-cp-text-primary mt-0.5">
                  {profileData.YearsWithCurrManager} yrs
                </div>
                <div className="text-[10px] text-cp-text-muted">With current supervisor</div>
              </div>

              <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                <div className="text-[10px] font-bold uppercase text-cp-text-muted">Annual Training</div>
                <div className="text-lg font-bold font-mono text-cp-text-primary mt-0.5">
                  {profileData.TrainingTimesLastYear} sessions
                </div>
                <div className="text-[10px] text-cp-text-muted">Past 12 months</div>
              </div>

              <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                <div className="text-[10px] font-bold uppercase text-cp-text-muted">Job Satisfaction</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  {profileData.JobSatisfaction} / 4.0
                </div>
                <div className="text-[10px] text-emerald-400 font-medium">Currently engaged</div>
              </div>
            </div>
          </div>

          {/* DIAGNOSTIC SNAPSHOT & DEVELOPMENT PLAN EDITOR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waterfall Score Contribution & Counterfactual */}
            <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-cp-accent">Explainable AI</div>
                  <h2 className="text-sm font-semibold text-cp-text-primary">
                    Retention Risk Index (RRI) Waterfall & Counterfactual
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cp-accent/15 text-cp-accent border border-cp-accent/30">
                  Total RRI: {scoreExplanation?.retention_risk_index ?? (profileData.RetentionRiskIndex ?? profileData.RetentionOpportunityIndex)}/100
                </span>
              </div>

              {/* Waterfall Chart Elements */}
              <div className="space-y-3 pt-1">
                <div className="text-xs text-cp-text-muted">
                  Weighted Factor Contributions:
                </div>
                {scoreExplanation?.components ? (
                  scoreExplanation.components.map((comp: any, idx: number) => {
                    const colors = ['bg-rose-500', 'bg-amber-500', 'bg-indigo-500'];
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-cp-text-secondary font-medium">{comp.name}</span>
                          <span className="font-mono font-bold text-cp-text-primary">+{comp.contribution_points} pts</span>
                        </div>
                        <div className="w-full h-2 bg-cp-bg-elevated rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${colors[idx % colors.length]}`}
                            style={{ width: `${Math.min(100, (comp.contribution_points / 50.0) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-cp-text-muted">{comp.description}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-cp-text-muted">Loading factor breakdown...</div>
                )}
              </div>

              {/* Counterfactual Guidance Box */}
              {scoreExplanation?.counterfactual && (
                <div className="p-3.5 rounded-lg bg-cp-bg-app border border-cp-accent/30 space-y-1.5 mt-3">
                  <div className="text-[10.5px] uppercase font-bold text-cp-accent flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Counterfactual Transition Path ({scoreExplanation.counterfactual.current_tier} → {scoreExplanation.counterfactual.target_tier})</span>
                  </div>
                  <p className="text-xs text-cp-text-secondary leading-relaxed">
                    {scoreExplanation.counterfactual.explanation}
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-cp-bg-elevated border border-cp-border text-xs space-y-1.5 mt-3">
                <div className="font-bold text-cp-text-primary">Explainable Model Triggers:</div>
                <div className="text-cp-text-secondary text-[11px] leading-relaxed">
                  {profileData.RecommendationTriggers || 'Standard progression pattern'}
                </div>
                <div className="pt-2 border-t border-cp-border text-[11px] text-cp-accent font-semibold">
                  Recommended Track: {profileData.RecommendedAction}
                </div>
              </div>

              {/* Logged Interventions History */}
              {profileData.interventions && profileData.interventions.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-cp-text-primary mb-2">Saved Intervention Plans:</div>
                  <div className="space-y-2">
                    {profileData.interventions.map((item: any) => (
                      <div key={item.id} className="p-2.5 rounded-lg bg-cp-bg-elevated border border-cp-border text-[11px]">
                        <div className="flex justify-between font-semibold text-cp-text-primary">
                          <span>{item.category}</span>
                          <span className="font-mono text-cp-accent">{item.status}</span>
                        </div>
                        <div className="text-cp-text-secondary mt-0.5">{item.action_plan}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Supervised ML Attrition Model & SHAP Feature Drivers */}
            {mlExplanation && !mlExplanation.error && (
              <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cp-accent" />
                    <h2 className="text-sm font-semibold text-cp-text-primary">
                      Supervised ML Model & SHAP Drivers
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cp-accent/15 text-cp-accent border border-cp-accent/30">
                      P(Exit): {mlExplanation.ml_probability_percent}%
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                      mlExplanation.ml_risk_tier === 'Urgent'
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : mlExplanation.ml_risk_tier === 'Moderate'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {mlExplanation.ml_risk_tier} Tier
                    </span>
                  </div>
                </div>

                {/* Agreement Indicator */}
                <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  mlExplanation.agreement
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  {mlExplanation.agreement ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{mlExplanation.agreement ? 'Methodology Concurrence' : 'Methodology Disagreement — Human Review Recommended'}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30 border border-white/10">
                        RRI: {mlExplanation.rri_tier} | ML: {mlExplanation.ml_risk_tier}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {mlExplanation.disagreement_note}
                    </p>
                  </div>
                </div>

                {/* SHAP Drivers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Top Positive Drivers (Risk Factors) */}
                  <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border space-y-2">
                    <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Top Risk Drivers (SHAP +)</span>
                    </div>
                    <div className="space-y-1.5">
                      {mlExplanation.top_positive_drivers?.map((d: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-cp-text-secondary truncate max-w-[140px]">{d.feature}</span>
                          <span className="font-mono text-rose-400 font-semibold">+{d.shap_impact}</span>
                        </div>
                      ))}
                      {(!mlExplanation.top_positive_drivers || mlExplanation.top_positive_drivers.length === 0) && (
                        <div className="text-[10.5px] text-cp-text-muted italic">No strong positive risk drivers</div>
                      )}
                    </div>
                  </div>

                  {/* Top Protective Drivers (Mitigating Factors) */}
                  <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border space-y-2">
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Top Protective Factors (SHAP -)</span>
                    </div>
                    <div className="space-y-1.5">
                      {mlExplanation.top_negative_drivers?.map((d: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-cp-text-secondary truncate max-w-[140px]">{d.feature}</span>
                          <span className="font-mono text-emerald-400 font-semibold">{d.shap_impact}</span>
                        </div>
                      ))}
                      {(!mlExplanation.top_negative_drivers || mlExplanation.top_negative_drivers.length === 0) && (
                        <div className="text-[10.5px] text-cp-text-muted italic">No strong protective factors</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Governance Notice */}
                <div className="text-[10px] text-cp-text-muted border-t border-cp-border pt-2 italic">
                  {mlExplanation.governance_disclosure}
                </div>
              </div>
            )}

            {/* Development Plan Editor */}
            <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-cp-text-primary">
                    Actionable Career Development Plan
                  </h2>
                  <p className="text-[11px] text-cp-text-muted">
                    Configure tailored development interventions synchronized to enterprise database
                  </p>
                </div>
                <FileEdit className="w-4 h-4 text-cp-accent" />
              </div>

              <form onSubmit={handleSaveDevelopmentPlan} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                    Development Objective
                  </label>
                  <input
                    type="text"
                    value={devGoal}
                    onChange={(e) => setDevGoal(e.target.value)}
                    required
                    className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                    Prescribed Action Plan
                  </label>
                  <textarea
                    value={devAction}
                    onChange={(e) => setDevAction(e.target.value)}
                    rows={2}
                    required
                    className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                      Accountable Owner
                    </label>
                    <input
                      type="text"
                      value={devOwner}
                      onChange={(e) => setDevOwner(e.target.value)}
                      required
                      className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                      Target Completion Date
                    </label>
                    <input
                      type="date"
                      value={devDate}
                      onChange={(e) => setDevDate(e.target.value)}
                      className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    value={devStatus}
                    onChange={(e) => setDevStatus(e.target.value)}
                    className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent"
                  >
                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Planned">Planned</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cp-text-secondary mb-1">
                    HR & Managerial Notes
                  </label>
                  <textarea
                    value={devNotes}
                    onChange={(e) => setDevNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs bg-cp-bg-input border border-cp-border rounded-lg px-3 py-2 outline-none text-cp-text-primary focus:border-cp-accent"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Plan Saved to Database!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="ml-auto px-4 py-2 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold transition-opacity shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingPlan ? 'Saving...' : 'Persist Development Plan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── INTERACTIVE WHAT-IF CAREER SCENARIO SIMULATOR ── */}
          <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-cp-accent mb-0.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Predictive Talent Modeling</span>
                </div>
                <h2 className="text-base font-bold text-cp-text-primary">
                  Interactive What-If Career Scenario Simulator
                </h2>
                <p className="text-xs text-cp-text-muted">
                  Simulate the quantitative impact of proactive talent interventions on promotion gap metrics and retention opportunity scores.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simulating}
                className="px-4 py-2 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-opacity"
              >
                {simulating ? 'Calculating Scenario...' : 'Run Scenario Simulation'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <label className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-elevated flex items-start gap-3 cursor-pointer hover:border-cp-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={simPromote}
                  onChange={(e) => setSimPromote(e.target.checked)}
                  className="mt-0.5 rounded accent-cp-accent"
                />
                <div>
                  <div className="text-xs font-bold text-cp-text-primary">Grant Promotion to Level {(profileData.JobLevel || 1) + 1}</div>
                  <div className="text-[11px] text-cp-text-muted mt-0.5">Resets promotion latency to 0 years unpromoted.</div>
                </div>
              </label>

              <label className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-elevated flex items-start gap-3 cursor-pointer hover:border-cp-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={simLateral}
                  onChange={(e) => setSimLateral(e.target.checked)}
                  className="mt-0.5 rounded accent-cp-accent"
                />
                <div>
                  <div className="text-xs font-bold text-cp-text-primary">Execute Lateral Rotation</div>
                  <div className="text-[11px] text-cp-text-muted mt-0.5">Rotates role into new functional domain (resets role tenure).</div>
                </div>
              </label>

              <div className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-elevated">
                <div className="flex justify-between items-center text-xs font-bold text-cp-text-primary mb-1">
                  <span>Additional Trainings:</span>
                  <span className="font-mono text-cp-accent font-bold">+{simTrainings} sessions</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={simTrainings}
                  onChange={(e) => setSimTrainings(Number(e.target.value))}
                  className="w-full accent-cp-accent mt-2"
                />
              </div>
            </div>

            {/* SIMULATION RESULTS COMPARISON */}
            {simulationResult && (
              <div className="mt-4 p-4 rounded-xl bg-cp-bg-elevated border border-cp-border text-cp-text-primary space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cp-accent font-bold">SCENARIO OUTCOME MODEL</span>
                  <span className="text-emerald-400 font-bold">
                    Risk Reduction: -{simulationResult.impact.risk_reduction_percent}%
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-cp-bg-surface border border-cp-border">
                    <div className="text-[10px] text-cp-text-muted">Promotion Gap %</div>
                    <div className="text-base font-bold font-mono mt-0.5">
                      <span className="line-through text-cp-text-muted mr-2">{simulationResult.original.promotion_gap_ratio}%</span>
                      <span className="text-emerald-400">{simulationResult.simulated.promotion_gap_ratio}%</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-cp-bg-surface border border-cp-border">
                    <div className="text-[10px] text-cp-text-muted">Role Stagnation Index</div>
                    <div className="text-base font-bold font-mono mt-0.5">
                      <span className="line-through text-cp-text-muted mr-2">{simulationResult.original.role_stagnation_index}%</span>
                      <span className="text-emerald-400">{simulationResult.simulated.role_stagnation_index}%</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-cp-bg-surface border border-cp-border">
                    <div className="text-[10px] text-cp-text-muted">Retention Opportunity Index</div>
                    <div className="text-base font-bold font-mono mt-0.5">
                      <span className="line-through text-cp-text-muted mr-2">{simulationResult.original.retention_opportunity_index}</span>
                      <span className="text-emerald-400">{simulationResult.simulated.retention_opportunity_index}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-cp-bg-surface border border-cp-border">
                    <div className="text-[10px] text-cp-text-muted">Simulated Retention Priority</div>
                    <div className="text-base font-bold font-mono mt-0.5 text-cp-accent">
                      {simulationResult.simulated.retention_priority}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-cp-text-secondary italic pt-1">
                  "{simulationResult.impact.narrative}"
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── EMPLOYEE DIRECTORY TABLE VIEW ── */
        <div className="space-y-6">
          <div className="border-b border-cp-border pb-5">
            <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
              <UserSearch className="w-4 h-4" />
              <span>Anonymized Workforce Directory</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
              Employee Explorer & Career Diagnostics
            </h1>
            <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
              Search by anonymized employee identifier to inspect individual trajectory indicators and manage persistent development plans.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-md">
            <div className="flex items-center bg-cp-bg-surface border border-cp-border rounded-xl px-3 py-2 shadow-xs focus-within:border-cp-accent">
              <Search className="w-4 h-4 text-cp-text-muted mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search by ID, role, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none text-cp-text-primary placeholder:text-cp-text-muted"
              />
            </div>
          </form>

          {/* Directory Table */}
          <div className="rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cp-border text-cp-text-muted text-[10px] font-bold uppercase tracking-wider bg-cp-bg-elevated/40">
                    <th className="py-2.5 px-3">Employee ID</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Job Role</th>
                    <th className="py-2.5 px-3">Job Level</th>
                    <th className="py-2.5 px-3">Tenure</th>
                    <th className="py-2.5 px-3">Unpromoted Yrs</th>
                    <th className="py-2.5 px-3">Career Cluster</th>
                    <th className="py-2.5 px-3">Stagnation Risk</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border/40 text-cp-text-secondary">
                  {loadingList ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={9} className="py-3 px-3"><div className="h-4 bg-cp-bg-elevated rounded"></div></td>
                      </tr>
                    ))
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.EmployeeID} className="hover:bg-cp-bg-hover transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-cp-accent">
                          {emp.EmployeeID}
                        </td>
                        <td className="py-3 px-3 text-cp-text-secondary">{emp.Department}</td>
                        <td className="py-3 px-3 font-semibold text-cp-text-primary">{emp.JobRole}</td>
                        <td className="py-3 px-3 font-mono">Level {emp.JobLevel}</td>
                        <td className="py-3 px-3 font-mono">{emp.YearsAtCompany} yrs</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-400">
                          {emp.YearsSinceLastPromotion} yrs
                        </td>
                        <td className="py-3 px-3 text-[11px] text-cp-text-muted">{emp.CareerCluster}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${
                            emp.PromotionGapCategory === 'High'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                              : 'bg-cp-bg-elevated text-cp-text-muted border border-cp-border'
                          }`}>
                            {emp.PromotionGapCategory}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedId(emp.EmployeeID)}
                            className="px-2.5 py-1 rounded-lg bg-cp-accent hover:opacity-90 text-white text-[11px] font-semibold transition-opacity shadow-xs"
                          >
                            Open Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-cp-border bg-cp-bg-elevated/40 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-surface text-xs font-medium text-cp-text-primary hover:bg-cp-bg-hover disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs text-cp-text-muted font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-surface text-xs font-medium text-cp-text-primary hover:bg-cp-bg-hover disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
