/**
 * Content Security Policy utilities
 * Generates CSP headers based on environment configuration
 */

import { API_CONFIG } from '../config/api';

/**
 * Get API host for CSP (without protocol)
 */
const getApiHost = (): string => {
  try {
    const url = new URL(API_CONFIG.baseUrl);
    return url.host;
  } catch {
    // Fallback to localhost if URL parsing fails
    return 'localhost:7240';
  }
};

/**
 * Generate CSP directive for connect-src
 */
export const getCSPConnectSrc = (): string => {
  const apiHost = getApiHost();
  const isDev = API_CONFIG.isDevelopment;
  
  if (isDev) {
    return `'self' http://localhost:* http://${apiHost} ws://localhost:* ws://${apiHost} wss://localhost:* wss://${apiHost} https://fonts.googleapis.com https://fonts.gstatic.com`;
  }
  
  return `'self' http://${apiHost} ws://${apiHost} wss://${apiHost} https://fonts.googleapis.com https://fonts.gstatic.com`;
};

/**
 * Generate CSP directive for script-src
 */
export const getCSPScriptSrc = (): string => {
  const apiHost = getApiHost();
  const isDev = API_CONFIG.isDevelopment;
  
  if (isDev) {
    return `'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://${apiHost}`;
  }
  
  return `'self' 'unsafe-inline' 'unsafe-eval' http://${apiHost}`;
};

/**
 * Generate CSP directive for default-src
 */
export const getCSPDefaultSrc = (): string => {
  const apiHost = getApiHost();
  const isDev = API_CONFIG.isDevelopment;
  
  if (isDev) {
    return `'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* http://${apiHost} ws://localhost:* ws://${apiHost} wss://localhost:* wss://${apiHost}`;
  }
  
  return `'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://${apiHost} ws://${apiHost} wss://${apiHost}`;
};

/**
 * Generate full CSP header value
 */
export const getCSPHeader = (): string => {
  return [
    `default-src ${getCSPDefaultSrc()};`,
    `script-src ${getCSPScriptSrc()};`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;`,
    `img-src 'self' data: blob: http: https:;`,
    `font-src 'self' data: https://fonts.gstatic.com;`,
    `connect-src ${getCSPConnectSrc()} https://fonts.googleapis.com https://fonts.gstatic.com;`,
  ].join(' ');
};

