/**
 * Vite plugin to replace CSP meta tag with environment-based CSP
 */

import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

// Read .env file manually
function readEnvFile(): Record<string, string> {
  const env: Record<string, string> = {};
  const envPath = path.join(process.cwd(), '.env');
  
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
  }
  
  return env;
}

export function cspReplace(): Plugin {
  return {
    name: 'csp-replace',
    transformIndexHtml(html) {
      // Read .env file to get API URL
      const envFile = readEnvFile();
      const apiUrl = process.env.VITE_API_URL || envFile.VITE_API_URL || 'http://localhost:7240';
      
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
      
      // Generate CSP directives with wildcard support for production
      // In production, allow connections to the API host and WebSocket host with any port variation
      // Also allow WebSocket without explicit port (defaults to 80 for ws://, 443 for wss://)
      const connectSrc = isDev
        ? `'self' http://localhost:* http://${hostPattern} http://${hostname}:* ws://localhost:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* ws://${wsHostname}:* wss://localhost:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:* wss://${wsHostname}:*`
        : `'self' http://${hostPattern} http://${hostname}:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* ws://${wsHostname}:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:* wss://${wsHostname}:*`;
      
      const scriptSrc = isDev
        ? `'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://${hostPattern} http://${hostname}:*`
        : `'self' 'unsafe-inline' 'unsafe-eval' http://${hostPattern} http://${hostname}:*`;
      
      const defaultSrc = isDev
        ? `'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* http://${hostPattern} http://${hostname}:* ws://localhost:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* ws://${wsHostname}:* wss://localhost:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:* wss://${wsHostname}:*`
        : `'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://${hostPattern} http://${hostname}:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* ws://${wsHostname}:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:* wss://${wsHostname}:*`;
      
      const csp = `default-src ${defaultSrc}; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http: https:; font-src 'self' data:; connect-src ${connectSrc};`;
      
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

