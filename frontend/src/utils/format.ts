/**
 * Unified Formatting & Privacy Masking Utilities for CareerPath Intelligence.
 * Enforces consistent number formatting, tabular decimal alignment, and privacy masking.
 */

export const formatNumber = (val: number | null | undefined, decimals: number = 0): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatPercent = (val: number | null | undefined, decimals: number = 1): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(decimals)}%`;
};

export const formatYears = (val: number | null | undefined, decimals: number = 1): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(decimals)} yrs`;
};

export const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `$${val.toLocaleString('en-US')}`;
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Privacy Masking Utility for Talent Committee Mode & Candidate Anonymization.
 * Replaces identifiers with a pseudonymized hash like "TALENT-9A4B" to prevent unconscious bias.
 */
export const maskEmployeeId = (empId: string, masked: boolean = false): string => {
  if (!masked || !empId) return empId;
  let hash = 0;
  for (let i = 0; i < empId.length; i++) {
    hash = ((hash << 5) - hash) + empId.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);
  return `CANDIDATE-${hex}`;
};

export const formatTenureYears = formatYears;

