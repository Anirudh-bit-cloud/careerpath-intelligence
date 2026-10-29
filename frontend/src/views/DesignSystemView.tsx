import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Sparkles,
  Type,
  Square,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Maximize2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const DesignSystemView: React.FC = () => {
  const { theme, setTheme, density, setDensity, config, accent, setAccent, dotGrid, setDotGrid } = useTheme();
  const [activeTab, setActiveTab] = useState<'tokens' | 'components' | 'typography'>('tokens');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cp-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-cp-text-primary">
              Enterprise Design System & Token Studio
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-pink-500/15 text-pink-400 border border-pink-500/30">
              Living Spec
            </span>
          </div>
          <p className="text-xs text-cp-text-muted mt-1">
            Engineered design tokens, theme color palettes, accessible micro-interactions, and reusable component architectures.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-cp-bg-surface border border-cp-border text-xs">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeTab === 'tokens' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            Design Tokens
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeTab === 'components' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            Components
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              activeTab === 'typography' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            Typography
          </button>
        </div>
      </div>

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          {/* Active Theme Overview */}
          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary">Active Visual Theme Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-cp-bg-app border border-cp-border">
                <div className="text-[10px] text-cp-text-muted uppercase">Active Theme</div>
                <div className="text-sm font-bold text-cp-accent capitalize mt-0.5">{theme}</div>
              </div>
              <div className="p-3 rounded-lg bg-cp-bg-app border border-cp-border">
                <div className="text-[10px] text-cp-text-muted uppercase">Density Mode</div>
                <div className="text-sm font-bold text-cp-text-primary capitalize mt-0.5">{density}</div>
              </div>
              <div className="p-3 rounded-lg bg-cp-bg-app border border-cp-border">
                <div className="text-[10px] text-cp-text-muted uppercase">Dot Matrix Grid</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{dotGrid ? 'Enabled' : 'Disabled'}</div>
              </div>
              <div className="p-3 rounded-lg bg-cp-bg-app border border-cp-border">
                <div className="text-[10px] text-cp-text-muted uppercase">Base Font</div>
                <div className="text-sm font-bold text-cp-text-primary mt-0.5 font-sans">Inter</div>
              </div>
              <div className="p-3 rounded-lg bg-cp-bg-app border border-cp-border">
                <div className="text-[10px] text-cp-text-muted uppercase">Telemetry Font</div>
                <div className="text-sm font-bold text-cp-text-primary mt-0.5 font-mono">JetBrains Mono</div>
              </div>
            </div>
          </div>

          {/* Color Palette Tokens */}
          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary">Theme Color Tokens</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="h-12 rounded-lg bg-cp-bg-app border border-cp-border flex items-end p-1.5">
                  <span className="text-[10px] font-mono text-cp-text-muted">bg-app</span>
                </div>
                <div className="font-semibold text-cp-text-primary">App Background</div>
              </div>

              <div className="space-y-1.5">
                <div className="h-12 rounded-lg bg-cp-bg-surface border border-cp-border flex items-end p-1.5">
                  <span className="text-[10px] font-mono text-cp-text-muted">bg-surface</span>
                </div>
                <div className="font-semibold text-cp-text-primary">Surface Container</div>
              </div>

              <div className="space-y-1.5">
                <div className="h-12 rounded-lg bg-cp-bg-elevated border border-cp-border flex items-end p-1.5">
                  <span className="text-[10px] font-mono text-cp-text-muted">bg-elevated</span>
                </div>
                <div className="font-semibold text-cp-text-primary">Elevated Card</div>
              </div>

              <div className="space-y-1.5">
                <div className="h-12 rounded-lg bg-cp-accent flex items-end p-1.5">
                  <span className="text-[10px] font-mono text-white">accent</span>
                </div>
                <div className="font-semibold text-cp-text-primary">Primary Accent</div>
              </div>

              <div className="space-y-1.5">
                <div className="h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-end p-1.5">
                  <span className="text-[10px] font-mono text-emerald-400">emerald</span>
                </div>
                <div className="font-semibold text-cp-text-primary">Success Semantic</div>
              </div>

              <div className="space-y-1.5">
                <div className="h-12 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-end p-1.5">
                  <span className="text-[10px] font-mono text-rose-400">rose</span>
                </div>
                <div className="font-semibold text-cp-text-primary">Urgent Semantic</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Components Tab */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary">Action & Button Micro-Interactions</h3>
            <div className="flex flex-wrap items-center gap-3">
              <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover shadow-xs transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 rounded-lg text-xs font-semibold border border-cp-border bg-cp-bg-surface hover:bg-cp-bg-hover text-cp-text-primary transition-colors">
                Secondary Outline
              </button>
              <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-cp-accent/15 text-cp-accent border border-cp-accent/30 hover:bg-cp-accent/25 transition-colors">
                Accent Subtle
              </button>
              <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
                Positive Action
              </button>
              <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors">
                Destructive Action
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-4">
            <h3 className="text-sm font-bold text-cp-text-primary">Status Badges & Telemetry Pills</h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cp-accent/15 text-cp-accent border border-cp-accent/25">
                Calibrated ML
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                Active Tier
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/25">
                Benchmark Lag
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/25">
                Urgent Action
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-500/15 text-zinc-400 border border-zinc-500/25">
                Roadmap Spec
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Typography Tab */}
      {activeTab === 'typography' && (
        <div className="p-5 rounded-xl bg-cp-bg-surface border border-cp-border space-y-5">
          <h3 className="text-sm font-bold text-cp-text-primary">Editorial Typography & Telemetry</h3>
          <div className="space-y-4">
            <div className="border-b border-cp-border/50 pb-3">
              <div className="text-[10px] text-cp-text-muted font-mono uppercase">Heading 1 — 28px Bold</div>
              <h1 className="text-2xl font-black text-cp-text-primary">Executive Workforce Progression</h1>
            </div>
            <div className="border-b border-cp-border/50 pb-3">
              <div className="text-[10px] text-cp-text-muted font-mono uppercase">Heading 2 — 20px Bold</div>
              <h2 className="text-xl font-bold text-cp-text-primary">Career Archetypes & Cluster Centroids</h2>
            </div>
            <div className="border-b border-cp-border/50 pb-3">
              <div className="text-[10px] text-cp-text-muted font-mono uppercase">Telemetry & Monospace Numbers — Tabular JetBrains Mono</div>
              <div className="text-2xl font-black text-cp-accent font-mono tracking-tight">$2,450,000 • 3.2 yrs • k=4</div>
            </div>
            <div>
              <div className="text-[10px] text-cp-text-muted font-mono uppercase">Body Prose — 13px Regular</div>
              <p className="text-xs text-cp-text-secondary leading-relaxed max-w-2xl">
                The CareerPath Intelligence design system couples mathematical rigor with editorial typography.
                Every numerical data point uses tabular figures for flawless columnar alignment across analytics tables.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
