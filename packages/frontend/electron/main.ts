/**
 * Electron Main Process
 */

import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import crypto from 'crypto';
import { spawn, execSync } from 'child_process';
import https from 'https';
import http from 'http';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const activeDownloads = new Map<string, { request: http.ClientRequest | https.ClientRequest; writer: fs.WriteStream; destPath: string }>();

const isDevelopment = process.env.NODE_ENV === 'development';

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
          stopAllDownloads();
          app.quit();
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
    // In production, use app.getAppPath()
    return app.getAppPath();
  }
}

function createWindow() {
  const appDir = getAppDir();
  const preloadPath = isDevelopment
    ? path.join(appDir, 'dist-electron', 'preload.js')
    : path.join(appDir, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(appDir, 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

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

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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
 * Find native library directories (natives folders) in libraries
 */
function findNativeLibDirs(librariesDir: string): string[] {
  const nativeDirs: string[] = [];
  const visited = new Set<string>();
  
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
 * Looks for updates/ in the project root
 */
function findUpdatesDir(): string {
  // In development, process.cwd() is usually the project root
  // In production, we need to find it relative to app path
  
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
  
  // Strategy 4: Try relative to app path (production)
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
  
  // Return default path (will be checked later, might not exist)
  const defaultPath = path.resolve(process.cwd(), 'updates');
  console.log('Using default updates path:', defaultPath);
  return defaultPath;
}

/**
 * Launch Minecraft
 */
ipcMain.handle('launcher:launch', async (event, args) => {
  const { javaPath, jvmArgs, mainClass, classPath, gameArgs, workingDir, version } = args;

  try {
    // Find updates directory (where files are downloaded)
    const updatesDir = findUpdatesDir();
    console.log('Updates directory:', updatesDir);
    
    // Resolve working directory to absolute path
    const resolvedWorkingDir = path.isAbsolute(workingDir) 
      ? workingDir 
      : path.resolve(process.cwd(), workingDir);

    // Resolve classPath entries to absolute paths
    const resolvedClassPath: string[] = [];
    
    for (const cp of classPath) {
      if (cp === 'client.jar') {
        // First try updates directory (where files are downloaded)
        let clientJar = path.join(updatesDir, version, 'client.jar');
        
        // If not found, try workingDir (for compatibility)
        if (!fs.existsSync(clientJar)) {
          clientJar = path.join(resolvedWorkingDir, version, 'client.jar');
        }
        
        if (!fs.existsSync(clientJar)) {
          return { 
            success: false, 
            error: `Client JAR not found. Searched in:\n- ${path.join(updatesDir, version, 'client.jar')}\n- ${path.join(resolvedWorkingDir, version, 'client.jar')}\n\nPlease download Minecraft files first using: npm run download-minecraft ${version}` 
          };
        }
        resolvedClassPath.push(clientJar);
      } else if (cp === 'libraries') {
        // First try updates directory
        let librariesDir = path.join(updatesDir, version, 'libraries');
        
        // If not found, try workingDir
        if (!fs.existsSync(librariesDir)) {
          librariesDir = path.join(resolvedWorkingDir, version, 'libraries');
        }
        
        const jarFiles = findJarFiles(librariesDir);
        if (jarFiles.length === 0) {
          console.warn(`No JAR files found in ${librariesDir}`);
        }
        resolvedClassPath.push(...jarFiles);
        
        // Find native library directories for java.library.path
        const nativeDirs = findNativeLibDirs(librariesDir);
        if (nativeDirs.length > 0) {
          console.log(`Found ${nativeDirs.length} native library directories`);
        }
      } else {
        // Try updates directory first, then workingDir
        let resolved = path.isAbsolute(cp) 
          ? cp 
          : path.join(updatesDir, version, cp);
        
        if (!fs.existsSync(resolved)) {
          resolved = path.join(resolvedWorkingDir, version, cp);
        }
        
        if (fs.existsSync(resolved)) {
          resolvedClassPath.push(resolved);
        } else {
          console.warn(`ClassPath entry not found: ${resolved}`);
        }
      }
    }

    if (resolvedClassPath.length === 0) {
      return { 
        success: false, 
        error: 'No valid classpath entries found. Please ensure Minecraft files are downloaded.' 
      };
    }

    // Ensure working directory exists
    if (!fs.existsSync(resolvedWorkingDir)) {
      console.log(`Creating working directory: ${resolvedWorkingDir}`);
      fs.mkdirSync(resolvedWorkingDir, { recursive: true });
    }

    // Find all native library directories
    const librariesDir = path.join(updatesDir, version, 'libraries');
    const nativeLibDirs = fs.existsSync(librariesDir) 
      ? findNativeLibDirs(librariesDir)
      : [];

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

    console.log('Launching Minecraft with:', {
      javaPath,
      workingDir: resolvedWorkingDir,
      classPathCount: resolvedClassPath.length,
      mainClass,
      jvmArgsCount: jvmArgs.length,
      gameArgsCount: gameArgs.length,
    });
    console.log('Full command:', `${javaPath} ${fullArgs.join(' ')}`);

    // Check if Java executable exists (for custom paths)
    if (javaPath !== 'java' && !fs.existsSync(javaPath)) {
      return { 
        success: false, 
        error: `Java executable not found: ${javaPath}. Please check the Java path in settings.` 
      };
    }

    // Try to verify Java is available (only if javaPath is 'java')
    if (javaPath === 'java') {
      try {
        execSync(`${javaPath} -version`, { timeout: 5000, stdio: 'pipe' });
      } catch (error: any) {
        return {
          success: false,
          error: `Java is not available or not in PATH. Error: ${error.message}. Please install Java 17 or higher, or specify the full path to Java in settings.`
        };
      }
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

    // Collect stderr for error messages
    let stderrBuffer = '';
    gameProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      stderrBuffer += message;
      console.error('Game stderr:', message);
      mainWindow?.webContents.send('game:error', message);
    });

    gameProcess.stdout?.on('data', (data) => {
      const message = data.toString();
      console.log('Game stdout:', message);
      mainWindow?.webContents.send('game:log', message);
    });

    gameProcess.on('exit', (code, signal) => {
      processExited = true;
      exitCode = code;
      console.log(`Game process exited with code ${code}, signal ${signal}`);
      mainWindow?.webContents.send('game:exit', code || 0);
      
      if (code !== 0 && code !== null) {
        const errorMsg = stderrBuffer || `Game exited with code ${code}`;
        console.error('Game failed:', errorMsg);
        mainWindow?.webContents.send('game:error', errorMsg);
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

ipcMain.handle('file:exists', async (event, filePath: string) => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.on('file:download', async (event, url: string, destPath: string) => {
  const downloadId = `${url}-${destPath}`;
  
  try {
    const dir = path.dirname(destPath);
    await fsPromises.mkdir(dir, { recursive: true });

    const client = url.startsWith('https:') ? https : http;
    
    const request = client.get(url, (response) => {
      if (response.statusCode !== 200) {
        activeDownloads.delete(downloadId);
        event.reply('file:download:error', `HTTP ${response.statusCode}`);
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      const writer = fs.createWriteStream(destPath);
      let downloadedBytes = 0;

      // Store download for potential cancellation
      activeDownloads.set(downloadId, { request, writer, destPath });

      response.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
        event.reply('file:download:progress', progress);
      });

      response.on('end', () => {
        activeDownloads.delete(downloadId);
        writer.end();
        event.reply('file:download:complete');
      });

      response.on('error', (error) => {
        activeDownloads.delete(downloadId);
        writer.destroy();
        fs.unlink(destPath, () => {});
        event.reply('file:download:error', error.message);
      });

      response.pipe(writer);

      writer.on('error', (error) => {
        activeDownloads.delete(downloadId);
        response.destroy();
        event.reply('file:download:error', error.message);
      });

      writer.on('finish', () => {
        activeDownloads.delete(downloadId);
      });
    });

    request.on('error', (error) => {
      activeDownloads.delete(downloadId);
      event.reply('file:download:error', error.message);
    });
  } catch (error) {
    activeDownloads.delete(downloadId);
    event.reply('file:download:error', (error as Error).message);
  }
});

/**
 * Get app version
 */
ipcMain.handle('app:version', () => {
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
