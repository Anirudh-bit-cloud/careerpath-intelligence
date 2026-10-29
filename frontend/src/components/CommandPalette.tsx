import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Target,
  GitCommit,
  Users,
  Compass,
  FileText,
  Database,
  Palette,
  User,
  ArrowRight,
  Sparkles,
  Command,
  X
} from 'lucide-react';
import { useTheme, ThemeKey } from '../context/ThemeContext';
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

  useEffect(() => {
    if (!query.trim()) {
      setEmployees([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchEmployees(query.trim());
        setEmployees(results.slice(0, 5));
      } catch (e) {
        // ignore
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const navItems = [
    { id: 'overview', title: 'Executive Overview', icon: LayoutDashboard, category: 'Navigation' },
    { id: 'clusters', title: 'Career Clusters (ML Trajectories)', icon: GitCommit, category: 'Navigation' },
    { id: 'promotion-gap', title: 'Promotion Gap Analysis', icon: Target, category: 'Navigation' },
    { id: 'retention-opportunities', title: 'Retention Opportunities & Action Plans', icon: Target, category: 'Navigation' },
    { id: 'manager-insights', title: 'Managerial Continuity & Growth', icon: Users, category: 'Navigation' },
    { id: 'explorer', title: 'Employee 360 Explorer & Simulator', icon: Compass, category: 'Navigation' },
    { id: 'reports', title: 'Executive Reports & Methodologies', icon: FileText, category: 'Navigation' },
    { id: 'data-management', title: 'Dataset Ingestion & Machine Learning Re-clustering', icon: Database, category: 'Navigation' },
    { id: 'settings', title: 'Application Theme & Preferences', icon: Palette, category: 'Navigation' }
  ];

  const filteredNav = navItems.filter((i) =>
    i.title.toLowerCase().includes(query.toLowerCase())
  );

  const themeItems = allThemes.map((t) => ({
    key: t.key,
    name: t.name,
    category: 'Theme Switcher',
    active: theme === t.key
  })).filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes('theme'));

  const allItems = [
    ...filteredNav.map((n) => ({ type: 'nav', ...n })),
    ...themeItems.map((t) => ({ type: 'theme', ...t })),
    ...employees.map((e) => ({
      type: 'emp',
      id: e.EmployeeID,
      title: `${e.EmployeeID} - ${e.JobRole} (${e.Department})`,
      category: 'Employees'
    }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allItems[selectedIndex];
      if (!selected) return;
      if (selected.type === 'nav') {
        onNavigate((selected as any).id);
        onClose();
      } else if (selected.type === 'theme') {
        setTheme((selected as any).key as ThemeKey);
        onClose();
      } else if (selected.type === 'emp') {
        onSelectEmployee((selected as any).id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-cp-bg-surface border border-cp-border rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-cp-border flex items-center gap-3 bg-cp-bg-elevated/60">
          <Search className="w-5 h-5 text-cp-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a page name, theme, or search employee ID..."
            className="flex-1 bg-transparent text-sm text-cp-text-primary placeholder:text-cp-text-muted outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-cp-bg-surface border border-cp-border text-[10px] font-mono text-cp-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-cp-border/40">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-cp-text-muted">
              No matching pages, themes, or employees found.
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.type}-${(item as any).id || (item as any).key || index}`}
                  onClick={() => {
                    if (item.type === 'nav') {
                      onNavigate((item as any).id);
                      onClose();
                    } else if (item.type === 'theme') {
                      setTheme((item as any).key as ThemeKey);
                      onClose();
                    } else if (item.type === 'emp') {
                      onSelectEmployee((item as any).id);
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-cp-accent text-white' : 'text-cp-text-primary hover:bg-cp-bg-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.type === 'nav' && React.createElement((item as any).icon, { className: 'w-4 h-4 text-cp-accent shrink-0' })}
                    {item.type === 'theme' && <Palette className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {item.type === 'emp' && <User className="w-4 h-4 text-amber-400 shrink-0" />}
                    <div>
                      <div className="font-medium">{(item as any).title || (item as any).name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-cp-text-muted'}`}>
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono opacity-80">
                    {item.type === 'theme' && ((item as any).active ? 'Active' : 'Switch')}
                    {item.type === 'nav' && <ArrowRight className="w-3.5 h-3.5" />}
                    {item.type === 'emp' && 'Profile'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-2.5 border-t border-cp-border bg-cp-bg-elevated/40 flex items-center justify-between text-[11px] text-cp-text-muted px-4">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; to navigate</span>
            <span>&crarr; to select</span>
          </div>
          <span>CareerPath Command Center</span>
        </div>
      </div>
    </div>
  );
};
