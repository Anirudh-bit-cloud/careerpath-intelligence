import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Database,
  ChevronRight,
  Palette,
  X,
  AlertTriangle,
  User,
  Shield,
  Layers,
  ChevronDown,
  Command,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetMetadata } from '../types';
import { useTheme } from '../context/ThemeContext';
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

const tabTitles: Record<string, { title: string; category: string }> = {
  'overview': { title: 'Executive Overview', category: 'Intelligence' },
  'clusters': { title: 'Career Clusters & Archetypes', category: 'Machine Learning' },
  'promotion-gap': { title: 'Promotion Gap Monitor', category: 'Progression' },
  'retention-opportunities': { title: 'Retention Opportunities', category: 'Intervention' },
  'manager-insights': { title: 'Manager Insights & Continuity', category: 'Leadership' },
  'committee': { title: 'Talent Review Committee Mode', category: 'Calibration' },
  'fairness-audit': { title: 'Algorithmic Fairness & Bias Audit', category: 'Ethics & Compliance' },
  'impact-estimator': { title: 'Impact & ROI Estimator', category: 'Business Case' },
  'employees': { title: 'Employee Explorer & Profile', category: 'Talent' },
  'reports': { title: 'Reports & Analytical Briefings', category: 'Governance' },
  'connectors': { title: 'Connectors & Developer Hub', category: 'Integrations' },
  'trust-center': { title: 'Trust Center & Governance', category: 'Security' },
  'design-system': { title: 'Design System & Token Studio', category: 'Living Spec' },
  'data-management': { title: 'Data Management & ML Pipeline', category: 'Operations' },
  'settings': { title: 'Themes, Methodology & Ethics', category: 'System' }
};

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
  const { theme, config } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeRole, setActiveRole] = useState<'admin' | 'hrbp' | 'hr_analyst' | 'talent_committee'>('admin');
  const [currentIndustry, setCurrentIndustry] = useState<'cyber' | 'healthcare' | 'finance'>('cyber');

  const searchRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTabMeta = tabTitles[currentTab] || { title: 'Workspace', category: 'Analytics' };

  return (
    <header className="h-14 border-b border-cp-border bg-cp-bg-surface px-6 flex items-center justify-between shrink-0 z-20 transition-colors">
      {/* Left: Breadcrumbs & Context */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-cp-text-muted font-medium flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-cp-accent" />
          <span>PANW Analytics</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-cp-border" />
        <span className="text-cp-text-muted hidden sm:inline">{currentTabMeta.category}</span>
        <ChevronRight className="w-3.5 h-3.5 text-cp-border hidden sm:inline" />
        <span className="text-cp-text-primary font-bold">{currentTabMeta.title}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-cp-bg-input border border-cp-border text-cp-text-muted hover:text-cp-text-primary hover:border-cp-accent/50 text-xs transition-colors shadow-2xs"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="w-3.5 h-3.5 text-cp-accent" />
            <span className="hidden md:inline text-[11px]">Command Menu</span>
            <kbd className="px-1.5 py-0.5 rounded bg-cp-bg-surface border border-cp-border text-[9.5px] font-mono">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Global Employee Lookup */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center bg-cp-bg-input border border-cp-border rounded-lg px-2.5 py-1.5 w-56 sm:w-64 focus-within:w-72 focus-within:border-cp-accent transition-all shadow-xs">
            <Search className="w-3.5 h-3.5 text-cp-text-muted mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search employee or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-cp-text-primary placeholder:text-cp-text-muted"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-cp-text-muted hover:text-cp-text-primary">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute right-0 mt-1.5 w-84 bg-cp-bg-elevated border border-cp-border rounded-xl shadow-xl py-1.5 z-50 max-h-80 overflow-y-auto">
              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cp-text-muted border-b border-cp-border flex justify-between">
                <span>Matching Profiles ({searchResults.length})</span>
                <span className="font-mono">ESC to close</span>
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
                    <div className="text-xs font-bold text-cp-text-primary font-mono flex items-center gap-1.5">
                      {emp.EmployeeID}
                      <span className="text-[10px] font-normal text-cp-text-muted">· Level {emp.JobLevel}</span>
                    </div>
                    <div className="text-[11px] text-cp-text-secondary">
                      {emp.JobRole} · {emp.Department}
                    </div>
                  </div>
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
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
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cp-bg-elevated border border-cp-border text-[11px] text-cp-text-secondary"
          title={`Active Dataset: ${metadata?.name || 'Academic Benchmark'}`}
        >
          <Database className="w-3 h-3 text-cp-accent" />
          <span className="font-mono font-medium">{metadata?.total_records?.toLocaleString() || 1470}</span>
          <span className="text-cp-text-muted">records</span>
          <span className={`w-1.5 h-1.5 rounded-full ${metadata?.is_demo ? 'bg-sky-400' : 'bg-emerald-400'}`} />
        </div>

        {/* Urgent Alerts Pill / Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-400 font-semibold hover:bg-rose-500/20 transition-colors"
            title="Retention Action Candidates"
          >
            <Bell className="w-3 h-3 text-rose-400" />
            <span>{urgentCount} Urgent</span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-cp-bg-elevated border border-cp-border rounded-xl shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-cp-border">
                <span className="text-xs font-bold text-cp-text-primary">Retention Action Center</span>
                <span className="text-[10px] text-rose-400 font-mono font-bold">{urgentCount} Flagged</span>
              </div>
              <p className="text-[11px] text-cp-text-muted mb-3 leading-relaxed">
                Employees exhibiting severe promotion latency &gt;4 yrs while maintaining strong performance and engagement.
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

        {/* Industry Cohort Preset Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cp-bg-surface border border-cp-border text-xs">
          <span className="text-[10px] uppercase font-bold text-cp-text-muted">Preset:</span>
          <select
            value={currentIndustry}
            onChange={(e) => {
              const val = e.target.value as 'cyber' | 'healthcare' | 'finance';
              setCurrentIndustry(val);
              if (onSwitchPreset) onSwitchPreset(val);
            }}
            className="bg-transparent text-xs font-semibold text-cp-text-primary focus:outline-none cursor-pointer"
          >
            <option value="cyber">Cybersecurity & Cloud (1,470)</option>
            <option value="healthcare">Healthcare Clinical Ops (1,200)</option>
            <option value="finance">Financial Services & Quant (1,350)</option>
          </select>
        </div>

        {/* Guided Tour Trigger Button */}
        {onLaunchTour && (
          <button
            onClick={onLaunchTour}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cp-accent/15 border border-cp-accent/30 text-cp-accent hover:bg-cp-accent/25 text-xs font-semibold transition-all shadow-2xs"
            title="Launch Spotlight Product Walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Guided Tour</span>
          </button>
        )}

        {/* Theme Switcher Button & Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeModal(!showThemeModal)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-hover text-xs font-medium text-cp-text-primary transition-all shadow-xs"
            title="Switch Visual Theme"
          >
            {/* Live active color dots */}
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
            <span className="hidden lg:inline">{config.name}</span>
            <ChevronDown className="w-3 h-3 text-cp-text-muted" />
          </button>

          {showThemeModal && (
            <div className="absolute right-0 mt-2 w-[540px] max-w-[92vw] bg-cp-bg-elevated border border-cp-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150 p-1">
              <ThemeSwitcher onClose={() => setShowThemeModal(false)} />
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-lg border border-cp-border bg-cp-bg-elevated hover:bg-cp-bg-hover text-cp-text-muted hover:text-cp-text-primary transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-cp-border">
          <div className="w-7 h-7 rounded-lg bg-cp-accent/20 border border-cp-accent/30 text-cp-accent flex items-center justify-center text-xs font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
};
