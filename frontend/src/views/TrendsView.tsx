import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  User,
  Search,
  Activity,
  BarChart3
} from 'lucide-react';
import { api } from '../services/api';

interface TrendsViewProps {
  dataVersion?: number;
}

export const TrendsView: React.FC<TrendsViewProps> = ({ dataVersion = 0 }) => {
  // Read initial range from URL hash if present (e.g. #trends?range=6m)
  const getInitialRange = (): string => {
    const hash = window.location.hash;
    const match = hash.match(/range=([36]m|12m|all)/i);
    return match ? match[1].toLowerCase() : '12m';
  };

  const [range, setRange] = useState<string>(getInitialRange);
  const [loading, setLoading] = useState<boolean>(true);
  const [trendsOverview, setTrendsOverview] = useState<any>(null);
  const [deptData, setDeptData] = useState<any>(null);
  const [snapshotDates, setSnapshotDates] = useState<any[]>([]);

  // Tier Movement Matrix State
  const [matrixFromDate, setMatrixFromDate] = useState<string>('');
  const [matrixToDate, setMatrixToDate] = useState<string>('');
  const [matrixResult, setMatrixResult] = useState<any>(null);
  const [loadingMatrix, setLoadingMatrix] = useState<boolean>(false);

  // Employee Trajectory State
  const [searchEmpId, setSearchEmpId] = useState<string>('PANW-1042');
  const [empTrajectory, setEmpTrajectory] = useState<any>(null);
  const [loadingEmp, setLoadingEmp] = useState<boolean>(false);
  const [empError, setEmpError] = useState<string | null>(null);

  // Snapshot Action State
  const [capturing, setCapturing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Update URL hash when range changes
  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
    window.location.hash = `trends?range=${newRange}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dates, ov, depts] = await Promise.all([
        api.getSnapshotDates().catch(() => []),
        api.getTrendsOverview(range).catch(() => null),
        api.getTrendsDepartments().catch(() => null)
      ]);

      setSnapshotDates(dates);
      setTrendsOverview(ov);
      setDeptData(depts);

      if (dates && dates.length >= 2) {
        const fromD = dates[0].snapshot_date;
        const toD = dates[dates.length - 1].snapshot_date;
        setMatrixFromDate(fromD);
        setMatrixToDate(toD);
        loadMatrix(fromD, toD);
      }
    } catch (e) {
      console.error('Failed to load trends data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMatrix = async (fromD: string, toD: string) => {
    if (!fromD || !toD) return;
    setLoadingMatrix(true);
    try {
      const res = await api.getTierMovement(fromD, toD);
      setMatrixResult(res);
    } catch (e) {
      console.error('Failed to load tier movement matrix:', e);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const handleSearchEmployee = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchEmpId.trim()) return;

    setLoadingEmp(true);
    setEmpError(null);
    try {
      const res = await api.getTrendsEmployee(searchEmpId.trim());
      setEmpTrajectory(res);
    } catch (err: any) {
      setEmpTrajectory(null);
      setEmpError(`Employee ${searchEmpId} not found in historical snapshots.`);
    } finally {
      setLoadingEmp(false);
    }
  };

  const handleCaptureSnapshot = async () => {
    setCapturing(true);
    setActionMessage(null);
    try {
      const res = await api.createSnapshot();
      setActionMessage(res.message || 'Snapshot captured successfully!');
      loadData();
    } catch (e: any) {
      setActionMessage(`Failed to capture snapshot: ${e.message}`);
    } finally {
      setCapturing(false);
    }
  };

  const handleSeedSyntheticHistory = async () => {
    setCapturing(true);
    setActionMessage(null);
    try {
      const res = await api.seedDemoSnapshots();
      setActionMessage(`Seeded ${res.snapshots_seeded} historical snapshots successfully.`);
      loadData();
    } catch (e: any) {
      setActionMessage(`Failed to seed history: ${e.message}`);
    } finally {
      setCapturing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [range, dataVersion]);

  useEffect(() => {
    handleSearchEmployee();
  }, []);

  const points = trendsOverview?.points || [];
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* ── HEADER & WORKSPACE TOOLBAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cp-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-cp-text-primary">
              Workforce Trends & Progression Velocity
            </h1>
            {trendsOverview?.has_synthetic_history && (
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Synthetic History Seeded
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-cp-accent/15 text-cp-accent border border-cp-accent/30">
              {snapshotDates.length} Snapshots
            </span>
          </div>
          <p className="text-xs text-cp-text-muted">
            Longitudinal telemetry tracking Retention Risk Index (RRI), priority tier migration matrices, and departmental dwell trajectories over time.
          </p>
        </div>

        {/* Action Controls & Range Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-cp-border bg-cp-bg-surface p-0.5 text-xs">
            {['3m', '6m', '12m', 'all'].map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  range === r
                    ? 'bg-cp-accent text-white shadow-xs'
                    : 'text-cp-text-muted hover:text-cp-text-primary'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleCaptureSnapshot}
            disabled={capturing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-all"
            title="Point-in-time idempotent capture of current workforce state"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{capturing ? 'Capturing...' : 'Capture Snapshot'}</span>
          </button>

          <button
            onClick={handleSeedSyntheticHistory}
            disabled={capturing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-surface hover:bg-cp-bg-elevated text-cp-text-secondary text-xs font-semibold transition-all"
            title="Generate 12 months of synthetic history for demonstration"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${capturing ? 'animate-spin' : ''}`} />
            <span>Seed 12M History</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-cp-accent/10 border border-cp-accent/30 text-xs text-cp-text-primary flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs text-cp-text-muted hover:text-cp-text-primary">
            Dismiss
          </button>
        </div>
      )}

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
          <div className="text-[10.5px] uppercase font-bold tracking-wider text-cp-text-muted">
            Workforce Mean RRI
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-cp-text-primary">
              {latestPoint ? latestPoint.mean_rri : '—'}
            </div>
            {trendsOverview?.summary && (
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                  trendsOverview.summary.net_rri_change < 0
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : trendsOverview.summary.net_rri_change > 0
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-cp-bg-elevated text-cp-text-muted border-cp-border'
                }`}
              >
                {trendsOverview.summary.net_rri_change > 0
                  ? `+${trendsOverview.summary.net_rri_change}`
                  : trendsOverview.summary.net_rri_change} pts
              </span>
            )}
          </div>
          <div className="text-[11px] text-cp-text-muted">
            {trendsOverview?.summary?.trajectory === 'improving' ? 'Retention risk decreasing over period' : 'Cohort risk distribution'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
          <div className="text-[10.5px] uppercase font-bold tracking-wider text-rose-400">
            Urgent Review Tier
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-rose-400">
              {latestPoint ? latestPoint.urgent_count : '—'}
            </div>
            <span className="text-xs font-mono font-semibold text-rose-400">
              {latestPoint ? `${latestPoint.urgent_pct}%` : '—'}
            </span>
          </div>
          <div className="text-[11px] text-cp-text-muted">Candidates requiring proactive intervention</div>
        </div>

        <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
          <div className="text-[10.5px] uppercase font-bold tracking-wider text-amber-400">
            Moderate Dwell Tier
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-amber-400">
              {latestPoint ? latestPoint.moderate_count : '—'}
            </div>
            <span className="text-xs font-mono font-semibold text-amber-400">
              {latestPoint ? `${latestPoint.moderate_pct}%` : '—'}
            </span>
          </div>
          <div className="text-[11px] text-cp-text-muted">Approaching level dwell thresholds</div>
        </div>

        <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-1">
          <div className="text-[10.5px] uppercase font-bold tracking-wider text-emerald-400">
            Standard Healthy Progression
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {latestPoint ? latestPoint.standard_count : '—'}
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              {latestPoint ? `${latestPoint.standard_pct}%` : '—'}
            </span>
          </div>
          <div className="text-[11px] text-cp-text-muted">Optimal velocity & healthy engagement</div>
        </div>
      </div>

      {/* ── LONGITUDINAL CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Mean RRI Over Time */}
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-cp-text-primary">
                Workforce Mean Retention Risk Index (RRI)
              </h2>
              <p className="text-[11px] text-cp-text-muted">
                Trajectory of composite risk index across recorded snapshot dates
              </p>
            </div>
            <span className="text-xs font-mono text-cp-accent font-bold">
              Range: {points.length} points
            </span>
          </div>

          <div className="h-48 w-full bg-cp-bg-elevated/40 border border-cp-border rounded-lg p-3 flex flex-col justify-between">
            {points.length > 1 ? (
              <div className="h-36 w-full flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rriTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F75FF" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4F75FF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const rriVals = points.map((p: any) => p.mean_rri);
                    const minR = Math.max(0, Math.min(...rriVals) - 10);
                    const maxR = Math.max(100, Math.max(...rriVals) + 10);
                    const rangeR = maxR - minR || 1;

                    const coords = points.map((p: any, i: number) => {
                      const x = (i / (points.length - 1)) * 480 + 10;
                      const y = 110 - ((p.mean_rri - minR) / rangeR) * 95;
                      return { x, y, rri: p.mean_rri, date: p.date };
                    });

                    const pathD = coords.reduce(
                      (acc: string, c: any, idx: number) =>
                        idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`,
                      ''
                    );
                    const areaD = `${pathD} L ${coords[coords.length - 1].x} 115 L ${coords[0].x} 115 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#rriTrendGrad)" />
                        <path d={pathD} fill="none" stroke="#4F75FF" strokeWidth="2.5" />
                        {coords.map((c: any, i: number) => (
                          <circle
                            key={i}
                            cx={c.x}
                            cy={c.y}
                            r="3.5"
                            className="fill-cp-accent hover:r-5 transition-all"
                          />
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-cp-text-muted">
                Insufficient snapshot points for trajectory visualization. Capture or seed snapshots.
              </div>
            )}
            <div className="flex justify-between text-[10px] text-cp-text-muted font-mono pt-1 border-t border-cp-border/50">
              <span>{points[0]?.date || 'Start'}</span>
              <span>{points[Math.floor(points.length / 2)]?.date || 'Mid'}</span>
              <span>{points[points.length - 1]?.date || 'Latest'}</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Priority Tier Distribution Over Time */}
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-cp-text-primary">
                Risk Tier Distribution Trajectory
              </h2>
              <p className="text-[11px] text-cp-text-muted">
                Headcount breakdown by Urgent (red), Moderate (amber), and Standard (green)
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Urgent
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Mod
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Std
              </span>
            </div>
          </div>

          <div className="h-48 w-full bg-cp-bg-elevated/40 border border-cp-border rounded-lg p-3 flex flex-col justify-between">
            {points.length > 1 ? (
              <div className="h-36 w-full flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                  {(() => {
                    const maxCount = Math.max(...points.map((p: any) => p.headcount), 1);
                    const buildPath = (key: string) => {
                      return points.reduce((acc: string, p: any, i: number) => {
                        const x = (i / (points.length - 1)) * 480 + 10;
                        const y = 110 - (p[key] / maxCount) * 95;
                        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                      }, '');
                    };

                    return (
                      <>
                        <path d={buildPath('standard_count')} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" />
                        <path d={buildPath('moderate_count')} fill="none" stroke="#f59e0b" strokeWidth="2" />
                        <path d={buildPath('urgent_count')} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                      </>
                    );
                  })()}
                </svg>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-cp-text-muted">
                Insufficient snapshot points.
              </div>
            )}
            <div className="flex justify-between text-[10px] text-cp-text-muted font-mono pt-1 border-t border-cp-border/50">
              <span>{points[0]?.date || 'Start'}</span>
              <span>{points[Math.floor(points.length / 2)]?.date || 'Mid'}</span>
              <span>{points[points.length - 1]?.date || 'Latest'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER MOVEMENT MIGRATION MATRIX ── */}
      <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-cp-accent mb-0.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Cohort Transition Matrix</span>
            </div>
            <h2 className="text-sm font-semibold text-cp-text-primary">
              Workforce Priority Tier Migration Matrix
            </h2>
            <p className="text-[11px] text-cp-text-muted">
              Select two point-in-time snapshots to examine how employees crossed between Standard, Moderate, and Urgent retention risk tiers.
            </p>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={matrixFromDate}
              onChange={(e) => {
                setMatrixFromDate(e.target.value);
                loadMatrix(e.target.value, matrixToDate);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-cp-border bg-cp-bg-input text-cp-text-primary outline-none focus:border-cp-accent text-xs font-mono"
            >
              {snapshotDates.map((d: any) => (
                <option key={d.snapshot_date} value={d.snapshot_date}>
                  From: {d.snapshot_date}
                </option>
              ))}
            </select>

            <ArrowRight className="w-3.5 h-3.5 text-cp-text-muted shrink-0" />

            <select
              value={matrixToDate}
              onChange={(e) => {
                setMatrixToDate(e.target.value);
                loadMatrix(matrixFromDate, e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-cp-border bg-cp-bg-input text-cp-text-primary outline-none focus:border-cp-accent text-xs font-mono"
            >
              {snapshotDates.map((d: any) => (
                <option key={d.snapshot_date} value={d.snapshot_date}>
                  To: {d.snapshot_date}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingMatrix ? (
          <div className="p-8 text-center text-xs text-cp-text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cp-accent" />
            <span>Computing migration transition matrix across snapshot cohorts...</span>
          </div>
        ) : matrixResult?.transition_matrix ? (
          <div className="space-y-4 pt-1">
            {/* Quick Transition Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                <div className="text-[10px] text-cp-text-muted uppercase">Tracked Cohort</div>
                <div className="text-lg font-bold font-mono text-cp-text-primary mt-0.5">
                  {matrixResult.cohort_size}
                </div>
                <div className="text-[10px] text-cp-text-muted">Present in both snapshots</div>
              </div>

              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <div className="text-[10px] text-rose-400 uppercase font-bold">Escalated to Urgent</div>
                <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                  +{matrixResult.escalated_to_urgent_count}
                </div>
                <div className="text-[10px] text-rose-300">New high-risk additions</div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">De-escalated / Resolved</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  -{matrixResult.deescalated_from_urgent_count}
                </div>
                <div className="text-[10px] text-emerald-300">Shifted out of Urgent tier</div>
              </div>

              <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border">
                <div className="text-[10px] text-cp-text-muted uppercase">Net Urgent Change</div>
                <div
                  className={`text-lg font-bold font-mono mt-0.5 ${
                    matrixResult.net_urgent_change > 0
                      ? 'text-rose-400'
                      : matrixResult.net_urgent_change < 0
                      ? 'text-emerald-400'
                      : 'text-cp-text-primary'
                  }`}
                >
                  {matrixResult.net_urgent_change > 0 ? `+${matrixResult.net_urgent_change}` : matrixResult.net_urgent_change}
                </div>
                <div className="text-[10px] text-cp-text-muted">Across comparison window</div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] tracking-wider border-b border-cp-border">
                  <tr>
                    <th className="py-2.5 px-3">Starting Tier ({matrixFromDate})</th>
                    <th className="py-2.5 px-3 text-right">→ To Standard</th>
                    <th className="py-2.5 px-3 text-right">→ To Moderate</th>
                    <th className="py-2.5 px-3 text-right text-rose-400">→ To Urgent</th>
                    <th className="py-2.5 px-3 text-right">Starting Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border font-mono text-[11px]">
                  {['Standard', 'Moderate', 'Urgent'].map((tFrom) => {
                    const row = matrixResult.transition_matrix[tFrom] || {};
                    const totalFrom = (row['Standard'] || 0) + (row['Moderate'] || 0) + (row['Urgent'] || 0);
                    return (
                      <tr key={tFrom} className="hover:bg-cp-bg-elevated/40">
                        <td className="py-2.5 px-3 font-sans font-semibold text-cp-text-primary flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tFrom === 'Urgent'
                                ? 'bg-rose-500'
                                : tFrom === 'Moderate'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span>{tFrom}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                          {row['Standard'] || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                          {row['Moderate'] || 0}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold ${
                            tFrom !== 'Urgent' && (row['Urgent'] || 0) > 0 ? 'text-rose-400 bg-rose-500/10' : 'text-cp-text-primary'
                          }`}
                        >
                          {row['Urgent'] || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right text-cp-text-muted font-bold">
                          {totalFrom}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-cp-text-muted">
            {matrixResult?.error || 'Select valid snapshots to view tier movement.'}
          </div>
        )}
      </div>

      {/* ── DEPARTMENT TRAJECTORY HEATMAP ── */}
      {deptData?.matrix && (
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-cp-text-primary">
                Departmental Retention Risk Heatmap Over Time
              </h2>
              <p className="text-[11px] text-cp-text-muted">
                Mean RRI by department across snapshot dates (color intensity reflects retention risk level)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] tracking-wider border-b border-cp-border">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  {deptData.dates.map((dt: string) => (
                    <th key={dt} className="py-2.5 px-3 text-center font-mono">
                      {dt.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cp-border font-mono text-[11px]">
                {deptData.matrix.map((row: any) => (
                  <tr key={row.department} className="hover:bg-cp-bg-elevated/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-cp-text-primary whitespace-nowrap">
                      {row.department}
                    </td>
                    {row.trajectory.map((point: any) => {
                      const rri = point.mean_rri;
                      let bgClass = 'bg-cp-bg-elevated/30 text-cp-text-muted';
                      if (rri != null) {
                        if (rri >= 65) bgClass = 'bg-rose-500/20 text-rose-400 font-bold';
                        else if (rri >= 50) bgClass = 'bg-amber-500/20 text-amber-400 font-semibold';
                        else bgClass = 'bg-emerald-500/15 text-emerald-400';
                      }

                      return (
                        <td key={point.date} className="py-2 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs transition-colors ${bgClass}`}
                            title={`${row.department} on ${point.date}: Mean RRI ${rri ?? '—'}, Urgent Headcount: ${point.urgent_count}`}
                          >
                            {rri != null ? rri : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SINGLE EMPLOYEE TRAJECTORY DRILL-DOWN ── */}
      <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-cp-accent mb-0.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Individual Longitudinal Profile</span>
            </div>
            <h2 className="text-sm font-semibold text-cp-text-primary">
              Employee Progression History Drill-Down
            </h2>
            <p className="text-[11px] text-cp-text-muted">
              Audit how an individual contributor's promotion gap and retention risk evolved across historical snapshots
            </p>
          </div>

          <form onSubmit={handleSearchEmployee} className="flex items-center gap-2">
            <input
              type="text"
              value={searchEmpId}
              onChange={(e) => setSearchEmpId(e.target.value)}
              placeholder="e.g. PANW-1042"
              className="px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-input text-xs text-cp-text-primary outline-none focus:border-cp-accent font-mono w-36"
            />
            <button
              type="submit"
              disabled={loadingEmp}
              className="px-3 py-1.5 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-all"
            >
              {loadingEmp ? 'Loading...' : 'Audit Trajectory'}
            </button>
          </form>
        </div>

        {empError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {empError}
          </div>
        )}

        {empTrajectory?.trajectory && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 text-xs p-3 rounded-lg bg-cp-bg-elevated border border-cp-border font-mono">
              <span className="text-cp-text-primary font-bold">{empTrajectory.employee_id}</span>
              <span className="text-cp-text-muted">|</span>
              <span className="text-cp-text-secondary">{empTrajectory.department}</span>
              <span className="text-cp-text-muted">|</span>
              <span className="text-cp-accent">Current RRI: {empTrajectory.current_rri}</span>
              <span className="text-cp-text-muted">|</span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold ${
                  empTrajectory.current_tier === 'Urgent'
                    ? 'text-rose-400 bg-rose-500/15'
                    : empTrajectory.current_tier === 'Moderate'
                    ? 'text-amber-400 bg-amber-500/15'
                    : 'text-emerald-400 bg-emerald-500/15'
                }`}
              >
                {empTrajectory.current_tier}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] tracking-wider border-b border-cp-border">
                  <tr>
                    <th className="py-2.5 px-3">Snapshot Date</th>
                    <th className="py-2.5 px-3 text-right">RRI Score</th>
                    <th className="py-2.5 px-3">Priority Tier</th>
                    <th className="py-2.5 px-3 text-right">Job Level</th>
                    <th className="py-2.5 px-3 text-right">Promotion Dwell</th>
                    <th className="py-2.5 px-3 text-right">Satisfaction</th>
                    <th className="py-2.5 px-3">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border font-mono text-[11px]">
                  {empTrajectory.trajectory.map((point: any) => (
                    <tr key={point.snapshot_date} className="hover:bg-cp-bg-elevated/40">
                      <td className="py-2.5 px-3 font-semibold text-cp-text-primary">{point.snapshot_date}</td>
                      <td className="py-2.5 px-3 text-right text-cp-accent font-bold">{point.rri}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            point.rri_tier === 'Urgent'
                              ? 'bg-rose-500/15 text-rose-400'
                              : point.rri_tier === 'Moderate'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {point.rri_tier}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-cp-text-secondary">L{point.job_level}</td>
                      <td className="py-2.5 px-3 text-right text-cp-text-secondary">{point.promotion_gap_years} yrs</td>
                      <td className="py-2.5 px-3 text-right text-cp-text-muted">{point.satisfaction}/4</td>
                      <td className="py-2.5 px-3 font-sans text-[10px]">
                        {point.is_synthetic ? (
                          <span className="text-amber-400">Synthetic Seed</span>
                        ) : (
                          <span className="text-emerald-400">Empirical Baseline</span>
                        )}
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
  );
};
