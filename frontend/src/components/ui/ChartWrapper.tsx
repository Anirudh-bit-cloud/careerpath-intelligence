import React, { useState } from 'react';
import { Table, BarChart2, Info, Check } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export interface TabularDatum {
  label: string;
  value: string | number;
  secondary?: string;
  percentage?: number;
}

export interface ChartWrapperProps {
  title: string;
  takeaway: string;
  units?: string;
  sampleSize?: number | string;
  tabularData?: TabularDatum[];
  disclosure?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  takeaway,
  units,
  sampleSize,
  tabularData,
  disclosure,
  children,
  actions,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  return (
    <Card className={`flex flex-col overflow-hidden ${className}`}>
      {/* Header with Title, Units, and View Mode Toggle */}
      <div className="p-4 sm:p-5 border-b border-cp-border/60 bg-cp-bg-surface flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs sm:text-sm font-bold text-cp-text-primary tracking-tight">
              {title}
            </h3>
            {units && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cp-bg-elevated border border-cp-border text-cp-text-secondary">
                {units}
              </span>
            )}
            {sampleSize && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cp-text-muted bg-cp-bg-surface border border-cp-border/60">
                n = {typeof sampleSize === 'number' ? sampleSize.toLocaleString() : sampleSize}
              </span>
            )}
          </div>
          {/* Executive plain-language takeaway */}
          <p className="text-[11.5px] text-cp-text-secondary leading-snug">
            {takeaway}
          </p>
        </div>

        {/* View Mode Toggle (Chart vs Accessible Table) & Custom Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {actions}
          {tabularData && tabularData.length > 0 && (
            <div className="inline-flex rounded-lg border border-cp-border p-0.5 bg-cp-bg-elevated text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-cp-bg-surface text-cp-text-primary shadow-2xs font-semibold'
                    : 'text-cp-text-muted hover:text-cp-text-primary'
                }`}
                aria-pressed={viewMode === 'chart'}
                title="View as visual chart"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-cp-bg-surface text-cp-text-primary shadow-2xs font-semibold'
                    : 'text-cp-text-muted hover:text-cp-text-primary'
                }`}
                aria-pressed={viewMode === 'table'}
                title="View as accessible tabular data"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Body or Tabular Presentation */}
      <div className="p-4 sm:p-5 flex-1 min-h-0 bg-cp-bg-surface/50">
        {viewMode === 'chart' ? (
          <div className="w-full h-full flex flex-col justify-center">
            {children}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-cp-border text-[10.5px] uppercase font-bold text-cp-text-muted font-mono tracking-wider">
                  <th className="py-2 px-3">Segment / Category</th>
                  <th className="py-2 px-3 text-right">Metric Value</th>
                  {tabularData?.some((d) => d.secondary) && (
                    <th className="py-2 px-3 text-right">Details</th>
                  )}
                  {tabularData?.some((d) => d.percentage !== undefined) && (
                    <th className="py-2 px-3 text-right">% Share</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-cp-border/40 font-mono">
                {tabularData?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-cp-bg-hover transition-colors">
                    <td className="py-2 px-3 font-sans font-medium text-cp-text-primary">
                      {item.label}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-cp-text-primary tabular-nums">
                      {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                    </td>
                    {tabularData.some((d) => d.secondary) && (
                      <td className="py-2 px-3 text-right text-cp-text-muted tabular-nums">
                        {item.secondary || '—'}
                      </td>
                    )}
                    {tabularData.some((d) => d.percentage !== undefined) && (
                      <td className="py-2 px-3 text-right text-cp-accent tabular-nums">
                        {item.percentage !== undefined ? `${item.percentage.toFixed(1)}%` : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclosures & Model Provenance Footnote */}
      {disclosure && (
        <div className="px-4 py-2 border-t border-cp-border/50 bg-cp-bg-elevated/30 flex items-center gap-1.5 text-[10.5px] text-cp-text-muted">
          <Info className="w-3 h-3 text-cp-text-muted shrink-0" />
          <span>{disclosure}</span>
        </div>
      )}
    </Card>
  );
};
