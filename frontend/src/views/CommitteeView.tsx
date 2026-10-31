import React, { useState, useEffect } from 'react';
import {
  Users2,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  FileText,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Save,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { maskEmployeeId, formatPercent, formatTenureYears } from '../utils/format';

interface CommitteeViewProps {
  onSelectEmployee?: (empId: string) => void;
}

export const CommitteeView: React.FC<CommitteeViewProps> = ({ onSelectEmployee }) => {
  const { toast } = useToast();
  const addToast = (msg: string, type: 'success' | 'error' = 'success') =>
    type === 'error' ? toast.error(msg) : toast.success(msg);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // New session modal
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // Decision state
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approved' | 'rejected' | 'deferred' | null>(null);

  // Minutes
  const [minutesText, setMinutesText] = useState('');
  const [savingMinutes, setSavingMinutes] = useState(false);

  // Load committee sessions & candidate candidates
  useEffect(() => {
    loadSessionsAndCandidates();
  }, []);

  const loadSessionsAndCandidates = async () => {
    setLoading(true);
    try {
      const [sessionsData, oppData] = await Promise.all([
        api.listCommitteeSessions(),
        api.getRetentionOpportunities({ limit: 40 })
      ]);
      setSessions(sessionsData);
      if (sessionsData.length > 0) {
        setActiveSession(sessionsData[0]);
        setMinutesText(sessionsData[0].minutes_text || sessionsData[0].meeting_minutes || '');
      }
      setCandidates(oppData.records || []);
      if (oppData.records?.length > 0) {
        setSelectedCandidate(oppData.records[0]);
      }
    } catch (e: any) {
      addToast('Failed to load committee data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;
    try {
      const created = await api.createCommitteeSession(newSessionTitle.trim());
      addToast('Committee session initialized', 'success');
      setSessions([created, ...sessions]);
      setActiveSession(created);
      setMinutesText('');
      setShowNewSessionModal(false);
      setNewSessionTitle('');
    } catch (err: any) {
      addToast(err.message || 'Failed to create session', 'error');
    }
  };

  const handleRecordDecision = async (decision: 'approved' | 'rejected' | 'deferred') => {
    if (!activeSession || !selectedCandidate) return;

    const empId = selectedCandidate.EmployeeID || selectedCandidate.employee_id;

    // Snapshot state for rollback resilience
    const prevSession = { ...activeSession };
    const prevSessions = [...sessions];
    const prevNotes = decisionNotes;

    // Optimistically update candidate in active session
    const optimisticDecision = {
      employee_id: empId,
      decision,
      notes: decisionNotes,
      decided_by: 'committee_chair',
      timestamp: new Date().toISOString()
    };
    const updatedDecisions = [...(activeSession.decisions || []), optimisticDecision];
    const updatedSession = { ...activeSession, decisions: updatedDecisions };

    setActiveSession(updatedSession);
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? updatedSession : s)));
    setDecisionNotes('');
    setSubmittingDecision(true);

    try {
      await api.logCommitteeDecision(activeSession.id, {
        employee_id: empId,
        decision,
        notes: prevNotes,
        decided_by: 'committee_chair'
      });
      addToast(`Candidate decision logged: ${decision.toUpperCase()}`, 'success');

      // Refresh in background
      const updatedSessions = await api.listCommitteeSessions();
      setSessions(updatedSessions);
      const cur = updatedSessions.find((s) => s.id === activeSession.id);
      if (cur) setActiveSession(cur);
    } catch (err: any) {
      // Rollback optimistic changes on failure
      setActiveSession(prevSession);
      setSessions(prevSessions);
      setDecisionNotes(prevNotes);
      addToast(err.message || 'Failed to log decision. Changes rolled back.', 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleSaveMinutes = async () => {
    if (!activeSession) return;
    setSavingMinutes(true);
    try {
      await api.updateCommitteeMinutes(activeSession.id, minutesText);
      addToast('Meeting minutes saved', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save minutes', 'error');
    } finally {
      setSavingMinutes(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const id = (c.EmployeeID || c.employee_id || '').toLowerCase();
    const role = (c.JobRole || c.job_role || '').toLowerCase();
    const dept = (c.Department || c.department || '').toLowerCase();
    return id.includes(term) || role.includes(term) || dept.includes(term);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cp-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-cp-text-primary">
              Talent Review Committee Mode
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Calibration Hub
            </span>
          </div>
          <p className="text-xs text-cp-text-muted mt-1">
            Conduct structured, auditable talent calibration reviews with presentation pseudonymization to eliminate bias.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Presentation Mode Toggle */}
          <button
            onClick={() => setPresentationMode(!presentationMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              presentationMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                : 'bg-cp-bg-surface text-cp-text-secondary border-cp-border hover:text-cp-text-primary'
            }`}
            title="Masks identifiers to eliminate unconscious demographic bias during live committee presentations"
          >
            {presentationMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Presentation Mode (Masked)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Candidate Masking (Bias-Free)</span>
              </>
            )}
          </button>

          {/* New Session Button */}
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Prominent Pseudonymization Active Banner */}
      {presentationMode && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Pseudonymization Active (Unconscious Bias Mitigation)</span>
              <div className="text-[11px] text-amber-200/80 mt-0.5">
                Candidate PII, raw employee IDs, and demographic identifiers are masked. Evaluation is objectively grounded in tenure, latency, and performance data.
              </div>
            </div>
          </div>
          <button
            onClick={() => setPresentationMode(false)}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold shrink-0"
          >
            Exit Masking
          </button>
        </div>
      )}

      {/* Session Selection Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-cp-bg-surface border border-cp-border">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-cp-accent" />
          <span className="text-xs font-semibold text-cp-text-primary">Active Review Session:</span>
          <select
            value={activeSession ? String(activeSession.id) : ''}
            onChange={(e) => {
              const s = sessions.find((item) => String(item.id) === e.target.value);
              if (s) {
                setActiveSession(s);
                setMinutesText(s.minutes_text || s.meeting_minutes || '');
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
          >
            {sessions.length === 0 && <option value="" disabled>No sessions available</option>}
            {sessions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.title} ({new Date(s.scheduled_date || s.created_at).toLocaleDateString()}) — {s.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs text-cp-text-muted">
          <span>Decisions Logged: <strong className="text-cp-text-primary font-mono">{activeSession?.decisions?.length || 0}</strong></span>
          <span className="w-1.5 h-1.5 rounded-full bg-cp-accent" />
          <span>Status: <span className="text-emerald-400 font-semibold">{activeSession?.status || 'Scheduled'}</span></span>
        </div>
      </div>

      {/* Main 2-Column Committee Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Candidate Roster (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-cp-text-primary">Candidate Calibration Queue</h3>
                <span className="text-xs font-mono text-cp-text-muted">({filteredCandidates.length})</span>
              </div>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-cp-text-muted" />
                <input
                  type="text"
                  placeholder="Filter queue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-cp-border text-cp-text-muted uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-2.5">Candidate ID</th>
                    <th className="py-2 px-2.5">Role / Dept</th>
                    <th className="py-2 px-2.5 text-right">Years in Role</th>
                    <th className="py-2 px-2.5 text-right">Promotion Gap</th>
                    <th className="py-2 px-2.5 text-center">ROI Tier</th>
                    <th className="py-2 px-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cp-border/50">
                  {filteredCandidates.map((c, idx) => {
                    const empId = c.EmployeeID || c.employee_id || `cand-${idx}`;
                    const isSelected = (selectedCandidate?.EmployeeID || selectedCandidate?.employee_id) === empId;
                    const maskedId = maskEmployeeId(empId, presentationMode);
                    const jobRole = c.JobRole || c.job_role || 'Specialist';
                    const department = c.Department || c.department || 'General';
                    const yearsSincePromotion = c.YearsSinceLastPromotion ?? c.years_since_last_promotion;
                    const promotionGap = c.PromotionGapYears ?? c.promotion_gap_years ?? (c.PromotionGapRatio != null ? c.PromotionGapRatio : 0);
                    const priorityTier = c.RetentionPriority || c.priority_tier || 'Standard';
                    const interventionStatus = c.InterventionStatus || c.intervention_status || 'Pending';
                    return (
                      <tr
                        key={empId}
                        onClick={() => setSelectedCandidate(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cp-accent/12 font-medium text-cp-text-primary'
                            : 'hover:bg-cp-bg-hover text-cp-text-secondary'
                        }`}
                      >
                        <td className="py-2.5 px-2.5 font-mono text-cp-accent font-semibold">
                          {maskedId}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <div className="font-semibold text-cp-text-primary truncate max-w-[150px]">
                            {presentationMode ? 'Technical Specialist' : jobRole}
                          </div>
                          <div className="text-[10px] text-cp-text-muted truncate">
                            {department}
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono">
                          {yearsSincePromotion != null ? `${Number(yearsSincePromotion).toFixed(1)}y` : '—'}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono font-semibold text-amber-400">
                          +{Number(promotionGap).toFixed(1)}y
                        </td>
                        <td className="py-2.5 px-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              priorityTier === 'Urgent'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                            }`}
                          >
                            {priorityTier}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center">
                          <span className="text-[10px] text-cp-text-muted">
                            {interventionStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Candidate Dossier & Decision Terminal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedCandidate ? (
            <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-cp-border">
                <div>
                  <div className="text-[10px] uppercase font-bold text-cp-text-muted tracking-wider">
                    Calibration Dossier
                  </div>
                  <h3 className="text-lg font-bold text-cp-accent font-mono">
                    {maskEmployeeId(selectedCandidate.EmployeeID || selectedCandidate.employee_id || '', presentationMode)}
                  </h3>
                </div>
                {onSelectEmployee && (
                  <button
                    onClick={() => onSelectEmployee(selectedCandidate.EmployeeID || selectedCandidate.employee_id)}
                    className="text-xs text-cp-accent hover:underline font-medium"
                  >
                    View Deep Profile →
                  </button>
                )}
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-cp-bg-app border border-cp-border/70">
                  <div className="text-[10px] text-cp-text-muted uppercase">Retention Opportunity Index</div>
                  <div className="text-xl font-black text-cp-accent font-mono mt-0.5">
                    {(() => {
                      const score = selectedCandidate.RetentionRiskIndex ?? selectedCandidate.RetentionOpportunityIndex ?? selectedCandidate.retention_opportunity_score ?? 0;
                      return (Number(score) * (score <= 1 ? 100 : 1)).toFixed(0);
                    })()}
                    <span className="text-xs font-normal text-cp-text-muted">/100</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-cp-bg-app border border-cp-border/70">
                  <div className="text-[10px] text-cp-text-muted uppercase">Promotion Lag</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                    +{(() => {
                      const gap = selectedCandidate.PromotionGapYears ?? selectedCandidate.promotion_gap_years ?? (selectedCandidate.PromotionGapRatio != null ? selectedCandidate.PromotionGapRatio : 0);
                      return Number(gap).toFixed(1);
                    })()}
                    <span className="text-xs font-normal text-cp-text-muted"> yrs</span>
                  </div>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-3 rounded-lg bg-cp-accent/10 border border-cp-accent/25 space-y-1">
                <div className="text-[10px] uppercase font-bold text-cp-accent flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Algorithm Recommendation</span>
                </div>
                <div className="text-xs font-semibold text-cp-text-primary">
                  {selectedCandidate.RecommendedAction || selectedCandidate.recommended_action || 'Career Progression & Level Calibration Review'}
                </div>
                <div className="text-[11px] text-cp-text-secondary leading-snug">
                  {selectedCandidate.RecommendationTriggers || selectedCandidate.explanation || 'Employee has exceeded benchmark dwell time for their level.'}
                </div>
              </div>

              {/* Decision Recorder */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-cp-text-primary block">
                    Committee Decision & Justification Notes
                  </label>
                  <span
                    className={`text-[10px] font-mono tabular-nums ${
                      decisionNotes.trim().length < 15 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {decisionNotes.trim().length}/15 min chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Document formal justification, agreed promotion path, or mentoring assignment (min 15 chars)..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent resize-none"
                />

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      if (decisionNotes.trim().length < 15) {
                        addToast('A formal justification of at least 15 characters is required for compliance audit.', 'error');
                        return;
                      }
                      setPendingDecision('approved');
                    }}
                    disabled={submittingDecision}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      if (decisionNotes.trim().length < 15) {
                        addToast('A formal justification of at least 15 characters is required for compliance audit.', 'error');
                        return;
                      }
                      setPendingDecision('deferred');
                    }}
                    disabled={submittingDecision}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Defer</span>
                  </button>
                  <button
                    onClick={() => {
                      if (decisionNotes.trim().length < 15) {
                        addToast('A formal justification of at least 15 characters is required for compliance audit.', 'error');
                        return;
                      }
                      setPendingDecision('rejected');
                    }}
                    disabled={submittingDecision}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-cp-bg-surface border border-cp-border text-center text-xs text-cp-text-muted">
              Select a candidate from the queue to view their evaluation dossier.
            </div>
          )}

          {/* Meeting Minutes Terminal */}
          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cp-accent" />
                <h4 className="text-xs font-bold text-cp-text-primary">Executive Meeting Minutes</h4>
              </div>
              <button
                onClick={handleSaveMinutes}
                disabled={savingMinutes}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover transition-colors"
              >
                <Save className="w-3 h-3" />
                <span>{savingMinutes ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="Record quorum participants, key leadership alignments, and next follow-up dates..."
              value={minutesText}
              onChange={(e) => setMinutesText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary font-mono focus:outline-none focus:border-cp-accent resize-none"
            />
          </div>
        </div>
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-cp-bg-surface border border-cp-border rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary">Schedule New Committee Session</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-cp-text-secondary">Session Title</label>
              <input
                type="text"
                placeholder="e.g. Q4 Executive Engineering Calibration"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="px-3 py-1.5 text-xs text-cp-text-muted hover:text-cp-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Decision Confirmation Modal */}
      {pendingDecision && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-cp-bg-surface border border-cp-border rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                pendingDecision === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                pendingDecision === 'deferred' ? 'bg-amber-500/20 text-amber-400' :
                'bg-rose-500/20 text-rose-400'
              }`}>
                {pendingDecision === 'approved' && <CheckCircle2 className="w-4 h-4" />}
                {pendingDecision === 'deferred' && <Clock className="w-4 h-4" />}
                {pendingDecision === 'rejected' && <XCircle className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-cp-text-primary capitalize">
                  Confirm Committee Decision: {pendingDecision}
                </h3>
                <p className="text-[11px] text-cp-text-muted">
                  Action will be permanently recorded in the calibration compliance audit log.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-cp-text-muted">Candidate:</span>
                <span className="font-mono font-bold text-cp-text-primary">
                  {maskEmployeeId(selectedCandidate.EmployeeID || selectedCandidate.employee_id || '', presentationMode)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cp-text-muted">Decision:</span>
                <span className="font-bold uppercase tracking-wider text-cp-accent">
                  {pendingDecision}
                </span>
              </div>
              <div className="pt-1 border-t border-cp-border/50">
                <div className="text-[10px] uppercase font-bold text-cp-text-muted mb-0.5">Recorded Justification:</div>
                <div className="text-[11px] text-cp-text-secondary italic bg-cp-bg-surface p-2 rounded border border-cp-border/60">
                  "{decisionNotes}"
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPendingDecision(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-cp-text-muted hover:text-cp-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const dec = pendingDecision;
                  setPendingDecision(null);
                  handleRecordDecision(dec);
                }}
                disabled={submittingDecision}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity ${
                  pendingDecision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' :
                  pendingDecision === 'deferred' ? 'bg-amber-600 hover:bg-amber-500' :
                  'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submittingDecision ? 'Logging...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
