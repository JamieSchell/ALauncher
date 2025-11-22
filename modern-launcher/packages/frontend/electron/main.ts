/**
 * Electron Main Process
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

let mainWindow: BrowserWindow | null = null;

const isDevelopment = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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
  mainWindow?.close();
});

/**
 * Launch Minecraft
 */
ipcMain.handle('launcher:launch', async (event, args) => {
  const { javaPath, jvmArgs, mainClass, classPath, gameArgs, workingDir } = args;

  try {
    const fullArgs = [
      ...jvmArgs,
      '-cp',
      classPath.join(path.delimiter),
      mainClass,
      ...gameArgs,
    ];

    const gameProcess = spawn(javaPath, fullArgs, {
      cwd: workingDir,
      stdio: 'pipe',
    });

    gameProcess.stdout?.on('data', (data) => {
      mainWindow?.webContents.send('game:log', data.toString());
    });

    gameProcess.stderr?.on('data', (data) => {
      mainWindow?.webContents.send('game:error', data.toString());
    });

    gameProcess.on('exit', (code) => {
      mainWindow?.webContents.send('game:exit', code);
    });

    return { success: true, pid: gameProcess.pid };
  } catch (error) {
    return { success: false, error: (error as Error).message };
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
