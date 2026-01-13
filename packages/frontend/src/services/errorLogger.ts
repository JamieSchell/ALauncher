/**
 * Automatic Error Logger Service
 * Logs all errors to the backend launcher_errors table
 */

import { crashesAPI } from '../api/crashes';
import { useAuthStore } from '../stores/authStore';
import { isElectron } from '../api/platformSimple';

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
  | 'UNKNOWN_ERROR'
  | 'INFO_MESSAGE';

interface ErrorContext {
  component?: string;
  action?: string;
  url?: string;
  statusCode?: number;
  userAgent?: string;
  os?: string;
  osVersion?: string;
  launcherVersion?: string;
  systemInfo?: string;
  profileId?: string;
  processId?: string | number;
  serverAddress?: string;
  serverPort?: number;
  [key: string]: any; // Allow additional properties
}

class ErrorLoggerService {
  private static launcherVersion: string | null = null;
  private static osInfo: { os: string; osVersion: string } | null = null;
  private static errorCounts: Map<string, number> = new Map();
  private static lastErrors: Map<string, { timestamp: number; message: string }> = new Map();
  private static isInitialized = false;

  /**
   * Initialize error logger
   */
  static async initialize() {
    try {
      // Get launcher version
      if (isElectron) {
        try {
          this.launcherVersion = await (window as any).electronAPI.getAppVersion();
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
      // Проверяем тип ошибки
      const errorType = this.determineErrorType(error, context);
      const message = error?.message || String(error);

      // Проверка на флуд - не логируем более 10 одинаковых ошибок в минуту
      if (this.isFlooding(errorType, message)) {
        console.warn(`[ErrorLogger] Flooding detected for error type: ${errorType}`);
        return;
      }

      // Don't log if we're in development and it's a known error
      if ((import.meta as any).env?.DEV) {
        // Still log, but don't spam
        console.error('[ErrorLogger] Error occurred:', error, context);
      }

      let errorMessage = error?.message || String(error);
      
      // Ensure errorMessage is not empty (backend validation requires it)
      if (!errorMessage || errorMessage.trim() === '') {
        errorMessage = 'Unknown error occurred';
      }
      
      const stackTrace = error?.stack || null;

      // Get user info
      const { playerProfile, accessToken } = useAuthStore.getState();
      // PlayerProfile doesn't have 'id', use uuid as identifier
      const userId = (playerProfile as any)?.id || playerProfile?.uuid || null;
      const username = playerProfile?.username || null;

      // Validate errorType matches backend enum values
      const validErrorTypes: LauncherErrorType[] = [
        'PROFILE_LOAD_ERROR',
        'FILE_DOWNLOAD_ERROR',
        'API_ERROR',
        'AUTHENTICATION_ERROR',
        'VALIDATION_ERROR',
        'FILE_SYSTEM_ERROR',
        'NETWORK_ERROR',
        'ELECTRON_ERROR',
        'JAVA_DETECTION_ERROR',
        'CLIENT_LAUNCH_ERROR',
        'UNKNOWN_ERROR',
      ];
      
      const validatedErrorType = validErrorTypes.includes(errorType) ? errorType : 'UNKNOWN_ERROR';

      // Prepare error data - use undefined instead of null for optional fields (express-validator prefers undefined)
      const errorData: any = {
        errorType: validatedErrorType,
        errorMessage: errorMessage.trim().substring(0, 10000), // Limit message length and ensure not empty
      };

      // Add optional fields only if they have values (don't send null/undefined)
      if (stackTrace) {
        errorData.stackTrace = stackTrace.substring(0, 50000);
      }
      if (context?.component) {
        errorData.component = context.component;
      }
      if (context?.action) {
        errorData.action = context.action;
      }
      if (context?.url) {
        errorData.url = context.url;
      }
      if (context?.statusCode !== undefined && context?.statusCode !== null) {
        errorData.statusCode = context.statusCode;
      }
      if (context?.userAgent || navigator.userAgent) {
        errorData.userAgent = context?.userAgent || navigator.userAgent;
      }
      if (context?.os || this.osInfo?.os) {
        errorData.os = context?.os || this.osInfo?.os;
      }
      if (context?.osVersion || this.osInfo?.osVersion) {
        errorData.osVersion = context?.osVersion || this.osInfo?.osVersion;
      }
      if (context?.launcherVersion || this.launcherVersion) {
        errorData.launcherVersion = context?.launcherVersion || this.launcherVersion;
      }

      // Log data being sent for debugging
      console.log('[ErrorLogger] Sending error data:', {
        errorType: errorData.errorType,
        errorMessageLength: errorData.errorMessage.length,
        hasStackTrace: !!errorData.stackTrace,
        component: errorData.component,
      });

      // Only log if we have access token (user is authenticated)
      // Skip logging for unauthenticated users to avoid CSRF errors
      if (accessToken) {
        try {
          await crashesAPI.logLauncherError(errorData);
          console.log('[ErrorLogger] Error logged successfully');
        } catch (logError) {
          // Silently fail to prevent infinite loops
          console.error('[ErrorLogger] Failed to log error:', logError);
        }
      } else {
        // Skip logging for unauthenticated users - just log to console
        console.log('[ErrorLogger] Skipping error logging for unauthenticated user');
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

  /**
   * Log API error - unified method for API errors
   * @param error - Axios error or similar
   * @param context - Additional context (component, action, etc.)
   */
  static async logApiError(
    error: any,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    const apiContext: ErrorContext = {
      ...context,
      url: error?.config?.url || error?.url || context?.url,
      statusCode: error?.response?.status || error?.statusCode || context?.statusCode,
      action: context?.action || 'api_request',
      component: context?.component || 'API',
      userAgent: navigator.userAgent,
    };

    // Enhance error message with API-specific info
    let errorMessage = error?.message || String(error);
    if (error?.response?.data?.error) {
      errorMessage = `${errorMessage} - ${error.response.data.error}`;
    }
    if (apiContext.statusCode) {
      errorMessage = `[${apiContext.statusCode}] ${errorMessage}`;
    }

    const enhancedError = {
      ...error,
      message: errorMessage,
    };

    await this.logError(enhancedError, apiContext);
  }

  /**
   * Log UI error - unified method for React/UI errors
   * @param error - Error object
   * @param errorInfo - React error info (from Error Boundary)
   * @param context - Additional context
   */
  static async logUIError(
    error: Error,
    errorInfo?: { componentStack?: string },
    context?: Partial<ErrorContext>
  ): Promise<void> {
    const uiContext: ErrorContext = {
      ...context,
      action: context?.action || 'ui_render',
      component: context?.component || 'UnknownComponent',
      userAgent: navigator.userAgent,
    };

    // Enhance error with React component stack if available
    let enhancedError = error;
    if (errorInfo?.componentStack) {
      enhancedError = {
        ...error,
        stack: `${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`,
      } as Error;
    }

    await this.logError(enhancedError, uiContext);
  }

  /**
   * Логирование информационных сообщений (для отладки)
   */
  static async logInfo(action: string, context?: ErrorContext): Promise<void> {
    try {
      const { playerProfile } = useAuthStore.getState();

      // Просто логируем в консоль, НЕ отправляем в базу данных
      console.log(`[INFO] ${action}`, {
        component: context?.component,
        action,
        userId: (playerProfile as any)?.id || playerProfile?.uuid || null,
        username: playerProfile?.username || null,
      });

      // Если нужно отладочное логирование в разработке, можно раскомментировать:
      // if ((import.meta as any).env?.DEV) {
      //   console.log(`[ErrorLogger] Info logged: ${action}`);
      // }
    } catch (error) {
      console.error('[ErrorLogger] Failed to log info:', error);
    }
  }

  /**
   * Получение статистики ошибок
   */
  static getErrorStats(): { [key: string]: number } {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * Очистка старых записей об ошибках
   */
  static cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [key, error] of this.lastErrors.entries()) {
      if (now - error.timestamp > oneHour) {
        this.lastErrors.delete(key);
      }
    }
  }

  /**
   * Проверка на флуд ошибок (более 10 одинаковых ошибок в минуту)
   */
  private static isFlooding(errorType: string, message: string): boolean {
    const key = `${errorType}:${message.substring(0, 100)}`;
    const now = Date.now();
    const lastError = this.lastErrors.get(key);

    if (lastError && now - lastError.timestamp < 60000) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
      return this.errorCounts.get(key)! > 10;
    }

    this.lastErrors.set(key, { timestamp: now, message });
    this.errorCounts.set(key, 1);
    return false;
  }

  /**
   * Автоматическое логирование критических системных ошибок
   */
  static setupGlobalErrorHandlers(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Логирование непойманных ошибок JavaScript
    window.onerror = (message, source, lineno, colno, error) => {
      this.logError(error || new Error(String(message)), {
        component: 'GlobalErrorHandler',
        action: 'unhandled_error',
        url: source,
        statusCode: 500,
      });
      return false;
    };

    // Логирование отклоненных промисов
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, {
        component: 'GlobalErrorHandler',
        action: 'unhandled_promise_rejection',
        statusCode: 500,
      });
    });

    // Логирование ошибок загрузки ресурсов
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const element = event.target as HTMLElement;
        const url = (element as any).src || (element as any).href;
        
        // Skip logging for image loading errors (404s are expected for missing server images)
        // Images are handled gracefully with fallbacks in components
        if (element.tagName === 'IMG') {
          // Check if it's a server image URL (expected to potentially fail)
          if (url && (url.includes('/uploads/server/') || url.includes('/uploads/textures/'))) {
            return; // Silently ignore - these are handled by onError handlers
          }
        }
        
        this.logError(new Error(`Resource loading failed: ${element.tagName}`), {
          component: 'ResourceLoader',
          action: 'resource_load_error',
          url,
          statusCode: 404,
        });
      }
    }, true);

    // Периодическая очистка
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Каждые 5 минут

    console.log('[ErrorLogger] Global error handlers initialized');
  }

  /**
   * Отслеживание производительности
   */
  static logPerformance(metricName: string, duration: number, context?: any): void {
    if (duration > 5000) { // Если операция занимает больше 5 секунд
      this.logError(new Error(`Performance warning: ${metricName} took ${duration}ms`), {
        component: 'PerformanceMonitor',
        action: metricName,
        statusCode: 200,
      });
    }
  }

  /**
   * Логирование сетевых ошибок
   */
  static logNetworkError(url: string, method: string, status: number, error?: Error): void {
    this.logError(error || new Error(`Network error: ${method} ${url} - ${status}`), {
      component: 'NetworkClient',
      action: `${method} ${url}`,
      url,
      statusCode: status,
    });
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  ErrorLoggerService.initialize();
}

export default ErrorLoggerService;

