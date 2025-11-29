/**
 * Electron-specific configuration
 * Used in Electron main process
 */

import fs from 'fs';
import path from 'path';

// Read .env file manually for Electron main process
// In production, process.env may not have VITE_ variables
const readEnvFile = (): Record<string, string> => {
  const env: Record<string, string> = {};
  
  // Try multiple possible .env file locations
  // In production, .env should be in the app directory (not in app.asar)
  const possibleEnvPaths = [
    // Production paths (outside app.asar)
    path.join((process as any).resourcesPath || '', 'app', '.env'),
    path.join((process as any).resourcesPath || '', '.env'),
    // Development paths
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    // Portable executable path (Windows)
    path.join(path.dirname(process.execPath), '.env'),
  ];
  
  // Also try to get app path if available (using dynamic require)
  try {
    // Use dynamic require to avoid circular dependencies
    const electron = require('electron');
    const app = electron.app || electron.default?.app;
    if (app && typeof app.getAppPath === 'function') {
      try {
        const appPath = app.getAppPath();
        if (appPath) {
          possibleEnvPaths.push(path.join(appPath, '.env'));
          possibleEnvPaths.push(path.join(path.dirname(appPath), '.env'));
          possibleEnvPaths.push(path.join(path.dirname(appPath), '..', '.env'));
        }
      } catch {
        // getAppPath may fail if app is not ready
      }
    }
  } catch {
    // electron module not available, continue
  }
  
  for (const envPath of possibleEnvPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
              env[key.trim()] = value;
            }
          }
        });
        console.log(`[Electron Config] Loaded .env from: ${envPath}`);
        break;
      }
    } catch (error) {
      // Continue to next path
    }
  }
  
  return env;
};

// Get API base URL from environment variable or .env file
const getApiBaseUrl = (): string => {
  // First try process.env (works in development)
  let envUrl = process.env.VITE_API_URL;
  
  // If not found, try reading .env file (for production)
  if (!envUrl) {
    const envFile = readEnvFile();
    envUrl = envFile.VITE_API_URL;
  }
  
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:7240';
  }
  
  // Production fallback - use default production server
  console.warn(
    '⚠️  VITE_API_URL is not configured in Electron main process.\n' +
    'Using default production server: http://5.188.119.206:7240\n' +
    'Please set VITE_API_URL in .env file or pass as environment variable.\n' +
    'Example: VITE_API_URL=http://your-server.com:7240'
  );
  
  // Return default production server instead of localhost
  return 'http://5.188.119.206:7240';
};

// Get WebSocket URL
const getWebSocketUrl = (): string => {
  // First try process.env (works in development)
  let envWsUrl = process.env.VITE_WS_URL;
  
  // If not found, try reading .env file (for production)
  if (!envWsUrl) {
    const envFile = readEnvFile();
    envWsUrl = envFile.VITE_WS_URL;
  }
  
  if (envWsUrl) {
    return envWsUrl.replace(/\/$/, '');
  }
  
  // Derive from API URL
  const apiUrl = getApiBaseUrl();
  try {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  } catch {
    // Fallback if URL parsing fails
    return 'ws://5.188.119.206/ws';
  }
};

// Get dev server URL
const getDevServerUrl = (): string => {
  const envDevUrl = process.env.VITE_DEV_SERVER_URL;
  
  if (envDevUrl) {
    return envDevUrl.replace(/\/$/, '');
  }
  
  return 'http://localhost:5173';
};

// Export configuration
export const ELECTRON_CONFIG = {
  apiUrl: getApiBaseUrl(),
  wsUrl: getWebSocketUrl(),
  devServerUrl: getDevServerUrl(),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Always log config for troubleshooting (especially in production)
console.log('[Electron Config]', {
  apiUrl: ELECTRON_CONFIG.apiUrl,
  wsUrl: ELECTRON_CONFIG.wsUrl,
  devServerUrl: ELECTRON_CONFIG.devServerUrl,
  isDevelopment: ELECTRON_CONFIG.isDevelopment,
  isProduction: ELECTRON_CONFIG.isProduction,
  env: {
    VITE_API_URL: process.env.VITE_API_URL || 'NOT SET',
    VITE_WS_URL: process.env.VITE_WS_URL || 'NOT SET',
  },
});

