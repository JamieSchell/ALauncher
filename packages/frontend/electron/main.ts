/**
 * Electron Main Process
 */

import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, Notification } from 'electron';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import crypto from 'crypto';
import { spawn, execSync, exec } from 'child_process';
import https from 'https';
import http from 'http';
import os from 'os';
import AdmZip from 'adm-zip';
import { ELECTRON_CONFIG } from '../src/config/electron';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const activeDownloads = new Map<string, { request: http.ClientRequest | https.ClientRequest; writer: fs.WriteStream; destPath: string }>();

const isDevelopment = process.env.NODE_ENV === 'development';

// Suppress Electron security warnings in development
// These warnings are expected in dev mode due to Vite's HMR requiring 'unsafe-eval'
// They won't appear in production builds
if (isDevelopment) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

/**
 * Log error to backend (if possible)
 */
async function logErrorToBackend(error: Error, context?: { component?: string; action?: string }) {
  try {
    // Try to send error to backend if we have network access
    // This is a best-effort attempt, don't block on it
    const errorData = JSON.stringify({
      errorType: 'ELECTRON_ERROR',
      errorMessage: error.message || String(error),
      stackTrace: error.stack || null,
      component: context?.component || 'ElectronMain',
      action: context?.action || 'unhandledError',
      os: process.platform,
      osVersion: os.release(),
      launcherVersion: app.getVersion(),
    });
    
    // Extract hostname from API URL
    const apiUrl = ELECTRON_CONFIG.apiUrl;
    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      port: parseInt(url.port) || 7240,
      path: '/api/crashes/launcher-errors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(errorData),
      },
      timeout: 2000, // 2 second timeout
    };
    
    const req = http.request(options, () => {
      // Success, but we don't need to wait
    });
    
    req.on('error', () => {
      // Silently fail - backend might not be available
    });
    
    req.write(errorData);
    req.end();
  } catch (logError) {
    // Silently fail to prevent infinite loops
    console.error('[ErrorLogger] Failed to log error to backend:', logError);
  }
}

// Global error handlers for Electron main process
process.on('uncaughtException', (error: Error) => {
  console.error('[Electron] Uncaught Exception:', error);
  logErrorToBackend(error, { component: 'ElectronMain', action: 'uncaughtException' });
  // Don't exit - let Electron handle it
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('[Electron] Unhandled Rejection:', reason);
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logErrorToBackend(error, { component: 'ElectronMain', action: 'unhandledRejection' });
});

/**
 * Stop all active downloads
 */
function stopAllDownloads() {
  console.log(`Stopping ${activeDownloads.size} active downloads...`);
  activeDownloads.forEach((download, id) => {
    try {
      download.request.destroy();
      download.writer.destroy();
      // Try to delete incomplete file
      if (fs.existsSync(download.destPath)) {
        fs.unlinkSync(download.destPath);
      }
    } catch (error) {
      console.error(`Error stopping download ${id}:`, error);
    }
  });
  activeDownloads.clear();
}

/**
 * Create system tray
 */
