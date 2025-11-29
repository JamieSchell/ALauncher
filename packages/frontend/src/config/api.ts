/**
 * Centralized API Configuration
 * All API URLs and connection settings should be configured here
 */

// Get API base URL from environment variable
// Format: http://domain.com:port or https://domain.com:port
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, '');
  }
  
  // Development fallback
  if (import.meta.env.DEV) {
    return 'http://localhost:7240';
  }
  
  // Production fallback - use default production server if not configured
  // This prevents the app from crashing if env var is missing
  console.warn(
    '⚠️ VITE_API_URL is not configured. Using default production server.\n' +
    'Please set VITE_API_URL in .env.prod file.\n' +
    'Example: VITE_API_URL=http://your-server.com:7240'
  );
  return 'http://5.188.119.206:7240';
};

// Get WebSocket URL from environment variable
// If not set, derive from API URL (ws:// for http://, wss:// for https://)
const getWebSocketUrl = (): string => {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  
  if (envWsUrl) {
    return envWsUrl.replace(/\/$/, '');
  }
  
  // Derive from API URL
  const apiUrl = getApiBaseUrl();
  const url = new URL(apiUrl);
  
  // Use wss:// for https://, ws:// for http://
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${url.host}/ws`;
};

// Get dev server URL (for Electron development)
const getDevServerUrl = (): string => {
  const envDevUrl = import.meta.env.VITE_DEV_SERVER_URL;
  
  if (envDevUrl) {
    return envDevUrl.replace(/\/$/, '');
  }
  
  // Default to localhost for development
  return 'http://localhost:5173';
};

// Export configuration object
export const API_CONFIG = {
  // Base API URL (without /api suffix)
  baseUrl: getApiBaseUrl(),
  
  // Full API URL with /api path
  get apiBaseUrl(): string {
    return `${this.baseUrl}/api`;
  },
  
  // WebSocket URL
  wsUrl: getWebSocketUrl(),
  
  // Dev server URL (for Electron)
  devServerUrl: getDevServerUrl(),
  
  // Helper to get base URL without /api suffix (for static files)
  get baseUrlWithoutApi(): string {
    return this.baseUrl.replace(/\/api$/, '');
  },
  
  // Check if running in development
  isDevelopment: import.meta.env.DEV,
  
  // Check if running in production
  isProduction: import.meta.env.PROD,
};

// Log configuration (always log for troubleshooting)
console.log('[API Config]', {
  baseUrl: API_CONFIG.baseUrl,
  apiBaseUrl: API_CONFIG.apiBaseUrl,
  wsUrl: API_CONFIG.wsUrl,
  devServerUrl: API_CONFIG.devServerUrl,
  isDevelopment: API_CONFIG.isDevelopment,
  isProduction: API_CONFIG.isProduction,
  env: {
    VITE_API_URL: import.meta.env.VITE_API_URL || 'NOT SET',
    VITE_WS_URL: import.meta.env.VITE_WS_URL || 'NOT SET',
    VITE_DEV_SERVER_URL: import.meta.env.VITE_DEV_SERVER_URL || 'NOT SET',
  },
});

