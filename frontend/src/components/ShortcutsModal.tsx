import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / ⌘ + K', desc: 'Open Command Palette (search pages, themes, employees)' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' },
    { key: 'Esc', desc: 'Close open drawers, modals, and palettes' },
    { key: 'Alt + 1', desc: 'Jump to Executive Overview' },
    { key: 'Alt + 2', desc: 'Jump to Career Clusters' },
    { key: 'Alt + 3', desc: 'Jump to Promotion Gap Monitor' },
    { key: 'Alt + 4', desc: 'Jump to Retention Opportunities' },
    { key: 'Alt + 5', desc: 'Jump to Managerial Insights' },
    { key: 'Alt + 6', desc: 'Jump to Employee Explorer' },
    { key: 'Alt + 7', desc: 'Jump to Reports & Methodologies' },
    { key: 'Alt + 8', desc: 'Jump to Data Management' },
    { key: 'Alt + 9', desc: 'Jump to Theme Settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-cp-bg-surface border border-cp-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-5 border-b border-cp-border flex items-center justify-between bg-cp-bg-elevated/60">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-cp-accent" />
            <h2 className="text-sm font-bold text-cp-text-primary">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1.5 border-b border-cp-border/40 last:border-b-0"
            >
              <span className="text-cp-text-secondary">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-cp-bg-elevated border border-cp-border font-mono text-[11px] font-semibold text-cp-accent shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-cp-border bg-cp-bg-elevated/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