function createTray() {
  // Don't create tray if it already exists
  if (tray) {
    return;
  }
  
  try {
    // Try to find icon file
    const appDir = getAppDir();
    const possibleIconPaths = [
      path.join(appDir, 'assets', 'icon.png'),
      path.join(appDir, 'icon.png'),
      path.join(process.cwd(), 'assets', 'icon.png'),
      path.join(process.cwd(), 'icon.png'),
    ];

    let iconPath: string | null = null;
    for (const possiblePath of possibleIconPaths) {
      if (fs.existsSync(possiblePath)) {
        iconPath = possiblePath;
        break;
      }
    }

    if (iconPath) {
      tray = new Tray(iconPath);
    } else {
      // Create a simple icon programmatically
      // 16x16 icon with "M" letter
      const size = 16;
      const buffer = Buffer.alloc(size * size * 4);
      
      // Fill with dark background
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 20;     // R
        buffer[i + 1] = 20; // G
        buffer[i + 2] = 20; // B
        buffer[i + 3] = 255; // A
      }
      
      // Draw "M" in white (simple pattern)
      const drawPixel = (x: number, y: number) => {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const idx = (y * size + x) * 4;
          buffer[idx] = 255;     // R
          buffer[idx + 1] = 255; // G
          buffer[idx + 2] = 255; // B
        }
      };
      
      // Draw "M" shape
      for (let y = 4; y < 12; y++) {
        drawPixel(3, y);
        drawPixel(12, y);
        if (y < 8) {
          drawPixel(3 + (y - 4), y);
          drawPixel(12 - (y - 4), y);
        }
      }
      
      const img = nativeImage.createFromBuffer(buffer, { width: size, height: size });
      tray = new Tray(img);
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Launcher',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        },
      },
      {
        label: 'Quit',
        click: () => {
          console.log('[Tray] Quit requested - closing all windows and exiting...');
          stopAllDownloads();
          // Close all windows first
          if (mainWindow) {
            mainWindow.removeAllListeners('close'); // Prevent hiding to tray
            mainWindow.destroy();
            mainWindow = null;
          }
          // Destroy tray
          if (tray) {
            tray.destroy();
            tray = null;
          }
          // Force quit the app
          setTimeout(() => {
            app.exit(0);
          }, 100);
        },
      },
    ]);

    tray.setToolTip('Modern Launcher');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      } else {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

// Get directory paths - works in both dev and production
function getAppDir() {
  if (isDevelopment) {
    // In development, use process.cwd() which points to packages/frontend
    return process.cwd();
  } else {
    // In production, use app.getAppPath() which correctly handles both asar and unpacked
    // For portable (unpacked): returns path to resources/app
    // For installed (asar): returns path to app.asar
    const appPath = app.getAppPath();
    
    // Log for debugging
    console.log('App path:', appPath);
    console.log('__dirname:', __dirname);
    console.log('process.resourcesPath:', process.resourcesPath);
    
    return appPath;
  }
}

function createWindow() {
  const appDir = getAppDir();
  
  // Determine preload path
  let preloadPath: string;
  if (isDevelopment) {
    preloadPath = path.join(appDir, 'dist-electron', 'preload.js');
  } else {
    // In production, try multiple possible paths for preload
    const possiblePreloadPaths = [
      path.join(__dirname, 'preload.js'), // Primary: dist-electron/preload.js
      path.join(appDir, 'dist-electron', 'preload.js'), // Alternative 1
      path.join(appDir, 'preload.js'), // Alternative 2
      path.join(process.resourcesPath, 'app', 'dist-electron', 'preload.js'), // Alternative 3
      path.join(process.resourcesPath, 'app.asar.unpacked', 'preload.js'), // Alternative 4
    ];
    
    preloadPath = possiblePreloadPaths.find(p => fs.existsSync(p)) || possiblePreloadPaths[0];
    console.log('Using preload path:', preloadPath);
    console.log('Preload exists:', fs.existsSync(preloadPath));
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0a', // Dark background to avoid white flash
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for preload scripts
      // Disable webSecurity in production to allow file:// protocol to make HTTP requests
      // This is safe because we control the content and use contextIsolation
      webSecurity: isDevelopment, // Only enable in development
    },
    show: false, // Don't show until ready
  });

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDevelopment) {
    const devServerUrl = ELECTRON_CONFIG.devServerUrl;
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, use app.getAppPath() which correctly handles both asar and unpacked
    // app.getAppPath() returns path to app.asar in portable version
    const indexPath = path.join(appDir, 'dist', 'index.html');
    
    console.log('Production mode - Loading index.html');
    console.log('App dir:', appDir);
    console.log('Index path:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    
    // Use loadFile which automatically handles app.asar paths
    // loadFile correctly resolves paths inside asar archives
    mainWindow.loadFile(indexPath).catch((error) => {
      console.error('Failed to load index.html:', error);
      console.error('Error details:', {
        code: (error as any).code,
        message: error.message,
        stack: error.stack,
      });
      
      // Try alternative paths as fallback
      const altPaths = [
        path.join(__dirname, '..', 'dist', 'index.html'),
        path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      ];
      
      let fallbackLoaded = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log('Trying alternative path:', altPath);
          mainWindow.loadFile(altPath).catch((altError) => {
            console.error('Alternative path also failed:', altError);
          });
          fallbackLoaded = true;
          break;
        }
      }
      
      // Last resort: try loading as URL
      if (!fallbackLoaded) {
        const fileUrl = path.resolve(indexPath).replace(/\\/g, '/');
        const url = `file:///${fileUrl}`;
        console.log('Trying URL load:', url);
        mainWindow.loadURL(url).catch((urlError) => {
          console.error('URL load also failed:', urlError);
          // Open DevTools for debugging if enabled
          if (process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
            mainWindow?.webContents.openDevTools();
          }
        });
      }
    });
  }

  // Handle page load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Page failed to load:', { errorCode, errorDescription, validatedURL });
    console.error('Error code:', errorCode);
    console.error('Error description:', errorDescription);
    console.error('Validated URL:', validatedURL);
    // Only open DevTools in development or if explicitly enabled
    if (isDevelopment || process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
      mainWindow?.webContents.openDevTools();
    }
    mainWindow?.webContents.send('app:error', `Failed to load page: ${errorDescription}`);
  });

  // Log when page is loaded
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
    const url = mainWindow?.webContents.getURL();
    console.log('Current URL:', url);
    // Open DevTools in production for debugging
    if (!isDevelopment) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Log when DOM is ready
  mainWindow.webContents.on('dom-ready', () => {
    console.log('✅ DOM is ready');
  });

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    // Log all console messages for debugging
    const levelNames = ['log', 'warn', 'info', 'error'];
    const levelName = levelNames[level] || 'unknown';
    console.log(`[Renderer ${levelName}]:`, message);
    if (level === 3) { // Error level
      console.error('Renderer error:', { message, line, sourceId });
    }
  });

  // Log ALL network requests for debugging (not just /api/)
  mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    if (details.url.includes('/api/') || details.url.includes('5.188.119.206')) {
      console.log('[Network Request]', {
        method: details.method,
        url: details.url,
        resourceType: details.resourceType,
        timestamp: new Date().toISOString(),
      });
    }
    callback({});
  });

  // Log network response errors
  mainWindow.webContents.session.webRequest.onErrorOccurred((details) => {
    if (details.url.includes('/api/') || details.url.includes('5.188.119.206')) {
      console.error('[Network Error]', {
        url: details.url,
        error: details.error,
        resourceType: details.resourceType,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Log successful responses
  mainWindow.webContents.session.webRequest.onCompleted((details) => {
    if (details.url.includes('/api/') || details.url.includes('5.188.119.206')) {
      console.log('[Network Response]', {
        method: details.method,
        url: details.url,
        statusCode: details.statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window close - stop all downloads only if really closing
  mainWindow.on('close', (event) => {
    // On Windows/Linux, if tray exists, hide instead of closing
    if (tray && process.platform !== 'darwin') {
      event.preventDefault();
      mainWindow?.hide();
      // Downloads continue in background
    } else {
      // Really closing - stop all downloads
      stopAllDownloads();
      if (mainWindow) {
        mainWindow.destroy();
        mainWindow = null;
      }
    }
  });

  // Handle minimize - don't stop downloads
  mainWindow.on('minimize', () => {
    // Downloads continue in background
  });
}

// Override userData path to use "Modern-Launcher" instead of "Modern Launcher" (no spaces)
// This must be called BEFORE app.whenReady() to ensure all paths use the custom name
const defaultUserDataPath = app.getPath('userData');
// Replace "Modern Launcher" with "Modern-Launcher" in the path
const customUserDataPath = defaultUserDataPath.replace(/Modern Launcher/g, 'Modern-Launcher');
if (customUserDataPath !== defaultUserDataPath) {
  app.setPath('userData', customUserDataPath);
  console.log(`[App] Set custom userData path: ${customUserDataPath} (original: ${defaultUserDataPath})`);
}

// Set Content Security Policy globally for all sessions
// This must be done before app.whenReady()
app.on('session-created', (session) => {
  session.webRequest.onHeadersReceived((details, callback) => {
    // In production, don't override CSP from HTML meta tag
    // The HTML meta tag CSP is already set by vite plugin based on .env
    // Only add CSP headers if they're not already present
    if (!isDevelopment) {
      // Don't set CSP in production - let HTML meta tag handle it
      callback({
        responseHeaders: {
          ...details.responseHeaders,
        },
      });
      return;
    }
    
    // In development, set permissive CSP
    if (isDevelopment) {
      // Get API and WebSocket URLs from config
      const apiHost = (() => {
      try {
        const url = new URL(ELECTRON_CONFIG.apiUrl);
        const host = url.host;
        console.log('[CSP] Using API host:', host, 'from URL:', ELECTRON_CONFIG.apiUrl);
        return host;
      } catch (error) {
        console.error('[CSP] Failed to parse API URL:', ELECTRON_CONFIG.apiUrl, error);
        return '5.188.119.206:7240'; // Fallback to production server
      }
    })();
    
    // Get WebSocket URL host
    const wsHost = (() => {
      try {
        const wsUrl = ELECTRON_CONFIG.wsUrl;
        const url = new URL(wsUrl);
        const host = url.host;
        console.log('[CSP] Using WebSocket host:', host, 'from URL:', wsUrl);
        return host;
      } catch (error) {
        console.error('[CSP] Failed to parse WebSocket URL:', ELECTRON_CONFIG.wsUrl, error);
        // Derive from API host
        const [hostname, port] = apiHost.split(':');
        return port ? `${hostname}:${port}` : hostname;
      }
    })();
    
    // Extract hostname and port for better CSP support
    const [hostname, port] = apiHost.split(':');
    const hostPattern = port ? `${hostname}:${port}` : hostname;
    
    // Extract WebSocket hostname and port
    const [wsHostname, wsPort] = wsHost.split(':');
    const wsHostPattern = wsPort ? `${wsHostname}:${wsPort}` : wsHostname;
    
    // Very permissive CSP - allow connections to API and WebSocket servers
    const connectSrc = `'self' http://localhost:* http://${hostPattern} http://${hostname}:* ws://localhost:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* wss://localhost:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:*`;
    const scriptSrc = `'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://${hostPattern} http://${hostname}:*`;
    const defaultSrc = `'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* http://${hostPattern} http://${hostname}:* ws://localhost:* ws://${hostPattern} ws://${hostname}:* ws://${wsHostPattern} ws://${wsHostname}:* wss://localhost:* wss://${hostPattern} wss://${hostname}:* wss://${wsHostPattern} wss://${wsHostname}:*`;
    
    // Log CSP for debugging (only first request to avoid spam)
    if (!(session as any)._cspLogged) {
      console.log('[CSP] Content Security Policy configured for development:', {
        apiHost,
        hostname,
        port,
        connectSrc,
      });
      (session as any)._cspLogged = true;
    }
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          'default-src ' + defaultSrc + '; ' +
          'script-src ' + scriptSrc + '; ' +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob: http: https:; " +
          "font-src 'self' data:; " +
          'connect-src ' + connectSrc + ';'
        ],
      },
    });
    }
  });
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  console.log('Another instance is already running. Exiting...');
  app.quit();
  process.exit(0);
} else {
  // This is the first instance
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  });

  app.on('window-all-closed', () => {
    // Don't quit if tray exists - keep running in background
    if (tray) {
      return;
    }
    if (process.platform !== 'darwin') {
      stopAllDownloads();
      app.quit();
    }
  });
}

// Handle app quit - stop all downloads
app.on('before-quit', () => {
  stopAllDownloads();
});

// IPC Handlers

/**
 * Minimize window
 */
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

/**
 * Maximize/unmaximize window
 */
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

/**
 * Close window
 */
ipcMain.on('window:close', () => {
  stopAllDownloads();
  mainWindow?.close();
});

/**
 * Minimize to tray
 */
ipcMain.on('window:minimizeToTray', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

/**
 * Resolve all JAR files in a directory recursively
 */
function findJarFiles(dir: string): string[] {
  const jars: string[] = [];
  
  try {
    if (!fs.existsSync(dir)) {
      return jars;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        jars.push(...findJarFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.jar')) {
        jars.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return jars;
}

/**
 * Определить платформу из имени JAR файла
 */
function getPlatformFromJarName(jarName: string): 'linux' | 'windows' | 'macos' | null {
  const name = jarName.toLowerCase();
  if (name.includes('natives-linux')) {
    return 'linux';
  } else if (name.includes('natives-windows') || name.includes('natives-win')) {
    return 'windows';
  } else if (name.includes('natives-macos') || name.includes('natives-osx') || name.includes('natives-mac')) {
    return 'macos';
  }
  return null;
}

/**
 * Extract native libraries from a JAR file (JAR is a ZIP archive)
 */
async function extractNativesFromJar(jarPath: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const jarName = path.basename(jarPath);
      const platform = getPlatformFromJarName(jarName);
      
      // Если платформа определена, извлекаем в подпапку платформы
      const targetDir = platform 
        ? path.join(outputDir, platform)
        : outputDir;
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const zip = new AdmZip(jarPath);
      const entries = zip.getEntries();
      
      // Find all native library files (.dll, .so, .dylib)
      const nativeFiles: Array<{ entry: any; name: string }> = [];
      for (const entry of entries) {
        if (!entry.isDirectory) {
          const name = entry.entryName;
          const ext = path.extname(name).toLowerCase();
          if (ext === '.dll' || ext === '.so' || ext === '.dylib') {
            nativeFiles.push({ entry, name: path.basename(name) });
          }
        }
      }
      
      if (nativeFiles.length === 0) {
        resolve();
        return;
      }
      
      // Extract native files
      for (const { entry, name } of nativeFiles) {
        const outputPath = path.join(targetDir, name);
        try {
          const data = entry.getData();
          fs.writeFileSync(outputPath, data);
        } catch (error: any) {
          console.warn(`Failed to extract ${name} from ${jarPath}:`, error.message);
        }
      }
      
      resolve();
    } catch (error: any) {
      // If adm-zip is not available, try using unzip command
      const jarName = path.basename(jarPath);
      const platform = getPlatformFromJarName(jarName);
      const targetDir = platform 
        ? path.join(outputDir, platform)
        : outputDir;
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const isWindows = process.platform === 'win32';
      const unzipCmd = isWindows ? 'jar xf' : 'unzip -o';
      
      exec(`${unzipCmd} "${jarPath}" -d "${targetDir}"`, (err: any) => {
        if (err) {
          console.warn(`Failed to extract natives from ${jarPath}:`, err.message);
          resolve(); // Don't fail launch if extraction fails
        } else {
          resolve();
        }
      });
    }
  });
}

/**
 * Extract native libraries from all natives JAR files
 */
async function extractAllNatives(librariesDir: string, clientDir: string): Promise<string> {
  const nativesDir = path.join(librariesDir, '..', 'natives');
  
  // Check if natives are already extracted
  if (fs.existsSync(nativesDir)) {
    const files = fs.readdirSync(nativesDir);
    if (files.length > 0) {
      console.log(`Native libraries already extracted to: ${nativesDir}`);
      return nativesDir;
    }
  }
  
  // Find all natives JAR files
  const nativesJars: string[] = [];
  function findNativesJars(dir: string) {
    if (!fs.existsSync(dir)) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.jar')) {
          // Check if it's a natives JAR (contains "natives" in name)
          if (entry.name.toLowerCase().includes('natives')) {
            nativesJars.push(fullPath);
          }
        } else if (entry.isDirectory()) {
          findNativesJars(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  findNativesJars(librariesDir);
  
  if (nativesJars.length === 0) {
    console.warn(`No natives JAR files found in ${librariesDir}`);
    return nativesDir;
  }
  
  console.log(`Found ${nativesJars.length} natives JAR files, extracting...`);
  
  // Create natives directory
  if (!fs.existsSync(nativesDir)) {
    fs.mkdirSync(nativesDir, { recursive: true });
  }
  
  // Extract from all natives JARs
  for (const jarPath of nativesJars) {
    try {
      await extractNativesFromJar(jarPath, nativesDir);
      console.log(`Extracted natives from: ${path.basename(jarPath)}`);
    } catch (error: any) {
      console.warn(`Failed to extract natives from ${jarPath}:`, error.message);
    }
  }
  
  return nativesDir;
}

/**
 * Find native library directories (natives folders) in libraries
 */
function findNativeLibDirs(librariesDir: string): string[] {
  const nativeDirs: string[] = [];
  const visited = new Set<string>();
  
  // Определить текущую платформу
  const currentPlatform = process.platform === 'win32' ? 'windows' 
    : process.platform === 'darwin' ? 'macos'
    : 'linux';
  
  // First, check for extracted natives directory (только для текущей платформы)
  const extractedNativesDir = path.join(librariesDir, '..', 'natives');
  if (fs.existsSync(extractedNativesDir)) {
    // Проверить наличие подпапки для текущей платформы
    const platformNativesDir = path.join(extractedNativesDir, currentPlatform);
    if (fs.existsSync(platformNativesDir)) {
      const files = fs.readdirSync(platformNativesDir);
      if (files.length > 0) {
        nativeDirs.push(platformNativesDir);
        console.log(`Using platform-specific natives: ${platformNativesDir}`);
      }
    } else {
      // Fallback: использовать корневую папку natives (для обратной совместимости)
      const files = fs.readdirSync(extractedNativesDir);
      if (files.length > 0) {
        // Проверить, есть ли нативные файлы для текущей платформы
        const hasPlatformFiles = files.some((file: string) => {
          const ext = path.extname(file).toLowerCase();
          const isPlatformFile = (currentPlatform === 'windows' && ext === '.dll') ||
                                (currentPlatform === 'linux' && ext === '.so') ||
                                (currentPlatform === 'macos' && ext === '.dylib');
          return isPlatformFile;
        });
        if (hasPlatformFiles) {
          nativeDirs.push(extractedNativesDir);
          console.log(`Using legacy natives directory: ${extractedNativesDir}`);
        }
      }
    }
  }
  
  function searchDir(dir: string) {
    if (visited.has(dir) || !fs.existsSync(dir)) {
      return;
    }
    visited.add(dir);
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check for natives subdirectories (extracted from ZIP)
          if (entry.name === 'natives') {
            nativeDirs.push(fullPath);
            continue;
          }
          
          // Recursively search
          searchDir(fullPath);
        } else if (entry.isFile()) {
          // Check if this directory contains native files
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === '.dll' || ext === '.so' || ext === '.dylib') {
            // This directory contains native files
            if (!nativeDirs.includes(dir)) {
              nativeDirs.push(dir);
            }
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  searchDir(librariesDir);
  
  // Remove duplicates and return
  return Array.from(new Set(nativeDirs));
}

/**
 * Find updates directory (where Minecraft files are stored)
 * Uses AppData/Roaming for production, project root for development
 */
function findUpdatesDir(): string {
  // In development, use project root
  if (isDevelopment) {
    // Strategy 1: Check process.cwd()/updates (works in dev mode)
    const cwdUpdates = path.resolve(process.cwd(), 'updates');
    if (fs.existsSync(cwdUpdates)) {
      console.log('Found updates in process.cwd():', cwdUpdates);
      return cwdUpdates;
    }
    
    // Strategy 2: Check packages/backend/updates/ (where files might be from old script)
    const backendUpdates = path.resolve(process.cwd(), 'packages', 'backend', 'updates');
    if (fs.existsSync(backendUpdates)) {
      console.log('Found updates in packages/backend/updates:', backendUpdates);
      return backendUpdates;
    }
    
    // Strategy 3: Go up from app directory to find project root
    const appDir = getAppDir();
    let currentDir = appDir;
    const maxDepth = 10;
    let depth = 0;
    
    while (depth < maxDepth && currentDir !== path.dirname(currentDir)) {
      // Check if we're at project root (has packages/ directory)
      const packagesDir = path.join(currentDir, 'packages');
      const updatesPath = path.join(currentDir, 'updates');
      
      if (fs.existsSync(packagesDir) && fs.existsSync(updatesPath)) {
        console.log('Found updates in project root:', updatesPath);
        return path.resolve(updatesPath);
      }
      
      currentDir = path.dirname(currentDir);
      depth++;
    }
  }
  
  // In production, use AppData/Roaming/Modern-Launcher/updates
  // This ensures files persist and are not in Temp directory
  try {
    const appDataPath = app.getPath('appData'); // Returns Roaming on Windows
    const launcherDataDir = path.join(appDataPath, 'Modern-Launcher');
    const updatesDir = path.join(launcherDataDir, 'updates');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(launcherDataDir)) {
      fs.mkdirSync(launcherDataDir, { recursive: true });
      console.log('Created launcher data directory:', launcherDataDir);
    }
    
    if (!fs.existsSync(updatesDir)) {
      fs.mkdirSync(updatesDir, { recursive: true });
      console.log('Created updates directory:', updatesDir);
    }
    
    console.log('Using updates directory in AppData/Roaming:', updatesDir);
    return updatesDir;
  } catch (error) {
    console.warn('Could not create updates directory in AppData:', error);
  }
  
  // Fallback: Try relative to app path (production)
  try {
    const appPath = app.getAppPath();
    // Go up from app path to find project root
    let appDir = path.dirname(appPath);
    for (let i = 0; i < 5; i++) {
      const appUpdates = path.join(appDir, 'updates');
      if (fs.existsSync(appUpdates)) {
        console.log('Found updates relative to app path:', appUpdates);
        return path.resolve(appUpdates);
      }
      appDir = path.dirname(appDir);
    }
  } catch (error) {
    console.warn('Could not get app path:', error);
  }
  
  // Last resort: Return default path (will be checked later, might not exist)
  const defaultPath = path.resolve(process.cwd(), 'updates');
  console.log('Using default updates path:', defaultPath);
  return defaultPath;
}

/**
 * Detect connection issue type from error message
 */
function detectConnectionIssueType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('connection refused') || lowerMessage.includes('connection.*refused')) {
    return 'CONNECTION_REFUSED';
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'CONNECTION_TIMEOUT';
  }
  if (lowerMessage.includes('authentication') || lowerMessage.includes('auth')) {
    return 'AUTHENTICATION_FAILED';
  }
  if (lowerMessage.includes('server full') || lowerMessage.includes('server.*full')) {
    return 'SERVER_FULL';
  }
  if (lowerMessage.includes('version') && lowerMessage.includes('mismatch')) {
    return 'VERSION_MISMATCH';
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('network.*error')) {
    return 'NETWORK_ERROR';
  }
  
  return 'UNKNOWN';
}

/**
 * Find Java executable automatically
 * Searches in: JAVA_HOME, PATH, Windows registry, standard locations
 */
function findJavaInstallations(): string[] {
  const found: string[] = [];
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';

  // 1. Check JAVA_HOME environment variable
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const javaExe = isWindows 
      ? path.join(javaHome, 'bin', 'java.exe')
      : path.join(javaHome, 'bin', 'java');
    if (fs.existsSync(javaExe)) {
      found.push(javaExe);
    }
  }

  // 2. Check PATH (try 'java' command)
  try {
    execSync('java -version', { timeout: 2000, stdio: 'pipe' });
    found.push('java'); // System Java in PATH
  } catch {
    // Java not in PATH
  }

  // 3. Windows-specific: Check registry and standard locations
  if (isWindows) {
    // Standard Java installation paths
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    
    const standardPaths = [
      path.join(programFiles, 'Java'),
      path.join(programFilesX86, 'Java'),
      path.join(process.env['LOCALAPPDATA'] || '', 'Programs', 'Java'),
      'C:\\Program Files\\Eclipse Adoptium',
      'C:\\Program Files\\Eclipse Foundation',
      'C:\\Program Files\\Microsoft',
      'C:\\Program Files\\OpenJDK',
    ];

    for (const basePath of standardPaths) {
      if (!fs.existsSync(basePath)) continue;
      
      try {
        const entries = fs.readdirSync(basePath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const javaExe = path.join(basePath, entry.name, 'bin', 'java.exe');
            if (fs.existsSync(javaExe)) {
              found.push(javaExe);
            }
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    // Check Windows Registry for Java installations
    try {
      // Try to read registry using reg command
      const regOutput = execSync('reg query "HKLM\\SOFTWARE\\JavaSoft\\Java Runtime Environment" /s /v JavaHome 2>nul', { 
        encoding: 'utf-8',
        timeout: 3000,
        stdio: 'pipe'
      } as any);
      
      const javaHomeMatches = regOutput.match(/JavaHome\s+REG_SZ\s+(.+)/g);
      if (javaHomeMatches) {
        for (const match of javaHomeMatches) {
          const javaHomePath = match.replace(/JavaHome\s+REG_SZ\s+/, '').trim();
          const javaExe = path.join(javaHomePath, 'bin', 'java.exe');
          if (fs.existsSync(javaExe) && !found.includes(javaExe)) {
            found.push(javaExe);
          }
        }
      }
    } catch {
      // Registry read failed, continue
    }
  }

  // 4. macOS-specific: Check common locations
  if (isMac) {
    const macPaths = [
      '/Library/Java/JavaVirtualMachines',
      '/System/Library/Java/JavaVirtualMachines',
      '/usr/libexec/java_home',
    ];

    for (const basePath of macPaths) {
      if (fs.existsSync(basePath)) {
        try {
          const entries = fs.readdirSync(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const javaExe = path.join(basePath, entry.name, 'Contents', 'Home', 'bin', 'java');
              if (fs.existsSync(javaExe)) {
                found.push(javaExe);
              }
            }
          }
        } catch {
          // Ignore read errors
        }
      }
    }

    // Try /usr/libexec/java_home command
    try {
      const javaHomeOutput = execSync('/usr/libexec/java_home -V', { 
        timeout: 2000, 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      const javaHomePaths = javaHomeOutput.match(/\/Library\/Java\/JavaVirtualMachines\/[^\s]+/g);
      if (javaHomePaths) {
        for (const javaHomePath of javaHomePaths) {
          const javaExe = path.join(javaHomePath, 'Contents', 'Home', 'bin', 'java');
          if (fs.existsSync(javaExe) && !found.includes(javaExe)) {
            found.push(javaExe);
          }
        }
      }
    } catch {
      // java_home command failed
    }
  }

  // 5. Linux-specific: Check common locations
  if (isLinux) {
    const linuxPaths = [
      '/usr/lib/jvm',
      '/usr/java',
      '/opt/java',
      '/usr/local/java',
    ];

    for (const basePath of linuxPaths) {
      if (fs.existsSync(basePath)) {
        try {
          const entries = fs.readdirSync(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const javaExe = path.join(basePath, entry.name, 'bin', 'java');
              if (fs.existsSync(javaExe) && !found.includes(javaExe)) {
                found.push(javaExe);
              }
            }
          }
        } catch {
          // Ignore read errors
        }
      }
    }
  }

  // Remove duplicates
  return Array.from(new Set(found));
}

/**
 * Get Java version from executable
 * Returns version string like "17.0.1" or null if failed
 */
function getJavaVersion(javaPath: string): { version: string; major: number; full: string } | null {
  try {
    const output = execSync(`"${javaPath}" -version 2>&1`, { 
      timeout: 5000, 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Parse version from output
    // Example outputs:
    // "openjdk version "17.0.1" 2021-10-19"
    // "java version "1.8.0_291""
    // "java version "11.0.12" 2021-07-20 LTS"
    
    const versionMatch = output.match(/version\s+"?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:_(\d+))?"?/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1], 10);
      const minor = versionMatch[2] ? parseInt(versionMatch[2], 10) : 0;
      const patch = versionMatch[3] ? parseInt(versionMatch[3], 10) : 0;
      const build = versionMatch[4] ? parseInt(versionMatch[4], 10) : 0;
      
      // Handle Java 8 and earlier (version "1.8.0" means Java 8)
      const actualMajor = major === 1 && minor > 0 ? minor : major;
      
      return {
        version: `${actualMajor}.${patch || 0}`,
        major: actualMajor,
        full: output.split('\n')[0] || output
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to get Java version from ${javaPath}:`, error);
    return null;
  }
}

/**
 * Check if Java version meets requirements
 * @param javaPath Path to Java executable
 * @param requiredVersion Minimum required Java version (e.g., "8", "17")
 */
function checkJavaVersion(javaPath: string, requiredVersion: string): { 
  valid: boolean; 
  currentVersion?: string; 
  requiredVersion: string;
  error?: string;
} {
  const versionInfo = getJavaVersion(javaPath);
  
  if (!versionInfo) {
    return {
      valid: false,
      requiredVersion,
      error: `Failed to determine Java version from ${javaPath}`
    };
  }

  const requiredMajor = parseInt(requiredVersion, 10);
  const isValid = versionInfo.major >= requiredMajor;

  return {
    valid: isValid,
    currentVersion: versionInfo.version,
    requiredVersion,
    error: isValid ? undefined : `Java ${versionInfo.major} is installed, but Java ${requiredMajor} or higher is required`
  };
}

/**
 * Launch Minecraft
 */
ipcMain.handle('launcher:launch', async (event, args) => {
  const { javaPath, jvmArgs, mainClass, classPath, gameArgs, workingDir, version, clientDirectory, jvmVersion, profileId, serverAddress, serverPort, userId, username } = args;

  try {
    // Find updates directory (where files are downloaded)
    const updatesDir = findUpdatesDir();
    console.log('Updates directory:', updatesDir);
    
    // Use clientDirectory if provided, otherwise fallback to version
    const clientDir = clientDirectory || version;
    console.log(`Using client directory: ${clientDir} (version: ${version})`);
    
    // Resolve working directory to absolute path
    const resolvedWorkingDir = path.isAbsolute(workingDir) 
      ? workingDir 
      : path.resolve(process.cwd(), workingDir);

    // Resolve classPath entries to absolute paths
    const resolvedClassPath: string[] = [];
    
    // Проверка на наличие modlauncher в classpath (требует Java 16+)
    const hasModLauncher = classPath.some(cp => 
      cp.includes('modlauncher') || cp.includes('ModLauncher') || cp.includes('bootstraplauncher')
    );
    
    if (hasModLauncher && jvmVersion === '8') {
      console.warn('[Launch] ⚠️  WARNING: ModLauncher detected in classpath, but Java 8 is required. ModLauncher requires Java 16+. This may cause UnsupportedClassVersionError.');
      console.warn('[Launch] Consider using Java 16+ or check if the client uses the correct Forge version for Minecraft 1.12.2.');
    }
    
    // Check if classPath contains 'libraries' entry
    const hasLibrariesEntry = classPath.includes('libraries');
    
    // Find libraries directory first (will be used later)
    let librariesDir = path.join(updatesDir, clientDir, 'libraries');
    if (!fs.existsSync(librariesDir)) {
      librariesDir = path.join(updatesDir, version, 'libraries');
    }
    
    for (const cp of classPath) {
      if (cp === 'client.jar') {
        // First try updates directory (where files are downloaded) - use clientDirectory
        let clientJar = path.join(updatesDir, clientDir, 'client.jar');
        
        // If not found, try workingDir (for compatibility)
        if (!fs.existsSync(clientJar)) {
          clientJar = path.join(resolvedWorkingDir, clientDir, 'client.jar');
        }
        
        // Fallback to version-based path for backward compatibility
        if (!fs.existsSync(clientJar)) {
          clientJar = path.join(updatesDir, version, 'client.jar');
        }
        if (!fs.existsSync(clientJar)) {
          clientJar = path.join(resolvedWorkingDir, version, 'client.jar');
        }
        
        if (!fs.existsSync(clientJar)) {
          return { 
            success: false, 
            error: `Client JAR not found. Searched in:\n- ${path.join(updatesDir, clientDir, 'client.jar')}\n- ${path.join(updatesDir, version, 'client.jar')}\n- ${path.join(resolvedWorkingDir, clientDir, 'client.jar')}\n- ${path.join(resolvedWorkingDir, version, 'client.jar')}\n\nPlease download Minecraft files first.` 
          };
        }
        resolvedClassPath.push(clientJar);
      } else if (cp === 'libraries') {
        // First try updates directory - use clientDirectory
        let librariesDir = path.join(updatesDir, clientDir, 'libraries');
        
        // If not found, try workingDir
        if (!fs.existsSync(librariesDir)) {
          librariesDir = path.join(resolvedWorkingDir, clientDir, 'libraries');
        }
        
        // Fallback to version-based path
        if (!fs.existsSync(librariesDir)) {
          librariesDir = path.join(updatesDir, version, 'libraries');
        }
        if (!fs.existsSync(librariesDir)) {
          librariesDir = path.join(resolvedWorkingDir, version, 'libraries');
        }
        
        const jarFiles = findJarFiles(librariesDir);
        if (jarFiles.length === 0) {
          console.warn(`[Launch] ⚠️  No JAR files found in ${librariesDir}`);
        } else {
          console.log(`[Launch] Found ${jarFiles.length} JAR files in libraries directory`);
          // Check for critical libraries
          const fastutilJar = jarFiles.find(j => j.includes('fastutil'));
          const launchwrapperJar = jarFiles.find(j => j.includes('launchwrapper'));
          const forgeJar = jarFiles.find(j => j.includes('forge'));
          if (!fastutilJar) {
            console.warn(`[Launch] ⚠️  WARNING: fastutil JAR not found in libraries!`);
          } else {
            console.log(`[Launch] ✓ Found fastutil: ${path.basename(fastutilJar)}`);
          }
          if (!launchwrapperJar) {
            console.warn(`[Launch] ⚠️  WARNING: launchwrapper JAR not found in libraries!`);
          } else {
            console.log(`[Launch] ✓ Found launchwrapper: ${path.basename(launchwrapperJar)}`);
          }
          if (!forgeJar) {
            console.warn(`[Launch] ⚠️  WARNING: forge JAR not found in libraries!`);
          } else {
            console.log(`[Launch] ✓ Found forge: ${path.basename(forgeJar)}`);
          }
        }
        resolvedClassPath.push(...jarFiles);
        
        // Find native library directories for java.library.path
        const nativeDirs = findNativeLibDirs(librariesDir);
        if (nativeDirs.length > 0) {
          console.log(`Found ${nativeDirs.length} native library directories`);
        }
      } else {
        // Try updates directory first - use clientDirectory
        let resolved = path.isAbsolute(cp) 
          ? cp 
          : path.join(updatesDir, clientDir, cp);
        
        if (!fs.existsSync(resolved)) {
          resolved = path.join(resolvedWorkingDir, clientDir, cp);
        }
        
        // Fallback to version-based path
        if (!fs.existsSync(resolved)) {
          resolved = path.join(updatesDir, version, cp);
        }
        if (!fs.existsSync(resolved)) {
          resolved = path.join(resolvedWorkingDir, version, cp);
        }
        
        if (fs.existsSync(resolved)) {
          resolvedClassPath.push(resolved);
        } else {
          console.warn(`[Launch] ⚠️  ClassPath entry not found: ${resolved}`);
          console.warn(`[Launch]   Searched in:`);
          console.warn(`[Launch]     - ${path.join(updatesDir, clientDir, cp)}`);
          console.warn(`[Launch]     - ${path.join(resolvedWorkingDir, clientDir, cp)}`);
          console.warn(`[Launch]     - ${path.join(updatesDir, version, cp)}`);
          console.warn(`[Launch]     - ${path.join(resolvedWorkingDir, version, cp)}`);
        }
      }
    }
    
    // If classPath didn't contain 'libraries' entry, but libraries directory exists,
    // add all JAR files from libraries directory to ensure all dependencies are included
    if (!hasLibrariesEntry && fs.existsSync(librariesDir)) {
      console.log('[Launch] ⚠️  classPath does not contain "libraries" entry, but libraries directory exists.');
      console.log('[Launch] Adding all JAR files from libraries directory to ensure all dependencies are included...');
      const allJarFiles = findJarFiles(librariesDir);
      if (allJarFiles.length > 0) {
        console.log(`[Launch] Found ${allJarFiles.length} additional JAR files in libraries directory`);
        // Add only files that are not already in classpath
        for (const jarFile of allJarFiles) {
          if (!resolvedClassPath.includes(jarFile)) {
            resolvedClassPath.push(jarFile);
          }
        }
      }
    }

    if (resolvedClassPath.length === 0) {
      return { 
        success: false, 
        error: 'No valid classpath entries found. Please ensure Minecraft files are downloaded.' 
      };
    }

    // Log classpath for debugging
    console.log(`[Launch] Resolved classpath (${resolvedClassPath.length} entries):`);
    const clientJar = resolvedClassPath.find(cp => cp.includes('client.jar'));
    const fastutilJar = resolvedClassPath.find(cp => cp.includes('fastutil'));
    const launchwrapperJar = resolvedClassPath.find(cp => cp.includes('launchwrapper'));
    const forgeJar = resolvedClassPath.find(cp => cp.includes('forge'));
    
    console.log(`[Launch]   - client.jar: ${clientJar || 'NOT FOUND'}`);
    console.log(`[Launch]   - fastutil: ${fastutilJar || 'NOT FOUND'}`);
    console.log(`[Launch]   - launchwrapper: ${launchwrapperJar || 'NOT FOUND'}`);
    console.log(`[Launch]   - forge: ${forgeJar || 'NOT FOUND'}`);
    console.log(`[Launch] Total JAR files in classpath: ${resolvedClassPath.length}`);
    
    // Check for fastutil (required for Minecraft 1.12.2)
    if (!fastutilJar) {
      console.error('[Launch] ❌ ERROR: fastutil library not found in classpath!');
      console.error('[Launch] This is required for Minecraft 1.12.2.');
      console.error('[Launch] Expected: libraries/it/unimi/dsi/fastutil/7.1.0/fastutil-7.1.0.jar');
      console.error('[Launch] Full classpath:');
      resolvedClassPath.forEach((cp, i) => {
        const exists = fs.existsSync(cp);
        console.error(`[Launch]   [${i + 1}] ${exists ? '✓' : '✗'} ${cp}`);
      });
      
      return {
        success: false,
        error: `FastUtil library not found in classpath. This is required for Minecraft 1.12.2.\n\nExpected: libraries/it/unimi/dsi/fastutil/7.1.0/fastutil-7.1.0.jar\n\nPlease ensure all Minecraft libraries are downloaded. Check the libraries directory:\n${path.join(updatesDir, clientDir, 'libraries')}`
      };
    }
    
    console.log('[Launch] ✓ FastUtil library found in classpath');

    // Check for launchwrapper in classpath (required for Forge 1.12.2)
    if (mainClass === 'net.minecraft.launchwrapper.Launch') {
      if (!launchwrapperJar) {
        console.error('[Launch] ❌ ERROR: launchwrapper library not found in classpath!');
        console.error('[Launch] This is required for Forge 1.12.2.');
        console.error('[Launch] Expected: libraries/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar');
        console.error('[Launch] Full classpath:');
        resolvedClassPath.forEach((cp, i) => {
          const exists = fs.existsSync(cp);
          console.error(`[Launch]   [${i + 1}] ${exists ? '✓' : '✗'} ${cp}`);
        });
        
        return {
          success: false,
          error: `LaunchWrapper library not found in classpath. This is required for Forge 1.12.2.\n\nExpected: libraries/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar\n\nPlease ensure all Minecraft libraries are downloaded. Check the libraries directory:\n${path.join(updatesDir, clientDir, 'libraries')}`
        };
      }
      
      console.log('[Launch] ✓ LaunchWrapper library found in classpath');
    }

    // Ensure working directory exists
    if (!fs.existsSync(resolvedWorkingDir)) {
      console.log(`Creating working directory: ${resolvedWorkingDir}`);
      fs.mkdirSync(resolvedWorkingDir, { recursive: true });
    }

    // Find all native library directories - use clientDirectory
    // librariesDir is already defined above, reuse it
    if (!fs.existsSync(librariesDir)) {
      librariesDir = path.join(updatesDir, version, 'libraries');
    }
    
    // Extract native libraries from JAR files if needed
    let nativeLibDirs: string[] = [];
    if (fs.existsSync(librariesDir)) {
      try {
        const extractedNativesDir = await extractAllNatives(librariesDir, clientDir);
        nativeLibDirs = findNativeLibDirs(librariesDir);
      } catch (error: any) {
        console.warn(`Failed to extract native libraries:`, error.message);
        nativeLibDirs = findNativeLibDirs(librariesDir);
      }
    }

    console.log(`Searching for native libraries in: ${librariesDir}`);
    console.log(`Found ${nativeLibDirs.length} native library directories:`);
    nativeLibDirs.forEach(dir => console.log(`  - ${dir}`));

    // Build Java command arguments
    const fullArgs = [
      ...jvmArgs,
    ];

    // Add java.library.path for native libraries (LWJGL)
    if (nativeLibDirs.length > 0) {
      const nativePath = nativeLibDirs.join(path.delimiter);
      fullArgs.push(`-Djava.library.path=${nativePath}`);
      console.log(`Added native library path: ${nativePath}`);
    } else {
      console.warn(`⚠️  No native libraries found! This may cause UnsatisfiedLinkError.`);
      console.warn(`   Please re-download Minecraft files: npm run download-minecraft ${version}`);
    }

    fullArgs.push(
      '-cp',
      resolvedClassPath.join(path.delimiter),
      mainClass,
      ...gameArgs,
    );

    // Log full command for debugging Forge issues
    if (mainClass === 'net.minecraft.launchwrapper.Launch') {
      console.log('[Launch] Forge LaunchWrapper - Full command:');
      console.log(`[Launch] Java: ${javaPath}`);
      console.log(`[Launch] Main Class: ${mainClass}`);
      console.log(`[Launch] ClassPath entries: ${resolvedClassPath.length}`);
      console.log(`[Launch] ClassPath (first 5): ${resolvedClassPath.slice(0, 5).join(', ')}`);
      
      // Check for launchwrapper in classpath
      const hasLaunchWrapper = resolvedClassPath.some(cp => 
        cp.includes('launchwrapper') || cp.includes('LaunchWrapper')
      );
      console.log(`[Launch] Has launchwrapper in classpath: ${hasLaunchWrapper}`);
      if (!hasLaunchWrapper) {
        console.error('[Launch] ❌ ERROR: launchwrapper library not found in classpath!');
        console.error('[Launch] This is required for Forge 1.12.2. Please ensure libraries are downloaded.');
        console.error('[Launch] Expected path: libraries/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar');
        console.error('[Launch] Full classpath:', resolvedClassPath.join('\n'));
      }
      
      // Check for Forge library
      const hasForge = resolvedClassPath.some(cp => 
        cp.includes('forge') || cp.includes('Forge')
      );
      console.log(`[Launch] Has Forge library in classpath: ${hasForge}`);
      
      console.log(`[Launch] Game Args: ${gameArgs.join(' ')}`);
      console.log(`[Launch] Has --tweakClass in gameArgs: ${gameArgs.includes('--tweakClass')}`);
    }

    // Финальная проверка версии Java перед запуском (только для логирования)
    const finalJavaCheck = getJavaVersion(javaPath);
    if (finalJavaCheck) {
      console.log(`[Launch] Final Java check - Path: ${javaPath}, Version: ${finalJavaCheck.major} (${finalJavaCheck.full})`);
    }
    
    console.log('Launching Minecraft with:', {
      javaPath,
      workingDir: resolvedWorkingDir,
      classPathCount: resolvedClassPath.length,
      mainClass,
      jvmArgsCount: jvmArgs.length,
      gameArgsCount: gameArgs.length,
      javaVersion: finalJavaCheck?.major || 'unknown',
    });
    console.log('Full command:', `${javaPath} ${fullArgs.join(' ')}`);

    // Check if Java executable exists (for custom paths)
    if (javaPath !== 'java' && !fs.existsSync(javaPath)) {
      return { 
        success: false, 
        error: `Java executable not found: ${javaPath}. Please check the Java path in settings.` 
      };
    }

    // Verify Java is available and check version
    let javaVersionCheck: { valid: boolean; currentVersion?: string; requiredVersion: string; error?: string } | null = null;
    
    try {
      // Get required Java version from jvmVersion parameter or default to Java 8
      const requiredJavaVersion = jvmVersion || '8';
      
      // Check Java version
      javaVersionCheck = checkJavaVersion(javaPath, requiredJavaVersion);
      
      // For Java 8, require exactly Java 8 (not 9+), especially for Minecraft 1.12.2 with Forge
      if (requiredJavaVersion === '8') {
        const versionInfo = getJavaVersion(javaPath);
        console.log(`[JavaCheck] Detected Java version: ${versionInfo?.major || 'unknown'} (${versionInfo?.full || 'unknown'})`);
        
        if (!versionInfo) {
          return {
            success: false,
            error: `Failed to detect Java version. Please ensure Java 8 is installed and the path is correct.`
          };
        }
        
        if (versionInfo.major !== 8) {
          return {
            success: false,
            error: `Java version mismatch. Minecraft 1.12.2 with Forge requires Java 8 exactly, but Java ${versionInfo.major} (${versionInfo.full}) is being used. Please install Java 8 or specify the correct path to Java 8 in settings.`
          };
        }
        
        console.log(`[JavaCheck] ✓ Java 8 confirmed: ${versionInfo.full}`);
      }
      
      if (!javaVersionCheck.valid) {
        return {
          success: false,
          error: javaVersionCheck.error || `Java version check failed. Required: Java ${requiredJavaVersion}+, found: ${javaVersionCheck.currentVersion || 'unknown'}`
        };
      }
      
      console.log(`[JavaCheck] ✓ Java version check passed: ${javaVersionCheck.currentVersion} (required: ${requiredJavaVersion}${requiredJavaVersion === '8' ? ' exactly' : '+'})`);
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to verify Java: ${error.message}. Please install Java or specify the full path to Java in settings.`
      };
    }

    let processError: Error | null = null;
    let processExited = false;
    let exitCode: number | null = null;

    const gameProcess = spawn(javaPath, fullArgs, {
      cwd: resolvedWorkingDir,
      stdio: 'pipe',
      shell: false,
    });

    // Store process error
    gameProcess.on('error', (error) => {
      processError = error;
      console.error('Process spawn error:', error);
      mainWindow?.webContents.send('game:error', `Process error: ${error.message}`);
    });

    // Collect stderr and stdout for crash logging
    let stderrBuffer = '';
    let stdoutBuffer = '';
    const stdoutLines: string[] = [];
    const maxStdoutLines = 100; // Keep last 100 lines for crash reporting
    
    // Track connection issues
    const connectionIssuePatterns = [
      /connection.*refused/i,
      /connection.*timeout/i,
      /connection.*timed.*out/i,
      /authentication.*failed/i,
      /server.*full/i,
      /version.*mismatch/i,
      /network.*error/i,
      /can't.*connect/i,
      /unable.*to.*connect/i,
      /failed.*to.*connect/i,
    ];

    gameProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      stderrBuffer += message;
      console.error('Game stderr:', message);
      mainWindow?.webContents.send('game:error', message);
      
      // Check for connection issues in stderr
      for (const pattern of connectionIssuePatterns) {
        if (pattern.test(message)) {
          mainWindow?.webContents.send('game:connection-issue', {
            message,
            type: detectConnectionIssueType(message),
          });
          break;
        }
      }
    });

    gameProcess.stdout?.on('data', (data) => {
      const message = data.toString();
      console.log('Game stdout:', message);
      mainWindow?.webContents.send('game:log', message);
      
      // Keep last N lines for crash reporting
      const lines = message.split('\n').filter(l => l.trim());
      stdoutLines.push(...lines);
      if (stdoutLines.length > maxStdoutLines) {
        stdoutLines.splice(0, stdoutLines.length - maxStdoutLines);
      }
      stdoutBuffer = stdoutLines.join('\n');
      
      // Check for connection issues in stdout
      for (const pattern of connectionIssuePatterns) {
        if (pattern.test(message)) {
          mainWindow?.webContents.send('game:connection-issue', {
            message,
            type: detectConnectionIssueType(message),
          });
          break;
        }
      }
    });

    gameProcess.on('exit', (code, signal) => {
      processExited = true;
      exitCode = code;
      console.log(`Game process exited with code ${code}, signal ${signal}`);
      // Always send exit event, even if code is null or 0
      mainWindow?.webContents.send('game:exit', code !== null && code !== undefined ? code : 0);
      
      if (code !== 0 && code !== null) {
        const errorMsg = stderrBuffer || `Game exited with code ${code}`;
        console.error('Game failed:', errorMsg);
        mainWindow?.webContents.send('game:error', errorMsg);
        
        // Send crash data for logging
        mainWindow?.webContents.send('game:crash', {
          exitCode: code,
          errorMessage: errorMsg.substring(0, 5000), // Limit length
          stderrOutput: stderrBuffer.substring(0, 10000), // Limit length
          stdoutOutput: stdoutBuffer.substring(0, 10000), // Limit length
          profileId,
          profileVersion: version,
          serverAddress,
          serverPort,
          javaVersion: javaVersionCheck?.currentVersion,
          javaPath,
          os: process.platform,
          osVersion: os.release(),
          userId,
          username,
        });
      }
    });

    // Also handle 'close' event as a fallback
    gameProcess.on('close', (code, signal) => {
      if (!processExited) {
        console.log(`Game process closed with code ${code}, signal ${signal}`);
        processExited = true;
        exitCode = code;
        mainWindow?.webContents.send('game:exit', code !== null && code !== undefined ? code : 0);
      }
    });

    // Wait a bit to see if process starts successfully
    await new Promise(resolve => setTimeout(resolve, 500));

    if (processError) {
      return {
        success: false,
        error: `Failed to start Java process: ${processError.message}`
      };
    }

    if (processExited && exitCode !== 0) {
      return {
        success: false,
        error: `Game process exited immediately with code ${exitCode}. Check the error messages above.`
      };
    }

    if (!gameProcess.pid) {
      return {
        success: false,
        error: 'Failed to start game process (no PID). Check Java installation and arguments.'
      };
    }

    console.log(`Game process started successfully with PID: ${gameProcess.pid}`);
    return { success: true, pid: gameProcess.pid };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

/**
 * File operations IPC handlers
 */
ipcMain.handle('file:ensureDir', async (event, dirPath: string) => {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('file:writeFile', async (event, filePath: string, data: Uint8Array) => {
  try {
    const dir = path.dirname(filePath);
    await fsPromises.mkdir(dir, { recursive: true });
    await fsPromises.writeFile(filePath, Buffer.from(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('file:deleteFile', async (event, filePath: string) => {
  try {
    await fsPromises.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('file:calculateHash', async (event, filePath: string, algorithm: 'sha256' | 'sha1') => {
  try {
    const content = await fsPromises.readFile(filePath);
    const hash = crypto.createHash(algorithm).update(content).digest('hex');
    return hash;
  } catch (error) {
    throw new Error(`Failed to calculate hash: ${(error as Error).message}`);
  }
});

ipcMain.handle('file:readFile', async (event, filePath: string) => {
  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${(error as Error).message}`);
  }
});

ipcMain.handle('file:exists', async (event, filePath: string) => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
});

/**
 * HTTP Request handler - proxy requests through main process
 * This bypasses file:// protocol restrictions in renderer process
 */
ipcMain.handle('http:request', async (event, options: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
}) => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(options.url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const requestOptions: any = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Modern-Launcher/1.0',
          'Accept': 'application/json',
          ...options.headers,
        },
        timeout: options.timeout || 30000,
      };

      // Add body for POST/PUT/PATCH requests
      let requestData: string | undefined;
      if (options.data && ['POST', 'PUT', 'PATCH'].includes(requestOptions.method)) {
        if (typeof options.data === 'string') {
          requestData = options.data;
        } else {
          requestData = JSON.stringify(options.data);
          requestOptions.headers['Content-Type'] = 'application/json';
        }
        requestOptions.headers['Content-Length'] = Buffer.byteLength(requestData);
      }

      console.log('[HTTP Request]', {
        method: requestOptions.method,
        url: options.url,
        hostname: requestOptions.hostname,
        port: requestOptions.port,
        path: requestOptions.path,
      });

      const req = client.request(requestOptions, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log('[HTTP Response]', {
            url: options.url,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
          });

          let parsedData: any = responseData;
          try {
            parsedData = JSON.parse(responseData);
          } catch {
            // Not JSON, keep as string
          }

          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            data: parsedData,
          });
        });
      });

      req.on('error', (error) => {
        console.error('[HTTP Error]', {
          url: options.url,
          error: error.message,
          code: (error as any).code,
        });
        reject({
          message: error.message,
          code: (error as any).code,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          message: 'Request timeout',
          code: 'ETIMEDOUT',
        });
      });

      if (requestData) {
        req.write(requestData);
      }
      
      req.end();
    } catch (error: any) {
      console.error('[HTTP Request Error]', {
        url: options.url,
        error: error.message,
      });
      reject({
        message: error.message,
        code: error.code,
      });
    }
  });
});

ipcMain.on('file:download', async (event, url: string, destPath: string, authToken?: string) => {
  // Уникальный идентификатор загрузки, чтобы отличать параллельные загрузки
  const downloadId = `${url}-${destPath}`;
  
  try {
    const dir = path.dirname(destPath);
    await fsPromises.mkdir(dir, { recursive: true });

    const client = url.startsWith('https:') ? https : http;
    
    // Prepare request options with auth header if token is provided
    const requestOptions: any = {};
    if (authToken) {
      requestOptions.headers = {
        'Authorization': `Bearer ${authToken}`,
      };
    }
    
    const request = client.get(url, requestOptions, (response) => {
      if (response.statusCode !== 200) {
        activeDownloads.delete(downloadId);
        event.reply('file:download:error', downloadId, `HTTP ${response.statusCode}`);
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      // Стандартный размер буфера для стабильности
      const writer = fs.createWriteStream(destPath, { highWaterMark: 64 * 1024 }); // 64KB буфер
      let downloadedBytes = 0;

      // Store download for potential cancellation
      activeDownloads.set(downloadId, { request, writer, destPath });

      // Оптимизация: обновлять прогресс реже для больших файлов (каждые 1MB или каждые 5%)
      let lastProgressUpdate = 0;
      const progressUpdateInterval = Math.max(totalBytes * 0.05, 1024 * 1024); // 5% или 1MB

      response.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        // Обновлять прогресс только если прошло достаточно времени/данных
        if (downloadedBytes - lastProgressUpdate >= progressUpdateInterval || downloadedBytes === totalBytes) {
          const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
          event.reply('file:download:progress', downloadId, progress);
          lastProgressUpdate = downloadedBytes;
        }
      });

      response.on('end', () => {
        // Не завершаем writer здесь, дождемся события 'finish'
        writer.end();
      });

      response.on('error', (error) => {
        activeDownloads.delete(downloadId);
        writer.destroy();
        fs.unlink(destPath, () => {});
        event.reply('file:download:error', downloadId, error.message);
      });

      response.pipe(writer);

      writer.on('error', (error) => {
        activeDownloads.delete(downloadId);
        response.destroy();
        fs.unlink(destPath, () => {});
        event.reply('file:download:error', downloadId, error.message);
      });

      writer.on('finish', () => {
        // Файл полностью записан на диск
        activeDownloads.delete(downloadId);
        event.reply('file:download:complete', downloadId);
      });
    });

    request.on('error', (error) => {
      activeDownloads.delete(downloadId);
      event.reply('file:download:error', downloadId, error.message);
    });
  } catch (error) {
    activeDownloads.delete(downloadId);
    event.reply('file:download:error', downloadId, (error as Error).message);
  }
});

/**
 * Get app version
 * First tries to read from config file (if updated), otherwise uses package.json version
 */
ipcMain.handle('app:version', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const versionConfigPath = path.join(userDataPath, 'launcher-version.json');
    
    // Попытаться прочитать версию из конфигурационного файла
    if (fs.existsSync(versionConfigPath)) {
      const configContent = await fsPromises.readFile(versionConfigPath, 'utf-8');
      const config = JSON.parse(configContent);
      if (config.version) {
        console.log(`[LauncherUpdate] Using version from config file: ${config.version}`);
        return config.version;
      }
    }
  } catch (error) {
    console.warn('[LauncherUpdate] Failed to read version from config file:', error);
  }
  
  // Fallback to package.json version
  return app.getVersion();
});

/**
 * Get app paths
 */
ipcMain.handle('app:paths', () => {
  return {
    userData: app.getPath('userData'),
    appData: app.getPath('appData'),
    temp: app.getPath('temp'),
  };
});

/**
 * Get updates directory path (where Minecraft files are stored)
 */
ipcMain.handle('app:updatesDir', () => {
  return findUpdatesDir();
});

/**
 * IPC handler to find Java installations
 */
ipcMain.handle('java:findInstallations', async () => {
  try {
    const installations = findJavaInstallations();
    const results = installations.map(javaPath => {
      const versionInfo = getJavaVersion(javaPath);
      return {
        path: javaPath,
        version: versionInfo?.version || 'unknown',
        major: versionInfo?.major || 0,
        full: versionInfo?.full || ''
      };
    });
    
    return { success: true, installations: results };
  } catch (error) {
    return { success: false, error: (error as Error).message, installations: [] };
  }
});

/**
 * IPC handler to check Java version
 */
ipcMain.handle('java:checkVersion', async (event, javaPath: string, requiredVersion: string) => {
  try {
    const result = checkJavaVersion(javaPath, requiredVersion);
    return { success: true, ...result };
  } catch (error) {
    return { 
      success: false, 
      valid: false,
      error: (error as Error).message,
      requiredVersion 
    };
  }
});

/**
 * IPC handler to get Java version
 */
ipcMain.handle('java:getVersion', async (event, javaPath: string) => {
  try {
    const versionInfo = getJavaVersion(javaPath);
    if (!versionInfo) {
      return { success: false, error: 'Failed to get Java version' };
    }
    return { success: true, ...versionInfo };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

/**
 * IPC handler to show file dialog for selecting Java executable
 */
ipcMain.handle('dialog:selectJavaFile', async () => {
  try {
    const isWindows = process.platform === 'win32';
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select Java Executable',
      filters: [
        { name: 'Java Executable', extensions: isWindows ? ['exe'] : [] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedPath = result.filePaths[0];
    
    // Verify it's a valid Java executable
    const versionInfo = getJavaVersion(selectedPath);
    if (!versionInfo) {
      return { 
        success: false, 
        error: 'Selected file is not a valid Java executable' 
      };
    }

    return { 
      success: true, 
      path: selectedPath,
      version: versionInfo.version,
      major: versionInfo.major,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

/**
 * IPC handler to show desktop notification
 */
ipcMain.handle('notification:show', async (event, title: string, body: string, options?: { icon?: string; sound?: boolean }) => {
  try {
    // Check if notifications are supported
    if (!Notification.isSupported()) {
      console.warn('Desktop notifications are not supported on this system');
      return { success: false, error: 'Notifications not supported' };
    }

    const notification = new Notification({
      title,
      body,
      icon: options?.icon,
      silent: !options?.sound,
    });

    notification.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    notification.show();
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return { success: true };
  } catch (error) {
    console.error('Error showing notification:', error);
    return { success: false, error: (error as Error).message };
  }
});

// ============= Launcher Update System =============

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  fileHash?: string;
  fileSize?: bigint;
  releaseNotes?: string;
  isRequired: boolean;
}

let updateDownloadProgress = 0;
let updateDownloadId: string | null = null;

/**
 * Check for launcher updates
 */
ipcMain.handle('launcher:checkUpdate', async (event, currentVersion: string, apiUrl: string, authToken?: string) => {
  try {
    const url = `${apiUrl}/api/launcher/check-update?currentVersion=${encodeURIComponent(currentVersion)}`;
    console.log(`[LauncherUpdate] Checking for updates: ${url}`);
    console.log(`[LauncherUpdate] Current version: ${currentVersion}`);
    
    return new Promise<{ success: boolean; hasUpdate?: boolean; updateInfo?: UpdateInfo; isRequired?: boolean; error?: string }>((resolve) => {
      const client = url.startsWith('https:') ? https : http;
      
      const headers: Record<string, string> = {
        'User-Agent': 'Modern-Launcher/1.0',
      };
      
      // Добавить токен авторизации, если он есть
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const req = client.get(url, {
        headers,
      }, (res) => {
        let data = '';
        
        console.log(`[LauncherUpdate] Response status: ${res.statusCode}`);
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            console.log(`[LauncherUpdate] Response data: ${data.substring(0, 200)}...`);
            const response = JSON.parse(data);
            
            if (response.success && response.data) {
              if (response.data.hasUpdate) {
                console.log(`[LauncherUpdate] Update found! Version: ${response.data.latestVersion?.version}`);
                resolve({
                  success: true,
                  hasUpdate: true,
                  updateInfo: response.data.latestVersion,
                  isRequired: response.data.isRequired,
                });
              } else {
                console.log('[LauncherUpdate] No updates available');
                resolve({
                  success: true,
                  hasUpdate: false,
                });
              }
            } else {
              console.error('[LauncherUpdate] Invalid response:', response);
              resolve({
                success: false,
                error: 'Invalid response from server',
              });
            }
          } catch (error) {
            console.error('[LauncherUpdate] Parse error:', error);
            resolve({
              success: false,
              error: `Failed to parse response: ${(error as Error).message}`,
            });
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('[LauncherUpdate] Network error:', error);
        resolve({
          success: false,
          error: `Network error: ${error.message}`,
        });
      });
      
      req.setTimeout(10000, () => {
        console.error('[LauncherUpdate] Request timeout');
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
        });
      });
    });
  } catch (error) {
    console.error('[LauncherUpdate] Error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

/**
 * Download launcher update
 */
ipcMain.on('launcher:downloadUpdate', async (event, updateInfo: UpdateInfo, apiUrl: string) => {
  try {
    const downloadUrl = updateInfo.downloadUrl;
    if (!downloadUrl) {
      event.reply('launcher:update:error', 'Download URL is not provided');
      return;
    }

    // Determine download path based on platform
    const isWindows = process.platform === 'win32';
    const tempDir = app.getPath('temp');
    const fileName = isWindows 
      ? `launcher-update-${updateInfo.version}.exe`
      : `launcher-update-${updateInfo.version}.${process.platform === 'darwin' ? 'dmg' : 'AppImage'}`;
    const destPath = path.join(tempDir, fileName);
    
    const downloadId = `${downloadUrl}-${Date.now()}`;
    updateDownloadId = downloadId;
    updateDownloadProgress = 0;

    // Ensure directory exists
    await fsPromises.mkdir(path.dirname(destPath), { recursive: true });

    // Helper function to follow redirects
    const downloadWithRedirects = (url: string, maxRedirects = 5): void => {
      if (maxRedirects <= 0) {
        event.reply('launcher:update:error', 'Too many redirects');
        return;
      }

      const urlClient = url.startsWith('https:') ? https : http;
      const request = urlClient.get(url, (response) => {
        // Handle redirects (301, 302, 307, 308)
        if (response.statusCode === 301 || response.statusCode === 302 || 
            response.statusCode === 307 || response.statusCode === 308) {
          const location = response.headers.location;
          if (!location) {
            event.reply('launcher:update:error', `HTTP ${response.statusCode}: No redirect location`);
            return;
          }
          // Follow redirect
          const redirectUrl = location.startsWith('http') ? location : new URL(location, url).href;
          console.log(`[LauncherUpdate] Following redirect to: ${redirectUrl}`);
          downloadWithRedirects(redirectUrl, maxRedirects - 1);
          return;
        }

        if (response.statusCode !== 200) {
          event.reply('launcher:update:error', `HTTP ${response.statusCode}`);
          return;
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        const writer = fs.createWriteStream(destPath);
        let downloadedBytes = 0;

        response.on('data', (chunk: Buffer) => {
          if (updateDownloadId !== downloadId) {
            // Download was cancelled
            response.destroy();
            writer.destroy();
            return;
          }
          
          downloadedBytes += chunk.length;
          updateDownloadProgress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
          event.reply('launcher:update:progress', updateDownloadProgress);
        });

        response.on('end', async () => {
          if (updateDownloadId !== downloadId) {
            // Download was cancelled
            try {
              await fsPromises.unlink(destPath);
            } catch {}
            return;
          }

          writer.end();
          
          // Verify file hash if provided
          if (updateInfo.fileHash) {
            try {
              const fileContent = await fsPromises.readFile(destPath);
              const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
              
              if (hash.toLowerCase() !== updateInfo.fileHash.toLowerCase()) {
                await fsPromises.unlink(destPath);
                event.reply('launcher:update:error', 'File hash verification failed. File may be corrupted.');
                return;
              }
            } catch (error) {
              await fsPromises.unlink(destPath);
              event.reply('launcher:update:error', `Hash verification error: ${(error as Error).message}`);
              return;
            }
          }

          event.reply('launcher:update:complete', destPath);
        });

        response.on('error', async (error) => {
          writer.destroy();
          try {
            await fsPromises.unlink(destPath);
          } catch {}
          event.reply('launcher:update:error', error.message);
        });

        response.pipe(writer);

        writer.on('error', async (error) => {
          response.destroy();
          try {
            await fsPromises.unlink(destPath);
          } catch {}
          event.reply('launcher:update:error', error.message);
        });
      });

      request.on('error', (error) => {
        event.reply('launcher:update:error', error.message);
      });

      request.setTimeout(300000, () => {
        request.destroy();
        event.reply('launcher:update:error', 'Download timeout');
      });
    };

    // Start download with redirect handling
    downloadWithRedirects(downloadUrl);
  } catch (error) {
    event.reply('launcher:update:error', (error as Error).message);
  }
});

/**
 * Cancel update download
 */
ipcMain.on('launcher:cancelUpdate', () => {
  updateDownloadId = null;
  updateDownloadProgress = 0;
});

/**
 * Install launcher update
 */
ipcMain.handle('launcher:installUpdate', async (event, installerPath: string, newVersion: string) => {
  try {
    if (!fs.existsSync(installerPath)) {
      return {
        success: false,
        error: 'Installer file not found',
      };
    }

    // Сохранить новую версию в конфигурационном файле перед установкой
    const userDataPath = app.getPath('userData');
    const versionConfigPath = path.join(userDataPath, 'launcher-version.json');
    try {
      await fsPromises.writeFile(versionConfigPath, JSON.stringify({ version: newVersion, updatedAt: new Date().toISOString() }), 'utf-8');
      console.log(`[LauncherUpdate] Saved version ${newVersion} to config file`);
    } catch (error) {
      console.warn('[LauncherUpdate] Failed to save version to config file:', error);
      // Не прерываем установку, если не удалось сохранить версию
    }

    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';

    // Get current executable path
    const currentExe = process.execPath;
    
    if (isWindows) {
      // On Windows, run the installer and exit
      // The installer will handle the update
      exec(`"${installerPath}" /S /D="${path.dirname(currentExe)}"`, (error) => {
        if (error) {
          console.error('Error running installer:', error);
        } else {
          // Give installer time to start, then quit
          setTimeout(() => {
            app.quit();
          }, 1000);
        }
      });
      
      return { success: true };
    } else if (isMac) {
      // On macOS, mount DMG and copy app
      // This is more complex, for now just open the DMG
      exec(`open "${installerPath}"`, (error) => {
        if (error) {
          console.error('Error opening DMG:', error);
        }
      });
      
      return { success: true, message: 'Please follow the installation instructions' };
    } else {
      // Linux - make executable and run
      await fsPromises.chmod(installerPath, 0o755);
      exec(`"${installerPath}"`, (error) => {
        if (error) {
          console.error('Error running installer:', error);
        } else {
          setTimeout(() => {
            app.quit();
          }, 1000);
        }
      });
      
      return { success: true };
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

/**
 * Restart launcher after update
 */
ipcMain.on('launcher:restart', () => {
  app.relaunch();
  app.exit(0);
});

