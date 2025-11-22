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

  // File operations
  ensureDir: (dirPath: string) => ipcRenderer.invoke('file:ensureDir', dirPath),
  writeFile: (filePath: string, data: Uint8Array) => ipcRenderer.invoke('file:writeFile', filePath, data),
  deleteFile: (filePath: string) => ipcRenderer.invoke('file:deleteFile', filePath),
  calculateFileHash: (filePath: string, algorithm: 'sha256' | 'sha1') => ipcRenderer.invoke('file:calculateHash', filePath, algorithm),
  downloadFile: (url: string, destPath: string, onProgress?: (progress: number) => void) => {
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

      ipcRenderer.send('file:download', url, destPath);
    });
  },
  fileExists: (filePath: string) => ipcRenderer.invoke('file:exists', filePath),
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
      onGameLog: (callback: (log: string) => void) => void;
      onGameError: (callback: (error: string) => void) => void;
      onGameExit: (callback: (code: number) => void) => void;
      ensureDir: (dirPath: string) => Promise<void>;
      writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
      deleteFile: (filePath: string) => Promise<void>;
      calculateFileHash: (filePath: string, algorithm: 'sha256' | 'sha1') => Promise<string>;
      downloadFile: (url: string, destPath: string, onProgress?: (progress: number) => void) => Promise<void>;
      fileExists: (filePath: string) => Promise<boolean>;
    };
  }
}
