/**
 * API Client
 * In Electron production builds, uses IPC to proxy requests through main process
 * This bypasses file:// protocol restrictions
 */

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { API_CONFIG } from '../config/api';
import ErrorLoggerService from '../services/errorLogger';

// Check if we're in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

// IPC-based API client for Electron
const createIpcClient = () => {
  return {
    async request(config: any) {
      const { accessToken } = useAuthStore.getState();
      const fullURL = `${config.baseURL || API_CONFIG.apiBaseUrl}${config.url}`;
      
      console.log('[API Request via IPC]', {
        method: config.method?.toUpperCase() || 'GET',
        url: config.url,
        baseURL: config.baseURL || API_CONFIG.apiBaseUrl,
        fullURL,
        timestamp: new Date().toISOString(),
      });

      try {
        const response = await window.electronAPI.httpRequest({
          method: config.method?.toUpperCase() || 'GET',
          url: fullURL,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Modern-Launcher/1.0',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...config.headers,
          },
          data: config.data,
          timeout: config.timeout || 30000,
        });

        console.log('[API Response via IPC]', {
          url: fullURL,
          status: response.status,
          statusText: response.statusText,
        });

        // Convert to axios-like response
        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config,
        };
      } catch (error: any) {
        console.error('[API Error via IPC]', {
          url: fullURL,
          message: error.message,
          code: error.code,
        });

        // Convert to axios-like error
        const axiosError: any = new Error(error.message || 'Network Error');
        axiosError.code = error.code || 'ERR_NETWORK';
        axiosError.config = config;
        axiosError.response = error.response || { status: 0 };
        axiosError.url = fullURL;

        // Log API error to backend (async, don't wait)
        const statusCode = error.response?.status;
        if (statusCode !== 401 && statusCode !== 404) {
          ErrorLoggerService.logApiError(axiosError, {
            component: 'API_Client_IPC',
            action: config.method?.toUpperCase() || 'REQUEST',
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

// Create axios instance for non-Electron or development
const axiosInstance = axios.create({
  baseURL: API_CONFIG.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (only for axios)
axiosInstance.interceptors.request.use(
  (config) => {
    // Log request for debugging (always log in production for troubleshooting)
    const fullURL = `${config.baseURL}${config.url}`;
    console.log('[API Request]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? 'Bearer ***' : 'none',
      },
      timestamp: new Date().toISOString(),
    });
    
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (only for axios)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error for debugging (always log in production for troubleshooting)
    console.error('[API Error]', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
    });
    
    // Enhance error message for network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('[API Error] Network error details:', {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        message: 'Unable to connect to server. Check if server is running and accessible.',
      });
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
      // Clear auth and redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Use IPC client in Electron production, axios otherwise
export const apiClient = isElectron && API_CONFIG.isProduction
  ? createIpcClient()
  : axiosInstance;
