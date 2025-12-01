/**
 * Design System - Tailwind CSS Presets
 *
 * Единая система дизайна с пресетами классов для консистентного UI.
 * Используется как слой над Tailwind для стандартизации стилей.
 *
 * @module styles/design-system
 */

/**
 * Button variants and sizes
 */
export const buttonVariants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white border-primary-500',
  secondary: 'bg-surface-elevated hover:bg-surface-hover text-heading border-white/10',
  success: 'bg-success-500 hover:bg-success-600 text-white border-success-500',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white border-warning-500',
  error: 'bg-error-500 hover:bg-error-600 text-white border-error-500',
  ghost: 'bg-transparent hover:bg-surface-hover text-heading border-transparent',
  outline: 'bg-transparent hover:bg-surface-hover text-heading border-white/20',
} as const;

export const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
} as const;

export const buttonBase = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background-primary';

/**
 * Input variants and sizes
 */
export const inputVariants = {
  default: 'bg-surface-base border-white/10 focus:border-primary-500 focus:ring-primary-500',
  error: 'bg-surface-base border-error-border focus:border-error-500 focus:ring-error-500',
  success: 'bg-surface-base border-success-border focus:border-success-500 focus:ring-success-500',
} as const;

export const inputSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
} as const;

export const inputBase = 'w-full rounded-lg border bg-surface-base text-heading placeholder:text-body-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Card variants
 */
export const cardVariants = {
  default: 'bg-surface-elevated border-white/10',
  elevated: 'bg-surface-elevated/90 border-white/15 shadow-lg',
  flat: 'bg-surface-base border-white/5',
} as const;

export const cardBase = 'rounded-2xl border p-lg';

/**
 * Modal variants
 */
export const modalOverlay = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50';
export const modalContent = 'bg-surface-elevated border border-white/20 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden';
export const modalHeader = 'px-6 py-4 border-b border-white/10';
export const modalBody = 'px-6 py-4 overflow-y-auto';
export const modalFooter = 'px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3';

/**
 * Table styles
 */
export const tableBase = 'w-full border-collapse';
export const tableHeader = 'bg-surface-elevated border-b border-white/10';
export const tableHeaderCell = 'px-4 py-3 text-left text-sm font-semibold text-heading';
export const tableBody = 'divide-y divide-white/5';
export const tableRow = 'hover:bg-surface-hover transition-colors';
export const tableCell = 'px-4 py-3 text-sm text-body';

/**
 * Tabs styles
 */
export const tabsList = 'flex items-center gap-1 border-b border-white/10';
export const tabBase = 'px-4 py-2 text-sm font-medium text-body-muted border-b-2 border-transparent transition-all duration-200 hover:text-heading';
export const tabActive = 'text-heading border-primary-500';

/**
 * Spacing presets
 */
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
} as const;

/**
 * Border radius presets
 */
export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

/**
 * Shadow presets
 */
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;

// Re-export cn from utils
export { cn } from '../utils/cn';

