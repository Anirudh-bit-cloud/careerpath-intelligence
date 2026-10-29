import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  AlertTriangle,
  User,
  Briefcase,
  Clock,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { EmployeeRecord, Intervention } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface RetentionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeRecord | null;
  existingIntervention?: Intervention | null;
  onSuccess: () => void;
}

export const RetentionDrawer: React.FC<RetentionDrawerProps> = ({
  isOpen,
  onClose,
  employee,
  existingIntervention,
  onSuccess
}) => {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('Career Conversation');
  const [status, setStatus] = useState<string>('New');
  const [priority, setPriority] = useState<string>('Urgent');
  const [actionPlan, setActionPlan] = useState<string>('');
  const [owner, setOwner] = useState<string>('Talent Development Partner');
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (existingIntervention) {
      setCategory(existingIntervention.category || 'Career Conversation');
      setStatus(existingIntervention.status || 'New');
      setPriority(existingIntervention.priority || 'Urgent');
      setActionPlan(existingIntervention.action_plan || '');
      setOwner(existingIntervention.owner || 'Talent Development Partner');
      setTargetDate(existingIntervention.target_date || '');
      setNotes(existingIntervention.notes || '');
    } else if (employee) {
      setCategory(employee.RecommendedCategory || 'Career Conversation');
      setStatus('New');
      setPriority(employee.RetentionPriority || 'Urgent');
      setActionPlan(
        employee.RecommendedAction ||
        `Schedule structured career conversation and evaluate promotion pathing for ${employee.JobRole}.`
      );
      setOwner('Talent Development Partner');
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setTargetDate(defaultDate.toISOString().split('T')[0]);
      setNotes(
        `Automated signal: Retention Opportunity Index ${employee.RetentionOpportunityIndex || 70}/100. Latency: ${employee.YearsSinceLastPromotion} yrs, Role Tenure: ${employee.YearsInCurrentRole} yrs.`
      );
    }
  }, [employee, existingIntervention]);

  if (!isOpen || (!employee && !existingIntervention)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPlan.trim()) {
      toast.error('Validation Error', 'Please enter an action plan description.');
      return;
    }
    if (!owner.trim()) {
      toast.error('Validation Error', 'Please assign an action owner.');
      return;
    }

    setSaving(true);
    try {
      const payload: Intervention = {
        employee_id: employee?.EmployeeID || existingIntervention?.employee_id || '',
        department: employee?.Department || existingIntervention?.department,
        job_role: employee?.JobRole || existingIntervention?.job_role,
        category,
        status,
        priority,
        action_plan: actionPlan.trim(),
        owner: owner.trim(),
        target_date: targetDate,
        notes: notes.trim()
      };

      if (existingIntervention?.id) {
        await api.updateIntervention(existingIntervention.id, payload);
        toast.success('Action Plan Updated', `Plan #${existingIntervention.id} for ${payload.employee_id} updated.`);
      } else {
        await api.createIntervention(payload);
        toast.success('Intervention Initiated', `Career development plan saved for ${payload.employee_id}.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Could not save intervention.');
    } finally {
      setSaving(false);
    }
  };

  const isUrgent = (employee?.RetentionPriority || priority) === 'Urgent';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in panel on the right */}
      <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-cp-bg-surface border-l border-cp-border shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-cp-border flex items-start justify-between bg-cp-bg-elevated/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isUrgent
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {employee?.RetentionPriority || priority} Priority
              </span>
              <span className="text-[11px] font-mono font-semibold text-cp-accent">
                {employee?.EmployeeID || existingIntervention?.employee_id}
              </span>
            </div>
            <h2 className="text-lg font-bold text-cp-text-primary">
              {existingIntervention ? 'Update Development Plan' : 'Initiate Retention Intervention'}
            </h2>
            <p className="text-xs text-cp-text-muted mt-0.5">
              Targeting career trajectory progression before voluntary disengagement.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Employee Diagnostic Profile Card */}
          {employee && (
            <div className="p-4 rounded-xl bg-cp-bg-elevated/40 border border-cp-border space-y-3">
              <div className="flex items-center justify-between border-b border-cp-border/60 pb-2.5">
                <div>
                  <div className="text-sm font-semibold text-cp-text-primary">{employee.JobRole}</div>
                  <div className="text-xs text-cp-text-muted">{employee.Department} &bull; Job Level {employee.JobLevel}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-cp-text-muted">Retention Opportunity Index</div>
                  <div className="text-xl font-bold font-mono text-cp-accent">
                    {employee.RetentionOpportunityIndex ?? '—'}<span className="text-xs text-cp-text-muted font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* Contributing Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-2 rounded-lg bg-cp-bg-surface/60 border border-cp-border/40">
                  <div className="text-[10px] text-cp-text-muted">Promo Latency</div>
                  <div className="font-mono font-bold text-rose-400 mt-0.5">
                    {employee.YearsSinceLastPromotion} yrs
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cp-bg-surface/60 border border-cp-border/40">
                  <div className="text-[10px] text-cp-text-muted">Role Tenure</div>
                  <div className="font-mono font-semibold text-cp-text-primary mt-0.5">
                    {employee.YearsInCurrentRole} yrs
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cp-bg-surface/60 border border-cp-border/40">
                  <div className="text-[10px] text-cp-text-muted">Company Tenure</div>
                  <div className="font-mono font-semibold text-cp-text-primary mt-0.5">
                    {employee.YearsAtCompany} yrs
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cp-bg-surface/60 border border-cp-border/40">
                  <div className="text-[10px] text-cp-text-muted">With Manager</div>
                  <div className="font-mono font-semibold text-cp-text-primary mt-0.5">
                    {employee.YearsWithCurrManager ?? '—'} yrs
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cp-bg-surface/60 border border-cp-border/40">
                  <div className="text-[10px] text-cp-text-muted">Training Last Yr</div>
                  <div className="font-mono font-semibold text-cp-text-primary mt-0.5">
                    {employee.TrainingTimesLastYear} sessions
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cp-bg-surface/60 border border-cp-border/40">
                  <div className="text-[10px] text-cp-text-muted">Trajectory Cluster</div>
                  <div className="font-medium text-cp-accent truncate mt-0.5" title={employee.CareerCluster}>
                    {employee.CareerCluster || 'Standard'}
                  </div>
                </div>
              </div>

              {/* Flagged Diagnostic Rationale */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Why Flagged for Retention Optimization?</span>
                </div>
                <p className="text-cp-text-secondary leading-relaxed text-[11px]">
                  {employee.RecommendationTriggers ||
                    `Employee has ${employee.YearsSinceLastPromotion} years without promotion despite sustained performance and satisfaction. High stagnation ratio (${Math.round((employee.PromotionGapRatio || 0) * 100)}%) indicates career ceiling risk.`}
                </p>
              </div>
            </div>
          )}

          {/* Intervention Form */}
          <form id="drawer-intervention-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-cp-text-secondary mb-1">
                  Intervention Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary outline-none focus:border-cp-accent"
                >
                  <option value="Career Conversation">Career Conversation</option>
                  <option value="Promotion Readiness Review">Promotion Readiness Review</option>
                  <option value="Targeted Reskilling">Targeted Reskilling / L&D</option>
                  <option value="Lateral Role Rotation">Lateral Role Rotation</option>
                  <option value="Manager Alignment">Manager Continuity & Alignment</option>
                  <option value="Executive Sponsorship">Executive Sponsorship</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cp-text-secondary mb-1">
                  Workflow Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary outline-none focus:border-cp-accent"
                >
                  <option value="New">New</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Planned">Planned</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-cp-text-secondary mb-1">
                  Action Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary outline-none focus:border-cp-accent"
                >
                  <option value="Urgent">Urgent Priority</option>
                  <option value="Moderate">Moderate Priority</option>
                  <option value="Standard">Standard Watch</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cp-text-secondary mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary outline-none focus:border-cp-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-cp-text-secondary mb-1">
                Assigned Owner / Talent Partner
              </label>
              <input
                type="text"
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g., Talent Partner Sarah / Engineering Lead Dave"
                className="w-full px-3 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary outline-none focus:border-cp-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-cp-text-secondary mb-1">
                Prescribed Action Plan & Milestones
              </label>
              <textarea
                rows={3}
                required
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                placeholder="Specific development steps, milestones, or promotion review criteria..."
                className="w-full px-3 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary outline-none focus:border-cp-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-cp-text-secondary mb-1">
                Diagnostic & Meeting Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional talent committee notes or manager feedback..."
                className="w-full px-3 py-2 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-primary outline-none focus:border-cp-accent"
              />
            </div>
          </form>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-cp-border bg-cp-bg-elevated/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-cp-border text-cp-text-secondary hover:bg-cp-bg-hover text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="drawer-intervention-form"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            {saving ? (
              <span>Saving to SQLite...</span>
            ) : (
              <>
                <span>{existingIntervention ? 'Update Plan' : 'Persist Intervention'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
