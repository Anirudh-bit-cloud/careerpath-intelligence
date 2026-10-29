/**
 * Internationalization and Localized Formatting Utilities for CareerPath Intelligence.
 * Conforms to WCAG 2.2 AA and ECMAScript Internationalization API (Intl).
 */

export type SupportedLocale = 'en-US' | 'en-GB' | 'de-DE' | 'fr-FR';

let currentLocale: SupportedLocale = 'en-US';

export function setLocale(locale: SupportedLocale) {
  currentLocale = locale;
  try {
    localStorage.setItem('cp_locale', locale);
  } catch {
    // ignore
  }
}

export function getLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem('cp_locale') as SupportedLocale;
    if (stored && ['en-US', 'en-GB', 'de-DE', 'fr-FR'].includes(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return currentLocale;
}

// ── NUMBERS & METRICS ────────────────────────────────────────────────────────

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat(getLocale(), options).format(value);
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0';
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercent(
  ratio: number,
  decimals: number = 1
): string {
  if (ratio === null || ratio === undefined || isNaN(ratio)) return '0%';
  const val = ratio > 1 ? ratio / 100 : ratio;
  return new Intl.NumberFormat(getLocale(), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(val);
}

export function formatTenureYears(years: number): string {
  if (years === null || years === undefined || isNaN(years)) return '0.0 yrs';
  return `${formatNumber(years, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} yrs`;
}

// ── DATES & TIMESTAMPS ──────────────────────────────────────────────────────

export function formatDate(
  dateInput: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  if (isNaN(date.getTime())) return '—';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return new Intl.DateTimeFormat(getLocale(), options || defaultOptions).format(date);
}

export function formatDateTime(
  dateInput: string | number | Date
): string {
  return formatDate(dateInput, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ── USER-FACING STRING DICTIONARY (ENGLISH BASE) ─────────────────────────────

export const DICTIONARY = {
  app: {
    title: 'CareerPath Intelligence',
    tagline: 'Enterprise Career Progression & Retention Optimization'
  },
  nav: {
    overview: 'Workforce Overview',
    reports: 'Reports & Briefings',
    clusters: 'Career Clusters',
    promotionGap: 'Promotion Gap Monitor',
    managerInsights: 'Manager Insights',
    retentionOpportunities: 'Retention Opportunities',
    succession: 'Succession & Bench',
    committee: 'Talent Committee Review',
    impactEstimator: 'Impact & ROI Estimator',
    employees: 'Employee Explorer',
    fairnessAudit: 'Fairness & Bias Audit',
    trustCenter: 'Trust Center & Governance',
    connectors: 'Connectors & Public API',
    dataManagement: 'Data Management',
    designSystem: 'Design System & Tokens',
    settings: 'Themes & Settings'
  },
  roles: {
    admin: 'Enterprise Admin',
    hrbp: 'HR Business Partner',
    analyst: 'People Analytics Lead',
    committee: 'Talent Committee Member'
  },
  actions: {
    save: 'Save Changes',
    cancel: 'Cancel',
    confirm: 'Confirm Decision',
    retry: 'Try Again',
    filter: 'Apply Filters',
    reset: 'Reset Filters',
    exportCsv: 'Export CSV',
    back: 'Back'
  },
  disclosures: {
    syntheticData: 'Derived from synthetic benchmark dataset. Academic prototype for illustrative decision support.',
    decisionSupportOnly: 'Decision Support Only: No automated adverse employment or compensation decisions may be taken on the basis of algorithmic scores.',
    privacySuppression: 'Cohorts with sample size n < 10 are suppressed to guarantee individual privacy.'
  }
} as const;

export function t(path: string, fallback?: string): string {
  const parts = path.split('.');
  let current: any = DICTIONARY;
  for (const p of parts) {
    if (current && typeof current === 'object' && p in current) {
      current = current[p];
    } else {
      return fallback || path;
    }
  }
  return typeof current === 'string' ? current : fallback || path;
}
