import React from 'react';
import {
  Check,
  Palette,
  Sparkles,
  Sliders,
  Grid,
  Minimize2,
  Maximize2,
  RotateCcw,
  Sun,
  Moon,
  Layers
} from 'lucide-react';
import {
  useTheme,
  THEMES,
  ThemeKey,
  ACCENT_COLORS,
  AccentKey,
  DensityMode
} from '../context/ThemeContext';

interface ThemeSwitcherProps {
  onClose?: () => void;
  inline?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onClose, inline = false }) => {
  const {
    theme,
    setTheme,
    allThemes,
    accent,
    setAccent,
    dotGrid,
    setDotGrid,
    density,
    setDensity,
    resetThemeCustomizations
  } = useTheme();

  return (
    <div className={inline ? 'w-full space-y-6' : 'p-4 max-w-xl w-full space-y-4'}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center justify-between pb-3 border-b border-cp-border">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-cp-accent" />
            <div>
              <h3 className="text-sm font-bold text-cp-text-primary">Theme & Workspace Customizer</h3>
              <p className="text-[11px] text-cp-text-muted">Live styling, razor contrast & telemetry modes</p>
            </div>
          </div>
          <button
            onClick={resetThemeCustomizations}
            className="p-1.5 rounded-md hover:bg-cp-bg-hover text-cp-text-muted hover:text-cp-text-primary text-[11px] flex items-center gap-1 transition-colors"
            title="Reset to default theme & settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      )}

      {/* ── 1. MASTER THEMES GRID ── */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted mb-2.5 flex items-center justify-between">
          <span>Master Visual Themes ({allThemes.length})</span>
          <span className="text-[10px] text-cp-accent font-mono font-medium">Instant DOM sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {allThemes.map((item) => {
            const isSelected = theme === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTheme(item.key)}
                className={`p-3 rounded-xl border text-left transition-all relative group flex flex-col justify-between ${
                  isSelected
                    ? 'border-cp-accent bg-cp-bg-elevated shadow-md ring-1 ring-cp-accent/50'
                    : 'border-cp-border bg-cp-bg-surface hover:bg-cp-bg-hover hover:border-cp-border-subtle'
                }`}
              >
                <div>
                  {/* Miniature dashboard mockup layout */}
                  <div
                    className="h-14 rounded-lg p-2 mb-2.5 border flex flex-col justify-between relative overflow-hidden transition-all shadow-inner"
                    style={{
                      backgroundColor: item.swatch.bg,
                      borderColor: isSelected ? item.swatch.accent : item.swatch.border
                    }}
                  >
                    {/* Mini top bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-xs"
                          style={{ backgroundColor: item.swatch.accent }}
                        />
                        <div
                          className="w-8 h-1 rounded-full opacity-60"
                          style={{ backgroundColor: item.swatch.surface }}
                        />
                      </div>
                      <div
                        className="w-2.5 h-1 rounded-full"
                        style={{ backgroundColor: item.swatch.secondary }}
                      />
                    </div>

                    {/* Micro mini telemetry bars */}
                    <div className="flex items-end gap-1 h-5 pt-1">
                      <div
                        className="w-1/4 h-3.5 rounded-xs"
                        style={{ backgroundColor: item.swatch.accent, opacity: 0.9 }}
                      />
                      <div
                        className="w-1/4 h-5 rounded-xs"
                        style={{ backgroundColor: item.swatch.secondary, opacity: 0.9 }}
                      />
                      <div
                        className="w-1/4 h-2 rounded-xs"
                        style={{ backgroundColor: item.swatch.surface, opacity: 0.7 }}
                      />
                      <div
                        className="w-1/4 h-4 rounded-xs"
                        style={{ backgroundColor: item.swatch.accent, opacity: 0.6 }}
                      />
                    </div>
                  </div>

                  {/* Header with Title + Tag */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-cp-text-primary flex items-center gap-1.5">
                      {item.name}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-cp-accent flex items-center justify-center text-white shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-cp-accent font-medium mb-1">
                    {item.subtitle}
                  </div>

                  <p className="text-[10.5px] text-cp-text-muted leading-tight line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. INTERACTIVE ACCENT COLOR OVERRIDE ── */}
      <div className="pt-3 border-t border-cp-border">
        <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted mb-2 flex items-center justify-between">
          <span>Accent Color Override</span>
          <span className="text-[10px] text-cp-text-secondary font-mono">
            {ACCENT_COLORS[accent].name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.entries(ACCENT_COLORS) as [AccentKey, typeof ACCENT_COLORS[AccentKey]][]).map(([key, item]) => {
            const isSelected = accent === key;
            return (
              <button
                key={key}
                onClick={() => setAccent(key)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'border-cp-accent bg-cp-bg-elevated text-cp-text-primary shadow-xs ring-1 ring-cp-accent/40'
                    : 'border-cp-border bg-cp-bg-surface text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-hover'
                }`}
              >
                {key === 'default' ? (
                  <span className="w-3 h-3 rounded-full border border-cp-border bg-gradient-to-tr from-sky-400 to-indigo-500" />
                ) : (
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: item.hex }}
                  />
                )}
                <span>{item.name}</span>
                {isSelected && <Check className="w-3 h-3 text-cp-accent ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. WORKSPACE HARDWARE / TEXTURE CONTROLS ── */}
      <div className="pt-3 border-t border-cp-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Dot Grid Background Texture */}
        <div className="p-3 rounded-xl bg-cp-bg-surface border border-cp-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-cp-accent" />
            <div>
              <div className="font-semibold text-cp-text-primary">Dot-Matrix Canvas</div>
              <div className="text-[10.5px] text-cp-text-muted">Engineering telemetry grid</div>
            </div>
          </div>
          <button
            onClick={() => setDotGrid(!dotGrid)}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative ${
              dotGrid ? 'bg-cp-accent' : 'bg-cp-bg-elevated border border-cp-border'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                dotGrid ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* UI Density Selector */}
        <div className="p-3 rounded-xl bg-cp-bg-surface border border-cp-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {density === 'compact' ? (
              <Minimize2 className="w-4 h-4 text-cp-accent" />
            ) : (
              <Maximize2 className="w-4 h-4 text-cp-accent" />
            )}
            <div>
              <div className="font-semibold text-cp-text-primary">Workspace Density</div>
              <div className="text-[10.5px] text-cp-text-muted">
                {density === 'compact' ? 'High-density telemetry' : 'Balanced spacing'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-cp-bg-elevated border border-cp-border rounded-lg p-0.5">
            <button
              onClick={() => setDensity('compact')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                density === 'compact' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
              }`}
            >
              Dense
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                density === 'comfortable' ? 'bg-cp-accent text-white' : 'text-cp-text-muted hover:text-cp-text-primary'
              }`}
            >
              Standard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
