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
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const FairnessAuditView: React.FC = () => {
  const { toast } = useToast();
  const [auditData, setAuditData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAttribute, setSelectedAttribute] = useState<string>('Gender');

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await api.getFairnessSummary();
      setAuditData(data);
      const attrs = Object.keys(data.attributes || {});
      if (attrs.length > 0 && !attrs.includes(selectedAttribute)) {
        setSelectedAttribute(attrs[0]);
      }
    } catch (e: any) {
      toast.error('Fairness Audit Restricted', e.message || 'Access requires admin or hrbp credentials.');
    } finally {
      setLoading(false);
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

        <button
          onClick={handleDownloadCsv}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Report (CSV)</span>
        </button>
      </div>

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
  );
};
