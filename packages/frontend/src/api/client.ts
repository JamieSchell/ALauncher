/**
 * API Client
 * In Tauri production builds, uses Tauri HTTP commands to bypass CORS restrictions
 * In development, uses regular axios
 */

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { API_CONFIG } from '../config/api';
import { isTauri } from './tauri';
import ErrorLoggerService from '../services/errorLogger';
import { logger } from '../utils/logger';

/**
 * CSRF Token Manager
 * Handles fetching, storing, and including CSRF tokens in API requests
 */
class CsrfTokenManager {
  private token: string | null = null;
  private fetchPromise: Promise<string> | null = null;

  /**
   * Get the current CSRF token
   * If no token exists, fetch one from the server
   */
  async getToken(): Promise<string | null> {
    // Return existing token if available
    if (this.token) {
      return this.token;
    }

    // If already fetching, wait for that request
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Fetch new token
    this.fetchPromise = this.fetchToken();

    try {
      const token = await this.fetchPromise;
      return token;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Fetch a new CSRF token from the server
   */
  private async fetchToken(): Promise<string | null> {
    try {
      const response = await fetch(`${API_CONFIG.apiBaseUrl}/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        logger.warn('[CSRF] Failed to fetch token, status:', response.status);
        return null;
      }

      // Get token from response header
      const token = response.headers.get('x-csrf-token');
      if (token) {
        this.token = token;
        logger.debug('[CSRF] Token fetched successfully');
        return token;
      }

      // Try to get from response body
      const data = await response.json();
      if (data?.data?.token) {
        this.token = data.data.token;
        logger.debug('[CSRF] Token fetched successfully from body');
        return this.token;
      }

      return null;
    } catch (error) {
      logger.error('[CSRF] Error fetching token:', error);
      return null;
    }
  }

  /**
   * Update the stored token from a response header
   */
  updateTokenFromResponse(headers: Headers | Record<string, string>): void {
    const token = headers instanceof Headers
      ? headers.get('x-csrf-token')
      : headers['x-csrf-token'];

    if (token) {
      this.token = token;
      logger.debug('[CSRF] Token updated from response header');
    }
  }

  /**
   * Clear the stored token (e.g., on logout)
   */
  clearToken(): void {
    this.token = null;
    logger.debug('[CSRF] Token cleared');
  }
}

// Singleton instance
const csrfManager = new CsrfTokenManager();

// Check if we're in Tauri
const isTauriApp = isTauri;

/**
 * Default request timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Fetch with timeout and abort controller support
 * Prevents requests from hanging indefinitely and supports external cancellation
 *
 * @param url - URL to fetch
 * @param options - Fetch options (can include signal for AbortController)
 * @param timeout - Timeout in milliseconds (default: 30000)
 * @returns Fetch response
 * @throws Error if timeout occurs or request is aborted
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If the request already has a signal (external AbortController), chain them
  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      controller.abort();
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      // Use the combined signal (either timeout controller or passed signal)
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error(options.signal?.aborted
        ? 'Request cancelled'
        : `Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Methods that require CSRF protection
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Tauri-based API client for production
const createTauriClient = () => {
  return {
    async request<T = any>(config: any): Promise<{ data: T; status: number; statusText: string; headers: any; config: any }> {
      const { accessToken } = useAuthStore.getState();
      const fullURL = `${config.baseURL || API_CONFIG.apiBaseUrl}${config.url}`;
      const method = config.method?.toUpperCase() || 'GET';

      logger.api('[API Request via Tauri]', config.url || '', {
        method,
        baseURL: config.baseURL || API_CONFIG.apiBaseUrl,
        fullURL,
      });

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ALauncher/1.0',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...config.headers,
      };

      // Add CSRF token for protected methods
      if (CSRF_PROTECTED_METHODS.includes(method)) {
        const csrfToken = await csrfManager.getToken();
        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken;
          logger.debug('[CSRF] Token added to request');
        }
      }

      try {
        // For Tauri, we can use fetch API which doesn't have CORS restrictions
        // Now with timeout and abort controller support
        const response = await fetchWithTimeout(
          fullURL,
          {
            method,
            headers,
            body: config.data ? JSON.stringify(config.data) : undefined,
            // Pass through AbortController signal if provided
            signal: config.signal as AbortSignal | undefined,
          },
          config.timeout || DEFAULT_TIMEOUT
        );

        // Update CSRF token from response
        csrfManager.updateTokenFromResponse(response.headers);

        const responseData = await response.json();

        logger.apiResponse('[API Response via Tauri]', fullURL, response.status);

        // Convert to axios-like response
        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          config,
        };
      } catch (error: any) {
        logger.error('[API Error via Tauri]', fullURL, error.message);

        // Convert to axios-like error
        const axiosError: any = new Error(error.message || 'Network Error');
        axiosError.code = error.message?.includes('timeout') ? 'ECONNABORTED' : (error.code || 'ERR_NETWORK');
        axiosError.config = config;
        axiosError.response = error.response || { status: 0 };
        axiosError.url = fullURL;

        // Log API error to backend (async, don't wait)
        const statusCode = error.response?.status;
        if (statusCode !== 401 && statusCode !== 404) {
          ErrorLoggerService.logApiError(axiosError, {
            component: 'API_Client_Tauri',
            action: method,
          }).catch(() => {
            // Silently fail to prevent infinite loops
          });
        }

        throw axiosError;
      }
    },
    get(url: string, config?: any) {
      return this.request({ ...config, method: 'GET', url });
    },
    post(url: string, data?: any, config?: any) {
      return this.request({ ...config, method: 'POST', url, data });
    },
    put(url: string, data?: any, config?: any) {
      return this.request({ ...config, method: 'PUT', url, data });
    },
    patch(url: string, data?: any, config?: any) {
      return this.request({ ...config, method: 'PATCH', url, data });
    },
    delete(url: string, config?: any) {
      return this.request({ ...config, method: 'DELETE', url });
    },
  };
};

// Create axios instance for development or when not in Tauri
const axiosInstance = axios.create({
  baseURL: API_CONFIG.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and CSRF token (only for axios)
axiosInstance.interceptors.request.use(
  async (config) => {
    const fullURL = `${config.baseURL}${config.url}`;
    const method = config.method?.toUpperCase() || 'GET';

    logger.api('[API Request]', config.url, {
      method,
      baseURL: config.baseURL,
      fullURL,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? 'Bearer ***' : 'none',
      },
    });

    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add CSRF token for protected methods
    if (CSRF_PROTECTED_METHODS.includes(method)) {
      const csrfToken = await csrfManager.getToken();
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
        logger.debug('[CSRF] Token added to axios request');
      }
    }

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    logger.error('[API Request Error]', error.message, error.code);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (only for axios)
axiosInstance.interceptors.response.use(
  (response) => {
    // Update CSRF token from response headers
    csrfManager.updateTokenFromResponse(response.headers);
    return response;
  },
  async (error) => {
    // Update CSRF token from error response headers too
    if (error.response?.headers) {
      csrfManager.updateTokenFromResponse(error.response.headers);
    }

    // Reduce noise for expected auth errors
    const isAuthError = error.response?.status === 401 && error.config?.url?.includes('/auth/login');

    if (!isAuthError) {
      logger.error('[API Error]', error.message, {
        status: error.response?.status,
        url: error.config?.url,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      });
    }

    // Enhance error message for network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      logger.error('[API Error] Network error - Unable to connect to server');
    }

    // Log API error to backend (async, don't wait)
    // Skip logging for 401 (authentication) and 404 (not found) errors to avoid spam
    const statusCode = error.response?.status;
    if (statusCode !== 401 && statusCode !== 404) {
      ErrorLoggerService.logApiError(error, {
        component: 'API_Client',
        action: error.config?.method?.toUpperCase() || 'REQUEST',
      }).catch(() => {
        // Silently fail to prevent infinite loops
      });
    }

    if (statusCode === 401) {
      // Only clear auth for protected routes, not for login attempts
      const url = error.config?.url;
      if (url && !url.includes('/auth/login')) {
        useAuthStore.getState().clearAuth();
        // Also clear CSRF token on logout
        csrfManager.clearToken();
      }
    }
    return Promise.reject(error);
  }
);

// Use Tauri client in Tauri production, axios otherwise
export const apiClient = isTauriApp && !import.meta.env.DEV
  ? createTauriClient()
  : axiosInstance;

// Export CSRF manager for use in auth store
export { csrfManager };