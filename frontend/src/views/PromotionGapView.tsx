import React, { useState, useEffect } from 'react';
import {
  ClockAlert,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { PromotionGapResponse, EmployeeRecord } from '../types';

interface PromotionGapViewProps {
  onSelectEmployee: (empId: string) => void;
  dataVersion?: number;
}

export const PromotionGapView: React.FC<PromotionGapViewProps> = ({ onSelectEmployee, dataVersion = 0 }) => {
  const [data, setData] = useState<PromotionGapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minTenure, setMinTenure] = useState<number>(0);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.getPromotionGap({
        page,
        page_size: 20,
        department: selectedDept,
        job_role: selectedRole,
        category: selectedCategory,
        min_tenure: minTenure > 0 ? minTenure : undefined,
        search: search.trim() || undefined
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, selectedDept, selectedRole, selectedCategory, minTenure, dataVersion]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleClearFilters = () => {
    setSelectedDept('All');
    setSelectedRole('All');
    setSelectedCategory('All');
    setMinTenure(0);
    setSearch('');
    setPage(1);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!data?.records) return;
    const headers = [
      'EmployeeID', 'Department', 'JobRole', 'JobLevel', 'YearsAtCompany',
      'YearsInCurrentRole', 'YearsSinceLastPromotion', 'PromotionGapRatio',
      'PromotionGapScore', 'PromotionGapCategory', 'RecommendedAction'
    ];
    const csvRows = [headers.join(',')];
    data.records.forEach((r) => {
      const row = [
        r.EmployeeID,
        `"${r.Department}"`,
        `"${r.JobRole}"`,
        r.JobLevel,
        r.YearsAtCompany,
        r.YearsInCurrentRole,
        r.YearsSinceLastPromotion,
        (r.PromotionGapRatio * 100).toFixed(1) + '%',
        r.PromotionGapScore,
        r.PromotionGapCategory,
        `"${(r.RecommendedAction || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PANW_Promotion_Gap_Analysis_Page_${page}.csv`;
    a.click();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cp-border pb-5">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-rose-500 mb-1 flex items-center gap-1.5">
            <ClockAlert className="w-4 h-4" />
            <span>Stagnation Diagnostic Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
            Promotion Gap & Career Stagnation Monitor
          </h1>
          <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
            Granular inspection of promotion latency, role tenure inertia, and recommended progression reviews
            across enterprise business units.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-lg bg-cp-bg-surface border border-cp-border text-xs font-semibold text-cp-text-primary hover:bg-cp-bg-hover transition-colors shadow-xs flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5 text-cp-text-muted" />
          <span>Export Current View (CSV)</span>
        </button>
      </div>

      {/* ── FILTERS TOOLBAR ── */}
      <div className="p-4 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px]">
            <div className="flex items-center bg-cp-bg-input border border-cp-border rounded-lg px-2.5 py-1.5 focus-within:border-cp-accent">
              <Search className="w-3.5 h-3.5 text-cp-text-muted mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Filter by ID, role, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none text-cp-text-primary placeholder:text-cp-text-muted"
              />
            </div>
          </form>

          {/* Department filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-cp-text-muted font-medium">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
              className="bg-cp-bg-input border border-cp-border rounded-lg px-2.5 py-1.5 outline-none font-medium text-cp-text-primary"
            >
              <option value="All">All Departments</option>
              <option value="Research & Development">Research & Development</option>
              <option value="Sales">Sales</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-cp-text-muted font-medium">Risk:</span>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="bg-cp-bg-input border border-cp-border rounded-lg px-2.5 py-1.5 outline-none font-medium text-cp-text-primary"
            >
              <option value="All">All Risk Tiers</option>
              <option value="High">High Gap (Stalled)</option>
              <option value="Medium">Medium Gap</option>
              <option value="Low">Low Gap (Progressing)</option>
            </select>
          </div>

          {/* Min Tenure Slider */}
          <div className="flex items-center gap-2 text-xs bg-cp-bg-elevated border border-cp-border rounded-lg px-3 py-1">
            <span className="text-cp-text-muted">Min Tenure:</span>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={minTenure}
              onChange={(e) => { setMinTenure(Number(e.target.value)); setPage(1); }}
              className="w-20 accent-cp-accent"
            />
            <span className="font-mono font-semibold text-cp-text-primary">{minTenure}y</span>
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className="p-1.5 text-cp-text-muted hover:text-cp-text-primary rounded-lg hover:bg-cp-bg-hover transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── ANALYTICAL DATA TABLE ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-cp-border bg-cp-bg-elevated/40 flex items-center justify-between">
          <div className="text-xs font-semibold text-cp-text-primary">
            Showing {data?.records.length || 0} of {data?.total_count || 0} Filtered Records
          </div>
          <div className="text-[11px] text-cp-text-muted font-mono">
            Page {data?.page || 1} of {data?.total_pages || 1}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cp-border text-cp-text-muted text-[10px] font-bold uppercase tracking-wider bg-cp-bg-elevated/30">
                <th className="py-2.5 px-3">Employee ID</th>
                <th className="py-2.5 px-3">Department & Role</th>
                <th className="py-2.5 px-3 text-right">Job Level</th>
                <th className="py-2.5 px-3 text-right">Co. Tenure</th>
                <th className="py-2.5 px-3 text-right">Role Tenure</th>
                <th className="py-2.5 px-3 text-right">Since Promo</th>
                <th className="py-2.5 px-3 text-right">Gap Ratio</th>
                <th className="py-2.5 px-3">Risk Tier</th>
                <th className="py-2.5 px-3">Recommended Action</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cp-border/40 text-cp-text-secondary">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="py-3 px-3">
                      <div className="h-4 bg-cp-bg-elevated rounded"></div>
                    </td>
                  </tr>
                ))
              ) : data?.records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-cp-text-muted">
                    No matching employee records found for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                data?.records.map((emp) => {
                  const isHigh = emp.PromotionGapCategory === 'High';
                  const isMed = emp.PromotionGapCategory === 'Medium';
                  const badgeClass = isHigh
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : isMed
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

                  return (
                    <tr key={emp.EmployeeID} className="hover:bg-cp-bg-hover transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-cp-accent">
                        <button
                          onClick={() => onSelectEmployee(emp.EmployeeID)}
                          className="hover:underline flex items-center gap-1 text-left"
                        >
                          {emp.EmployeeID}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-cp-text-primary">{emp.JobRole}</div>
                        <div className="text-[10px] text-cp-text-muted">{emp.Department}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-cp-text-secondary">
                        L{emp.JobLevel}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-cp-text-secondary">
                        {emp.YearsAtCompany} yrs
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-cp-text-primary">
                        {emp.YearsInCurrentRole} yrs
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-rose-400">
                        {emp.YearsSinceLastPromotion} yrs
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-semibold text-cp-text-primary">
                        {(emp.PromotionGapRatio * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider border ${badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-rose-400' : isMed ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <span>{emp.PromotionGapCategory}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-cp-text-secondary max-w-xs truncate" title={emp.RecommendedAction}>
                        {emp.RecommendedAction}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onSelectEmployee(emp.EmployeeID)}
                          className="px-2.5 py-1 rounded bg-cp-bg-elevated hover:bg-cp-accent hover:text-white text-cp-text-primary text-[11px] font-semibold transition-colors inline-flex items-center gap-1 border border-cp-border shadow-2xs"
                        >
                          Profile <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        <div className="px-5 py-3.5 border-t border-cp-border bg-cp-bg-elevated/40 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-surface text-xs font-medium text-cp-text-primary hover:bg-cp-bg-hover disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>

          <span className="text-xs text-cp-text-muted font-medium font-mono">
            Page {page} of {data?.total_pages || 1}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(data?.total_pages || 1, p + 1))}
            disabled={page >= (data?.total_pages || 1)}
            className="px-3 py-1.5 rounded-lg border border-cp-border bg-cp-bg-surface text-xs font-medium text-cp-text-primary hover:bg-cp-bg-hover disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── ROLE LATENCY CHART SUMMARY ── */}
      {data?.role_gap_breakdown && (
        <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-cp-text-primary mb-1">
            Average Promotion Latency Ranked by Role
          </h2>
          <p className="text-[11px] text-cp-text-muted mb-4">
            Identifying enterprise job families where latency systematically clusters
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {data.role_gap_breakdown.map((item) => (
              <div key={item.role} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-cp-text-primary">{item.role}</span>
                  <span className="font-mono text-cp-text-muted font-bold">{item.avg_years.toFixed(1)} yrs</span>
                </div>
                <div className="w-full h-2 bg-cp-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (item.avg_years / 8.0) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
