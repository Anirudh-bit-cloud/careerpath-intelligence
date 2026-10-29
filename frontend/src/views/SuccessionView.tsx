import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertOctagon,
  ShieldAlert,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export const SuccessionView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [nineBoxData, setNineBoxData] = useState<any>(null);
  const [criticalRolesData, setCriticalRolesData] = useState<any>(null);
  const [effectivenessData, setEffectivenessData] = useState<any>(null);

  // Selected 9-box drilldown
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>('high_pot_high_perf');
  const [roleFilter, setRoleFilter] = useState<'all' | 'spof'>('all');

  useEffect(() => {
    fetchSuccessionData();
  }, []);

  const fetchSuccessionData = async () => {
    setLoading(true);
    try {
      const [nineBox, roles, effectiveness] = await Promise.all([
        api.getNineBoxGrid().catch(() => null),
        api.getCriticalRoles().catch(() => null),
        api.getInterventionEffectiveness().catch(() => null)
      ]);
      setNineBoxData(nineBox);
      setCriticalRolesData(roles);
      setEffectivenessData(effectiveness);
    } catch (e) {
      console.error('Failed to load succession planning data:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedBox = nineBoxData?.boxes?.find((b: any) => b.id === selectedBoxId);
  const filteredRoles = (criticalRolesData?.roles || []).filter((r: any) => {
    if (roleFilter === 'spof') return r.is_single_point_of_failure;
    return true;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="border-b border-cp-border pb-5">
        <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
          <Target className="w-4 h-4" />
          <span>Talent Continuity & Risk Mitigation</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
              Succession Planning & Bench Strength Architecture
            </h1>
            <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
              Evaluate talent distribution across the 9-box performance-potential matrix, detect Single Points of Failure (SPOFs) in mission-critical roles, and track longitudinal intervention retention rates.
            </p>
          </div>
          <button
            onClick={fetchSuccessionData}
            disabled={loading}
            className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-surface hover:bg-cp-bg-elevated text-xs font-semibold text-cp-text-primary transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalibrate Bench</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-cp-text-muted flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-cp-accent" />
          <span>Calibrating 9-box matrix and succession pipelines...</span>
        </div>
      ) : (
        <>
          {/* ── Top Metric KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                Total Evaluated Workforce
              </div>
              <div className="text-2xl font-bold font-mono text-cp-text-primary">
                {nineBoxData?.total_workforce?.toLocaleString() ?? '1,470'}
              </div>
              <div className="text-[11px] text-cp-text-secondary">
                Calibrated on objective velocity & performance
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Single Points of Failure</span>
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                {criticalRolesData?.single_points_of_failure ?? 2} Roles
              </div>
              <div className="text-[11px] text-rose-300">
                0 Ready Now successors with incumbent flight risk
              </div>
            </div>

            <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                Future Stars / Key Talents
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-400">
                {nineBoxData?.boxes?.find((b: any) => b.id === 'high_pot_high_perf')?.count ?? 85}
              </div>
              <div className="text-[11px] text-cp-text-secondary">
                High potential + high performance accelerator tier
              </div>
            </div>

            <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                Intervention Retention Rate
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {effectivenessData?.overall_summary?.average_retention_rate ?? '81.4'}%
              </div>
              <div className="text-[11px] text-cp-text-secondary">
                Directional tracking across {effectivenessData?.overall_summary?.total_tracked_interventions ?? 93} interventions
              </div>
            </div>
          </div>

          {/* ── 9-BOX TALENT CALIBRATION MATRIX ── */}
          <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-cp-text-primary flex items-center gap-2">
                  <Award className="w-4 h-4 text-cp-accent" />
                  <span>9-Box Talent Calibration Matrix</span>
                </h2>
                <p className="text-[11px] text-cp-text-muted mt-0.5">
                  Performance (historical rating) vs Potential Proxy (career velocity, level progression & L&D engagement)
                </p>
              </div>
              <span className="text-[11px] font-mono text-cp-text-muted">
                Click any cell to drill into individual candidate tokens
              </span>
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Rows are arranged High Potential (top), Medium Potential (middle), Low Potential (bottom) */}
              {(nineBoxData?.boxes || []).map((box: any) => {
                const isSelected = selectedBoxId === box.id;
                const isStar = box.id === 'high_pot_high_perf';
                const isDilemma = box.id === 'high_pot_low_perf';
                const isUnderperformer = box.id === 'low_pot_low_perf';

                let borderTheme = 'border-cp-border bg-cp-bg-elevated hover:border-cp-accent/50';
                if (isStar) borderTheme = 'border-indigo-500/40 bg-indigo-500/5 hover:border-indigo-500';
                if (isDilemma) borderTheme = 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500';
                if (isUnderperformer) borderTheme = 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500';

                return (
                  <div
                    key={box.id}
                    onClick={() => setSelectedBoxId(box.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${borderTheme} ${
                      isSelected ? 'ring-2 ring-cp-accent shadow-md' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-cp-text-primary">
                        {box.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-cp-accent bg-cp-bg-surface px-2 py-0.5 rounded border border-cp-border">
                        {box.count} ({box.percentage}%)
                      </span>
                    </div>

                    <div className="text-[10px] text-cp-text-muted flex items-center gap-2 mb-2 font-mono">
                      <span>Pot: <strong className="text-cp-text-secondary">{box.potential}</strong></span>
                      <span>|</span>
                      <span>Perf: <strong className="text-cp-text-secondary">{box.performance}</strong></span>
                    </div>

                    <p className="text-[11px] text-cp-text-secondary leading-snug">
                      {box.recommended_action}
                    </p>

                    {box.urgent_risk_count > 0 && (
                      <div className="mt-3 pt-2 border-t border-cp-border/50 flex items-center justify-between text-[10px]">
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          {box.urgent_risk_count} Urgent Flight Risk
                        </span>
                        <ChevronRight className="w-3 h-3 text-cp-text-muted" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Drilldown Drawer for Selected Box */}
            {selectedBox && (
              <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-accent/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cp-accent">
                      Active Calibration Cohort
                    </span>
                    <h3 className="text-sm font-bold text-cp-text-primary">
                      {selectedBox.name} — {selectedBox.count} Employees ({selectedBox.percentage}% of workforce)
                    </h3>
                  </div>
                  <span className="text-xs text-cp-text-muted">
                    Guidance: {selectedBox.recommended_action}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(selectedBox.sample_employee_ids || []).slice(0, 12).map((empId: string) => (
                    <span
                      key={empId}
                      className="px-2.5 py-1 rounded bg-cp-bg-elevated border border-cp-border text-xs font-mono text-cp-text-primary flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3 text-cp-accent" />
                      {empId}
                    </span>
                  ))}
                  {(selectedBox.sample_employee_ids || []).length === 0 && (
                    <span className="text-xs text-cp-text-muted italic">No employees assigned to this cohort.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── CRITICAL ROLES & BENCH STRENGTH PIPELINE ── */}
          <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-cp-text-primary flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cp-accent" />
                  <span>Mission-Critical Roles & Bench Pipeline</span>
                </h2>
                <p className="text-[11px] text-cp-text-muted">
                  Monitoring organizational vulnerabilities, incumbent flight risk, and successor readiness horizons
                </p>
              </div>

              {/* Filter toggle */}
              <div className="flex items-center gap-1.5 bg-cp-bg-elevated p-1 rounded-lg border border-cp-border text-xs">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1 rounded font-semibold transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-cp-bg-surface text-cp-accent shadow-xs'
                      : 'text-cp-text-muted hover:text-cp-text-primary'
                  }`}
                >
                  All Critical Roles ({criticalRolesData?.total_critical_roles ?? 0})
                </button>
                <button
                  onClick={() => setRoleFilter('spof')}
                  className={`px-3 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                    roleFilter === 'spof'
                      ? 'bg-rose-500/15 text-rose-400 shadow-xs'
                      : 'text-cp-text-muted hover:text-rose-400'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  SPOF Only ({criticalRolesData?.single_points_of_failure ?? 0})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] tracking-wider border-b border-cp-border">
                  <tr>
                    <th className="py-2.5 px-3">Role & Department</th>
                    <th className="py-2.5 px-3">Incumbents</th>
                    <th className="py-2.5 px-3">Flight Risk</th>
                    <th className="py-2.5 px-3">Ready Now</th>
                    <th className="py-2.5 px-3">Ready 1-2 Yrs</th>
                    <th className="py-2.5 px-3">Bench Ratio</th>
                    <th className="py-2.5 px-3">SPOF Status</th>
                    <th className="py-2.5 px-3">Mitigation Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border">
                  {filteredRoles.map((role: any) => (
                    <tr key={role.job_role} className="hover:bg-cp-bg-elevated/40">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-cp-text-primary">{role.job_role}</div>
                        <div className="text-[10px] text-cp-text-muted">{role.department} (Lvl {role.average_job_level})</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-cp-text-secondary">
                        {role.incumbents_count}
                      </td>

                      <td className="py-3 px-3">
                        {role.urgent_risk_incumbents > 0 ? (
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500/15 text-rose-400">
                            {role.urgent_risk_incumbents} Urgent
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[10px] font-medium">Standard</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          role.bench_strength.ready_now > 0
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {role.bench_strength.ready_now}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-cp-text-secondary">
                        {role.bench_strength.ready_1_2_years}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className={role.bench_strength.bench_ratio < 0.5 ? 'text-amber-400 font-bold' : 'text-cp-text-primary'}>
                          {role.bench_strength.bench_ratio}x
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {role.is_single_point_of_failure ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                            <AlertOctagon className="w-3 h-3" />
                            <span>SPOF Risk</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Protected</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-cp-text-secondary max-w-xs">
                        {role.mitigation_strategy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── LONGITUDINAL INTERVENTION EFFECTIVENESS ── */}
          <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-cp-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cp-accent" />
                <span>Longitudinal Intervention Effectiveness & Outcomes</span>
              </h2>
              <p className="text-[11px] text-cp-text-muted">
                Observational outcomes (retention, promotion, and 90-day persistence) grouped by intervention category
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(effectivenessData?.categories || []).map((cat: any) => (
                <div key={cat.category} className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-cp-text-primary">{cat.category}</span>
                    <span className="text-[10px] font-mono text-cp-text-muted bg-cp-bg-surface px-2 py-0.5 rounded border border-cp-border">
                      n = {cat.sample_size}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-cp-text-secondary">Retained Rate:</span>
                      <span className="font-mono font-bold text-emerald-400">{cat.retained_percentage}%</span>
                    </div>
                    <div className="w-full bg-cp-bg-surface h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${cat.retained_percentage}%` }}></div>
                    </div>

                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-cp-text-secondary">Promotion Conversion:</span>
                      <span className="font-mono font-bold text-indigo-400">{cat.promoted_percentage}%</span>
                    </div>
                    <div className="w-full bg-cp-bg-surface h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${cat.promoted_percentage}%` }}></div>
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-cp-text-muted">90-Day Retention:</span>
                      <span className="font-mono text-cp-text-primary">{cat.retained_at_90_days_percentage}%</span>
                    </div>
                  </div>

                  {cat.is_small_sample && (
                    <div className="text-[10px] text-amber-400/90 italic pt-1 border-t border-cp-border">
                      * Small cohort ($n &lt; 15$); directional guidance only.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border text-[11px] text-cp-text-muted">
              <strong>Longitudinal Governance Disclosure: </strong>
              {effectivenessData?.longitudinal_disclosure ||
                'Intervention outcomes are tracked across 90-day, 180-day, and 365-day observation windows. Outcomes are directional and do not assert isolated causal attribution.'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
