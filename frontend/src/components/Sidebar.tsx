import React, { useState } from 'react';
import {
  LayoutDashboard,
  Network,
  ClockAlert,
  Target,
  Users2,
  UserSearch,
  FileSpreadsheet,
  Database,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  TrendingUp,
  User,
  Calculator,
  Briefcase,
  ShieldCheck,
  Palette,
  Home
} from 'lucide-react';
import { DatasetMetadata } from '../types';
import { useTheme } from '../context/ThemeContext';
import { BrandLogo } from './brand/BrandLogo';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  metadata: DatasetMetadata | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  metadata,
  collapsed = false,
  onToggleCollapse
}) => {
  const { config } = useTheme();

  const navGroups = [
    {
      group: 'Analytics & Models',
      items: [
        { id: 'overview', label: 'Workforce Overview', icon: LayoutDashboard },
        { id: 'clusters', label: 'Career Clusters', icon: Network, badge: 'ML' },
        { id: 'promotion-gap', label: 'Promotion Gap Monitor', icon: ClockAlert },
        { id: 'manager-insights', label: 'Manager Insights', icon: Users2 }
      ]
    },
    {
      group: 'Decision & Strategy',
      items: [
        { id: 'retention-opportunities', label: 'Retention Opportunities', icon: Target, badge: 'Urgent' },
        { id: 'committee', label: 'Talent Committee Review', icon: Briefcase, badge: 'New' },
        { id: 'fairness-audit', label: 'Fairness & Bias Audit', icon: ShieldCheck, badge: 'Audit' },
        { id: 'impact-estimator', label: 'Impact & ROI Estimator', icon: Calculator, badge: 'ROI' },
        { id: 'employees', label: 'Employee Explorer', icon: UserSearch },
        { id: 'reports', label: 'Reports & Briefings', icon: FileSpreadsheet }
      ]
    },
    {
      group: 'System & Governance',
      items: [
        { id: 'connectors', label: 'Connectors & Public API', icon: Database, badge: 'API' },
        { id: 'trust-center', label: 'Trust & Governance', icon: ShieldCheck },
        { id: 'design-system', label: 'Design System & Tokens', icon: Palette },
        { id: 'data-management', label: 'Data Management', icon: Sliders },
        { id: 'settings', label: 'Themes & Settings', icon: Activity }
      ]
    }
  ];

  return (
    <aside
      className={`h-screen bg-cp-bg-sidebar border-r border-cp-border flex flex-col shrink-0 select-none transition-all duration-200 z-30 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-cp-border flex items-center justify-between">
        {!collapsed ? (
          <BrandLogo size={28} showWordmark={true} />
        ) : (
          <BrandLogo size={28} showWordmark={false} />
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-md text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover transition-colors ${
              collapsed ? 'hidden' : 'block'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-cp-text-muted">
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left relative group ${
                    isActive
                      ? 'bg-cp-accent/12 text-cp-accent font-semibold border border-cp-accent/25 shadow-xs'
                      : 'text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-hover'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  {/* Left active line indicator */}
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cp-accent" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cp-accent' : 'text-cp-text-muted group-hover:text-cp-text-primary'
                    }`}
                  />

                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        item.badge === 'Urgent'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                          : 'bg-cp-accent/15 text-cp-accent border border-cp-accent/25'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer: Dataset Status + User Profile */}
      <div className="p-3 border-t border-cp-border bg-cp-bg-elevated/40 text-[11px] space-y-2">
        {!collapsed ? (
          <>
            <div className="p-2 rounded-lg bg-cp-bg-surface border border-cp-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-cp-text-muted">Dataset</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-semibold text-cp-text-primary text-xs truncate">
                {metadata?.is_demo ? 'Academic Benchmark' : metadata?.name || 'Active Data'}
              </div>
              <div className="text-[10px] text-cp-text-muted mt-0.5 font-mono">
                {metadata?.total_records?.toLocaleString() || 1470} profiles indexed
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cp-accent/20 border border-cp-accent/30 text-cp-accent flex items-center justify-center text-[10px] font-bold">
                  HR
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] font-semibold text-cp-text-primary">Talent Strategy</div>
                  <div className="text-[9px] text-cp-text-muted">Unified Mentor • Demo</div>
                </div>
              </div>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1 rounded text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-[8.5px] text-cp-text-muted/80 leading-tight pt-1 border-t border-cp-border/40">
              Synthetic benchmark data. Academic prototype.
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Dataset connected" />
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover"
                title="Expand sidebar"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
