import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeKey = 'midnight' | 'arctic' | 'obsidian' | 'emerald' | 'cyber';
export type AccentKey = 'default' | 'cobalt' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
export type DensityMode = 'compact' | 'comfortable';

export interface ThemeConfig {
  key: ThemeKey;
  name: string;
  tag?: string;
  subtitle: string;
  description: string;
  swatch: {
    bg: string;
    sidebar: string;
    surface: string;
    accent: string;
    secondary: string;
    border: string;
  };
  isDark: boolean;
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  midnight: {
    key: 'midnight',
    name: 'Linear Navy',
    tag: 'Flagship',
    subtitle: 'High-contrast engineering precision',
    description: 'Deep space navy surfaces with razor hairline dividers, electric cobalt accents, and cyan telemetry.',
    swatch: {
      bg: '#090B10',
      sidebar: '#0D1017',
      surface: '#121622',
      accent: '#4F75FF',
      secondary: '#06B6D4',
      border: '#20293D'
    },
    isDark: true
  },
  obsidian: {
    key: 'obsidian',
    name: 'Vercel Monolith',
    tag: 'OLED Minimalist',
    subtitle: 'Zero distraction monochrome',
    description: 'True pitch black OLED canvas, razor-sharp silver borders, and high-impact stark white highlights.',
    swatch: {
      bg: '#000000',
      sidebar: '#080808',
      surface: '#0E0E0E',
      accent: '#FFFFFF',
      secondary: '#38BDF8',
      border: '#27272A'
    },
    isDark: true
  },
  arctic: {
    key: 'arctic',
    name: 'Stripe Precision',
    tag: 'Editorial Light',
    subtitle: 'Crisp paper clarity',
    description: 'Clean architectural light mode with high-contrast slate typography, pure white cards, and royal blue accents.',
    swatch: {
      bg: '#F8FAFC',
      sidebar: '#FFFFFF',
      surface: '#FFFFFF',
      accent: '#2563EB',
      secondary: '#0D9488',
      border: '#E2E8F0'
    },
    isDark: false
  },
  emerald: {
    key: 'emerald',
    name: 'Bloomberg Terminal',
    tag: 'Financial Telemetry',
    subtitle: 'Dense telemetry aesthetic',
    description: 'Dark forest green backdrop, neon matrix indicators, and high-density financial metrics.',
    swatch: {
      bg: '#040806',
      sidebar: '#070F0B',
      surface: '#0B1812',
      accent: '#10B981',
      secondary: '#34D399',
      border: '#1A3B2C'
    },
    isDark: true
  },
  cyber: {
    key: 'cyber',
    name: 'Raycast Cyber',
    tag: 'Electric Violet',
    subtitle: 'Futuristic developer workstation',
    description: 'Deep violet void with neon purple and hot rose highlights, optimized for rapid scanning.',
    swatch: {
      bg: '#090714',
      sidebar: '#0F0C22',
      surface: '#151130',
      accent: '#C084FC',
      secondary: '#F43F5E',
      border: '#2F2468'
    },
    isDark: true
  }
};

export const ACCENT_COLORS: Record<AccentKey, { name: string; hex: string; hover: string; bg: string }> = {
  default: { name: 'Theme Native', hex: '', hover: '', bg: '' },
  cobalt: { name: 'Cobalt Blue', hex: '#3B82F6', hover: '#2563EB', bg: 'rgba(59, 130, 246, 0.15)' },
  cyan: { name: 'Electric Cyan', hex: '#06B6D4', hover: '#0891B2', bg: 'rgba(6, 182, 212, 0.15)' },
  emerald: { name: 'Matrix Emerald', hex: '#10B981', hover: '#059669', bg: 'rgba(16, 185, 129, 0.15)' },
  amber: { name: 'Telemetry Amber', hex: '#F59E0B', hover: '#D97706', bg: 'rgba(245, 158, 11, 0.15)' },
  rose: { name: 'Laser Rose', hex: '#F43F5E', hover: '#E11D48', bg: 'rgba(244, 63, 94, 0.15)' },
  violet: { name: 'Cyber Violet', hex: '#A855F7', hover: '#9333EA', bg: 'rgba(168, 85, 247, 0.15)' }
};

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  config: ThemeConfig;
  allThemes: ThemeConfig[];
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
  dotGrid: boolean;
  setDotGrid: (enabled: boolean) => void;
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  resetThemeCustomizations: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'cp_intel_theme';
const ACCENT_STORAGE_KEY = 'cp_intel_accent';
const GRID_STORAGE_KEY = 'cp_intel_grid';
const DENSITY_STORAGE_KEY = 'cp_intel_density';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeKey;
      if (saved && THEMES[saved]) return saved;
    } catch (e) {}
    return 'midnight';
  });

  const [accent, setAccentState] = useState<AccentKey>(() => {
    try {
      const saved = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentKey;
      if (saved && ACCENT_COLORS[saved]) return saved;
    } catch (e) {}
    return 'default';
  });

  const [dotGrid, setDotGridState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(GRID_STORAGE_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch (e) {}
    return true;
  });

  const [density, setDensityState] = useState<DensityMode>(() => {
    try {
      const saved = localStorage.getItem(DENSITY_STORAGE_KEY) as DensityMode;
      if (saved === 'compact' || saved === 'comfortable') return saved;
    } catch (e) {}
    return 'compact';
  });

  const setTheme = (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {}
  };

  const setAccent = (newAccent: AccentKey) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, newAccent);
    } catch (e) {}
  };

  const setDotGrid = (enabled: boolean) => {
    setDotGridState(enabled);
    try {
      localStorage.setItem(GRID_STORAGE_KEY, String(enabled));
    } catch (e) {}
  };

  const setDensity = (mode: DensityMode) => {
    setDensityState(mode);
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, mode);
    } catch (e) {}
  };

  const resetThemeCustomizations = () => {
    setTheme('midnight');
    setAccent('default');
    setDotGrid(true);
    setDensity('compact');
  };

  // Sync DOM attributes & CSS overrides
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    if (dotGrid) {
      root.setAttribute('data-grid', 'dots');
    } else {
      root.removeAttribute('data-grid');
    }

    root.setAttribute('data-density', density);

    // Apply custom accent override if selected
    if (accent !== 'default' && ACCENT_COLORS[accent].hex) {
      const custom = ACCENT_COLORS[accent];
      root.style.setProperty('--cp-accent', custom.hex);
      root.style.setProperty('--cp-accent-hover', custom.hover);
      root.style.setProperty('--cp-accent-bg', custom.bg);
    } else {
      root.style.removeProperty('--cp-accent');
      root.style.removeProperty('--cp-accent-hover');
      root.style.removeProperty('--cp-accent-bg');
    }
  }, [theme, accent, dotGrid, density]);

  const value = {
    theme,
    setTheme,
    config: THEMES[theme],
    allThemes: Object.values(THEMES),
    accent,
    setAccent,
    dotGrid,
    setDotGrid,
    density,
    setDensity,
    resetThemeCustomizations
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
