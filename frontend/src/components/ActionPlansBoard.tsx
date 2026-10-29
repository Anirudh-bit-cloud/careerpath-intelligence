import React from 'react';
import { Intervention } from '../types';
import { Target, Calendar, User, Clock, CheckCircle2, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ActionPlansBoardProps {
  interventions: Intervention[];
  onEdit: (item: Intervention) => void;
  onRefresh: () => void;
  onSelectEmployee: (empId: string) => void;
}

const COLUMNS = [
  { id: 'New', title: 'New Intake', badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  { id: 'Under Review', title: 'Under Review', badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { id: 'Planned', title: 'Planned', badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { id: 'Completed', title: 'Completed', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
];

export const ActionPlansBoard: React.FC<ActionPlansBoardProps> = ({
  interventions,
  onEdit,
  onRefresh,
  onSelectEmployee
}) => {
  const { toast } = useToast();

  const handleStatusChange = async (item: Intervention, newStatus: string) => {
    if (!item.id) return;
    try {
      await api.updateIntervention(item.id, { ...item, status: newStatus });
      toast.success('Status Updated', `Plan #${item.id} moved to ${newStatus}.`);
      onRefresh();
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update status');
    }
  };

  const handleDelete = async (item: Intervention) => {
    if (!item.id) return;
    if (!window.confirm(`Delete intervention plan #${item.id} for ${item.employee_id}?`)) return;
    try {
      await api.deleteIntervention(item.id);
      toast.info('Plan Deleted', `Plan #${item.id} removed from SQLite.`);
      onRefresh();
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Could not delete plan');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colItems = interventions.filter((item) => (item.status || 'New') === col.id);
        return (
          <div
            key={col.id}
            className="flex flex-col rounded-xl bg-cp-bg-surface border border-cp-border shadow-xs overflow-hidden"
          >
            {/* Column Header */}
            <div className="p-3 border-b border-cp-border bg-cp-bg-elevated/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${col.badgeColor}`}>
                  {col.title}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-cp-text-muted">
                {colItems.length}
              </span>
            </div>

            {/* Column Body Cards */}
            <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[600px] min-h-[160px]">
              {colItems.length === 0 ? (
                <div className="h-full flex items-center justify-center p-6 text-center text-xs text-cp-text-muted">
                  No plans in {col.title}
                </div>
              ) : (
                colItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-cp-bg-elevated/60 border border-cp-border hover:border-cp-accent/50 transition-colors shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onSelectEmployee(item.employee_id)}
                        className="font-mono font-bold text-cp-accent hover:underline text-left text-[11px]"
                      >
                        {item.employee_id}
                      </button>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          item.priority === 'Urgent'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="font-semibold text-cp-text-primary text-[11.5px] leading-tight">
                      {item.category}
                    </div>

                    <p className="text-[11px] text-cp-text-secondary line-clamp-2 leading-relaxed">
                      {item.action_plan}
                    </p>

                    <div className="pt-2 border-t border-cp-border/40 flex items-center justify-between text-[10px] text-cp-text-muted">
                      <div className="flex items-center gap-1 truncate max-w-[120px]">
                        <User className="w-3 h-3" />
                        <span className="truncate">{item.owner}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{item.target_date || '—'}</span>
                      </div>
                    </div>

                    {/* Quick Status Shift + Edit Actions */}
                    <div className="pt-1 flex items-center justify-between gap-1 border-t border-cp-border/30">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        className="text-[10px] bg-cp-bg-surface border border-cp-border rounded px-1.5 py-0.5 text-cp-text-secondary outline-none"
                      >
                        <option value="New">New</option>
                        <option value="Under Review">Review</option>
                        <option value="Planned">Planned</option>
                        <option value="Completed">Done</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1 rounded hover:bg-cp-bg-hover text-cp-text-muted hover:text-cp-accent"
                          title="Edit plan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1 rounded hover:bg-cp-bg-hover text-cp-text-muted hover:text-rose-400"
                          title="Delete plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
