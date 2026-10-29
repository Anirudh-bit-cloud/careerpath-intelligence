/**
 * CareerPath Intelligence — Consolidated Design System Tokens
 * Single source of truth for color scales, typography, spacing, radius, elevation, and z-index.
 * Muted, calm enterprise design adhering to WCAG 2.2 AA accessibility standards.
 */

export const TOKENS = {
  // Typography
  typography: {
    fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontMono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    sizes: {
      xs: '0.6875rem',    // 11px - micro badges & footnotes
      sm: '0.75rem',      // 12px - secondary labels, table headers
      base: '0.8125rem',   // 13px - standard UI text, table cells
      md: '0.875rem',     // 14px - inputs, card headings, subheadings
      lg: '1rem',         // 16px - section titles, modal headers
      xl: '1.25rem',      // 20px - page subheadings
      '2xl': '1.5rem',    // 24px - page primary titles
      '3xl': '1.875rem',  // 30px - executive metric KPI displays
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.6',
    }
  },

  // Spacing (rem based)
  spacing: {
    '2xs': '0.25rem',   // 4px
    xs: '0.5rem',       // 8px
    sm: '0.75rem',      // 12px
    md: '1rem',         // 16px
    lg: '1.5rem',       // 24px
    xl: '2rem',         // 32px
    '2xl': '3rem',      // 48px
  },

  // Corner radius
  radius: {
    none: '0px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },

  // Elevation Shadows
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.09), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
  },

  // Z-Index Layers
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    drawer: 300,
    modal: 400,
    toast: 500,
    tooltip: 600,
  },

  // 3 Restrained Core Themes
  themes: {
    light: {
      key: 'light',
      name: 'Light (Default)',
      description: 'Clean architectural enterprise white canvas with slate typography and high-contrast dividers.',
      isDark: false,
      colors: {
        bgApp: '#F8FAFC',
        bgSidebar: '#FFFFFF',
        bgSurface: '#FFFFFF',
        bgElevated: '#F1F5F9',
        bgHover: '#E2E8F0',
        bgInput: '#FFFFFF',
        textPrimary: '#0F172A',
        textSecondary: '#334155',
        textMuted: '#64748B',
        border: '#E2E8F0',
        borderSubtle: '#F1F5F9',
        chartGrid: '#E2E8F0',
        chartAxis: '#64748B',
      }
    },
    dark: {
      key: 'dark',
      name: 'Dark Slate',
      description: 'Refined deep slate charcoal surfaces designed for long-duration analytical reviews.',
      isDark: true,
      colors: {
        bgApp: '#090D16',
        bgSidebar: '#0F1420',
        bgSurface: '#141B2B',
        bgElevated: '#1A2338',
        bgHover: '#232E4A',
        bgInput: '#0F1420',
        textPrimary: '#F8FAFC',
        textSecondary: '#CBD5E1',
        textMuted: '#8193AC',
        border: '#243048',
        borderSubtle: '#182133',
        chartGrid: '#1E293B',
        chartAxis: '#94A3B8',
      }
    },
    contrast: {
      key: 'contrast',
      name: 'High Contrast (WCAG AAA)',
      description: 'Maximum legibility mode with solid stark borders and strict monochrome contrast.',
      isDark: true,
      colors: {
        bgApp: '#000000',
        bgSidebar: '#050505',
        bgSurface: '#0A0A0A',
        bgElevated: '#121212',
        bgHover: '#1E1E1E',
        bgInput: '#000000',
        textPrimary: '#FFFFFF',
        textSecondary: '#E4E4E7',
        textMuted: '#A1A1AA',
        border: '#52525B',
        borderSubtle: '#3F3F46',
        chartGrid: '#3F3F46',
        chartAxis: '#E4E4E7',
      }
    }
  },

  // 5 Muted Accessible Accent Options
  accents: {
    'slate-navy': {
      key: 'slate-navy',
      name: 'Slate Navy',
      light: '#2563EB',
      dark: '#4F75FF',
      contrast: '#38BDF8',
      bgSubtleLight: 'rgba(37, 99, 235, 0.08)',
      bgSubtleDark: 'rgba(79, 117, 255, 0.15)',
    },
    'forest-sage': {
      key: 'forest-sage',
      name: 'Forest Sage',
      light: '#0D9488',
      dark: '#14B8A6',
      contrast: '#2DD4BF',
      bgSubtleLight: 'rgba(13, 148, 136, 0.08)',
      bgSubtleDark: 'rgba(20, 184, 166, 0.15)',
    },
    'warm-amber': {
      key: 'warm-amber',
      name: 'Executive Amber',
      light: '#D97706',
      dark: '#F59E0B',
      contrast: '#FBBF24',
      bgSubtleLight: 'rgba(217, 119, 6, 0.08)',
      bgSubtleDark: 'rgba(245, 158, 11, 0.15)',
    },
    'deep-indigo': {
      key: 'deep-indigo',
      name: 'Deep Indigo',
      light: '#4F46E5',
      dark: '#6366F1',
      contrast: '#818CF8',
      bgSubtleLight: 'rgba(79, 70, 229, 0.08)',
      bgSubtleDark: 'rgba(99, 102, 241, 0.15)',
    },
    'rosewood': {
      key: 'rosewood',
      name: 'Muted Rosewood',
      light: '#BE123C',
      dark: '#F43F5E',
      contrast: '#FB7185',
      bgSubtleLight: 'rgba(190, 18, 60, 0.08)',
      bgSubtleDark: 'rgba(244, 63, 94, 0.15)',
    }
  }
} as const;

export type ThemeKey = 'light' | 'dark' | 'contrast';
export type AccentKey = 'slate-navy' | 'forest-sage' | 'warm-amber' | 'deep-indigo' | 'rosewood';
export type DensityMode = 'compact' | 'comfortable';
