import React from 'react';
import {
  Users,
  ClockAlert,
  Target,
  Sparkles,
  TrendingUp,
  GraduationCap,
  ChevronRight,
  Info,
  Building,
  Shield,
  Layers
} from 'lucide-react';
import { ExecutiveOverview } from '../types';

interface OverviewViewProps {
  data: ExecutiveOverview | null;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
  onRetry?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ data, loading, onNavigateTab, onRetry }) => {
  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-cp-bg-elevated rounded-lg w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-cp-bg-elevated rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-cp-bg-elevated rounded-xl"></div>
          <div className="h-80 bg-cp-bg-elevated rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <ClockAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-cp-text-primary">Executive Telemetry Unavailable</h2>
        <p className="text-xs text-cp-text-muted">
          Could not load workforce telemetry from the analytics service.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  const {
    kpis,
    cluster_distribution,
    promotion_gap_distribution,
    department_comparison,
    progression_matrix,
    insights
  } = data;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Page Header / Context ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cp-border pb-5">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
            <span>Workforce Intelligence Command Center</span>
            <span>•</span>
            <span className="text-cp-text-muted font-normal">Palo Alto Networks Prototype</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
            Workforce Progression & Retention Intelligence
          </h1>
          <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
            Diagnosing structural promotion gaps, role inertia, and managerial continuity to unlock employee potential
            and make talent retention proactive before voluntary disengagement occurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('retention-opportunities')}
            className="px-3.5 py-2 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Review Urgent Retention Cohort</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS STRIP (INTERACTIVE TELEMETRY) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Analyzed */}
        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs hover:border-cp-accent/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-cp-text-muted mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Cohort Profiles</span>
              <Users className="w-3.5 h-3.5 text-cp-text-muted" />
            </div>
            <div className="text-2xl font-bold text-cp-text-primary font-mono tracking-tight">
              {kpis.total_employees.toLocaleString()}
            </div>
          </div>
          <div className="text-[10.5px] text-cp-text-muted mt-2 font-mono flex items-center justify-between">
            <span>100% indexed</span>
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
        </div>

        {/* High Promotion Gap */}
        <div
          onClick={() => onNavigateTab('promotion-gap')}
          className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs border-l-3 border-l-rose-500 hover:border-rose-500/70 cursor-pointer transition-all flex flex-col justify-between group"
          title="Click to view Promotion Gap Monitor"
        >
          <div>
            <div className="flex items-center justify-between text-cp-text-muted mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">High Latency</span>
              <ClockAlert className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight">
              {kpis.high_promotion_gap_cases}
            </div>
          </div>
          <div className="text-[10.5px] text-rose-400/90 font-medium mt-2 flex items-center justify-between">
            <span>{kpis.high_gap_percent}% of cohort</span>
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider group-hover:underline">&rarr; View</span>
          </div>
        </div>

        {/* Urgent Retention */}
        <div
          onClick={() => onNavigateTab('retention-opportunities')}
          className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs border-l-3 border-l-amber-500 hover:border-amber-500/70 cursor-pointer transition-all flex flex-col justify-between group"
          title="Click to view Retention Opportunities"
        >
          <div>
            <div className="flex items-center justify-between text-cp-text-muted mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">Urgent Retention</span>
              <Target className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
              {kpis.urgent_retention_opportunities}
            </div>
          </div>
          <div className="text-[10.5px] text-amber-400/90 font-medium mt-2 flex items-center justify-between">
            <span>{kpis.urgent_retention_percent}% high-value</span>
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider group-hover:underline">&rarr; Action</span>
          </div>
        </div>

        {/* Stalled Cluster */}
        <div
          onClick={() => onNavigateTab('clusters')}
          className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs hover:border-cp-accent/50 cursor-pointer transition-all flex flex-col justify-between group"
          title="Click to view Career Clusters"
        >
          <div>
            <div className="flex items-center justify-between text-cp-text-muted mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cp-accent font-mono">Stalled Cluster</span>
              <Sparkles className="w-3.5 h-3.5 text-cp-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-cp-text-primary font-mono tracking-tight">
              {kpis.stalled_cluster_count}
            </div>
          </div>
          <div className="text-[10.5px] text-cp-text-muted mt-2 flex items-center justify-between">
            <span>Primary target</span>
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-cp-accent group-hover:underline">&rarr; Map</span>
          </div>
        </div>

        {/* Median Role Tenure */}
        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs hover:border-cp-accent/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-cp-text-muted mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Role Tenure</span>
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-cp-text-primary font-mono tracking-tight">
              {kpis.median_role_tenure_years} <span className="text-xs font-normal text-cp-text-muted font-sans">yrs</span>
            </div>
          </div>
          <div className="text-[10.5px] text-cp-text-muted mt-2">Median in single role</div>
        </div>

        {/* Training Velocity */}
        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs hover:border-cp-accent/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-cp-text-muted mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Training Velocity</span>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-cp-text-primary font-mono tracking-tight">
              {kpis.avg_trainings_last_year} <span className="text-xs font-normal text-cp-text-muted font-sans">/ yr</span>
            </div>
          </div>
          <div className="text-[10.5px] text-emerald-400 font-medium mt-2">Annual sessions avg</div>
        </div>
      </div>

      {/* ── CALCULATED ANALYTICAL INSIGHT FEED ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-cp-accent" />
          <h2 className="text-sm font-semibold text-cp-text-primary">
            Calculated Analytical Observations & Actionable Findings
          </h2>
          <span className="text-[10px] text-cp-text-muted ml-auto font-mono">
            Derived directly from indexed cohort data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-cp-border bg-cp-bg-elevated/60 flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-cp-accent mb-1">
                  {item.type}
                </div>
                <div className="text-xs font-semibold text-cp-text-primary leading-snug">
                  {item.finding}
                </div>
                <div className="mt-2 text-[11px] text-cp-text-secondary space-y-1">
                  <div>
                    <span className="font-semibold text-cp-text-primary">Metric:</span> {item.metric}
                  </div>
                  <div>
                    <span className="font-semibold text-cp-text-primary">Implication:</span> {item.implication}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-cp-border text-[11px] font-medium text-cp-text-primary flex items-center justify-between">
                <span className="text-cp-accent font-semibold">Action:</span>
                <span className="text-[10px] text-cp-text-muted text-right truncate pl-1" title={item.recommended_action}>
                  {item.recommended_action}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ASYMMETRICAL CHARTS: CLUSTERS + PROMOTION GAP DISTRIBUTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Trajectory Distribution */}
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-cp-text-primary">
                  Career Trajectory Archetype Distribution
                </h2>
                <p className="text-[11px] text-cp-text-muted">Unsupervised multi-feature clustering segments</p>
              </div>
              <button
                onClick={() => onNavigateTab('clusters')}
                className="text-xs text-cp-accent hover:underline font-medium flex items-center gap-1"
              >
                Inspect Clusters <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {cluster_distribution.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-cp-text-primary">{c.name}</span>
                    <span className="font-mono text-cp-text-muted font-medium">
                      {c.count} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-cp-bg-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        c.name.includes('Stalled')
                          ? 'bg-rose-500'
                          : c.name.includes('High-Risk')
                          ? 'bg-amber-500'
                          : c.name.includes('Fast') || c.name.includes('Early')
                          ? 'bg-sky-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cp-border flex items-center justify-between text-[11px] text-cp-text-muted">
            <span>Primary Archetypes: 5 Clusters</span>
            <span className="font-mono">Ensemble K-Means + GMM</span>
          </div>
        </div>

        {/* Promotion Gap Category Breakdown */}
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-cp-text-primary">
                  Workforce Promotion Gap Risk Categories
                </h2>
                <p className="text-[11px] text-cp-text-muted">Latency & company tenure ratio classification</p>
              </div>
              <button
                onClick={() => onNavigateTab('promotion-gap')}
                className="text-xs text-cp-accent hover:underline font-medium flex items-center gap-1"
              >
                Monitor Table <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {promotion_gap_distribution.map((item) => {
                const isHigh = item.category === 'High';
                const isMed = item.category === 'Medium';
                const colorClass = isHigh
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  : isMed
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                return (
                  <div
                    key={item.category}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${colorClass}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider mb-1">
                      {item.category} Gap
                    </span>
                    <span className="text-2xl font-bold font-mono">{item.count}</span>
                    <span className="text-[11px] opacity-80 mt-1">
                      {Math.round((item.count / kpis.total_employees) * 100)}% of cohort
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-cp-bg-elevated border border-cp-border text-xs text-cp-text-secondary flex items-start gap-2">
            <Info className="w-4 h-4 text-cp-text-muted shrink-0 mt-0.5" />
            <span>
              <strong>Threshold Logic:</strong> High Gap flags employees with score $\ge 55$ composite
              (&gt;50% tenure without advancement and absolute promotion latency $\ge 3.5$ years).
            </span>
          </div>
        </div>
      </div>

      {/* ── CAREER PROGRESSION MATRIX (TENURE VS STAGNATION HEATMAP) ── */}
      {progression_matrix && progression_matrix.length > 0 && (
        <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-cp-text-primary">
                Career Progression Matrix: Tenure Cohorts vs. Promotion Gap Risk
              </h2>
              <p className="text-[11px] text-cp-text-muted">
                Tracks when employees enter high-stagnation zones across company tenure stages
              </p>
            </div>
            <span className="text-[11px] text-cp-text-muted font-mono">Company Tenure Stages</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {progression_matrix.map((row) => {
              const totalInGroup = (row.High || 0) + (row.Medium || 0) + (row.Low || 0);
              const highPct = totalInGroup > 0 ? Math.round(((row.High || 0) / totalInGroup) * 100) : 0;
              return (
                <div key={row.TenureGroup} className="p-3.5 rounded-lg border border-cp-border bg-cp-bg-elevated/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-cp-text-primary">{row.TenureGroup}</span>
                      <span className="text-[10px] text-cp-text-muted font-mono">{totalInGroup} emp</span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center p-1.5 rounded bg-rose-500/10 border border-rose-500/25">
                        <span className="text-rose-400 font-medium">High Gap (Stalled):</span>
                        <span className="font-mono font-bold text-rose-300">{row.High || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-1.5 rounded bg-amber-500/10 border border-amber-500/25">
                        <span className="text-amber-400 font-medium">Medium Gap:</span>
                        <span className="font-mono font-bold text-amber-300">{row.Medium || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-1.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                        <span className="text-emerald-400 font-medium">Low Gap (Normal):</span>
                        <span className="font-mono font-bold text-emerald-300">{row.Low || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-cp-border flex items-center justify-between text-[10px]">
                    <span className="text-cp-text-muted">Stagnation Rate:</span>
                    <span className={`font-mono font-bold ${highPct >= 40 ? 'text-rose-400' : 'text-cp-text-primary'}`}>
                      {highPct}% Stalled
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DEPARTMENT COMPARISON TABLE ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-cp-text-primary">
              Departmental Progression & Stagnation Analysis
            </h2>
            <p className="text-[11px] text-cp-text-muted">
              Cross-unit comparison of advancement metrics and retention opportunities
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cp-border text-cp-text-muted text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Headcount</th>
                <th className="py-2.5 px-3">Avg Promo Latency</th>
                <th className="py-2.5 px-3">Median Role Tenure</th>
                <th className="py-2.5 px-3">High Gap %</th>
                <th className="py-2.5 px-3">Urgent Retention</th>
                <th className="py-2.5 px-3">Annual Training</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cp-border/50 text-cp-text-secondary">
              {department_comparison.map((dept) => (
                <tr key={dept.Department} className="hover:bg-cp-bg-hover transition-colors">
                  <td className="py-3 px-3 font-semibold text-cp-text-primary">{dept.Department}</td>
                  <td className="py-3 px-3 font-mono">{dept.total}</td>
                  <td className="py-3 px-3 font-mono">{dept.avg_promotion_gap} yrs</td>
                  <td className="py-3 px-3 font-mono">{dept.median_role_tenure} yrs</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{dept.high_gap_percent}%</span>
                      <div className="w-16 h-1.5 bg-cp-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, dept.high_gap_percent)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/25">
                      {dept.urgent_retention} targets
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{dept.avg_training} / yr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
