import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Scale,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  History,
  CheckSquare,
  FileCheck2,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const FairnessAuditView: React.FC = () => {
  const { toast } = useToast();
  const [auditData, setAuditData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAttribute, setSelectedAttribute] = useState<string>('Gender');

  // Phase 3: Intersectional, Longitudinal, and Sign-off state
  const [activeSection, setActiveSection] = useState<'marginal' | 'intersectional' | 'longitudinal' | 'signoffs'>('marginal');
  const [intersectionalData, setIntersectionalData] = useState<any | null>(null);
  const [loadingIntersectional, setLoadingIntersectional] = useState<boolean>(false);
  const [intersectionalPairFilter, setIntersectionalPairFilter] = useState<string>('all');

  const [longitudinalData, setLongitudinalData] = useState<any | null>(null);
  const [loadingLongitudinal, setLoadingLongitudinal] = useState<boolean>(false);

  const [signoffsList, setSignoffsList] = useState<any[]>([]);
  const [showSignoffModal, setShowSignoffModal] = useState<boolean>(false);
  const [signoffReviewType, setSignoffReviewType] = useState<string>('model_promotion');
  const [signoffTargetId, setSignoffTargetId] = useState<string>('v3.2.0');
  const [signoffDecision, setSignoffDecision] = useState<string>('approved');
  const [signoffNotes, setSignoffNotes] = useState<string>('Comprehensive bias review completed. Disparate impact ratio meets Four-Fifths requirement across non-suppressed cohorts.');
  const [submittingSignoff, setSubmittingSignoff] = useState<boolean>(false);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const [data, intData, longData, signoffs] = await Promise.all([
        api.getFairnessSummary().catch(() => null),
        api.getIntersectionalFairness(10).catch(() => null),
        api.getLongitudinalFairness().catch(() => null),
        api.listBiasSignoffs(20).catch(() => [])
      ]);
      setAuditData(data);
      setIntersectionalData(intData);
      setLongitudinalData(longData);
      setSignoffsList(signoffs || []);

      const attrs = Object.keys(data?.attributes || {});
      if (attrs.length > 0 && !attrs.includes(selectedAttribute)) {
        setSelectedAttribute(attrs[0]);
      }
    } catch (e: any) {
      toast.error('Fairness Audit Restricted', e.message || 'Access requires admin or hrbp credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSignoff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSignoff(true);
    try {
      await api.submitBiasSignoff({
        review_type: signoffReviewType,
        target_id: signoffTargetId,
        decision: signoffDecision,
        reviewer_notes: signoffNotes,
        acknowledged_flags: auditData?.total_flags || 0
      });
      toast.success('Bias Review Recorded', 'Formal algorithmic bias sign-off logged in immutable audit trail.');
      setShowSignoffModal(false);
      const list = await api.listBiasSignoffs(20);
      setSignoffsList(list);
    } catch (err: any) {
      toast.error('Sign-off Failed', err.message || 'Failed to record bias review sign-off.');
    } finally {
      setSubmittingSignoff(false);
    }
  };

  const handleDownloadCsv = () => {
    window.open('/api/fairness/export/csv', '_blank');
    toast.success('Download Initiated', 'Exporting disparate impact audit matrix as CSV.');
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-cp-bg-elevated rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-cp-bg-elevated rounded-xl"></div>
          <div className="h-28 bg-cp-bg-elevated rounded-xl"></div>
          <div className="h-28 bg-cp-bg-elevated rounded-xl"></div>
        </div>
        <div className="h-64 bg-cp-bg-elevated rounded-xl"></div>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="p-12 max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
          <Scale className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-cp-text-primary">Fairness Telemetry Unavailable</h2>
        <p className="text-xs text-cp-text-muted">
          Could not retrieve disparate impact audit telemetry. Ensure you have appropriate compliance permissions.
        </p>
        <button
          onClick={loadAudit}
          className="px-4 py-2 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Retry Audit Evaluation
        </button>
      </div>
    );
  }

  const activeAttrData = auditData?.attributes?.[selectedAttribute];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cp-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-cp-text-primary">
              Algorithmic Fairness & Bias Audit Module
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              EEOC Four-Fifths Rule
            </span>
          </div>
          <p className="text-xs text-cp-text-muted mt-1">
            Auditing disparate impact across demographic segments. Suppression active for groups with sample size n &lt; 10.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSignoffModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Formal Bias Sign-Off</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* ── SECTION NAV SWITCHER (PHASE 3) ── */}
      <div className="flex items-center gap-2 border-b border-cp-border pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('marginal')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeSection === 'marginal'
              ? 'bg-cp-accent text-white shadow-xs'
              : 'text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover'
          }`}
        >
          Marginal Demographics (Four-Fifths)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('intersectional')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeSection === 'intersectional'
              ? 'bg-cp-accent text-white shadow-xs'
              : 'text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Intersectional Slices (FDR Corrected)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('longitudinal')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeSection === 'longitudinal'
              ? 'bg-cp-accent text-white shadow-xs'
              : 'text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Longitudinal Fairness Drift
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('signoffs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeSection === 'signoffs'
              ? 'bg-cp-accent text-white shadow-xs'
              : 'text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          Governance & Bias Sign-Offs ({signoffsList.length})
        </button>
      </div>

      {activeSection === 'marginal' && (
        <div className="space-y-6">

      {/* Executive Plain-Language Summary of Findings */}
      <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            auditData?.total_flags > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {auditData?.total_flags > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-bold text-cp-text-primary">
              Executive Audit Summary: {auditData?.total_flags > 0
                ? `${auditData.total_flags} Demographic Sub-group(s) Below 80% Parity Threshold`
                : 'All Evaluated Demographic Cohorts Satisfy EEOC Four-Fifths Parity'}
            </div>
            <p className="text-[11.5px] text-cp-text-secondary mt-0.5 leading-snug">
              {auditData?.total_flags > 0
                ? 'Flagged groups exhibit disparate impact requiring proactive calibration in talent review sessions.'
                : 'No actionable adverse impact detected in the active workforce dataset. All protected attributes show parity ratios ≥ 0.80.'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-cp-text-muted shrink-0 bg-cp-bg-elevated px-2 py-1 rounded border border-cp-border">
          EEOC 4/5ths Uniform Guidelines
        </span>
      </div>

      {/* Collapsible EEOC Four-Fifths Regulatory Guide Panel */}
      <details className="rounded-xl border border-cp-border bg-cp-bg-surface p-4 group transition-all shadow-2xs">
        <summary className="flex items-center justify-between cursor-pointer text-xs font-bold text-cp-text-primary select-none">
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cp-accent" />
            <span>How the EEOC Four-Fifths (80%) Rule Works (29 C.F.R. § 1607.4)</span>
          </span>
          <span className="text-[11px] text-cp-text-muted font-mono">Click to expand</span>
        </summary>
        <div className="mt-3 text-xs text-cp-text-secondary leading-relaxed space-y-2 border-t border-cp-border/50 pt-3">
          <p>
            The Four-Fifths Rule is an established regulatory test codified in Title 29 C.F.R. § 1607.4 (Uniform Guidelines on Employee Selection Procedures). If the selection, promotion, or favorable retention rate for any protected demographic class is less than 80% (4/5ths) of the rate for the highest-performing reference class, the practice is flagged as exhibiting adverse disparate impact.
          </p>
          <p>
            <strong>Mathematical Formula:</strong>{' '}
            <code className="px-1.5 py-0.5 rounded bg-cp-bg-elevated font-mono text-cp-accent text-[11px]">
              Disparate Impact Ratio = (Favorable Rate of Protected Cohort) / (Favorable Rate of Benchmark Cohort)
            </code>
            . If this ratio is <strong>&lt; 0.80</strong>, the algorithm raises a formal compliance notification.
          </p>
          <p className="text-[11px] text-cp-text-muted">
            *Privacy Safeguard: Demographics with fewer than 10 individuals ($n &lt; 10$) are automatically suppressed to guarantee employee anonymity and prevent small-sample volatility. Protected attributes are used strictly for post-hoc auditing and never as model inputs.
          </p>
        </div>
      </details>

      {/* Prominent Legal Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-accent/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-cp-accent shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-cp-text-primary">Protected Attributes Usage Policy</div>
          <p className="text-cp-text-secondary leading-relaxed">
            {auditData?.legal_notice || (
              "Protected demographic attributes (Gender, Age Band, Marital Status) are strictly prohibited from being used as model training features, scoring weights, or recommendation triggers. They are evaluated exclusively within this post-hoc audit module to ensure the Four-Fifths Disparate Impact standard is maintained."
            )}
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border">
          <div className="text-[10px] uppercase font-bold text-cp-text-muted">Total Workforce Audited</div>
          <div className="text-2xl font-black text-cp-text-primary font-mono mt-1">
            {auditData?.total_records_audited?.toLocaleString() ?? 0}
          </div>
          <div className="text-[10px] text-cp-text-muted mt-0.5">Profiles evaluated</div>
        </div>

        <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border">
          <div className="text-[10px] uppercase font-bold text-cp-text-muted">Compliance Status</div>
          <div className={`text-sm font-bold font-mono mt-1 flex items-center gap-1.5 ${
            auditData?.total_flags > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {auditData?.total_flags > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{auditData.total_flags} Disparities Flagged</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Four-Fifths Compliant</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-cp-text-muted mt-0.5">Ratio threshold: ≥ 0.80</div>
        </div>

        <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border">
          <div className="text-[10px] uppercase font-bold text-cp-text-muted">Sample Size Threshold</div>
          <div className="text-2xl font-black text-cp-accent font-mono mt-1">n ≥ 10</div>
          <div className="text-[10px] text-cp-text-muted mt-0.5">Small cohorts suppressed for statistical validity</div>
        </div>

        <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border">
          <div className="text-[10px] uppercase font-bold text-cp-text-muted">Audited Attributes</div>
          <div className="text-2xl font-black text-cp-text-primary font-mono mt-1">
            {Object.keys(auditData?.attributes || {}).length}
          </div>
          <div className="text-[10px] text-cp-text-muted mt-0.5">Demographic & organizational vectors</div>
        </div>
      </div>

      {/* Flagged Group Callouts */}
      {auditData?.flagged_disparities && auditData.flagged_disparities.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Identified Four-Fifths Disparity Flags (Action Required)</span>
          </div>
          <div className="space-y-1.5">
            {auditData.flagged_disparities.map((flag: any, i: number) => (
              <div key={i} className="text-xs text-cp-text-secondary flex items-center justify-between border-b border-amber-500/20 pb-1 last:border-none">
                <span>
                  <strong>{flag.attribute}: {flag.affected_group}</strong> has favorable rate of {flag.favorable_rate}% vs {flag.benchmark_rate}% for benchmark ({flag.benchmark_group}).
                </span>
                <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/20">
                  Ratio: {flag.ratio} (&lt; 0.80)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribute Tabs */}
      <div className="flex items-center gap-2 border-b border-cp-border pb-2">
        {Object.keys(auditData?.attributes || {}).map((attr) => (
          <button
            key={attr}
            onClick={() => setSelectedAttribute(attr)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedAttribute === attr
                ? 'bg-cp-accent text-white shadow-xs'
                : 'text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-hover'
            }`}
          >
            {attr}
          </button>
        ))}
      </div>

      {/* Detailed Attribute Breakdown Table */}
      {activeAttrData && (
        <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-cp-text-primary">
              Demographic Cohort Breakdown: {selectedAttribute}
            </h3>
            {activeAttrData.most_favored_group && (
              <div className="text-xs text-cp-text-muted">
                Benchmark (Most Favored Cohort): <strong className="text-cp-accent">{activeAttrData.most_favored_group}</strong>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cp-border text-cp-text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Cohort / Segment</th>
                  <th className="py-2.5 px-3 text-right">Sample Size (n)</th>
                  <th className="py-2.5 px-3 text-right">Urgent Risk (%)</th>
                  <th className="py-2.5 px-3 text-right">Standard Safe (%)</th>
                  <th className="py-2.5 px-3 text-right">Disparate Impact Ratio</th>
                  <th className="py-2.5 px-3 text-center">EEOC Four-Fifths Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cp-border/40 text-cp-text-secondary">
                {activeAttrData.groups.map((g: any, idx: number) => {
                  if (g.suppressed) {
                    return (
                      <tr key={idx} className="opacity-60 italic text-cp-text-muted">
                        <td className="py-2.5 px-3">{g.group}</td>
                        <td className="py-2.5 px-3 text-right font-mono">n={g.sample_size}</td>
                        <td colSpan={3} className="py-2.5 px-3 text-center">
                          Suppressed (Insufficient sample size n &lt; 10 to protect privacy & precision)
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cp-bg-elevated text-cp-text-muted">
                            Suppressed
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  const ratio = g.disparate_impact_ratio;
                  const isViolation = g.four_fifths_flag;

                  return (
                    <tr key={idx} className="hover:bg-cp-bg-hover">
                      <td className="py-2.5 px-3 font-semibold text-cp-text-primary">{g.group}</td>
                      <td className="py-2.5 px-3 text-right font-mono">n={g.sample_size}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                        {g.tier_distribution?.urgent_pct}% ({g.tier_distribution?.urgent})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        {g.tier_distribution?.standard_pct}% ({g.tier_distribution?.standard})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={isViolation ? 'text-amber-400' : 'text-cp-text-primary'}>
                          {ratio != null ? ratio.toFixed(3) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isViolation ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Disparity Flagged (&lt; 0.80)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Compliant
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      )}

      {/* ── 2. INTERSECTIONAL FAIRNESS SLICES (PHASE 3) ── */}
      {activeSection === 'intersectional' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
            <div>
              <h3 className="text-sm font-semibold text-cp-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-cp-accent" />
                <span>Intersectional Demographic Fairness (Benjamini-Hochberg FDR)</span>
              </h3>
              <p className="text-xs text-cp-text-muted mt-1 leading-relaxed">
                Evaluates compound demographic intersections: Gender × Age Band, Gender × Department, Age Band × Department.
                Small-sample cohorts with n &lt; 10 are statistically suppressed to maintain precision and employee privacy.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-cp-text-muted font-medium">Filter Slices:</span>
              <select
                value={intersectionalPairFilter}
                onChange={(e) => setIntersectionalPairFilter(e.target.value)}
                className="text-xs bg-cp-bg-elevated border border-cp-border rounded-lg px-2.5 py-1 text-cp-text-primary font-medium focus:outline-none focus:border-cp-accent"
              >
                <option value="all">All Intersectional Pairs</option>
                <option value="Gender × AgeBand">Gender × AgeBand</option>
                <option value="Gender × Department">Gender × Department</option>
                <option value="AgeBand × Department">AgeBand × Department</option>
              </select>
            </div>
          </div>

          {/* Intersectional KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border">
              <div className="text-[10px] uppercase font-bold text-cp-text-muted">Total Intersections</div>
              <div className="text-2xl font-bold font-mono text-cp-text-primary mt-1">
                {intersectionalData?.total_slices || 0}
              </div>
              <div className="text-[10px] text-cp-text-muted mt-0.5">Across {intersectionalData?.pairs_evaluated?.length || 3} pair spaces</div>
            </div>

            <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border">
              <div className="text-[10px] uppercase font-bold text-cp-text-muted">Small Cohorts Suppressed</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {intersectionalData?.suppressed_slices_count || 0}
              </div>
              <div className="text-[10px] text-cp-text-muted mt-0.5">n &lt; 10 privacy safeguard</div>
            </div>

            <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border">
              <div className="text-[10px] uppercase font-bold text-cp-text-muted">Four-Fifths Disparities</div>
              <div className={`text-2xl font-bold font-mono mt-1 ${
                (intersectionalData?.flagged_four_fifths_count || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {intersectionalData?.flagged_four_fifths_count || 0}
              </div>
              <div className="text-[10px] text-cp-text-muted mt-0.5">DIR &lt; 0.80 benchmark ratio</div>
            </div>

            <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border">
              <div className="text-[10px] uppercase font-bold text-cp-text-muted">FDR Significant Disparities</div>
              <div className="text-2xl font-bold font-mono text-cp-accent mt-1">
                {intersectionalData?.statistically_significant_disparities_count || 0}
              </div>
              <div className="text-[10px] text-cp-text-muted mt-0.5">q &lt; 0.05 after BH adjustment</div>
            </div>
          </div>

          {/* Slices Table */}
          <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-cp-text-primary uppercase tracking-wider">
                  Intersectional Slices Evaluation Matrix
                </h4>
                <p className="text-[11px] text-cp-text-muted mt-0.5">
                  Two-sided Fisher's Exact / Chi-Square tests with Benjamini-Hochberg False Discovery Rate correction
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-cp-accent bg-cp-accent/10 px-2.5 py-0.5 rounded border border-cp-accent/20">
                FDR alpha = 0.05
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cp-border text-cp-text-muted font-medium text-[11px]">
                    <th className="py-2.5 px-3">Intersectional Cohort</th>
                    <th className="py-2.5 px-3">Category Pair</th>
                    <th className="py-2.5 px-3 text-right">Headcount (n)</th>
                    <th className="py-2.5 px-3 text-right">Urgent Risk</th>
                    <th className="py-2.5 px-3 text-right">Disparate Impact Ratio</th>
                    <th className="py-2.5 px-3">Test Type</th>
                    <th className="py-2.5 px-3 text-right">Raw p-value</th>
                    <th className="py-2.5 px-3 text-right">Adjusted q-value</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border/50 text-cp-text-primary">
                  {intersectionalData?.slices
                    ?.filter((s: any) => intersectionalPairFilter === 'all' || s.pair_name.includes(intersectionalPairFilter.split(' × ')[0]))
                    ?.map((s: any, idx: number) => {
                      if (s.is_suppressed) {
                        return (
                          <tr key={idx} className="opacity-60 bg-cp-bg-elevated/20 text-cp-text-muted font-mono">
                            <td className="py-2.5 px-3 font-semibold font-sans">{s.slice_label}</td>
                            <td className="py-2.5 px-3 text-[11px] font-sans">{s.pair_name}</td>
                            <td className="py-2.5 px-3 text-right">{s.headcount}</td>
                            <td colSpan={5} className="py-2.5 px-3 text-center italic text-[11px]">
                              Suppressed: group size n &lt; 10 too small for statistically reliable inference
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Suppressed
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={idx} className="hover:bg-cp-bg-elevated/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-cp-text-primary flex items-center gap-1.5">
                            {s.slice_label}
                            {s.is_favored_reference && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                Benchmark
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-cp-text-muted">{s.pair_name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{s.headcount}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-400">{s.urgent_share_pct}%</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={s.is_flagged_four_fifths ? 'text-amber-400' : 'text-emerald-400'}>
                              {s.disparate_impact_ratio?.toFixed(3)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-cp-text-secondary">{s.hypothesis_test}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-cp-text-secondary">
                            {s.raw_p_value !== null ? s.raw_p_value.toFixed(4) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {s.fdr_adjusted_p_value !== null ? (
                              <span className={s.is_statistically_significant ? 'text-rose-400' : 'text-cp-text-primary'}>
                                {s.fdr_adjusted_p_value.toFixed(4)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {s.is_flagged_four_fifths ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                DIR Flag (&lt; 0.80)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Compliant
                              </span>
                            )}
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

      {/* ── 3. LONGITUDINAL FAIRNESS DRIFT (PHASE 3) ── */}
      {activeSection === 'longitudinal' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
            <div>
              <h3 className="text-sm font-semibold text-cp-text-primary flex items-center gap-2">
                <History className="w-4 h-4 text-cp-accent" />
                <span>Longitudinal Fairness Drift Over Workforce Snapshots</span>
              </h3>
              <p className="text-xs text-cp-text-muted mt-1 leading-relaxed">
                Tracks Disparate Impact Ratio across monthly historical workforce snapshots to monitor whether parity is stable, widening, or improving over time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-cp-text-muted font-medium">Trajectory:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                longitudinalData?.drift_trend === 'improving'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : longitudinalData?.drift_trend === 'widening'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
              }`}>
                {longitudinalData?.drift_trend || 'Stable'}
              </span>
            </div>
          </div>

          {/* Narrative Summary */}
          {longitudinalData?.summary_narrative && (
            <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border flex items-center gap-2.5 text-xs text-cp-text-secondary">
              <Info className="w-4 h-4 text-cp-accent shrink-0" />
              <span>{longitudinalData.summary_narrative}</span>
            </div>
          )}

          {/* Time Series Table */}
          <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-cp-text-primary uppercase tracking-wider">
              Monthly Snapshot Fairness History ({longitudinalData?.total_snapshots_evaluated || 0} Snapshots)
            </h4>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-cp-bg-surface">
                  <tr className="border-b border-cp-border text-cp-text-muted font-medium text-[11px]">
                    <th className="py-2.5 px-3">Snapshot Date</th>
                    <th className="py-2.5 px-3">Active Cohort</th>
                    <th className="py-2.5 px-3 text-right">Female Favorable Rate</th>
                    <th className="py-2.5 px-3 text-right">Male Favorable Rate</th>
                    <th className="py-2.5 px-3 text-right">Gender DIR</th>
                    <th className="py-2.5 px-3 text-center">Four-Fifths Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border/50 text-cp-text-primary font-mono">
                  {longitudinalData?.timeline?.map((t: any) => (
                    <tr key={t.snapshot_date} className="hover:bg-cp-bg-elevated/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-cp-text-primary font-sans">{t.snapshot_date}</td>
                      <td className="py-2.5 px-3">{t.cohort_size}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">{(t.female_favorable_rate * 100)?.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right text-indigo-400">{(t.male_favorable_rate * 100)?.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-cp-accent">{t.gender_dir?.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-center">
                        {t.is_four_fifths_compliant ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Compliant
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Drift Flag
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. BIAS REVIEWS & GOVERNANCE SIGNOFFS (PHASE 3) ── */}
      {activeSection === 'signoffs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
            <div>
              <h3 className="text-sm font-semibold text-cp-text-primary flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>Algorithmic Bias Governance & Review Sign-Offs</span>
              </h3>
              <p className="text-xs text-cp-text-muted mt-1 leading-relaxed">
                Immutable audit trail of compliance and HRBP bias sign-offs required before model promotion or scoring policy modifications.
              </p>
            </div>

            <button
              onClick={() => setShowSignoffModal(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Record New Sign-Off</span>
            </button>
          </div>

          <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-cp-text-primary uppercase tracking-wider">
              Recorded Compliance Sign-Off Logs ({signoffsList.length})
            </h4>

            {signoffsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-cp-text-muted">
                No formal bias review sign-offs recorded yet. Click "Record New Sign-Off" to document compliance approval.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-cp-border text-cp-text-muted font-medium text-[11px]">
                      <th className="py-2.5 px-3">Signed-off At</th>
                      <th className="py-2.5 px-3">Reviewer Email</th>
                      <th className="py-2.5 px-3">Context Type</th>
                      <th className="py-2.5 px-3">Target ID</th>
                      <th className="py-2.5 px-3">Decision</th>
                      <th className="py-2.5 px-3">Reviewer Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cp-border/50 text-cp-text-primary">
                    {signoffsList.map((s: any) => (
                      <tr key={s.id} className="hover:bg-cp-bg-elevated/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-cp-text-secondary">
                          {s.created_at ? new Date(s.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-cp-text-primary">{s.user_email}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-cp-accent uppercase">{s.review_type}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{s.target_id}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.decision === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {s.decision}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-cp-text-secondary max-w-sm truncate" title={s.reviewer_notes}>
                          {s.reviewer_notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BIAS SIGN-OFF MODAL ── */}
      {showSignoffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-cp-border bg-cp-bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-cp-text-primary">Formal Bias Review Sign-Off</h3>
              </div>
              <button onClick={() => setShowSignoffModal(false)} className="text-cp-text-muted hover:text-cp-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-cp-text-muted leading-relaxed">
              Confirm that you have reviewed the algorithmic disparate impact audit and that the active model and scoring policy meet your organization's ethical and regulatory fairness standards.
            </p>

            <form onSubmit={handleCreateSignoff} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-cp-text-primary block mb-1">Review Context</label>
                <select
                  value={signoffReviewType}
                  onChange={(e) => setSignoffReviewType(e.target.value)}
                  className="w-full text-xs bg-cp-bg-elevated border border-cp-border rounded-lg p-2 text-cp-text-primary font-medium focus:outline-none focus:border-cp-accent"
                >
                  <option value="model_promotion">Model Version Promotion Gate</option>
                  <option value="policy_update">Scoring Policy Revision Gate</option>
                  <option value="scheduled_audit">Periodic Compliance Bias Audit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-cp-text-primary block mb-1">Target Version / Identifier</label>
                <input
                  type="text"
                  value={signoffTargetId}
                  onChange={(e) => setSignoffTargetId(e.target.value)}
                  className="w-full text-xs bg-cp-bg-elevated border border-cp-border rounded-lg p-2 text-cp-text-primary font-mono focus:outline-none focus:border-cp-accent"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cp-text-primary block mb-1">Compliance Decision</label>
                <select
                  value={signoffDecision}
                  onChange={(e) => setSignoffDecision(e.target.value)}
                  className="w-full text-xs bg-cp-bg-elevated border border-cp-border rounded-lg p-2 text-cp-text-primary font-medium focus:outline-none focus:border-cp-accent"
                >
                  <option value="approved">Approved — Four-Fifths Compliant</option>
                  <option value="conditionally_approved">Conditionally Approved with Talent Review Calibration</option>
                  <option value="rejected">Rejected — Disparity Requires Remediation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-cp-text-primary block mb-1">Reviewer Notes & Rationale</label>
                <textarea
                  value={signoffNotes}
                  onChange={(e) => setSignoffNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-cp-bg-elevated border border-cp-border rounded-lg p-2 text-cp-text-primary focus:outline-none focus:border-cp-accent"
                  placeholder="Document compliance justification and non-discrimination review..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignoffModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-cp-border text-cp-text-secondary text-xs hover:bg-cp-bg-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSignoff}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40 shadow-xs"
                >
                  {submittingSignoff ? 'Recording...' : 'Confirm Sign-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
