import React from 'react';
import {
  Check,
  Palette,
  Sun,
  Moon,
  Contrast,
  Minimize2,
  Maximize2,
  RotateCcw
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
    density,
    setDensity,
    resetThemeCustomizations
  } = useTheme();

  const getThemeIcon = (key: ThemeKey) => {
    switch (key) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'contrast':
        return <Contrast className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className={inline ? 'w-full space-y-6' : 'p-4 max-w-xl w-full space-y-5'}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center justify-between pb-3 border-b border-cp-border">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-cp-accent" />
            <div>
              <h3 className="text-sm font-semibold text-cp-text-primary">Theme & Appearance</h3>
              <p className="text-[11px] text-cp-text-muted">Calm enterprise themes and accessible contrast options</p>
            </div>
          </div>
          <button
            onClick={resetThemeCustomizations}
            className="p-1.5 rounded-md hover:bg-cp-bg-hover text-cp-text-muted hover:text-cp-text-primary text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset to default light theme"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* ── 1. CORE THEMES (LIGHT, DARK, HIGH CONTRAST) ── */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted mb-2.5 flex items-center justify-between">
          <span>Enterprise Themes</span>
          <span className="text-[10px] text-cp-text-muted font-mono">WCAG 2.2 AA compliant</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {allThemes.map((item) => {
            const isSelected = theme === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTheme(item.key)}
                className={`p-3.5 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-cp-accent bg-cp-bg-elevated shadow-xs ring-1 ring-cp-accent/50'
                    : 'border-cp-border bg-cp-bg-surface hover:bg-cp-bg-hover'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getThemeIcon(item.key)}
                      <span className="text-xs font-semibold text-cp-text-primary">{item.name}</span>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-cp-accent text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-cp-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-cp-border/50">
                  <div
                    className="w-3 h-3 rounded border border-cp-border"
                    style={{ backgroundColor: item.swatch.bg }}
                    title="Background"
                  />
                  <div
                    className="w-3 h-3 rounded border border-cp-border"
                    style={{ backgroundColor: item.swatch.surface }}
                    title="Surface"
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.swatch.accent }}
                    title="Accent"
                  />
                  <span className="text-[10px] text-cp-text-muted font-mono ml-auto">
                    {item.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. MUTED ACCENT COLORS (5 ACCESSIBLE OPTIONS) ── */}
      <div className="pt-4 border-t border-cp-border">
        <div className="text-[10px] font-bold uppercase tracking-wider text-cp-text-muted mb-2 flex items-center justify-between">
          <span>Accent Color</span>
          <span className="text-[10px] text-cp-text-secondary font-mono">
            {ACCENT_COLORS[accent]?.name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.entries(ACCENT_COLORS) as [AccentKey, typeof ACCENT_COLORS[AccentKey]][]).map(([key, item]) => {
            const isSelected = accent === key;
            return (
              <button
                key={key}
                onClick={() => setAccent(key)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cp-accent bg-cp-bg-elevated text-cp-text-primary shadow-xs ring-1 ring-cp-accent/40'
                    : 'border-cp-border bg-cp-bg-surface text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-hover'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: item.hex }}
                />
                <span>{item.name}</span>
                {isSelected && <Check className="w-3 h-3 text-cp-accent ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. WORKSPACE DENSITY ── */}
      <div className="pt-4 border-t border-cp-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {density === 'compact' ? (
            <Minimize2 className="w-4 h-4 text-cp-accent" />
          ) : (
            <Maximize2 className="w-4 h-4 text-cp-accent" />
          )}
          <div>
            <div className="font-semibold text-cp-text-primary">Table & Layout Density</div>
            <div className="text-[11px] text-cp-text-muted">
              {density === 'compact' ? 'High information density for calibration review' : 'Comfortable line height & padding'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-cp-bg-elevated border border-cp-border rounded-md p-0.5">
          <button
            onClick={() => setDensity('compact')}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              density === 'compact' ? 'bg-cp-accent text-white font-semibold' : 'text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            Compact
          </button>
          <button
            onClick={() => setDensity('comfortable')}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              density === 'comfortable' ? 'bg-cp-accent text-white font-semibold' : 'text-cp-text-muted hover:text-cp-text-primary'
            }`}
          >
            Comfortable
          </button>
        </div>
      </div>
    </div>
  );
};
