import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex items-center gap-1 border-b border-cp-border ${className}`}
    >
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            disabled={t.disabled}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive
                ? 'border-cp-accent text-cp-accent'
                : 'border-transparent text-cp-text-muted hover:text-cp-text-primary hover:border-cp-border'
            }`}
          >
            {t.icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center">{t.icon}</span>}
            <span>{t.label}</span>
            {t.badge && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isActive ? 'bg-cp-accent/15 text-cp-accent' : 'bg-cp-bg-elevated text-cp-text-muted'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
