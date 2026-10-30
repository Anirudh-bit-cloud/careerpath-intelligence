import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  FileText,
  X,
  Download,
  AlertTriangle,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Search,
  RotateCcw,
  LayoutGrid,
  List,
  Eye,
  Sliders,
  BarChart2,
  Bookmark,
  ChevronLeft,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import {
  RetentionOpportunityResponse,
  Intervention,
  EmployeeRecord
} from '../types';
import { RetentionDrawer } from '../components/RetentionDrawer';
import { EmployeeCompareModal } from '../components/EmployeeCompareModal';
import { ActionPlansBoard } from '../components/ActionPlansBoard';
import { useToast } from '../context/ToastContext';

interface RetentionOpportunitiesViewProps {
  onSelectEmployee: (empId: string) => void;
  dataVersion?: number;
}

export const RetentionOpportunitiesView: React.FC<RetentionOpportunitiesViewProps> = ({
  onSelectEmployee,
  dataVersion = 0
}) => {
  const { toast } = useToast();

  // Primary data state
  const [data, setData] = useState<RetentionOpportunityResponse | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'candidates' | 'plans'>('candidates');

  // Filter States
  const [priorityFilter, setPriorityFilter] = useState<string>('Urgent');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [clusterFilter, setClusterFilter] = useState<string>('All');
  const [minTenure, setMinTenure] = useState<number>(0);
  const [minGapScore, setMinGapScore] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<string>('RetentionOpportunityIndex');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Table Density & Column Visibility
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    roleTenure: true,
    companyTenure: true,
    managerTenure: true,
    training: true,
    cluster: false
  });
  const [colMenuOpen, setColMenuOpen] = useState<boolean>(false);

  // Multi-Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);

  // Slide-in Drawer State
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerEmployee, setDrawerEmployee] = useState<EmployeeRecord | null>(null);
  const [drawerIntervention, setDrawerIntervention] = useState<Intervention | null>(null);

  // Plans Tab View (Table vs Kanban)
  const [plansViewMode, setPlansViewMode] = useState<'table' | 'board'>('table');
  const [plansStatusFilter, setPlansStatusFilter] = useState<string>('All');

  // Saved Views in LocalStorage
  const [savedViews, setSavedViews] = useState<Array<{ name: string; filters: any }>>(() => {
    try {
      const stored = localStorage.getItem('cp_retention_saved_views');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [showSavedViewsMenu, setShowSavedViewsMenu] = useState<boolean>(false);

  // Fetch candidates and interventions
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        priority: priorityFilter,
        department: deptFilter,
        job_role: roleFilter,
        job_level: levelFilter,
        cluster: clusterFilter,
        search: searchQuery,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        page_size: pageSize
      };
      if (minTenure > 0) params.min_tenure = minTenure;
      if (minGapScore > 0) params.min_gap_score = minGapScore;

      const [oppRes, intRes] = await Promise.all([
        api.getRetentionOpportunities(params),
        api.getInterventions(plansStatusFilter)
      ]);
      setData(oppRes);
      setInterventions(intRes);
    } catch (err: any) {
      console.error(err);
      toast.error('Data Fetch Error', err.message || 'Could not load retention opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    priorityFilter,
    deptFilter,
    roleFilter,
    levelFilter,
    clusterFilter,
    minTenure,
    minGapScore,
    searchQuery,
    sortBy,
    sortDir,
    page,
    pageSize,
    plansStatusFilter,
    dataVersion
  ]);

  // Reset page on filter changes
  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleClearAllFilters = () => {
    setPriorityFilter('All');
    setDeptFilter('All');
    setRoleFilter('All');
    setLevelFilter('All');
    setClusterFilter('All');
    setMinTenure(0);
    setMinGapScore(0);
    setSearchQuery('');
    setPage(1);
    setSelectedIds(new Set());
    toast.info('Filters Reset', 'All filter constraints have been cleared.');
  };

  // Checkbox selection
  const handleToggleSelectAll = () => {
    if (!data?.records) return;
    if (selectedIds.size === data.records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.records.map((r) => r.EmployeeID)));
    }
  };

  const handleToggleSelectRow = (empId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  // Selected employee objects
  const selectedEmployees = useMemo(() => {
    if (!data?.records) return [];
    return data.records.filter((r) => selectedIds.has(r.EmployeeID));
  }, [data, selectedIds]);

  // Open Drawer for creating new intervention
  const handleOpenDrawerCreate = (emp: EmployeeRecord) => {
    setDrawerIntervention(null);
    setDrawerEmployee(emp);
    setDrawerOpen(true);
  };

  // Open Drawer for editing existing intervention
  const handleOpenDrawerEdit = (item: Intervention) => {
    setDrawerEmployee(null);
    setDrawerIntervention(item);
    setDrawerOpen(true);
  };

  // Export filtered candidates to CSV
  const handleExportCandidates = () => {
    if (!data?.records || data.records.length === 0) return;
    const recordsToExport = selectedIds.size > 0 ? selectedEmployees : data.records;
    const headers = [
      'EmployeeID',
      'Department',
      'JobRole',
      'JobLevel',
      'YearsSinceLastPromotion',
      'YearsInCurrentRole',
      'YearsAtCompany',
      'YearsWithCurrManager',
      'RetentionOpportunityIndex',
      'RetentionPriority',
      'RecommendedCategory',
      'RecommendedAction'
    ];
    const rows = [headers.join(',')];
    recordsToExport.forEach((r) => {
      rows.push([
        r.EmployeeID,
        `"${r.Department}"`,
        `"${r.JobRole}"`,
        r.JobLevel,
        r.YearsSinceLastPromotion,
        r.YearsInCurrentRole,
        r.YearsAtCompany,
        r.YearsWithCurrManager ?? '',
        r.RetentionOpportunityIndex,
        r.RetentionPriority,
        `"${r.RecommendedCategory}"`,
        `"${(r.RecommendedAction || '').replace(/"/g, '""')}"`
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PANW_Retention_Opportunities_${priorityFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV Exported', `Exported ${recordsToExport.length} candidate records.`);
  };

  // Export action plans
  const handleExportInterventions = () => {
    if (interventions.length === 0) return;
    const headers = ['ID', 'EmployeeID', 'Category', 'Status', 'Priority', 'ActionPlan', 'Owner', 'TargetDate', 'Notes'];
    const rows = [headers.join(',')];
    interventions.forEach((item) => {
      rows.push([
        item.id,
        item.employee_id,
        `"${item.category}"`,
        item.status,
        item.priority,
        `"${(item.action_plan || '').replace(/"/g, '""')}"`,
        `"${item.owner}"`,
        item.target_date || '',
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PANW_Active_Retention_Interventions.csv`;
    a.click();
    toast.success('CSV Exported', `Exported ${interventions.length} active intervention plans.`);
  };

  // Save current view preset
  const handleSaveCurrentView = () => {
    const viewName = prompt('Enter a name for this custom filter view:');
    if (!viewName) return;
    const newView = {
      name: viewName,
      filters: {
        priorityFilter,
        deptFilter,
        roleFilter,
        levelFilter,
        clusterFilter,
        minTenure,
        minGapScore,
        sortBy,
        sortDir
      }
    };
    const updated = [...savedViews, newView];
    setSavedViews(updated);
    try {
      localStorage.setItem('cp_retention_saved_views', JSON.stringify(updated));
      toast.success('View Saved', `Filter view "${viewName}" stored in browser.`);
    } catch (e) {
      // ignore
    }
  };

  const handleApplySavedView = (view: { name: string; filters: any }) => {
    const f = view.filters;
    setPriorityFilter(f.priorityFilter || 'All');
    setDeptFilter(f.deptFilter || 'All');
    setRoleFilter(f.roleFilter || 'All');
    setLevelFilter(f.levelFilter || 'All');
    setClusterFilter(f.clusterFilter || 'All');
    setMinTenure(f.minTenure || 0);
    setMinGapScore(f.minGapScore || 0);
    setSortBy(f.sortBy || 'RetentionOpportunityIndex');
    setSortDir(f.sortDir || 'desc');
    setPage(1);
    setShowSavedViewsMenu(false);
    toast.info('View Applied', `Loaded "${view.name}" settings.`);
  };

  const hasActiveFilters =
    priorityFilter !== 'All' ||
    deptFilter !== 'All' ||
    roleFilter !== 'All' ||
    levelFilter !== 'All' ||
    clusterFilter !== 'All' ||
    minTenure > 0 ||
    minGapScore > 0 ||
    searchQuery.trim() !== '';

  const summary = data?.filtered_summary || {
    filtered_count: data?.total_count || 0,
    urgent_count: data?.summary?.['Urgent'] || 0,
    moderate_count: data?.summary?.['Moderate'] || 0,
    standard_count: data?.summary?.['Standard'] || 0,
    median_promotion_gap: 0,
    avg_opportunity_index: 0,
    avg_tenure: 0
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cp-border pb-5">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            <span>Proactive Talent Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
            Retention Opportunities & Career Action Plans
          </h1>
          <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
            Prioritize and intervene for high-performing employees experiencing career bottlenecks before voluntary disengagement.
            All development actions are persisted directly to the enterprise database.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={activeTab === 'candidates' ? handleExportCandidates : handleExportInterventions}
            className="px-3.5 py-2 rounded-lg bg-cp-bg-surface border border-cp-border text-xs font-semibold text-cp-text-primary hover:bg-cp-bg-hover transition-colors shadow-xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-cp-text-muted" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── LIVE EXECUTIVE SUMMARY STRIP (100% Dynamic Computed Metrics) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">Filtered Cohort</div>
          <div className="text-xl font-bold font-mono text-cp-text-primary mt-1">
            {summary.filtered_count}
            <span className="text-[11px] font-normal text-cp-text-muted ml-1.5 font-sans">
              / {data?.unfiltered_total || data?.total_count || 1470}
            </span>
          </div>
          <div className="text-[10.5px] text-cp-text-secondary mt-0.5">Matching active filters</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-2xs border-l-3 border-l-rose-500">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Urgent Priority</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {summary.urgent_count}
          </div>
          <div className="text-[10.5px] text-cp-text-muted mt-0.5">Index &ge; 65 with high latency</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-2xs border-l-3 border-l-amber-500">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Moderate Watch</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {summary.moderate_count}
          </div>
          <div className="text-[10.5px] text-cp-text-muted mt-0.5">Approaching ceiling threshold</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cp-accent">Median Promo Latency</div>
          <div className="text-xl font-bold font-mono text-cp-accent mt-1">
            {summary.median_promotion_gap} <span className="text-xs font-normal font-sans text-cp-text-muted">yrs</span>
          </div>
          <div className="text-[10.5px] text-cp-text-secondary mt-0.5">Unpromoted duration</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active Interventions</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {interventions.length} <span className="text-xs font-normal font-sans text-cp-text-muted">plans</span>
          </div>
          <div className="text-[10.5px] text-cp-text-secondary mt-0.5">Persisted in SQLite database</div>
        </div>
      </div>

      {/* ── WORKSPACE TAB SWITCHER ── */}
      <div className="flex items-center justify-between border-b border-cp-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'candidates'
                ? 'bg-cp-accent text-white shadow-xs'
                : 'text-cp-text-secondary hover:bg-cp-bg-hover'
            }`}
          >
            Retention Candidates Roster ({data?.total_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'plans'
                ? 'bg-cp-accent text-white shadow-xs'
                : 'text-cp-text-secondary hover:bg-cp-bg-hover'
            }`}
          >
            Persistent Action Plans ({interventions.length})
          </button>
        </div>

        {/* Action plans view switcher */}
        {activeTab === 'plans' && (
          <div className="flex items-center gap-1 bg-cp-bg-surface border border-cp-border rounded-lg p-0.5">
            <button
              onClick={() => setPlansViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${
                plansViewMode === 'table' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setPlansViewMode('board')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${
                plansViewMode === 'board' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Status Board
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: RETENTION CANDIDATES WORKSPACE ── */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {/* ── FILTER TOOLBAR ── */}
          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-cp-text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                  placeholder="Search ID, role, category, action..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary placeholder:text-cp-text-muted text-xs outline-none focus:border-cp-accent"
                />
              </div>

              {/* Priority */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary text-xs outline-none focus:border-cp-accent"
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="Moderate">Moderate Watch</option>
                  <option value="Standard">Standard Watch</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <select
                  value={deptFilter}
                  onChange={(e) => handleFilterChange(setDeptFilter, e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary text-xs outline-none focus:border-cp-accent"
                >
                  <option value="All">All Departments</option>
                  {data?.filter_options?.departments?.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Job Level */}
              <div>
                <select
                  value={levelFilter}
                  onChange={(e) => handleFilterChange(setLevelFilter, e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary text-xs outline-none focus:border-cp-accent"
                >
                  <option value="All">All Job Levels</option>
                  <option value="1">Level 1 (Associate)</option>
                  <option value="2">Level 2 (Mid-Level)</option>
                  <option value="3">Level 3 (Senior)</option>
                  <option value="4">Level 4 (Principal / Lead)</option>
                  <option value="5">Level 5 (Director / Exec)</option>
                </select>
              </div>

              {/* Min Promo Latency */}
              <div>
                <select
                  value={minGapScore}
                  onChange={(e) => handleFilterChange(setMinGapScore, Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary text-xs outline-none focus:border-cp-accent"
                >
                  <option value={0}>Promo Latency: Any</option>
                  <option value={2}>&ge; 2 years unpromoted</option>
                  <option value={4}>&ge; 4 years unpromoted</option>
                  <option value={6}>&ge; 6 years unpromoted</option>
                  <option value={8}>&ge; 8 years unpromoted</option>
                </select>
              </div>
            </div>

            {/* Toolbar second row: Active chips & Saved Views */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cp-border/60 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-cp-text-muted font-medium mr-1">Active Filters:</span>
                {priorityFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cp-bg-elevated border border-cp-border text-[11px] text-cp-text-primary">
                    Priority: {priorityFilter}
                    <button onClick={() => setPriorityFilter('All')}><X className="w-3 h-3 text-cp-text-muted hover:text-white" /></button>
                  </span>
                )}
                {deptFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cp-bg-elevated border border-cp-border text-[11px] text-cp-text-primary">
                    Dept: {deptFilter}
                    <button onClick={() => setDeptFilter('All')}><X className="w-3 h-3 text-cp-text-muted hover:text-white" /></button>
                  </span>
                )}
                {levelFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cp-bg-elevated border border-cp-border text-[11px] text-cp-text-primary">
                    Level: {levelFilter}
                    <button onClick={() => setLevelFilter('All')}><X className="w-3 h-3 text-cp-text-muted hover:text-white" /></button>
                  </span>
                )}
                {minGapScore > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cp-bg-elevated border border-cp-border text-[11px] text-cp-text-primary">
                    Latency &ge; {minGapScore} yrs
                    <button onClick={() => setMinGapScore(0)}><X className="w-3 h-3 text-cp-text-muted hover:text-white" /></button>
                  </span>
                )}
                {searchQuery.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cp-bg-elevated border border-cp-border text-[11px] text-cp-text-primary">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 text-cp-text-muted hover:text-white" /></button>
                  </span>
                )}

                {hasActiveFilters ? (
                  <button
                    onClick={handleClearAllFilters}
                    className="text-[11px] text-cp-accent hover:underline flex items-center gap-1 ml-2 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear All
                  </button>
                ) : (
                  <span className="text-[11px] text-cp-text-muted italic">None</span>
                )}
              </div>

              {/* View options: Density, Column visibility, Saved views */}
              <div className="flex items-center gap-2">
                {/* Density Toggle */}
                <div className="flex items-center gap-1 bg-cp-bg-elevated border border-cp-border rounded-lg p-0.5">
                  <button
                    onClick={() => setDensity('compact')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      density === 'compact' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
                    }`}
                    title="Compact density for high information display"
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setDensity('comfortable')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      density === 'comfortable' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
                    }`}
                    title="Spacious rows"
                  >
                    Comfortable
                  </button>
                </div>

                {/* Column Visibility Menu */}
                <div className="relative">
                  <button
                    onClick={() => setColMenuOpen(!colMenuOpen)}
                    className="px-2.5 py-1 rounded-lg bg-cp-bg-elevated border border-cp-border text-cp-text-secondary hover:text-cp-text-primary flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Columns</span>
                  </button>
                  {colMenuOpen && (
                    <div className="absolute right-0 mt-1 w-44 rounded-xl bg-cp-bg-surface border border-cp-border shadow-xl p-2 z-20 space-y-1.5 text-xs">
                      <div className="text-[10px] uppercase font-bold text-cp-text-muted px-2 py-1">Toggle Columns</div>
                      {Object.entries({
                        roleTenure: 'Role Tenure',
                        companyTenure: 'Company Tenure',
                        managerTenure: 'Manager Tenure',
                        training: 'Training Count',
                        cluster: 'Career Cluster'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 px-2 py-1 hover:bg-cp-bg-hover rounded cursor-pointer text-cp-text-secondary">
                          <input
                            type="checkbox"
                            checked={visibleColumns[key] ?? true}
                            onChange={(e) => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                            className="rounded border-cp-border text-cp-accent"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved Views */}
                <button
                  onClick={handleSaveCurrentView}
                  className="px-2.5 py-1 rounded-lg bg-cp-bg-elevated border border-cp-border text-cp-text-secondary hover:text-cp-text-primary flex items-center gap-1 text-xs font-medium"
                  title="Bookmark current filter settings"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save View</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── BULK ACTION BAR (Renders when 1 or more rows selected) ── */}
          {selectedIds.size > 0 && (
            <div className="p-3 rounded-xl bg-cp-accent/15 border border-cp-accent/40 flex items-center justify-between text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-semibold text-cp-text-primary">
                <CheckCircle2 className="w-4 h-4 text-cp-accent" />
                <span>{selectedIds.size} talent profile{selectedIds.size > 1 ? 's' : ''} selected</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size >= 2 && selectedIds.size <= 3 && (
                  <button
                    onClick={() => setCompareModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-cp-accent text-white font-semibold flex items-center gap-1.5 hover:opacity-90 shadow-xs"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Compare Profiles ({selectedIds.size})
                  </button>
                )}
                <button
                  onClick={handleExportCandidates}
                  className="px-3 py-1.5 rounded-lg bg-cp-bg-surface border border-cp-border text-cp-text-primary hover:bg-cp-bg-hover font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export Selected
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 py-1.5 rounded-lg text-cp-text-muted hover:text-cp-text-primary"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* ── ENHANCED DATA TABLE ── */}
          <div className="rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cp-border text-cp-text-muted text-[10px] font-bold uppercase tracking-wider bg-cp-bg-elevated/40">
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={Boolean(data?.records && data.records.length > 0 && selectedIds.size === data.records.length)}
                        onChange={handleToggleSelectAll}
                        className="rounded border-cp-border text-cp-accent"
                      />
                    </th>
                    <th className="py-2.5 px-3">Employee ID</th>
                    <th className="py-2.5 px-3">Role & Department</th>
                    <th className="py-2.5 px-3 text-right">Level</th>
                    <th className="py-2.5 px-3 text-right">Promo Latency</th>
                    {visibleColumns.roleTenure && <th className="py-2.5 px-3 text-right">Role Tenure</th>}
                    {visibleColumns.companyTenure && <th className="py-2.5 px-3 text-right">Company Tenure</th>}
                    {visibleColumns.managerTenure && <th className="py-2.5 px-3 text-right">Manager Tenure</th>}
                    {visibleColumns.training && <th className="py-2.5 px-3 text-right">L&D Trainings</th>}
                    {visibleColumns.cluster && <th className="py-2.5 px-3">Career Cluster</th>}
                    <th className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1" title="Retention Risk Index (RRI) prioritizes proactive career development interventions based on dwell time and engagement.">
                        <span>Retention Risk Index (RRI)</span>
                        <Info className="w-3 h-3 text-cp-text-muted" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Recommended Intervention</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border/40 text-cp-text-secondary">
                  {loading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={13} className="py-3 px-3">
                          <div className="h-4 bg-cp-bg-elevated rounded"></div>
                        </td>
                      </tr>
                    ))
                  ) : !data?.records || data.records.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-cp-text-muted">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Filter className="w-6 h-6 text-cp-text-muted/60" />
                          <div className="font-semibold text-cp-text-primary text-sm">No retention candidates match your filters</div>
                          <p className="text-xs max-w-sm text-cp-text-muted">
                            Try expanding your search query, lowering the promotion latency threshold, or clearing active filters.
                          </p>
                          <button
                            onClick={handleClearAllFilters}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-cp-accent text-white text-xs font-semibold"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.records.map((emp) => {
                      const isSelected = selectedIds.has(emp.EmployeeID);
                      const pyClass = density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-3';
                      return (
                        <tr
                          key={emp.EmployeeID}
                          className={`hover:bg-cp-bg-hover transition-colors ${
                            isSelected ? 'bg-cp-accent/5' : ''
                          }`}
                        >
                          <td className={`${pyClass} w-8`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(emp.EmployeeID)}
                              className="rounded border-cp-border text-cp-accent"
                            />
                          </td>
                          <td className={`${pyClass} font-mono font-bold text-cp-accent`}>
                            <button
                              onClick={() => onSelectEmployee(emp.EmployeeID)}
                              className="hover:underline flex items-center gap-1 text-left"
                            >
                              {emp.EmployeeID}
                            </button>
                          </td>
                          <td className={pyClass}>
                            <div className="font-semibold text-cp-text-primary">{emp.JobRole}</div>
                            <div className="text-[10px] text-cp-text-muted">{emp.Department}</div>
                          </td>
                          <td className={`${pyClass} font-mono text-right text-cp-text-secondary`}>
                            L{emp.JobLevel}
                          </td>
                          <td className={`${pyClass} font-mono text-right font-bold text-rose-400`}>
                            {emp.YearsSinceLastPromotion} yrs
                          </td>
                          {visibleColumns.roleTenure && (
                            <td className={`${pyClass} font-mono text-right text-cp-text-primary`}>
                              {emp.YearsInCurrentRole} yrs
                            </td>
                          )}
                          {visibleColumns.companyTenure && (
                            <td className={`${pyClass} font-mono text-right text-cp-text-secondary`}>
                              {emp.YearsAtCompany} yrs
                            </td>
                          )}
                          {visibleColumns.managerTenure && (
                            <td className={`${pyClass} font-mono text-right text-cp-text-secondary`}>
                              {emp.YearsWithCurrManager ?? '—'} yrs
                            </td>
                          )}
                          {visibleColumns.training && (
                            <td className={`${pyClass} font-mono text-right text-cp-text-secondary`}>
                              {emp.TrainingTimesLastYear}
                            </td>
                          )}
                          {visibleColumns.cluster && (
                            <td className={`${pyClass} text-cp-text-secondary max-w-xs truncate`} title={emp.CareerCluster}>
                              {emp.CareerCluster || 'Standard'}
                            </td>
                          )}
                          <td className={`${pyClass} text-right`}>
                            <span className="font-mono font-bold text-cp-text-primary text-sm">
                              {emp.RetentionOpportunityIndex}
                            </span>
                            <span className="text-[10px] text-cp-text-muted font-normal ml-0.5">/100</span>
                          </td>
                          <td className={pyClass}>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${
                                emp.RetentionPriority === 'Urgent'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${emp.RetentionPriority === 'Urgent' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                              <span>{emp.RetentionPriority}</span>
                            </span>
                          </td>
                          <td className={`${pyClass} max-w-xs`}>
                            <div className="font-medium text-cp-text-primary truncate">
                              {emp.RecommendedCategory}
                            </div>
                            <div className="text-[10px] text-cp-text-muted truncate mt-0.5" title={emp.RecommendedAction}>
                              {emp.RecommendedAction}
                            </div>
                          </td>
                          <td className={`${pyClass} text-right`}>
                            <button
                              onClick={() => handleOpenDrawerCreate(emp)}
                              className="px-2.5 py-1 rounded-lg bg-cp-accent hover:opacity-90 text-white text-[11px] font-semibold transition-opacity inline-flex items-center gap-1 shadow-xs"
                            >
                              <Plus className="w-3 h-3" /> Initiate Plan
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 border-t border-cp-border bg-cp-bg-elevated/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cp-text-muted">
              <div>
                Showing page <span className="font-mono font-bold text-cp-text-primary">{page}</span> of{' '}
                <span className="font-mono font-bold text-cp-text-primary">{data?.total_pages || 1}</span>{' '}
                ({data?.total_count || 0} candidates)
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded bg-cp-bg-surface border border-cp-border text-cp-text-primary text-xs outline-none"
                >
                  <option value={15}>15 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>

                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-cp-border text-cp-text-secondary hover:bg-cp-bg-hover disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={!data || page >= (data.total_pages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-cp-border text-cp-text-secondary hover:bg-cp-bg-hover disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PERSISTENT INTERVENTIONS WORKSPACE ── */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-cp-text-muted font-medium">Status Filter:</span>
              {['All', 'New', 'Under Review', 'Planned', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPlansStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    plansStatusFilter === st
                      ? 'bg-cp-accent text-white'
                      : 'bg-cp-bg-elevated text-cp-text-muted hover:text-cp-text-primary'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setDrawerEmployee(null);
                setDrawerIntervention({
                  employee_id: 'PANW-',
                  category: 'Career Conversation',
                  status: 'New',
                  priority: 'Urgent',
                  action_plan: '',
                  owner: 'Talent Development Partner'
                });
                setDrawerOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> New Action Plan
            </button>
          </div>

          {/* Render either Board view or Table view */}
          {plansViewMode === 'board' ? (
            <ActionPlansBoard
              interventions={interventions}
              onEdit={handleOpenDrawerEdit}
              onRefresh={fetchData}
              onSelectEmployee={onSelectEmployee}
            />
          ) : (
            <div className="rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-cp-border text-cp-text-muted text-[10px] font-bold uppercase tracking-wider bg-cp-bg-elevated/40">
                      <th className="py-2.5 px-3">Plan ID</th>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Intervention Category</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Action Plan</th>
                      <th className="py-2.5 px-3">Owner</th>
                      <th className="py-2.5 px-3">Target Date</th>
                      <th className="py-2.5 px-3 text-right">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cp-border/40 text-cp-text-secondary">
                    {interventions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-cp-text-muted">
                          No active intervention plans matching this status filter.
                        </td>
                      </tr>
                    ) : (
                      interventions.map((item) => (
                        <tr key={item.id} className="hover:bg-cp-bg-hover transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-cp-text-muted">
                            #{item.id}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-cp-accent">
                            <button
                              onClick={() => onSelectEmployee(item.employee_id)}
                              className="hover:underline"
                            >
                              {item.employee_id}
                            </button>
                          </td>
                          <td className="py-3 px-3 font-medium text-cp-text-primary">
                            {item.category}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${
                                item.status === 'Completed'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : item.status === 'Planned'
                                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                  : item.status === 'Under Review'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-cp-bg-elevated text-cp-text-muted border border-cp-border'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${
                                item.priority === 'Urgent'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-sm truncate text-cp-text-primary" title={item.action_plan}>
                            {item.action_plan}
                          </td>
                          <td className="py-3 px-3 text-cp-text-secondary">{item.owner}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-cp-text-muted">{item.target_date || '—'}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleOpenDrawerEdit(item)}
                              className="px-2.5 py-1 rounded-md bg-cp-bg-elevated hover:bg-cp-accent hover:text-white text-cp-text-primary text-[11px] font-semibold transition-colors border border-cp-border"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SLIDE-IN RIGHT DRAWER (Keeps table visible) ── */}
      <RetentionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employee={drawerEmployee}
        existingIntervention={drawerIntervention}
        onSuccess={fetchData}
      />

      {/* ── EMPLOYEE SIDE-BY-SIDE COMPARISON MODAL ── */}
      <EmployeeCompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        employees={selectedEmployees}
        onSelectEmployee={onSelectEmployee}
        onInitiatePlan={handleOpenDrawerCreate}
      />
    </div>
  );
};
