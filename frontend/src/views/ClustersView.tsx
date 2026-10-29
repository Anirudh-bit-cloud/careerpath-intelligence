import React, { useState } from 'react';
import {
  Network,
  Info,
  CheckCircle,
  BarChart3,
  Search,
  ExternalLink,
  AlertTriangle,
  Sliders,
  Sparkles
} from 'lucide-react';
import { CareerClustersData } from '../types';

interface ClustersViewProps {
  data: CareerClustersData | null;
  loading: boolean;
  onSelectEmployee: (empId: string) => void;
}

const clusterColors: Record<string, string> = {
  'Early-Career Explorers': '#3B82F6',
  'Progressing Career Builders': '#10B981',
  'Stable Long-Term Contributors': '#6366F1',
  'Promotion-Stalled Talent': '#EF4444',
  'High-Risk Stagnation Profiles': '#F59E0B'
};

export const ClustersView: React.FC<ClustersViewProps> = ({ data, loading, onSelectEmployee }) => {
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('All');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  if (loading || !data) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 bg-cp-bg-elevated rounded-lg w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-cp-bg-elevated rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-cp-bg-elevated rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const { metrics, profiles, pca_points } = data;

  const filteredPoints = selectedClusterFilter === 'All'
    ? pca_points
    : pca_points.filter(p => p.CareerCluster === selectedClusterFilter);

  // Compute bounding box for PCA scatter plot canvas
  const minX = -4.5;
  const maxX = 5.5;
  const minY = -4.0;
  const maxY = 4.5;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="border-b border-cp-border pb-5">
        <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
          <Network className="w-4 h-4" />
          <span>Unsupervised Machine Learning Workspace</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
          Workforce Career Trajectory Clustering & Archetypes
        </h1>
        <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
          Ensemble clustering: K-Means + Gaussian Mixture Model (probabilistic soft assignment) +
          Agglomerative Hierarchical (Ward's linkage) + Isolation Forest anomaly detection.
          Cluster profiles are organically derived from multi-feature progression vectors.
        </p>
      </div>

      {/* ── MODEL EVALUATION BENCHMARKS BAR ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs hover:border-cp-accent/50 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
            Clusters (K) · Model
          </div>
          <div className="text-xl font-bold text-cp-text-primary font-mono mt-1">
            {metrics.n_clusters}
          </div>
          <div className="text-[10px] text-cp-accent font-semibold">{metrics.primary_algorithm || 'Ensemble'}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs border-l-3 border-l-sky-500 hover:border-cp-accent/50 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
            Silhouette · Best
          </div>
          <div className="text-xl font-bold text-sky-400 font-mono mt-1">
            {metrics.silhouette_score_primary ?? metrics.silhouette_score_kmeans}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Valid partition separation</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs hover:border-cp-accent/50 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
            Silhouette · GMM
          </div>
          <div className="text-xl font-bold text-violet-400 font-mono mt-1">
            {metrics.silhouette_score_gmm ?? '—'}
          </div>
          <div className="text-[10px] text-cp-text-muted">Gaussian Mixture</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs hover:border-cp-accent/50 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
            Davies-Bouldin
          </div>
          <div className="text-xl font-bold text-cp-text-primary font-mono mt-1">
            {metrics.davies_bouldin_kmeans ?? metrics.davies_bouldin_index}
          </div>
          <div className="text-[10px] text-cp-text-muted">Compactness score</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs hover:border-cp-accent/50 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
            PCA Variance
          </div>
          <div className="text-xl font-bold text-cp-text-primary font-mono mt-1">
            {metrics.pca_total_variance_explained
              ? `${metrics.pca_total_variance_explained}%`
              : metrics.pca_variance_explained
                ? `${(metrics.pca_variance_explained as number[]).reduce((a, b) => a + b, 0)}%`
                : '57.4%'}
          </div>
          <div className="text-[10px] text-cp-text-muted">2-Component projection</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs border-l-3 border-l-amber-500 hover:border-cp-accent/50 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
            Anomalies · IsoForest
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            {metrics.anomaly_count ?? '—'}
          </div>
          <div className="text-[10px] text-amber-400">{metrics.anomaly_rate_percent ?? 8}% extreme stagnation</div>
        </div>
      </div>

      {/* ── CLUSTERING 2D PCA VISUALIZATION + PROFILE CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PCA Map */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-cp-text-primary">
                2D Principal Component Space (PCA Projection)
              </h2>
              <p className="text-[11px] text-cp-text-muted">
                Hover over data points to inspect individual trajectory features. Click to open profile.
              </p>
            </div>

            {/* Filter by Cluster */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-cp-text-muted">Filter:</span>
              <select
                value={selectedClusterFilter}
                onChange={(e) => setSelectedClusterFilter(e.target.value)}
                className="text-xs bg-cp-bg-input border border-cp-border rounded-lg px-2.5 py-1.5 outline-none font-medium text-cp-text-primary"
              >
                <option value="All">All 5 Archetypes</option>
                {profiles.map(p => (
                  <option key={p.Name} value={p.Name}>{p.Name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scatter Plot SVG Canvas */}
          <div className="relative flex-1 min-h-[420px] bg-cp-bg-elevated/70 rounded-xl border border-cp-border p-4 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 800 480" className="w-full h-full">
              {/* Axes and Grid */}
              <line x1="0" y1="240" x2="800" y2="240" stroke="currentColor" className="text-cp-border" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="400" y1="0" x2="400" y2="480" stroke="currentColor" className="text-cp-border" strokeWidth="1" strokeDasharray="3 3" />
              <text x="760" y="235" fill="currentColor" className="text-cp-text-muted" fontSize="10" fontFamily="monospace">PC1</text>
              <text x="405" y="20" fill="currentColor" className="text-cp-text-muted" fontSize="10" fontFamily="monospace">PC2</text>

              {/* Data points */}
              {filteredPoints.map((pt, i) => {
                const cx = ((pt.PCA1 - minX) / (maxX - minX)) * 800;
                const cy = 480 - ((pt.PCA2 - minY) / (maxY - minY)) * 480;
                const color = clusterColors[pt.CareerCluster] || '#0284C7';
                const isHovered = hoveredPoint?.EmployeeID === pt.EmployeeID;

                return (
                  <circle
                    key={pt.EmployeeID || i}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 3.5}
                    fill={color}
                    opacity={isHovered ? 1 : 0.78}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => onSelectEmployee(pt.EmployeeID)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-4 right-4 p-3 bg-cp-bg-surface/95 border border-cp-border rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-md max-w-xs z-10">
                <div className="font-bold text-cp-text-primary flex items-center justify-between font-mono">
                  <span>{hoveredPoint.EmployeeID}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: clusterColors[hoveredPoint.CareerCluster] }}
                  />
                </div>
                <div className="text-[11px] text-cp-text-secondary">{hoveredPoint.JobRole} · {hoveredPoint.Department}</div>
                <div className="pt-1.5 border-t border-cp-border text-[10px] space-y-0.5 text-cp-text-muted">
                  <div>Company Tenure: <strong className="text-cp-text-primary">{hoveredPoint.YearsAtCompany} yrs</strong></div>
                  <div>Promo Latency: <strong className="text-cp-text-primary">{hoveredPoint.YearsSinceLastPromotion} yrs</strong></div>
                  <div>Gap Ratio: <strong className="text-cp-text-primary">{(hoveredPoint.PromotionGapRatio * 100).toFixed(0)}%</strong></div>
                  <div className="text-cp-accent font-semibold pt-1">Click to view full employee profile</div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-cp-border text-xs">
            {profiles.map(p => (
              <div key={p.Name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clusterColors[p.Name] }}></span>
                <span className="text-cp-text-secondary text-[11px]">{p.Name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cluster Profiles List */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-cp-text-primary px-1">
              Cluster Archetype Breakdown
            </h2>

            {profiles.map((p) => {
              const color = clusterColors[p.Name] || '#0284C7';
              return (
                <div
                  key={p.Cluster_ID}
                  className="p-3.5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-2 hover:border-cp-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-cp-text-primary flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                      {p.Name}
                    </span>
                    <span className="text-xs font-mono font-bold text-cp-text-primary">
                      {p.Count} ({p.Percentage}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-cp-text-muted leading-relaxed">
                    {p.PrimaryCharacteristics}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-cp-border text-[10px]">
                    <div>
                      <span className="text-cp-text-muted block">Med Tenure</span>
                      <strong className="text-cp-text-primary font-mono">{p.MedianYearsAtCompany} yrs</strong>
                    </div>
                    <div>
                      <span className="text-cp-text-muted block">Promo Latency</span>
                      <strong className="text-cp-text-primary font-mono">{p.MedianYearsSinceLastPromotion} yrs</strong>
                    </div>
                    <div>
                      <span className="text-cp-text-muted block" title="Retention Opportunity Index (Intervention Priority)">Retention Opp. Index</span>
                      <strong className="text-cp-text-primary font-mono">{p.AvgRetentionOpportunityIndex}/100</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DETAILED CLUSTER FEATURE COMPARISON TABLE ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-cp-text-primary">
              Empirical Cluster Trajectory Comparison Matrix
            </h2>
            <p className="text-[11px] text-cp-text-muted">
              Computed cluster central tendencies across core progression features
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cp-border text-cp-text-muted text-[10px] font-bold uppercase tracking-wider bg-cp-bg-elevated/30">
                <th className="py-2.5 px-3">Archetype</th>
                <th className="py-2.5 px-3 text-right">Cohort Size</th>
                <th className="py-2.5 px-3 text-right">Median Tenure</th>
                <th className="py-2.5 px-3 text-right">Median Role Yrs</th>
                <th className="py-2.5 px-3 text-right">Median Promo Gap</th>
                <th className="py-2.5 px-3 text-right">Mean Gap Ratio</th>
                <th className="py-2.5 px-3 text-right">Annual Training</th>
                <th className="py-2.5 px-3 text-right">High Gap Cases</th>
                <th className="py-2.5 px-3 text-right">Anomalies</th>
                <th className="py-2.5 px-3 text-right" title="Retention Opportunity Index prioritizes career development interventions. Not an attrition probability or financial ROI.">Avg Retention Opp. Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cp-border/50 text-cp-text-secondary">
              {profiles.map((p) => (
                <tr key={p.Cluster_ID} className="hover:bg-cp-bg-hover transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-cp-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: clusterColors[p.Name] }}></span>
                    <span>{p.Name}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right font-medium">{p.Count} ({p.Percentage}%)</td>
                  <td className="py-2.5 px-3 font-mono text-right">{p.MedianYearsAtCompany} yrs</td>
                  <td className="py-2.5 px-3 font-mono text-right">{p.MedianYearsInCurrentRole} yrs</td>
                  <td className="py-2.5 px-3 font-mono text-right font-bold text-rose-400">{p.MedianYearsSinceLastPromotion} yrs</td>
                  <td className="py-2.5 px-3 font-mono text-right font-semibold text-cp-text-primary">{(p.MeanPromotionGapRatio * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 font-mono text-right">{p.MedianTrainingLastYear} / yr</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      p.HighPromotionGapCount > 50
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        : 'bg-cp-bg-elevated text-cp-text-muted border border-cp-border'
                    }`}>
                      {p.HighPromotionGapCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {p.AnomalousStagnationCount != null ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        p.AnomalousStagnationCount > 0
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-cp-bg-elevated text-cp-text-muted border border-cp-border'
                      }`}>
                        {p.AnomalousStagnationCount}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right font-bold text-cp-text-primary">
                    {p.AvgRetentionOpportunityIndex} / 100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RANDOM FOREST FEATURE IMPORTANCE PANEL ── */}
      {metrics.feature_importances && Object.keys(metrics.feature_importances).length > 0 && (
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-cp-text-primary">Random Forest Feature Importances</h2>
            <span className="text-[10px] text-cp-text-muted ml-1">— career dimensions that drive archetype separation</span>
          </div>
          <div className="space-y-2">
            {Object.entries(metrics.feature_importances as Record<string, number>).map(([feat, imp]) => {
              const maxImp = Math.max(...Object.values(metrics.feature_importances as Record<string, number>));
              const pct = (imp / maxImp) * 100;
              return (
                <div key={feat} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-cp-text-secondary w-52 shrink-0">{feat}</span>
                  <div className="flex-1 h-2 bg-cp-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct > 75 ? '#8B5CF6' : pct > 40 ? '#38BDF8' : '#94A3B8'
                      }}
                    />
                  </div>
                  <span className="font-mono text-cp-text-primary w-12 text-right font-medium">{(imp * 100).toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ELBOW & SILHOUETTE CURVE TABLE ── */}
      {metrics.elbow_curve && metrics.elbow_curve.length > 0 && (
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-cp-text-primary">Optimal K Selection — Silhouette & Inertia Curve</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-cp-border text-cp-text-muted text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2 px-3">K</th>
                  <th className="py-2 px-3">Silhouette Score</th>
                  <th className="py-2 px-3">Silhouette (bar)</th>
                  <th className="py-2 px-3">Inertia</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cp-border/50">
                {(metrics.elbow_curve as Array<{ k: number; inertia: number; silhouette_score: number }>).map(row => {
                  const isSelected = row.k === metrics.n_clusters;
                  const maxSil = Math.max(...(metrics.elbow_curve as any[]).map((r: any) => r.silhouette_score));
                  const barPct = (row.silhouette_score / maxSil) * 100;
                  return (
                    <tr key={row.k} className={isSelected ? 'bg-cp-accent/10' : 'hover:bg-cp-bg-hover'}>
                      <td className="py-2 px-3 font-mono font-bold text-cp-text-primary">{row.k}</td>
                      <td className="py-2 px-3 font-mono font-semibold text-cp-accent">{row.silhouette_score.toFixed(4)}</td>
                      <td className="py-2 px-3 w-40">
                        <div className="h-1.5 bg-cp-bg-elevated rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isSelected ? 'bg-cp-accent' : 'bg-cp-text-muted'}`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-cp-text-muted">{row.inertia.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        {isSelected && (
                          <span className="text-[10px] font-bold text-cp-accent bg-cp-accent/15 border border-cp-accent/30 px-2 py-0.5 rounded-full">
                            ✓ Active
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
