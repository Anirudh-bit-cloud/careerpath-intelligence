import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Database,
  ChevronRight,
  X,
  User,
  Shield,
  ChevronDown,
  Command,
  HelpCircle,
  Sparkles,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetMetadata } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth, UserRole, ROLE_CONFIGS } from '../context/AuthContext';
import { NAVIGATION_MAP } from '../navigation';
import { ThemeSwitcher } from './ThemeSwitcher';

interface TopNavProps {
  currentTab: string;
  metadata: DatasetMetadata | null;
  onSelectEmployee: (empId: string) => void;
  urgentCount?: number;
  onNavigateTab?: (tab: string) => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
  onSwitchPreset?: (preset: 'cyber' | 'healthcare' | 'finance') => void;
  onLaunchTour?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  metadata,
  onSelectEmployee,
  urgentCount = 0,
  onNavigateTab,
  onOpenCommandPalette,
  onOpenShortcuts,
  onSwitchPreset,
  onLaunchTour
}) => {
  const { config } = useTheme();
  const { user, role, setRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentIndustry, setCurrentIndustry] = useState<'cyber' | 'healthcare' | 'finance'>('cyber');

  const searchRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const results = await api.searchEmployees(searchQuery.trim());
          setSearchResults(results);
          setShowDropdown(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    };

    const timer = setTimeout(fetchSearch, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for all popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeModal(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navMeta = NAVIGATION_MAP[currentTab] || {
    title: 'Workforce Overview',
    group: 'Overview'
  };

  return (
    <header className="h-14 border-b border-cp-border bg-cp-bg-surface px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 transition-colors">
      {/* Left: Accessible Enterprise Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 sm:gap-2 text-xs">
        <button
          onClick={() => onNavigateTab && onNavigateTab('overview')}
          className="text-cp-text-muted hover:text-cp-text-primary font-medium flex items-center gap-1.5 transition-colors"
          title="Return to Executive Overview"
        >
          <Shield className="w-3.5 h-3.5 text-cp-accent shrink-0" />
          <span className="hidden sm:inline">CareerPath</span>
        </button>
        <ChevronRight className="w-3 h-3 text-cp-border shrink-0" />
        <span className="text-cp-text-muted hidden md:inline truncate">{navMeta.group}</span>
        <ChevronRight className="w-3 h-3 text-cp-border hidden md:inline shrink-0" />
        <span className="text-cp-text-primary font-bold truncate max-w-[180px] sm:max-w-none">
          {navMeta.title}
        </span>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Command Palette Trigger with Visible Keyboard Shortcut Hint */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-muted hover:text-cp-text-primary hover:border-cp-accent/50 text-xs transition-colors shadow-2xs"
            title="Open Command Palette (Ctrl+K or ⌘K)"
            aria-label="Open command palette"
          >
            <Command className="w-3.5 h-3.5 text-cp-accent shrink-0" />
            <span className="hidden md:inline text-[11px] font-medium">Quick Find</span>
            <kbd className="px-1.5 py-0.5 rounded bg-cp-bg-surface border border-cp-border text-[9.5px] font-mono tabular-nums text-cp-text-secondary">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Global Employee Lookup */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center bg-cp-bg-input border border-cp-border rounded-lg px-2.5 py-1.5 w-48 sm:w-60 focus-within:w-68 focus-within:border-cp-accent transition-all shadow-xs">
            <Search className="w-3.5 h-3.5 text-cp-text-muted mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search employee, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-cp-text-primary placeholder:text-cp-text-muted"
              aria-label="Search employees by ID, name, or title"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-cp-text-muted hover:text-cp-text-primary"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute right-0 mt-1.5 w-84 bg-cp-bg-elevated border border-cp-border rounded-xl shadow-xl py-1.5 z-50 max-h-80 overflow-y-auto">
              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cp-text-muted border-b border-cp-border flex justify-between">
                <span>Matching Profiles ({searchResults.length})</span>
                <span className="font-mono text-[9px]">ESC to close</span>
              </div>
              {searchResults.map((emp) => (
                <button
                  key={emp.EmployeeID}
                  onClick={() => {
                    onSelectEmployee(emp.EmployeeID);
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-cp-bg-hover flex items-center justify-between border-b border-cp-border/40 last:border-none transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-cp-text-primary font-mono tabular-nums flex items-center gap-1.5">
                      {emp.EmployeeID}
                      <span className="text-[10px] font-normal text-cp-text-muted">· Level {emp.JobLevel}</span>
                    </div>
                    <div className="text-[11px] text-cp-text-secondary truncate max-w-[200px]">
                      {emp.JobRole} · {emp.Department}
                    </div>
                  </div>
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider tabular-nums ${
                      emp.RetentionPriority === 'Urgent'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : emp.RetentionPriority === 'Moderate'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-cp-bg-surface text-cp-text-muted border border-cp-border'
                    }`}
                  >
                    {emp.RetentionPriority || 'Standard'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dataset Provenance Pill */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cp-bg-elevated border border-cp-border text-[11px] text-cp-text-secondary"
          title={`Active Dataset: ${metadata?.name || 'Academic Benchmark'}`}
        >
          <Database className="w-3 h-3 text-cp-accent shrink-0" />
          <span className="font-mono font-medium tabular-nums">{metadata?.total_records?.toLocaleString() || 1470}</span>
          <span className="text-cp-text-muted">profiles</span>
          <span className={`w-1.5 h-1.5 rounded-full ${metadata?.is_demo ? 'bg-sky-400' : 'bg-emerald-400'}`} />
        </div>

        {/* Urgent Alerts Pill / Action Drawer */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-400 font-semibold hover:bg-rose-500/20 transition-colors"
            title="Retention Action Candidates"
            aria-label="Retention alerts"
          >
            <Bell className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="font-mono tabular-nums">{urgentCount}</span>
            <span className="hidden sm:inline">Urgent</span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-cp-bg-elevated border border-cp-border rounded-xl shadow-xl p-3.5 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-cp-border">
                <span className="text-xs font-bold text-cp-text-primary">Retention Action Center</span>
                <span className="text-[10px] text-rose-400 font-mono font-bold tabular-nums">
                  {urgentCount} High Flight Risk
                </span>
              </div>
              <p className="text-[11px] text-cp-text-muted mb-3 leading-relaxed">
                Employees exhibiting severe promotion latency &gt;4 yrs while maintaining strong performance ratings.
              </p>
              {onNavigateTab && (
                <button
                  onClick={() => {
                    onNavigateTab('retention-opportunities');
                    setShowNotifications(false);
                  }}
                  className="w-full py-1.5 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity text-center block"
                >
                  Open Retention Opportunities
                </button>
              )}
            </div>
          )}
        </div>

        {/* Guided Tour Trigger Button */}
        {onLaunchTour && (
          <button
            onClick={onLaunchTour}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cp-accent/15 border border-cp-accent/30 text-cp-accent hover:bg-cp-accent/25 text-xs font-semibold transition-all shadow-2xs"
            title="Launch Spotlight Product Walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tour</span>
          </button>
        )}

        {/* 3-Theme Switcher Button & Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeModal(!showThemeModal)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-hover text-xs font-medium text-cp-text-primary transition-all shadow-xs"
            title="Switch Visual Theme (Light, Dark, High Contrast)"
            aria-label="Theme settings"
          >
            <div className="flex items-center -space-x-1">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/30"
                style={{ backgroundColor: config.swatch.surface }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: config.swatch.accent }}
              />
            </div>
            <span className="hidden xl:inline">{config.name}</span>
            <ChevronDown className="w-3 h-3 text-cp-text-muted" />
          </button>

          {showThemeModal && (
            <div className="absolute right-0 mt-2 w-[540px] max-w-[92vw] bg-cp-bg-elevated border border-cp-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150 p-1">
              <ThemeSwitcher onClose={() => setShowThemeModal(false)} />
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help Dialog Trigger (?) */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-hover text-cp-text-muted hover:text-cp-text-primary transition-colors flex items-center justify-center"
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {/* User Persona & Role Selector */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-cp-bg-hover border border-transparent hover:border-cp-border transition-colors"
            title={`Active Persona: ${user.name} (${ROLE_CONFIGS[role].label})`}
            aria-label="User account and role menu"
          >
            <div className="w-7 h-7 rounded-lg bg-cp-accent/20 border border-cp-accent/30 text-cp-accent flex items-center justify-center text-xs font-bold">
              {user.avatarInitials}
            </div>
            <ChevronDown className="w-3 h-3 text-cp-text-muted hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-cp-bg-surface border border-cp-border rounded-xl shadow-xl py-2 z-50">
              <div className="px-3.5 py-2 border-b border-cp-border">
                <div className="text-xs font-bold text-cp-text-primary">{user.name}</div>
                <div className="text-[10px] text-cp-text-muted font-mono truncate">{user.email}</div>
                <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-cp-accent/15 text-cp-accent border border-cp-accent/25">
                  {ROLE_CONFIGS[role].label}
                </div>
              </div>

              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                Role Persona Perspective
              </div>
              {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((r) => {
                const cfg = ROLE_CONFIGS[r];
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3.5 py-1.5 text-left text-xs hover:bg-cp-bg-hover flex items-center justify-between transition-colors ${
                      isSelected ? 'font-semibold text-cp-accent bg-cp-accent/10' : 'text-cp-text-secondary'
                    }`}
                  >
                    <span>{cfg.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cp-accent" />}
                  </button>
                );
              })}

              <div className="mt-1 pt-1 border-t border-cp-border px-1">
                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-hover rounded-md transition-colors"
                >
                  Security & Profile Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
