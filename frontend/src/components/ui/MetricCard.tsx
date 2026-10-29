import React from 'react';
import { Info } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  disclosure?: {
    type: 'synthetic' | 'proxy' | 'small-sample' | 'benchmark';
    tooltip?: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  trend,
  disclosure,
  icon,
  className = '',
}) => {
  const disclosureLabels = {
    synthetic: 'Synthetic benchmark',
    proxy: 'Calculated proxy',
    'small-sample': 'Small cohort (n<10)',
    benchmark: 'Industry baseline',
  };

  return (
    <div className={`p-4 rounded-lg border border-cp-border bg-cp-bg-surface shadow-xs space-y-1.5 transition-colors ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-cp-text-muted">
          {label}
        </span>
        {icon && <span className="text-cp-accent w-4 h-4">{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold font-mono tracking-tight text-cp-text-primary tabular-nums">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-mono font-medium ${
              trend.neutral
                ? 'text-cp-text-muted'
                : trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <div className="text-[11px] text-cp-text-secondary leading-snug">
          {subtext}
        </div>
      )}

      {disclosure && (
        <div className="pt-2 border-t border-cp-border/60 flex items-center gap-1 text-[10px] text-cp-text-muted font-mono" title={disclosure.tooltip || disclosureLabels[disclosure.type]}>
          <Info className="w-3 h-3 text-cp-text-muted shrink-0" />
          <span className="truncate">{disclosureLabels[disclosure.type]}</span>
        </div>
      )}
    </div>
  );
};
