import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Target,
  Users2,
  FileSpreadsheet,
  Database,
  Palette,
  User,
  ArrowRight,
  Command,
  X,
  Network,
  ClockAlert,
  Award,
  Briefcase,
  Calculator,
  ShieldCheck,
  Shield,
  Sliders,
  Settings,
  Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth, UserRole, ROLE_CONFIGS } from '../context/AuthContext';
import { NAVIGATION_MAP } from '../navigation';
import { api } from '../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  onSelectEmployee: (empId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectEmployee
}) => {
  const { theme, setTheme, allThemes } = useTheme();
  const { role, setRole, canAccessTab } = useAuth();
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setEmployees([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Live employee search debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setEmployees([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchEmployees(query.trim());
        setEmployees(results.slice(0, 5));
      } catch {
        // ignore
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Icon mapping for navigation
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'overview': LayoutDashboard,
    'reports': FileSpreadsheet,
    'clusters': Network,
    'promotion-gap': ClockAlert,
    'manager-insights': Users2,
    'retention-opportunities': Target,
    'succession': Award,
    'committee': Briefcase,
    'impact-estimator': Calculator,
    'employees': User,
    'fairness-audit': ShieldCheck,
    'trust-center': Shield,
    'connectors': Database,
    'data-management': Sliders,
    'design-system': Palette,
    'settings': Settings
  };

  // Filter accessible navigation items
  const accessibleNavItems = Object.values(NAVIGATION_MAP)
    .filter((item) => canAccessTab(item.id))
    .map((item) => ({
      type: 'nav' as const,
      id: item.id,
      title: item.title,
      category: item.group,
      description: item.description,
      icon: iconMap[item.id] || LayoutDashboard
    }))
    .filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );

  // Theme actions
  const themeItems = allThemes
    .filter((t) =>
      query.toLowerCase().includes('theme') ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.key.toLowerCase().includes(query.toLowerCase())
    )
    .map((t) => ({
      type: 'theme' as const,
      id: t.key,
      title: `Theme: ${t.name}`,
      category: 'Preferences',
      description: `Switch visual theme to ${t.name}`,
      active: theme === t.key,
      icon: Palette
    }));

  // Role switching actions
  const roleItems = (Object.keys(ROLE_CONFIGS) as UserRole[])
    .filter((r) =>
      query.toLowerCase().includes('role') ||
      query.toLowerCase().includes('persona') ||
      ROLE_CONFIGS[r].label.toLowerCase().includes(query.toLowerCase())
    )
    .map((r) => ({
      type: 'role' as const,
      id: r,
      title: `Switch Persona: ${ROLE_CONFIGS[r].label}`,
      category: 'Role & Permissions (RBAC)',
      description: ROLE_CONFIGS[r].description,
      active: role === r,
      icon: User
    }));

  // Employee matching items
  const employeeItems = employees.map((e) => ({
    type: 'employee' as const,
    id: e.EmployeeID,
    title: `${e.EmployeeID} — ${e.JobRole}`,
    category: 'Employees',
    description: `${e.Department} · Level ${e.JobLevel} · Priority: ${e.RetentionPriority || 'Standard'}`,
    icon: User
  }));

  const allItems = [...accessibleNavItems, ...employeeItems, ...themeItems, ...roleItems];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        executeAction(allItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const executeAction = (item: (typeof allItems)[0]) => {
    if (item.type === 'nav') {
      onNavigate(item.id);
      onClose();
    } else if (item.type === 'employee') {
      onSelectEmployee(item.id);
      onClose();
    } else if (item.type === 'theme') {
      setTheme(item.id as any);
      onClose();
    } else if (item.type === 'role') {
      setRole(item.id as UserRole);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl bg-cp-bg-surface border border-cp-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-cp-border bg-cp-bg-elevated/40">
          <Search className="w-4 h-4 text-cp-text-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a page name, employee ID, theme, or role..."
            className="w-full bg-transparent text-sm text-cp-text-primary placeholder:text-cp-text-muted focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-cp-bg-surface border border-cp-border text-[10px] font-mono text-cp-text-muted">
            ESC
          </kbd>
        </div>

        {/* Action Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-cp-border/30">
          {allItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-cp-text-muted">
              No matching pages, employees, or commands found for "{query}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={`${item.type}-${item.id}-${idx}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => executeAction(item)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cp-accent/12 text-cp-accent'
                      : 'hover:bg-cp-bg-hover text-cp-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-cp-accent text-white'
                          : 'bg-cp-bg-elevated text-cp-text-muted'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.type === 'theme' && (item as any).active && (
                          <span className="text-[9px] font-mono bg-cp-accent/20 text-cp-accent px-1.5 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                        {item.type === 'role' && (item as any).active && (
                          <span className="text-[9px] font-mono bg-cp-accent/20 text-cp-accent px-1.5 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-cp-text-muted truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[9.5px] font-mono text-cp-text-muted uppercase tracking-wider hidden sm:inline">
                      {item.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-cp-accent' : 'text-cp-border'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer helper */}
        <div className="px-4 py-2 border-t border-cp-border bg-cp-bg-elevated/40 text-[10.5px] text-cp-text-muted flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-[9.5px]">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="text-[10px]">Role: {ROLE_CONFIGS[role].label}</span>
        </div>
      </div>
    </div>
  );
};
