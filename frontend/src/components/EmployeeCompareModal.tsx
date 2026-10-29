import React from 'react';
import { X, ArrowRight, BarChart2, CheckCircle2 } from 'lucide-react';
import { EmployeeRecord } from '../types';

interface EmployeeCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeRecord[];
  onSelectEmployee: (empId: string) => void;
  onInitiatePlan: (emp: EmployeeRecord) => void;
}

export const EmployeeCompareModal: React.FC<EmployeeCompareModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSelectEmployee,
  onInitiatePlan
}) => {
  if (!isOpen || employees.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-cp-bg-surface border border-cp-border rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-cp-border flex items-center justify-between bg-cp-bg-elevated/60">
          <div>
            <h2 className="text-base font-bold text-cp-text-primary flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cp-accent" />
              Side-by-Side Retention Opportunity Comparison
            </h2>
            <p className="text-xs text-cp-text-muted mt-0.5">
              Comparing {employees.length} talent profiles across career progression indicators.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div
                key={emp.EmployeeID}
                className="p-4 rounded-xl bg-cp-bg-elevated/40 border border-cp-border flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-cp-accent">{emp.EmployeeID}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        emp.RetentionPriority === 'Urgent'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {emp.RetentionPriority}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="font-bold text-sm text-cp-text-primary">{emp.JobRole}</div>
                    <div className="text-xs text-cp-text-muted">{emp.Department} &bull; Level {emp.JobLevel}</div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cp-border/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-cp-text-muted">Retention Opportunity Index:</span>
                      <span className="font-mono font-bold text-cp-accent">{emp.RetentionOpportunityIndex}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-muted">Promotion Latency:</span>
                      <span className="font-mono font-bold text-rose-400">{emp.YearsSinceLastPromotion} yrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-muted">Role Tenure:</span>
                      <span className="font-mono font-semibold text-cp-text-primary">{emp.YearsInCurrentRole} yrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-muted">Company Tenure:</span>
                      <span className="font-mono font-semibold text-cp-text-primary">{emp.YearsAtCompany} yrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-muted">With Current Manager:</span>
                      <span className="font-mono font-semibold text-cp-text-primary">{emp.YearsWithCurrManager ?? '—'} yrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-muted">L&D Trainings Last Yr:</span>
                      <span className="font-mono font-semibold text-cp-text-primary">{emp.TrainingTimesLastYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-muted">Career Trajectory:</span>
                      <span className="font-medium text-cp-text-secondary truncate max-w-[140px] text-right" title={emp.CareerCluster}>
                        {emp.CareerCluster || 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cp-border/60">
                    <div className="text-[10px] uppercase font-bold text-cp-text-muted mb-1">Prescribed Action</div>
                    <div className="text-xs text-cp-text-secondary leading-snug">
                      {emp.RecommendedAction || 'Standard career progression review.'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectEmployee(emp.EmployeeID);
                    }}
                    className="flex-1 py-1.5 rounded-lg border border-cp-border text-cp-text-secondary hover:bg-cp-bg-hover text-xs font-semibold"
                  >
                    View 360&deg;
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onInitiatePlan(emp);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-cp-accent text-white hover:opacity-90 text-xs font-semibold"
                  >
                    Initiate Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cp-border bg-cp-bg-elevated/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
