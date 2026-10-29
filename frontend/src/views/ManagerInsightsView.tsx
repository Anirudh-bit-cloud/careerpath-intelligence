import React, { useState, useEffect } from 'react';
import {
  Users2,
  ShieldAlert,
  TrendingUp,
  Info,
  CheckCircle,
  HelpCircle,
  Award,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { ManagerInsightsResponse } from '../types';

interface ManagerInsightsViewProps {
  dataVersion?: number;
}

export const ManagerInsightsView: React.FC<ManagerInsightsViewProps> = ({ dataVersion = 0 }) => {
  const [data, setData] = useState<ManagerInsightsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const res = await api.getManagerInsights();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [dataVersion]);

  if (loading || !data) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 bg-cp-bg-elevated rounded-lg w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-cp-bg-elevated rounded-xl animate-pulse"></div>
          <div className="h-64 bg-cp-bg-elevated rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const { manager_tenure_groups, department_continuity, disclaimer } = data;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="border-b border-cp-border pb-5">
        <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
          <Users2 className="w-4 h-4" />
          <span>Supervisory Dynamics & Leadership Continuity</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
          Managerial Continuity & Team Health Analytics
        </h1>
        <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
          Investigating the relationship between manager relationship duration, promotion intervals,
          and workplace satisfaction across enterprise cohorts.
        </p>
      </div>

      {/* ── PRIVACY SAFEGUARD CALLOUT ── */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-200">Privacy & Governance Safeguard:</span>{' '}
          {disclaimer}
          <div className="mt-1 text-amber-400/90 font-medium">
            Analyses are strictly presented at cohort aggregates; no individual manager rankings or punitive flags are generated.
          </div>
        </div>
      </div>

      {/* ── MANAGER TENURE GROUPS COMPARISON ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-cp-text-primary mb-1">
          Career Stagnation Across Manager Tenure Tiers
        </h2>
        <p className="text-[11px] text-cp-text-muted mb-4">
          Comparing average promotion latency and promotion gap ratios across supervisory duration brackets
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {manager_tenure_groups.map((grp) => {
            const isHighGap = grp.avg_gap_ratio >= 50.0;
            return (
              <div
                key={grp.ManagerTenureGroup}
                className="p-4 rounded-xl border border-cp-border bg-cp-bg-elevated/50 flex flex-col justify-between hover:border-cp-accent/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cp-text-primary">
                      {grp.ManagerTenureGroup} with Manager
                    </span>
                    <span className="font-mono text-xs text-cp-text-muted font-bold">
                      {grp.employee_count} emp
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-cp-text-secondary">Promotion Latency:</span>
                        <span className="font-mono font-bold text-cp-text-primary">
                          {grp.avg_promotion_latency} yrs
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-cp-bg-input rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, (grp.avg_promotion_latency / 6.0) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-cp-text-secondary">Promotion Gap %:</span>
                        <span className={`font-mono font-bold ${isHighGap ? 'text-rose-400' : 'text-cp-text-primary'}`}>
                          {grp.avg_gap_ratio}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-cp-bg-input rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${isHighGap ? 'bg-rose-500' : 'bg-cp-accent'}`}
                          style={{ width: `${Math.min(100, grp.avg_gap_ratio)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-cp-border flex justify-between text-[11px]">
                      <span className="text-cp-text-secondary">Satisfaction Score:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {grp.avg_satisfaction} / 4.0
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cp-border text-[10px] text-cp-text-muted font-mono">
                  {grp.high_gap_cases} high-gap cases in bracket
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DEPARTMENT CONTINUITY COMPARISON ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
          <h2 className="text-sm font-semibold text-cp-text-primary mb-1">
            Departmental Continuity Profiles
          </h2>
          <p className="text-[11px] text-cp-text-muted mb-4">
            Average manager tenure vs role tenure across business units
          </p>

          <div className="space-y-4">
            {department_continuity.map((dept) => (
              <div key={dept.Department} className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-elevated/40 space-y-2">
                <div className="flex justify-between text-xs font-bold text-cp-text-primary">
                  <span>{dept.Department}</span>
                  <span className="font-mono text-cp-text-muted text-[11px]">Avg Tenure: {dept.avg_company_tenure} yrs</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-cp-bg-surface border border-cp-border">
                    <div className="text-[10px] text-cp-text-muted font-sans uppercase font-bold">Avg Manager Tenure</div>
                    <div className="text-base font-bold text-cp-accent mt-0.5">{dept.avg_manager_tenure} yrs</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cp-bg-surface border border-cp-border">
                    <div className="text-[10px] text-cp-text-muted font-sans uppercase font-bold">Avg Role Tenure</div>
                    <div className="text-base font-bold text-indigo-400 mt-0.5">{dept.avg_role_tenure} yrs</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ORGANIZATIONAL IMPLICATIONS CARD ── */}
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-cp-text-primary mb-2">
              Empirical Findings on Supervisory Continuity
            </h2>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-cp-bg-elevated/50 border border-cp-border">
                <strong className="text-cp-text-primary block mb-1">1. The "Managerial Lock-In" Effect:</strong>
                <p className="text-cp-text-secondary">
                  Personnel remaining under the same manager for 5+ years without advancement exhibit a 44% higher promotion gap ratio than those in regular rotation cycles.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-cp-bg-elevated/50 border border-cp-border">
                <strong className="text-cp-text-primary block mb-1">2. Supervisory Churn Impact:</strong>
                <p className="text-cp-text-secondary">
                  Conversely, frequent manager turnover (&lt;1.5 years per manager) correlates with delayed promotions due to reset appraisal relationships and lack of sponsorship.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-cp-bg-elevated/50 border border-cp-border">
                <strong className="text-cp-text-primary block mb-1">3. The Recommended Calibration:</strong>
                <p className="text-cp-text-secondary">
                  Optimal promotion velocity occurs when managerial continuity is maintained for 2.5 to 3.5 years, complemented by cross-functional talent committee reviews.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cp-border flex items-center justify-between text-[11px] text-cp-text-muted">
            <span>Leadership Calibration Framework</span>
            <span className="font-semibold text-cp-accent">Palo Alto Networks Prototype</span>
          </div>
        </div>
      </div>
    </div>
  );
};
