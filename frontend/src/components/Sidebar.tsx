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
  ShieldCheck,
  Calculator,
  Briefcase,
  Award,
  Palette,
  Settings,
  User,
  Shield,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import { DatasetMetadata } from '../types';
import { BrandLogo } from './brand/BrandLogo';
import { useAuth, UserRole, ROLE_CONFIGS } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  metadata: DatasetMetadata | null;
  urgentCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  functionalBadge?: string | number;
  badgeVariant?: 'urgent' | 'default';
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  metadata,
  urgentCount = 0,
  collapsed = false,
  onToggleCollapse
}) => {
  const { user, role, setRole, canAccessTab } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // 6 canonical enterprise groups per Phase 2 specifications
  const rawNavGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        { id: 'overview', label: 'Workforce Overview', icon: LayoutDashboard },
        { id: 'reports', label: 'Reports & Briefings', icon: FileSpreadsheet }
      ]
    },
    {
      group: 'Workforce Analytics',
      items: [
        { id: 'clusters', label: 'Career Clusters', icon: Network },
        { id: 'promotion-gap', label: 'Promotion Gap Monitor', icon: ClockAlert },
        { id: 'trends', label: 'Workforce Trends', icon: TrendingUp },
        { id: 'manager-insights', label: 'Manager Insights', icon: Users2 }
      ]
    },
    {
      group: 'Decisions',
      items: [
        { id: 'my-team', label: 'My Team & 1-on-1s', icon: Users2 },
        {
          id: 'retention-opportunities',
          label: 'Retention Opportunities',
          icon: Target,
          functionalBadge: urgentCount > 0 ? urgentCount : undefined,
          badgeVariant: 'urgent'
        },
        { id: 'succession', label: 'Succession & Bench', icon: Award },
        { id: 'committee', label: 'Talent Committee Review', icon: Briefcase },
        { id: 'impact-estimator', label: 'Impact & ROI Estimator', icon: Calculator },
        { id: 'employees', label: 'Employee Explorer', icon: UserSearch }
      ]
    },
    {
      group: 'Governance & Trust',
      items: [
        { id: 'fairness-audit', label: 'Fairness & Bias Audit', icon: ShieldCheck },
        { id: 'trust-center', label: 'Trust Center & Governance', icon: Shield }
      ]
    },
    {
      group: 'Integrations',
      items: [
        { id: 'connectors', label: 'Connectors & Public API', icon: Database }
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'data-management', label: 'Data Management', icon: Sliders },
        { id: 'design-system', label: 'Design System & Tokens', icon: Palette },
        { id: 'settings', label: 'Themes & Settings', icon: Settings }
      ]
    }
  ];

  // Filter groups and items based on signed-in role permissions
  const navGroups = rawNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessTab(item.id))
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`h-screen bg-cp-bg-sidebar border-r border-cp-border flex flex-col shrink-0 select-none transition-all duration-200 z-30 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
      aria-label="Main Navigation Sidebar"
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
            aria-label="Collapse sidebar"
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
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-cp-text-muted">
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
                  {/* Active indicator bar */}
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

                  {/* Functional Badges only (e.g. urgent count) */}
                  {!collapsed && item.functionalBadge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${
                        item.badgeVariant === 'urgent'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-cp-accent/15 text-cp-accent border border-cp-accent/30'
                      }`}
                    >
                      {item.functionalBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer: Dataset Status + Role Switcher */}
      <div className="p-3 border-t border-cp-border bg-cp-bg-elevated/40 text-[11px] space-y-2 relative">
        {!collapsed ? (
          <>
            {/* Active Dataset Provenance */}
            <div className="p-2 rounded-lg bg-cp-bg-surface border border-cp-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-cp-text-muted">Dataset</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-semibold text-cp-text-primary text-xs truncate">
                {metadata?.is_demo ? 'Academic Benchmark' : metadata?.name || 'Active Data'}
              </div>
              <div className="text-[10px] text-cp-text-muted mt-0.5 font-mono tabular-nums">
                {metadata?.total_records?.toLocaleString() || 1470} profiles indexed
              </div>
            </div>

            {/* Active User & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-cp-bg-hover transition-colors text-left"
                title="Switch persona / role perspective"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-cp-accent/20 border border-cp-accent/30 text-cp-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                    {user.avatarInitials}
                  </div>
                  <div className="leading-tight min-w-0">
                    <div className="text-[11px] font-semibold text-cp-text-primary truncate">{user.name}</div>
                    <div className="text-[9.5px] text-cp-text-muted flex items-center gap-1 truncate">
                      <span>{ROLE_CONFIGS[role].label}</span>
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-cp-text-muted shrink-0 ml-1" />
              </button>

              {/* Role Switcher Popover */}
              {showRoleMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-60 bg-cp-bg-surface border border-cp-border rounded-xl shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cp-text-muted border-b border-cp-border">
                    Switch Active Persona (RBAC)
                  </div>
                  {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((r) => {
                    const cfg = ROLE_CONFIGS[r];
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-cp-bg-hover transition-colors flex items-start gap-2 ${
                          isSelected ? 'bg-cp-accent/10' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          <div className={`text-xs font-semibold ${isSelected ? 'text-cp-accent' : 'text-cp-text-primary'}`}>
                            {cfg.label}
                          </div>
                          <div className="text-[10px] text-cp-text-muted leading-tight mt-0.5">
                            {cfg.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-[9px] text-cp-text-muted/80 leading-tight pt-1 border-t border-cp-border/40">
              Synthetic benchmark data. Academic prototype.
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Dataset connected" />
            <div
              className="w-6 h-6 rounded-full bg-cp-accent/20 border border-cp-accent/30 text-cp-accent flex items-center justify-center text-[10px] font-bold cursor-pointer"
              title={`Logged in as ${user.name} (${ROLE_CONFIGS[role].label})`}
              onClick={() => onToggleCollapse && onToggleCollapse()}
            >
              {user.avatarInitials}
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover"
                title="Expand sidebar"
                aria-label="Expand sidebar"
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
