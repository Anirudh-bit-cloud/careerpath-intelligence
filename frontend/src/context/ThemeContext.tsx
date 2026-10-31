import React, { createContext, useContext, useEffect, useState } from 'react';
import { TOKENS, ThemeKey, AccentKey, DensityMode } from '../tokens';

export type { ThemeKey, AccentKey, DensityMode };

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
    border: string;
  };
  isDark: boolean;
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  light: {
    key: 'light',
    name: 'Light',
    tag: 'Default',
    subtitle: 'Calm, architectural paper clarity',
    description: 'Clean architectural white canvas with slate typography, subtle borders, and high contrast for daylight operations.',
    swatch: {
      bg: '#F8FAFC',
      sidebar: '#FFFFFF',
      surface: '#FFFFFF',
      accent: '#2563EB',
      border: '#E2E8F0'
    },
    isDark: false
  },
  dark: {
    key: 'dark',
    name: 'Dark Slate',
    tag: 'Low Glare',
    subtitle: 'Refined deep charcoal slate',
    description: 'Disciplined slate dark canvas designed for focused, fatigue-free workforce calibration and analytical reviews.',
    swatch: {
      bg: '#090D16',
      sidebar: '#0F1420',
      surface: '#141B2B',
      accent: '#4F75FF',
      border: '#243048'
    },
    isDark: true
  },
  contrast: {
    key: 'contrast',
    name: 'High Contrast',
    tag: 'WCAG AAA',
    subtitle: 'Maximum accessibility and stark borders',
    description: 'High-contrast monochrome surfaces with solid borders meeting strict WCAG 2.2 AAA accessibility requirements.',
    swatch: {
      bg: '#000000',
      sidebar: '#050505',
      surface: '#0A0A0A',
      accent: '#38BDF8',
      border: '#52525B'
    },
    isDark: true
  }
};

export interface AccentColorConfig {
  key: AccentKey;
  name: string;
  hex: string;
  hover: string;
  bgSubtle: string;
}

export const ACCENT_COLORS: Record<AccentKey, AccentColorConfig> = {
  'slate-navy': {
    key: 'slate-navy',
    name: 'Slate Navy',
    hex: '#2563EB',
    hover: '#1D4ED8',
    bgSubtle: 'rgba(37, 99, 235, 0.08)'
  },
  'forest-sage': {
    key: 'forest-sage',
    name: 'Forest Sage',
    hex: '#0D9488',
    hover: '#0F766E',
    bgSubtle: 'rgba(13, 148, 136, 0.08)'
  },
  'warm-amber': {
    key: 'warm-amber',
    name: 'Executive Amber',
    hex: '#D97706',
    hover: '#B45309',
    bgSubtle: 'rgba(217, 119, 6, 0.08)'
  },
  'deep-indigo': {
    key: 'deep-indigo',
    name: 'Deep Indigo',
    hex: '#4F46E5',
    hover: '#4338CA',
    bgSubtle: 'rgba(79, 70, 229, 0.08)'
  },
  'rosewood': {
    key: 'rosewood',
    name: 'Muted Rosewood',
    hex: '#BE123C',
    hover: '#9F1239',
    bgSubtle: 'rgba(190, 18, 60, 0.08)'
  }
};

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  config: ThemeConfig;
  allThemes: ThemeConfig[];
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  resetThemeCustomizations: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'cp_intel_theme';
const ACCENT_STORAGE_KEY = 'cp_intel_accent';
const DENSITY_STORAGE_KEY = 'cp_intel_density';

function normalizeTheme(saved: string | null): ThemeKey {
  if (saved === 'light' || saved === 'arctic') return 'light';
  if (saved === 'dark' || saved === 'midnight' || saved === 'emerald' || saved === 'cyber') return 'dark';
  if (saved === 'contrast' || saved === 'obsidian') return 'contrast';
  return 'light'; // Default Light
}

function normalizeAccent(saved: string | null): AccentKey {
  if (saved && ACCENT_COLORS[saved as AccentKey]) return saved as AccentKey;
  return 'slate-navy';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    try {
      return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return 'light';
    }
  });

  const [accent, setAccentState] = useState<AccentKey>(() => {
    try {
      return normalizeAccent(localStorage.getItem(ACCENT_STORAGE_KEY));
    } catch {
      return 'slate-navy';
    }
  });

  const [density, setDensityState] = useState<DensityMode>(() => {
    try {
      const saved = localStorage.getItem(DENSITY_STORAGE_KEY) as DensityMode;
      if (saved === 'compact' || saved === 'comfortable') return saved;
    } catch {}
    return 'compact';
  });

  const setTheme = (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const setAccent = (newAccent: AccentKey) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, newAccent);
    } catch {}
  };

  const setDensity = (mode: DensityMode) => {
    setDensityState(mode);
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, mode);
    } catch {}
  };

  const resetThemeCustomizations = () => {
    setTheme('light');
    setAccent('slate-navy');
    setDensity('compact');
  };

  // Sync DOM root attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    root.setAttribute('data-accent', accent);
    root.setAttribute('data-density', density);
    root.removeAttribute('data-grid'); // Removed novelty dot grid
  }, [theme, accent, density]);

  const value = {
    theme,
    setTheme,
    config: THEMES[theme] || THEMES.light,
    allThemes: Object.values(THEMES),
    accent,
    setAccent,
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
