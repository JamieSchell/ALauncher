/**
 * Tauri-specific configuration
 * Used in Tauri application
 */

import { readTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

// Read .env file manually for Tauri
const readEnvFile = async (): Promise<Record<string, string>> => {
  const env: Record<string, string> = {};

  try {
    // Try to read .env from app data directory
    const appDataPath = await appDataDir();
    const envPath = `${appDataPath}.env`;

    try {
      const content = await readTextFile(envPath);
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
      console.log(`[Tauri Config] Loaded .env from: ${envPath}`);
    } catch {
      // Try to read from development location
      try {
        const content = await readTextFile('.env');
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
        console.log(`[Tauri Config] Loaded .env from development directory`);
      } catch {
        console.log(`[Tauri Config] No .env file found, using defaults`);
      }
    }
  } catch (error) {
    console.error(`[Tauri Config] Error reading .env:`, error);
  }

  return env;
};

// Get API base URL from environment variable or .env file
const getApiBaseUrl = async (): Promise<string> => {
  // First try import.meta.env (works in development with Vite)
  let envUrl = import.meta.env.VITE_API_URL;

  // If not found, try reading .env file
  if (!envUrl) {
    const envFile = await readEnvFile();
    envUrl = envFile.VITE_API_URL;
  }

  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // Development fallback
  if (import.meta.env.DEV) {
    return 'http://localhost:7240';
  }

  // Production fallback - use official API domain
  console.warn(
    '⚠️  VITE_API_URL is not configured in Tauri.\n' +
    'Using default production server: https://api.alauncher.su\n' +
    'Please set VITE_API_URL in .env file.\n' +
    'Example: VITE_API_URL=https://api.alauncher.su'
  );

  return 'https://api.alauncher.su';
};

// Get WebSocket URL
const getWebSocketUrl = async (): Promise<string> => {
  // First try import.meta.env
  let envWsUrl = import.meta.env.VITE_WS_URL;

  // If not found, try reading .env file
  if (!envWsUrl) {
    const envFile = await readEnvFile();
    envWsUrl = envFile.VITE_WS_URL;
  }

  if (envWsUrl) {
    return envWsUrl.replace(/\/$/, '');
  }

  // Derive from API URL
  const apiUrl = await getApiBaseUrl();
  try {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  } catch {
    // Fallback if URL parsing fails - use official domain
    return 'wss://api.alauncher.su/ws';
  }
};

// Get dev server URL
const getDevServerUrl = (): string => {
  const envDevUrl = import.meta.env.VITE_DEV_SERVER_URL;

  if (envDevUrl) {
    return envDevUrl.replace(/\/$/, '');
  }

  return 'http://localhost:5173';
};

// Initialize configuration asynchronously
let initializedConfig: any = null;

const initConfig = async () => {
  if (!initializedConfig) {
    initializedConfig = {
      apiUrl: await getApiBaseUrl(),
      wsUrl: await getWebSocketUrl(),
      devServerUrl: getDevServerUrl(),
      isDevelopment: import.meta.env.DEV,
      isProduction: !import.meta.env.DEV,
    };

    console.log('[Tauri Config]', {
      apiUrl: initializedConfig.apiUrl,
      wsUrl: initializedConfig.wsUrl,
      devServerUrl: initializedConfig.devServerUrl,
      isDevelopment: initializedConfig.isDevelopment,
      isProduction: initializedConfig.isProduction,
      env: {
        VITE_API_URL: import.meta.env.VITE_API_URL || 'NOT SET',
        VITE_WS_URL: import.meta.env.VITE_WS_URL || 'NOT SET',
      },
    });
  }
  return initializedConfig;
};

// Export configuration promise
export const TAURI_CONFIG = initConfig();

// Export a synchronous getter for when you need the config immediately
export const getTauriConfig = () => {
  if (!initializedConfig) {
    throw new Error('Tauri config not initialized. Call initConfig() first.');
  }
  return initializedConfig;
};

// Export helper functions
export { readEnvFile, getApiBaseUrl, getWebSocketUrl };