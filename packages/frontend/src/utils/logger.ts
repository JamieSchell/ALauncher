/**
 * Development-safe logger utility
 * All logs are automatically disabled in production builds
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = import.meta.env.DEV;

/**
 * Development-only logger
 * In production, all calls are no-ops for better performance
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[Dev]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[Dev]', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[Dev]', ...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production (for debugging critical issues)
    if (isDevelopment) {
      console.error('[Dev]', ...args);
    } else {
      console.error('[Prod]', ...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[Dev]', ...args);
    }
  },

  /**
   * API-specific logger with structured output
   */
  api: (label: string, url: string, details?: Record<string, any>) => {
    if (isDevelopment) {
      console.log(`[API] ${label}`, url, details ? JSON.stringify(details, null, 2) : '');
    }
  },

  apiResponse: (label: string, url: string, status: number) => {
    if (isDevelopment) {
      console.log(`[API Response] ${label}`, url, `Status: ${status}`);
    }
  },

  /**
   * Component-specific logger
   */
  component: (componentName: string, message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[${componentName}]`, message, data || '');
    }
  },

  /**
   * Performance logger
   */
  performance: (label: string, duration: number) => {
    if (isDevelopment) {
      console.log(`[Performance] ${label}: ${duration}ms`);
    }
  },
};

/**
 * Legacy console wrapper for gradual migration
 * @deprecated Use logger instead
 */
export const devConsole = {
  log: logger.log,
  info: logger.info,
  warn: logger.warn,
  error: logger.error,
  debug: logger.debug,
};

export default logger;
