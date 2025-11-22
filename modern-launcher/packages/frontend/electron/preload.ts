/**
 * Electron Preload Script
 * Exposes safe APIs to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
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
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      launchGame: (args: any) => Promise<{ success: boolean; pid?: number; error?: string }>;
      getAppVersion: () => Promise<string>;
      getAppPaths: () => Promise<{ userData: string; appData: string; temp: string }>;
      onGameLog: (callback: (log: string) => void) => void;
      onGameError: (callback: (error: string) => void) => void;
      onGameExit: (callback: (code: number) => void) => void;
    };
  }
}
