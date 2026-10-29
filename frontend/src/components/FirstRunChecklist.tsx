import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
  Network,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  tab: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'explore-clusters',
    tab: 'clusters',
    title: 'Explore Career Clusters',
    description: 'Inspect unsupervised ML trajectory archetypes and PCA projections',
    icon: Network
  },
  {
    id: 'review-retention',
    tab: 'retention-opportunities',
    title: 'Review Retention Opportunities',
    description: 'Analyze flight risk indices and schedule targeted intervention plans',
    icon: Target
  },
  {
    id: 'audit-fairness',
    tab: 'fairness-audit',
    title: 'Verify Four-Fifths Fairness Audit',
    description: 'Audit demographic parity ratios and EEOC compliance benchmarks',
    icon: ShieldCheck
  },
  {
    id: 'calibrate-succession',
    tab: 'succession',
    title: 'Calibrate Succession & 9-Box Matrix',
    description: 'Assess bench strength and detect critical single points of failure (SPOFs)',
    icon: Award
  }
];

interface FirstRunChecklistProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
}

export const FirstRunChecklist: React.FC<FirstRunChecklistProps> = ({
  currentTab,
  onNavigateTab
}) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cp_checklist_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [collapsed, setCollapsed] = useState<boolean>(false);

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cp_checklist_completed');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Automatically mark items completed when the user visits their tab
  useEffect(() => {
    const matching = CHECKLIST_ITEMS.find((item) => item.tab === currentTab);
    if (matching && !completedIds.includes(matching.id)) {
      const updated = [...completedIds, matching.id];
      setCompletedIds(updated);
      try {
        localStorage.setItem('cp_checklist_completed', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  }, [currentTab, completedIds]);

  const handleDismissPermanently = () => {
    setDismissed(true);
    try {
      localStorage.setItem('cp_checklist_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (!completedIds.includes(item.id)) {
      const updated = [...completedIds, item.id];
      setCompletedIds(updated);
      try {
        localStorage.setItem('cp_checklist_completed', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    onNavigateTab(item.tab);
  };

  if (dismissed) return null;

  const progressPercent = Math.round((completedIds.length / CHECKLIST_ITEMS.length) * 100);
  const isAllComplete = completedIds.length === CHECKLIST_ITEMS.length;

  return (
    <div
      className="fixed bottom-5 right-5 z-40 w-84 bg-cp-bg-surface border border-cp-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 animate-in slide-in-from-bottom-4"
      role="region"
      aria-label="First-Run Product Checklist"
    >
      {/* Header */}
      <div className="p-3.5 bg-cp-bg-elevated/70 border-b border-cp-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cp-accent/15 border border-cp-accent/30 text-cp-accent flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-cp-text-primary">
              Getting Started Checklist
            </h3>
            <div className="text-[10px] text-cp-text-muted font-mono tabular-nums">
              {completedIds.length} of {CHECKLIST_ITEMS.length} completed ({progressPercent}%)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDismissPermanently}
            className="p-1 rounded text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover"
            title="Dismiss checklist permanently"
            aria-label="Dismiss permanently"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-cp-bg-elevated">
        <div
          className="h-full bg-cp-accent transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Body Items */}
      {!collapsed && (
        <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
          {isAllComplete ? (
            <div className="py-3 px-2 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-cp-text-primary">All Key Workflows Explored!</div>
              <p className="text-[11px] text-cp-text-muted">
                You have reviewed all core analytical and decision hubs.
              </p>
              <button
                onClick={handleDismissPermanently}
                className="mt-2 px-3 py-1.5 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Close Checklist
              </button>
            </div>
          ) : (
            CHECKLIST_ITEMS.map((item) => {
              const isDone = completedIds.includes(item.id);
              const isCurrent = currentTab === item.tab;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition-colors border ${
                    isCurrent
                      ? 'bg-cp-accent/10 border-cp-accent/30 text-cp-text-primary'
                      : 'hover:bg-cp-bg-hover border-transparent text-cp-text-secondary'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-cp-text-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-semibold truncate ${isDone ? 'line-through text-cp-text-muted' : 'text-cp-text-primary'}`}>
                      {item.title}
                    </div>
                    <div className="text-[10px] text-cp-text-muted leading-tight mt-0.5 line-clamp-1">
                      {item.description}
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-cp-text-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100" />
                </button>
              );
            })
          )}

          <div className="pt-2 border-t border-cp-border/40 flex items-center justify-between text-[10px] text-cp-text-muted">
            <span>Click any item to navigate</span>
            <button
              onClick={handleDismissPermanently}
              className="text-cp-text-muted hover:text-cp-accent underline"
            >
              Don't show again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
