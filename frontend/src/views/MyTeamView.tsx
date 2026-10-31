import React, { useState, useEffect } from 'react';
import {
  Users2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Sparkles,
  Clock,
  TrendingUp,
  TrendingDown,
  User,
  Plus,
  Search,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Info,
  Award,
  Copy,
  CheckCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DirectReport {
  employee_id: string;
  job_role: string;
  job_level: number;
  department: string;
  years_in_role: number;
  years_since_promotion: number;
  years_with_manager: number;
  performance_rating: number;
  job_satisfaction: number;
  rri_score: number;
  rri_tier: 'Urgent' | 'Moderate' | 'Standard';
  ml_probability: number | null;
  ml_risk_tier: string;
  top_drivers: Array<{ name: string; detail: string; severity: 'high' | 'medium' | 'low' }>;
  talking_points: string[];
  active_interventions?: any[];
  follow_ups?: any[];
}

interface TeamData {
  manager_id: string;
  headcount: number;
  urgent_count: number;
  moderate_count: number;
  standard_count: number;
  team_mean_rri: number;
  company_mean_rri: number;
  rri_delta: number;
  direct_reports: DirectReport[];
}

export const MyTeamView: React.FC = () => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Decision Support Framing & Ethical Acknowledgement State
  const [acknowledged, setAcknowledged] = useState<boolean>(() => {
    return localStorage.getItem('cp_manager_acknowledged') === 'true';
  });
  const [showAckModal, setShowAckModal] = useState<boolean>(false);
  const [acknowledging, setAcknowledging] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('All');

  // Follow-up Modal State
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<DirectReport | null>(null);
  const [plannedDate, setPlannedDate] = useState<string>('2026-11-15');
  const [topic, setTopic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [syncWithHR, setSyncWithHR] = useState<boolean>(true);
  const [submittingFollowUp, setSubmittingFollowUp] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Follow-up history drawer/list
  const [followUpsList, setFollowUpsList] = useState<any[]>([]);

  useEffect(() => {
    loadTeamData();
    loadFollowUps();
  }, [user]);

  const loadTeamData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyTeam();
      setTeamData(data);
    } catch (err: any) {
      console.error('Failed to load team data:', err);
      setError(err.message || 'Failed to load manager team data');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowUps = async () => {
    try {
      const list = await api.listFollowUps();
      setFollowUpsList(list);
    } catch (err) {
      console.error('Failed to load followups:', err);
    }
  };

  const handleConfirmAcknowledgement = async () => {
    setAcknowledging(true);
    try {
      await api.recordManagerAcknowledgement();
      localStorage.setItem('cp_manager_acknowledged', 'true');
      setAcknowledged(true);
      setShowAckModal(false);
    } catch (err) {
      console.error('Acknowledgement error:', err);
      // Fallback local persistence
      localStorage.setItem('cp_manager_acknowledged', 'true');
      setAcknowledged(true);
      setShowAckModal(false);
    } finally {
      setAcknowledging(false);
    }
  };

  const openFollowUpModal = (report: DirectReport) => {
    setSelectedReport(report);
    setTopic(`Career growth roadmap & ${report.job_role} progression`);
    setNotes(report.talking_points.join('\n• '));
    setShowFollowUpModal(true);
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setSubmittingFollowUp(true);
    try {
      await api.createFollowUp({
        employee_id: selectedReport.employee_id,
        planned_date: plannedDate,
        topic: topic,
        notes: notes,
        talking_points_discussed: selectedReport.talking_points.join(' | '),
        create_hr_intervention: syncWithHR
      });
      setActionSuccessMsg(`1-on-1 follow-up logged for ${selectedReport.employee_id}`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setShowFollowUpModal(false);
      loadTeamData();
      loadFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to create follow-up');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleCopyTalkingPoints = (report: DirectReport) => {
    const text = `1-on-1 Progression Agenda for ${report.employee_id} (${report.job_role}):\n` +
      report.talking_points.map((tp, idx) => `${idx + 1}. ${tp}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(report.employee_id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredReports = teamData?.direct_reports.filter((rep) => {
    const matchesSearch =
      rep.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.job_role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'All' || rep.rri_tier === selectedTier;
    return matchesSearch && matchesTier;
  }) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cp-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-cp-text-primary tracking-tight">My Team & 1-on-1s</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cp-accent/10 text-cp-accent border border-cp-accent/20">
              Role: People Manager
            </span>
          </div>
          <p className="text-sm text-cp-text-muted mt-1">
            Empathetic, data-grounded progression diagnostics and supportive 1-on-1 talking points for direct reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAckModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-cp-border bg-cp-bg-surface hover:bg-cp-bg-hover text-cp-text-secondary transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-cp-accent" />
            Decision Support Guidelines
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-600 text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Decision Support & Non-Punitive Framing Banner */}
      <div className="p-4 rounded-xl bg-cp-accent/5 border border-cp-accent/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cp-accent/10 text-cp-accent shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cp-text-primary">
              Ethical Diagnostic Framing: Growth-Oriented, Non-Punitive
            </h3>
            <p className="text-xs text-cp-text-secondary mt-0.5 max-w-3xl leading-relaxed">
              These progression indicators identify team members who may be experiencing career dwell latency or unpromoted tenure.
              They are <strong>strictly diagnostic aids</strong> to facilitate supportive career coaching, recognition, and internal mobility.
              They must <strong>never</strong> be used to justify disciplinary actions, demotions, or adverse compensation decisions.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {acknowledged ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              Policy Acknowledged
            </span>
          ) : (
            <button
              onClick={() => setShowAckModal(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover shadow-sm transition-all"
            >
              Sign Acknowledgement
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      {teamData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border shadow-sm">
            <div className="text-xs font-medium text-cp-text-muted flex items-center justify-between">
              <span>Direct Team Size</span>
              <Users2 className="w-4 h-4 text-cp-text-muted" />
            </div>
            <div className="text-2xl font-bold font-mono text-cp-text-primary mt-1.5">
              {teamData.headcount}
            </div>
            <div className="text-[11px] text-cp-text-muted mt-0.5">Assigned to manager</div>
          </div>

          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border shadow-sm">
            <div className="text-xs font-medium text-cp-text-muted flex items-center justify-between">
              <span>Urgent Career Reviews</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1.5">
              {teamData.urgent_count}
            </div>
            <div className="text-[11px] text-cp-text-muted mt-0.5">High retention priority window</div>
          </div>

          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border shadow-sm">
            <div className="text-xs font-medium text-cp-text-muted flex items-center justify-between">
              <span>Moderate Development</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-1.5">
              {teamData.moderate_count}
            </div>
            <div className="text-[11px] text-cp-text-muted mt-0.5">Skill refresh & mobility candidates</div>
          </div>

          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border shadow-sm">
            <div className="text-xs font-medium text-cp-text-muted flex items-center justify-between">
              <span>Standard Progression</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1.5">
              {teamData.standard_count}
            </div>
            <div className="text-[11px] text-cp-text-muted mt-0.5">On-track role tenure</div>
          </div>

          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border shadow-sm col-span-2 md:col-span-1">
            <div className="text-xs font-medium text-cp-text-muted flex items-center justify-between">
              <span>Team Mean RRI</span>
              {teamData.rri_delta >= 0 ? (
                <TrendingUp className="w-4 h-4 text-amber-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="text-2xl font-bold font-mono text-cp-text-primary mt-1.5 flex items-baseline gap-1.5">
              <span>{teamData.team_mean_rri}</span>
              <span className="text-xs text-cp-text-muted font-normal">/ 100</span>
            </div>
            <div className="text-[11px] text-cp-text-muted mt-0.5 flex items-center gap-1">
              <span>vs Org ({teamData.company_mean_rri}):</span>
              <span className={`font-mono font-medium ${teamData.rri_delta > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {teamData.rri_delta > 0 ? `+${teamData.rri_delta}` : teamData.rri_delta}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-cp-bg-surface border border-cp-border rounded-xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-cp-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or role..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-cp-bg-main border border-cp-border rounded-lg text-cp-text-primary placeholder:text-cp-text-muted focus:outline-none focus:border-cp-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-cp-text-muted">Filter Tier:</span>
          {(['All', 'Urgent', 'Moderate', 'Standard'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                selectedTier === t
                  ? 'bg-cp-accent text-white shadow-sm'
                  : 'bg-cp-bg-hover text-cp-text-secondary hover:text-cp-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Direct Report Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-cp-bg-surface border border-cp-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-cp-bg-surface border border-cp-border rounded-xl">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-cp-text-primary">Unable to load team members</h3>
          <p className="text-xs text-cp-text-muted mt-1">{error}</p>
          <button
            onClick={loadTeamData}
            className="mt-3 px-3 py-1.5 text-xs font-medium bg-cp-accent text-white rounded-lg hover:bg-cp-accent-hover transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-8 text-center bg-cp-bg-surface border border-cp-border rounded-xl">
          <Users2 className="w-8 h-8 text-cp-text-muted mx-auto mb-2" />
          <p className="text-sm text-cp-text-secondary font-medium">No direct reports found matching filter criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.employee_id}
              className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border shadow-sm hover:border-cp-border-hover transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-cp-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cp-accent/15 border border-cp-accent/30 text-cp-accent flex items-center justify-center font-bold text-sm shrink-0">
                    {report.employee_id.replace('PANW-', '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cp-text-primary text-sm tracking-tight">
                        Employee {report.employee_id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-cp-bg-hover text-cp-text-secondary border border-cp-border">
                        Level {report.job_level}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-cp-bg-hover text-cp-text-muted border border-cp-border">
                        {report.department}
                      </span>
                    </div>
                    <div className="text-xs text-cp-text-muted mt-0.5 font-medium">
                      {report.job_role}
                    </div>
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                      report.rri_tier === 'Urgent'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : report.rri_tier === 'Moderate'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    RRI {report.rri_score} ({report.rri_tier})
                  </span>

                  {report.ml_probability !== null && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20" title="Supervised ML Calibrated Exit Probability">
                      ML P(Exit) = {(report.ml_probability * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Tenures and Top Drivers Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-cp-border/40 text-xs">
                <div>
                  <span className="text-cp-text-muted block text-[11px]">Time in Role:</span>
                  <span className="font-semibold text-cp-text-primary font-mono">{report.years_in_role.toFixed(1)} yrs</span>
                </div>
                <div>
                  <span className="text-cp-text-muted block text-[11px]">Since Promotion:</span>
                  <span className={`font-semibold font-mono ${report.years_since_promotion >= 3.0 ? 'text-amber-600' : 'text-cp-text-primary'}`}>
                    {report.years_since_promotion.toFixed(1)} yrs
                  </span>
                </div>
                <div>
                  <span className="text-cp-text-muted block text-[11px]">With Curr Manager:</span>
                  <span className="font-semibold text-cp-text-primary font-mono">{report.years_with_manager.toFixed(1)} yrs</span>
                </div>
                <div>
                  <span className="text-cp-text-muted block text-[11px]">Job Satisfaction:</span>
                  <span className="font-semibold text-cp-text-primary font-mono">{report.job_satisfaction} / 4.0</span>
                </div>
              </div>

              {/* Top Progression Drivers */}
              <div className="py-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-cp-text-muted">Primary Trajectory Drivers:</span>
                {report.top_drivers.map((d, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                      d.severity === 'high'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                        : d.severity === 'medium'
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                        : 'bg-cp-bg-hover text-cp-text-secondary border-cp-border'
                    }`}
                  >
                    <strong>{d.name}:</strong> {d.detail}
                  </span>
                ))}
              </div>

              {/* Supportive 1-on-1 Talking Points Box */}
              <div className="mt-2.5 p-3.5 rounded-xl bg-cp-bg-main border border-cp-accent/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cp-accent">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Supportive 1-on-1 Growth & Coaching Talking Points</span>
                  </div>
                  <button
                    onClick={() => handleCopyTalkingPoints(report)}
                    className="flex items-center gap-1 text-[11px] text-cp-text-muted hover:text-cp-accent transition-colors"
                    title="Copy talking points to clipboard"
                  >
                    {copiedId === report.employee_id ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy agenda</span>
                      </>
                    )}
                  </button>
                </div>

                <ul className="space-y-1.5 text-xs text-cp-text-secondary">
                  {report.talking_points.map((tp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cp-accent font-bold mt-0.5">•</span>
                      <span>{tp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-3.5 pt-3 border-t border-cp-border/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-cp-text-muted">
                  {report.active_interventions && report.active_interventions.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {report.active_interventions.length} Active HR Intervention
                    </span>
                  ) : (
                    <span className="text-[11px]">No active HR intervention</span>
                  )}
                  {report.follow_ups && report.follow_ups.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      <Clock className="w-3 h-3" />
                      {report.follow_ups.length} 1-on-1 Tracked
                    </span>
                  )}
                </div>

                <button
                  onClick={() => openFollowUpModal(report)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover shadow-sm transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Log 1-on-1 Follow-up
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1-on-1 Follow-up Scheduling Modal */}
      {showFollowUpModal && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-cp-bg-surface border border-cp-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cp-border pb-3">
              <div>
                <h3 className="text-base font-bold text-cp-text-primary">
                  Schedule 1-on-1 Follow-up: {selectedReport.employee_id}
                </h3>
                <p className="text-xs text-cp-text-muted mt-0.5">
                  {selectedReport.job_role} • Baseline RRI: {selectedReport.rri_score}
                </p>
              </div>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="text-cp-text-muted hover:text-cp-text-primary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-cp-text-secondary font-medium mb-1">
                  Target Conversation Date:
                </label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-cp-bg-main border border-cp-border rounded-lg text-cp-text-primary focus:outline-none focus:border-cp-accent"
                />
              </div>

              <div>
                <label className="block text-cp-text-secondary font-medium mb-1">
                  Primary Discussion Focus:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder="e.g. Promotion Readiness Panel Preparation"
                  className="w-full px-3 py-2 bg-cp-bg-main border border-cp-border rounded-lg text-cp-text-primary focus:outline-none focus:border-cp-accent"
                />
              </div>

              <div>
                <label className="block text-cp-text-secondary font-medium mb-1">
                  Discussion Points & Support Plan:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-cp-bg-main border border-cp-border rounded-lg text-cp-text-primary focus:outline-none focus:border-cp-accent leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="syncHR"
                  checked={syncWithHR}
                  onChange={(e) => setSyncWithHR(e.target.checked)}
                  className="rounded border-cp-border text-cp-accent focus:ring-0"
                />
                <label htmlFor="syncHR" className="text-cp-text-secondary select-none">
                  Sync with Central HR Talent Interventions Tracker
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cp-border">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-cp-border hover:bg-cp-bg-hover text-cp-text-secondary font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFollowUp}
                  className="px-4 py-2 rounded-lg bg-cp-accent text-white font-semibold hover:bg-cp-accent-hover shadow-sm transition-all disabled:opacity-50"
                >
                  {submittingFollowUp ? 'Logging...' : 'Confirm & Log Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Support Guidelines & Policy Modal */}
      {showAckModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-cp-bg-surface border border-cp-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-cp-border pb-3">
              <div className="p-2 rounded-lg bg-cp-accent/15 text-cp-accent">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-cp-text-primary">
                  Decision Support & Ethical Standards
                </h3>
                <p className="text-xs text-cp-text-muted">
                  CareerPath Intelligence Manager Guidelines
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-cp-text-secondary leading-relaxed">
              <p>
                As a People Manager, you have visibility into progression risk indicators and dwell latency benchmarks for your direct team.
                Please review and acknowledge these principles:
              </p>
              <div className="p-3 bg-cp-bg-main border border-cp-border rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Growth Enabler:</strong> Indicators are designed to help you advocate for your team's vertical and lateral career development.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Non-Punitive:</strong> Scores are never a measure of personal worth, capability, or disciplinary standing.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Human-in-the-Loop:</strong> Career decisions, promotions, and compensation changes require human review and talent committee calibration.</span>
                </div>
              </div>
              <p className="text-[11px] text-cp-text-muted italic">
                Statement: "I understand these indicators are meant to support employee growth and retention, not to evaluate performance or justify discipline."
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cp-border">
              <button
                onClick={() => setShowAckModal(false)}
                className="px-3.5 py-2 rounded-lg border border-cp-border hover:bg-cp-bg-hover text-cp-text-secondary font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleConfirmAcknowledgement}
                disabled={acknowledging}
                className="px-4 py-2 rounded-lg bg-cp-accent text-white font-semibold hover:bg-cp-accent-hover shadow-sm transition-all disabled:opacity-50"
              >
                {acknowledging ? 'Confirming...' : 'I Acknowledge & Agree'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
