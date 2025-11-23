/**
 * Electron Preload Script
 * Exposes safe APIs to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  minimizeToTray: () => ipcRenderer.send('window:minimizeToTray'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Launcher
  launchGame: (args: any) => ipcRenderer.invoke('launcher:launch', args),

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getAppPaths: () => ipcRenderer.invoke('app:paths'),
  getUpdatesDir: () => ipcRenderer.invoke('app:updatesDir'),

  // Java operations
  findJavaInstallations: () => ipcRenderer.invoke('java:findInstallations'),
  checkJavaVersion: (javaPath: string, requiredVersion: string) => ipcRenderer.invoke('java:checkVersion', javaPath, requiredVersion),
  getJavaVersion: (javaPath: string) => ipcRenderer.invoke('java:getVersion', javaPath),
  
  // Dialog operations
  selectJavaFile: () => ipcRenderer.invoke('dialog:selectJavaFile'),

  // Listeners
  onGameLog: (callback: (log: string) => void) => {
    ipcRenderer.on('game:log', (_, log) => callback(log));
  },
  onGameError: (callback: (error: string) => void) => {
    ipcRenderer.on('game:error', (_, error) => callback(error));
  },
  onGameExit: (callback: (code: number) => void) => {
    ipcRenderer.on('game:exit', (_, code) => callback(code));
  },
  onGameCrash: (callback: (data: any) => void) => {
    ipcRenderer.on('game:crash', (_, data) => callback(data));
  },
  onGameConnectionIssue: (callback: (data: any) => void) => {
    ipcRenderer.on('game:connection-issue', (_, data) => callback(data));
  },

  // File operations
  ensureDir: (dirPath: string) => ipcRenderer.invoke('file:ensureDir', dirPath),
  writeFile: (filePath: string, data: Uint8Array) => ipcRenderer.invoke('file:writeFile', filePath, data),
  deleteFile: (filePath: string) => ipcRenderer.invoke('file:deleteFile', filePath),
  calculateFileHash: (filePath: string, algorithm: 'sha256' | 'sha1') => ipcRenderer.invoke('file:calculateHash', filePath, algorithm),
      downloadFile: (url: string, destPath: string, onProgress?: (progress: number) => void, authToken?: string) => {
    return new Promise<void>((resolve, reject) => {
      const progressListener = (_: any, progress: number) => {
        if (onProgress) onProgress(progress);
      };
      const completeListener = () => {
        ipcRenderer.removeListener('file:download:progress', progressListener);
        ipcRenderer.removeListener('file:download:complete', completeListener);
        ipcRenderer.removeListener('file:download:error', errorListener);
        resolve();
      };
      const errorListener = (_: any, error: string) => {
        ipcRenderer.removeListener('file:download:progress', progressListener);
        ipcRenderer.removeListener('file:download:complete', completeListener);
        ipcRenderer.removeListener('file:download:error', errorListener);
        reject(new Error(error));
      };

      ipcRenderer.once('file:download:progress', progressListener);
      ipcRenderer.once('file:download:complete', completeListener);
      ipcRenderer.once('file:download:error', errorListener);

      ipcRenderer.send('file:download', url, destPath, authToken);
    });
  },
  fileExists: (filePath: string) => ipcRenderer.invoke('file:exists', filePath),
  
  // Notifications
  showNotification: (title: string, body: string, options?: { icon?: string; sound?: boolean }) => 
    ipcRenderer.invoke('notification:show', title, body, options),
  
  // Launcher updates
  checkLauncherUpdate: (currentVersion: string, apiUrl: string) => 
    ipcRenderer.invoke('launcher:checkUpdate', currentVersion, apiUrl),
  downloadLauncherUpdate: (updateInfo: any, apiUrl: string) => {
    ipcRenderer.send('launcher:downloadUpdate', updateInfo, apiUrl);
  },
  cancelLauncherUpdate: () => {
    ipcRenderer.send('launcher:cancelUpdate');
  },
  installLauncherUpdate: (installerPath: string) => 
    ipcRenderer.invoke('launcher:installUpdate', installerPath),
  restartLauncher: () => {
    ipcRenderer.send('launcher:restart');
  },
  onLauncherUpdateProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('launcher:update:progress', (_, progress) => callback(progress));
  },
  onLauncherUpdateComplete: (callback: (installerPath: string) => void) => {
    ipcRenderer.on('launcher:update:complete', (_, path) => callback(path));
  },
  onLauncherUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('launcher:update:error', (_, error) => callback(error));
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      minimizeToTray: () => void;
      closeWindow: () => void;
      launchGame: (args: any) => Promise<{ success: boolean; pid?: number; error?: string }>;
      getAppVersion: () => Promise<string>;
      getAppPaths: () => Promise<{ userData: string; appData: string; temp: string }>;
      getUpdatesDir: () => Promise<string>;
      findJavaInstallations: () => Promise<{ success: boolean; installations: Array<{ path: string; version: string; major: number; full: string }>; error?: string }>;
      checkJavaVersion: (javaPath: string, requiredVersion: string) => Promise<{ success: boolean; valid: boolean; currentVersion?: string; requiredVersion: string; error?: string }>;
      getJavaVersion: (javaPath: string) => Promise<{ success: boolean; version?: string; major?: number; full?: string; error?: string }>;
      selectJavaFile: () => Promise<{ success: boolean; path?: string; version?: string; major?: number; canceled?: boolean; error?: string }>;
      onGameLog: (callback: (log: string) => void) => void;
      onGameError: (callback: (error: string) => void) => void;
      onGameExit: (callback: (code: number) => void) => void;
      onGameCrash: (callback: (data: any) => void) => void;
      onGameConnectionIssue: (callback: (data: any) => void) => void;
      ensureDir: (dirPath: string) => Promise<void>;
      writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
      deleteFile: (filePath: string) => Promise<void>;
      calculateFileHash: (filePath: string, algorithm: 'sha256' | 'sha1') => Promise<string>;
      downloadFile: (url: string, destPath: string, onProgress?: (progress: number) => void, authToken?: string) => Promise<void>;
      fileExists: (filePath: string) => Promise<boolean>;
      showNotification: (title: string, body: string, options?: { icon?: string; sound?: boolean }) => Promise<void>;
      checkLauncherUpdate: (currentVersion: string, apiUrl: string) => Promise<{ success: boolean; hasUpdate?: boolean; updateInfo?: any; isRequired?: boolean; error?: string }>;
      downloadLauncherUpdate: (updateInfo: any, apiUrl: string) => void;
      cancelLauncherUpdate: () => void;
      installLauncherUpdate: (installerPath: string) => Promise<{ success: boolean; error?: string; message?: string }>;
      restartLauncher: () => void;
      onLauncherUpdateProgress: (callback: (progress: number) => void) => void;
      onLauncherUpdateComplete: (callback: (installerPath: string) => void) => void;
      onLauncherUpdateError: (callback: (error: string) => void) => void;
    };
  }
}
