/**
 * Automatic Error Logger Service
 * Logs all errors to the backend launcher_errors table
 */

import { crashesAPI } from '../api/crashes';
import { useAuthStore } from '../stores/authStore';

// LauncherErrorType enum (matching backend)
type LauncherErrorType = 
  | 'PROFILE_LOAD_ERROR'
  | 'FILE_DOWNLOAD_ERROR'
  | 'API_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'FILE_SYSTEM_ERROR'
  | 'NETWORK_ERROR'
  | 'ELECTRON_ERROR'
  | 'JAVA_DETECTION_ERROR'
  | 'CLIENT_LAUNCH_ERROR'
  | 'UNKNOWN_ERROR';

interface ErrorContext {
  component?: string;
  action?: string;
  url?: string;
  statusCode?: number;
  userAgent?: string;
  os?: string;
  osVersion?: string;
  launcherVersion?: string;
}

class ErrorLoggerService {
  private static launcherVersion: string | null = null;
  private static osInfo: { os: string; osVersion: string } | null = null;

  /**
   * Initialize error logger
   */
  static async initialize() {
    try {
      // Get launcher version
      if (window.electronAPI) {
        try {
          this.launcherVersion = await window.electronAPI.getAppVersion();
        } catch (error) {
          console.warn('[ErrorLogger] Failed to get launcher version:', error);
        }
      }

      // Get OS info from navigator
      // In Electron, we can use navigator.platform and userAgent
      const userAgent = navigator.userAgent;
      let os = navigator.platform;
      let osVersion = '';

      // Try to extract OS version from user agent
      if (userAgent.includes('Windows')) {
        os = 'win32';
        const match = userAgent.match(/Windows NT ([0-9.]+)/);
        if (match) {
          osVersion = match[1];
        }
      } else if (userAgent.includes('Mac')) {
        os = 'darwin';
        const match = userAgent.match(/Mac OS X ([0-9_]+)/);
        if (match) {
          osVersion = match[1].replace(/_/g, '.');
        }
      } else if (userAgent.includes('Linux')) {
        os = 'linux';
      }

      this.osInfo = {
        os,
        osVersion: osVersion || (navigator as any).userAgentData?.platformVersion || '',
      };
    } catch (error) {
      console.error('[ErrorLogger] Failed to initialize:', error);
      // Set default values on error
      this.osInfo = {
        os: navigator.platform,
        osVersion: '',
      };
    }
  }

  /**
   * Determine error type from error
   */
  private static determineErrorType(error: Error | any, context?: ErrorContext): LauncherErrorType {
    // Check error message for clues
    const message = error?.message || String(error);
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    if (lowerMessage.includes('authentication') || lowerMessage.includes('auth') || lowerMessage.includes('login')) {
      return 'AUTHENTICATION_ERROR';
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    if (lowerMessage.includes('file') || lowerMessage.includes('download') || lowerMessage.includes('fs')) {
      return 'FILE_DOWNLOAD_ERROR';
    }
    if (lowerMessage.includes('profile') || lowerMessage.includes('load')) {
      return 'PROFILE_LOAD_ERROR';
    }
    if (lowerMessage.includes('java') || lowerMessage.includes('jvm')) {
      return 'JAVA_DETECTION_ERROR';
    }
    if (lowerMessage.includes('electron') || lowerMessage.includes('ipc')) {
      return 'ELECTRON_ERROR';
    }
    if (lowerMessage.includes('launch') || lowerMessage.includes('game') || lowerMessage.includes('client')) {
      return 'CLIENT_LAUNCH_ERROR';
    }
    if (context?.url || context?.statusCode) {
      return 'API_ERROR';
    }
    if (lowerMessage.includes('filesystem') || lowerMessage.includes('permission denied')) {
      return 'FILE_SYSTEM_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Log error to backend
   */
  static async logError(
    error: Error | any,
    context?: ErrorContext
  ): Promise<void> {
    try {
      // Don't log if we're in development and it's a known error
      if ((import.meta as any).env?.DEV) {
        // Still log, but don't spam
        console.error('[ErrorLogger] Error occurred:', error, context);
      }

      const errorType = this.determineErrorType(error, context);
      const errorMessage = error?.message || String(error);
      const stackTrace = error?.stack || null;

      // Get user info
      const { playerProfile, accessToken } = useAuthStore.getState();
      // PlayerProfile doesn't have 'id', use uuid as identifier
      const userId = (playerProfile as any)?.id || playerProfile?.uuid || null;
      const username = playerProfile?.username || null;

      // Prepare error data
      const errorData = {
        errorType,
        errorMessage: errorMessage.substring(0, 10000), // Limit message length
        stackTrace: stackTrace ? stackTrace.substring(0, 50000) : null, // Limit stack trace length
        component: context?.component || null,
        action: context?.action || null,
        url: context?.url || null,
        statusCode: context?.statusCode || null,
        userAgent: context?.userAgent || navigator.userAgent,
        os: context?.os || this.osInfo?.os || null,
        osVersion: context?.osVersion || this.osInfo?.osVersion || null,
        launcherVersion: context?.launcherVersion || this.launcherVersion || null,
      };

      // Only log if we have access token (user is authenticated)
      // For critical errors, we might want to log even without auth
      if (accessToken) {
        try {
          await crashesAPI.logLauncherError(errorData);
          console.log('[ErrorLogger] Error logged successfully');
        } catch (logError) {
          // Silently fail to prevent infinite loops
          console.error('[ErrorLogger] Failed to log error:', logError);
        }
      } else {
        // For unauthenticated errors, we can still try to log (backend will handle it)
        try {
          await crashesAPI.logLauncherError(errorData);
        } catch (logError) {
          // Silently fail
          console.error('[ErrorLogger] Failed to log error (no auth):', logError);
        }
      }
    } catch (loggerError) {
      // Prevent infinite loops - don't log logger errors
      console.error('[ErrorLogger] Critical error in logger:', loggerError);
    }
  }

  /**
   * Log error with automatic context detection
   */
  static async logErrorAuto(error: Error | any, additionalContext?: Partial<ErrorContext>): Promise<void> {
    const context: ErrorContext = {
      ...additionalContext,
      userAgent: navigator.userAgent,
    };

    // Try to detect component from stack trace
    if (error?.stack && !context.component) {
      const stack = error.stack;
      // Try to extract component name from stack
      const componentMatch = stack.match(/at\s+(\w+)/);
      if (componentMatch) {
        context.component = componentMatch[1];
      }
    }

    await this.logError(error, context);
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  ErrorLoggerService.initialize();
}

export default ErrorLoggerService;

