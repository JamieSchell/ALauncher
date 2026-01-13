/**
 * Vite plugin to replace CSP meta tag with environment-based CSP
 */

import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

// Read .env file manually
function readEnvFile(): Record<string, string> {
  const env: Record<string, string> = {};
  const mode = process.env.NODE_ENV || 'development';
  
  // Try to read mode-specific .env file first (.env.production, .env.development)
  const envFiles = [
    path.join(process.cwd(), `.env.${mode}`),
    path.join(process.cwd(), '.env.production'),
    path.join(process.cwd(), '.env'),
  ];
  
  for (const envPath of envFiles) {
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
      break; // Use first found file
    }
  }
  
  return env;
}

export function cspReplace(): Plugin {
  return {
    name: 'csp-replace',
    transformIndexHtml(html) {
      // Read .env file to get API URL
      const envFile = readEnvFile();
      const isProduction = process.env.NODE_ENV === 'production';
      const defaultUrl = isProduction ? 'https://api.alauncher.su' : 'http://localhost:7240';
      const apiUrl = process.env.VITE_API_URL || envFile.VITE_API_URL || defaultUrl;
      
      let apiHost: string;
      let apiProtocol: string;
      try {
        const url = new URL(apiUrl);
        apiHost = url.host;
        apiProtocol = url.protocol === 'https:' ? 'https' : 'http';
      } catch {
        apiHost = 'localhost:7240';
        apiProtocol = 'http';
      }
      
      const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
      
      // Extract hostname and port separately for better CSP support
      const [hostname, port] = apiHost.split(':');
      const hostPattern = port ? `${hostname}:${port}` : hostname;
      
      // Get WebSocket URL from environment
      const wsUrl = process.env.VITE_WS_URL || envFile.VITE_WS_URL || (() => {
        // Derive from API URL
        try {
          const url = new URL(apiUrl);
          const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
          return `${protocol}//${url.host}/ws`;
        } catch {
          return 'ws://localhost:7240/ws';
        }
      })();
      
      // Extract WebSocket hostname and port
      let wsHostname: string;
      let wsPort: string | undefined;
      let wsHostPattern: string;
      try {
        const wsUrlObj = new URL(wsUrl);
        const wsHost = wsUrlObj.host;
        [wsHostname, wsPort] = wsHost.split(':');
        wsHostPattern = wsPort ? `${wsHostname}:${wsPort}` : wsHostname;
      } catch {
        // Fallback to API host
        wsHostname = hostname;
        wsPort = port;
        wsHostPattern = hostPattern;
      }
      
      // For Tauri desktop apps, we need to allow all external connections
      // Desktop apps should be able to connect to any external API
      const connectSrc = isDev
        ? `'self' http://localhost:* http://${hostPattern} http://${hostname}:* ws://localhost:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* ws://${wsHostname}:* wss://localhost:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:* wss://${wsHostname}:*`
        : `'self' http: https: ws: wss: http://${hostPattern} https://${hostPattern} ws://${hostPattern} wss://${hostPattern}`;

      // Script source: unsafe-eval is needed for React and many libraries in production
      // Desktop apps can be less restrictive since there's no XSS risk from external websites
      const scriptSrc = isDev
        ? `'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://${hostPattern} http://${hostname}:*`
        : `'self' 'unsafe-eval'`; // Production: need unsafe-eval for React/libraries

      // Default source: More restrictive for production
      const defaultSrc = isDev
        ? `'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* http://${hostPattern} http://${hostname}:* ws://localhost:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* ws://${wsHostname}:* wss://localhost:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:* wss://${wsHostname}:*`
        : `'self' data: blob: http: https: ws: wss:`; // Production: restrictive but allows external resources

      // Style source: unsafe-inline is acceptable for inline styles (common in React apps)
      // This is a reasonable trade-off between security and functionality
      const csp = `default-src ${defaultSrc}; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: http: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src ${connectSrc} https://fonts.googleapis.com https://fonts.gstatic.com; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self';`;
      
      // Always log for debugging in production
      console.log('[CSP Plugin] API URL:', apiUrl);
      console.log('[CSP Plugin] WebSocket URL:', wsUrl);
      console.log('[CSP Plugin] API Host:', apiHost);
      console.log('[CSP Plugin] WebSocket Host:', wsHostPattern);
      console.log('[CSP Plugin] Generated CSP:', csp);
      
      // Replace CSP meta tag
      return html.replace(
        /<meta http-equiv="Content-Security-Policy" content="[^"]*" \/>/,
        `<meta http-equiv="Content-Security-Policy" content="${csp}" />`
      );
    },
  };
}

