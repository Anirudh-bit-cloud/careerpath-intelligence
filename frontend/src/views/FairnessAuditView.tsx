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
      <div className="p-8 max-w-7xl mx-auto text-center space-y-3">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-cp-accent border-t-transparent rounded-full" />
        <div className="text-xs text-cp-text-muted">Evaluating Four-Fifths Disparate Impact across demographics...</div>
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
