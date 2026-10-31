import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutSections = [
    {
      section: 'Global Commands & Search',
      shortcuts: [
        { key: 'Ctrl + K / ⌘ + K', desc: 'Open Command Palette (search pages, themes, personas, employees)' },
        { key: '?', desc: 'Show this keyboard shortcuts guide' },
        { key: 'Esc', desc: 'Close open dialogs, drawers, and popovers' }
      ]
    },
    {
      section: 'Direct Workflow Navigation',
      shortcuts: [
        { key: 'Alt + 1', desc: 'Jump to Workforce Overview' },
        { key: 'Alt + 2', desc: 'Jump to Career Clusters' },
        { key: 'Alt + 3', desc: 'Jump to Promotion Gap Monitor' },
        { key: 'Alt + 4', desc: 'Jump to Retention Opportunities' },
        { key: 'Alt + 5', desc: 'Jump to Manager Insights' },
        { key: 'Alt + 6', desc: 'Jump to Employee Explorer' },
        { key: 'Alt + 7', desc: 'Jump to Reports & Briefings' },
        { key: 'Alt + 8', desc: 'Jump to Data Management' },
        { key: 'Alt + 9', desc: 'Jump to Themes & Settings' }
      ]
    },
    {
      section: 'Data Grids & Accessible Controls',
      shortcuts: [
        { key: 'Tab / Shift + Tab', desc: 'Navigate focus through accessible interactive controls' },
        { key: 'Enter / Space', desc: 'Activate buttons, expand drawers, or select items' },
        { key: 'Arrow Up / Down', desc: 'Cycle through command palette options and table rows' }
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
    >
      <div
        className="bg-cp-bg-surface border border-cp-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-cp-border flex items-center justify-between bg-cp-bg-elevated/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cp-accent/15 border border-cp-accent/25 flex items-center justify-center text-cp-accent">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cp-text-primary">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-cp-text-muted">Fast navigation for enterprise power users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover transition-colors"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {shortcutSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted">
                {sec.section}
              </h3>
              <div className="space-y-1.5">
                {sec.shortcuts.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-cp-bg-elevated/40 border border-cp-border/40"
                  >
                    <span className="text-cp-text-secondary text-[11.5px]">{s.desc}</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-cp-bg-surface border border-cp-border font-mono text-[10.5px] font-semibold text-cp-accent shrink-0 ml-3 shadow-2xs">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 border-t border-cp-border bg-cp-bg-elevated/40 flex items-center justify-between">
          <span className="text-[11px] text-cp-text-muted">
            Press <kbd className="px-1.5 py-0.5 rounded bg-cp-bg-surface border border-cp-border font-mono text-[10px]">?</kbd> at any time to open this guide
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
