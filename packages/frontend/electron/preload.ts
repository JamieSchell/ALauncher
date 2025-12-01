/**
 * Electron Preload Script
 * Exposes safe APIs to renderer process
 * 
 * Security:
 * - Uses contextBridge for secure IPC communication
 * - nodeIntegration: false (enforced in main.ts)
 * - contextIsolation: true (enforced in main.ts)
 * - Only exposes minimal, typed API surface
 * 
 * API Audit:
 * All exposed APIs are actively used in the codebase:
 * - Window controls: TitleBar, LoginPage
 * - App info: errorLogger, ServerDetailsPage, HomePage, TitleBar, useLauncherUpdate, LoginPage, GameLogsModal
 * - Java operations: SettingsPage (findJavaInstallations, selectJavaFile)
 * - Game events: HomePage, ServerDetailsPage (all listeners)
 * - File operations: ServerDetailsPage, HomePage, GameLogsModal (all methods)
 * - Notifications: NotificationCenter, notificationService
 * - HTTP requests: api/client.ts (IPC proxy)
 * - Launcher updates: useLauncherUpdate, LauncherUpdateModal
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, LaunchGameArgs, LaunchGameResponse, AppPaths, FindJavaInstallationsResponse, CheckJavaVersionResponse, GetJavaVersionResponse, SelectJavaFileResponse, GameCrashData, GameConnectionIssueData, FileHashAlgorithm, HttpRequestOptions, HttpResponse, NotificationOptions, CheckLauncherUpdateResponse, UpdateInfo, InstallLauncherUpdateResponse } from '@modern-launcher/shared';

const electronAPI: ElectronAPI = {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  minimizeToTray: () => ipcRenderer.send('window:minimizeToTray'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Launcher
  launchGame: (args: LaunchGameArgs): Promise<LaunchGameResponse> => 
    ipcRenderer.invoke('launcher:launch', args),

  // App info
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  getAppPaths: (): Promise<AppPaths> => ipcRenderer.invoke('app:paths'),
  getUpdatesDir: (): Promise<string> => ipcRenderer.invoke('app:updatesDir'),

  // Java operations
  // Note: findJavaInstallations and selectJavaFile are actively used in SettingsPage
  // checkJavaVersion and getJavaVersion are available for future use or advanced Java validation
  findJavaInstallations: (): Promise<FindJavaInstallationsResponse> => 
    ipcRenderer.invoke('java:findInstallations'),
  checkJavaVersion: (javaPath: string, requiredVersion: string): Promise<CheckJavaVersionResponse> => 
    ipcRenderer.invoke('java:checkVersion', javaPath, requiredVersion),
  getJavaVersion: (javaPath: string): Promise<GetJavaVersionResponse> => 
    ipcRenderer.invoke('java:getVersion', javaPath),
  
  // Dialog operations
  selectJavaFile: (): Promise<SelectJavaFileResponse> => 
    ipcRenderer.invoke('dialog:selectJavaFile'),

  // Game event listeners
  onGameLog: (callback: (log: string) => void) => {
    ipcRenderer.on('game:log', (_, log) => callback(log));
  },
  onGameError: (callback: (error: string) => void) => {
    ipcRenderer.on('game:error', (_, error) => callback(error));
  },
  onGameExit: (callback: (code: number) => void) => {
    ipcRenderer.on('game:exit', (_, code) => callback(code));
  },
  onGameCrash: (callback: (data: GameCrashData) => void) => {
    ipcRenderer.on('game:crash', (_, data) => callback(data));
  },
  onGameConnectionIssue: (callback: (data: GameConnectionIssueData) => void) => {
    ipcRenderer.on('game:connection-issue', (_, data) => callback(data));
  },

  // File operations
  ensureDir: (dirPath: string): Promise<void> => 
    ipcRenderer.invoke('file:ensureDir', dirPath),
  writeFile: (filePath: string, data: Uint8Array): Promise<void> => 
    ipcRenderer.invoke('file:writeFile', filePath, data),
  deleteFile: (filePath: string): Promise<void> => 
    ipcRenderer.invoke('file:deleteFile', filePath),
  readFile: (filePath: string): Promise<string> => 
    ipcRenderer.invoke('file:readFile', filePath),
  calculateFileHash: (filePath: string, algorithm: FileHashAlgorithm): Promise<string> => 
    ipcRenderer.invoke('file:calculateHash', filePath, algorithm),
  downloadFile: (url: string, destPath: string, onProgress?: (progress: number) => void, authToken?: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      // Уникальный идентификатор данной загрузки (должен совпадать с main.ts)
      const downloadId = `${url}-${destPath}`;

      const progressListener = (_: any, id: string, progress: number) => {
        if (id !== downloadId) return;
        if (onProgress) onProgress(progress);
      };

      const completeListener = (_: any, id: string) => {
        if (id !== downloadId) return;
        ipcRenderer.removeListener('file:download:progress', progressListener);
        ipcRenderer.removeListener('file:download:complete', completeListener);
        ipcRenderer.removeListener('file:download:error', errorListener);
        resolve();
      };

      const errorListener = (_: any, id: string, error: string) => {
        if (id !== downloadId) return;
        ipcRenderer.removeListener('file:download:progress', progressListener);
        ipcRenderer.removeListener('file:download:complete', completeListener);
        ipcRenderer.removeListener('file:download:error', errorListener);
        reject(new Error(error));
      };

      // Используем on, а не once, чтобы поддерживать несколько событий для одной загрузки
      ipcRenderer.on('file:download:progress', progressListener);
      ipcRenderer.on('file:download:complete', completeListener);
      ipcRenderer.on('file:download:error', errorListener);

      ipcRenderer.send('file:download', url, destPath, authToken);
    });
  },
  fileExists: (filePath: string): Promise<boolean> => 
    ipcRenderer.invoke('file:exists', filePath),
  
  // Notifications
  showNotification: (title: string, body: string, options?: NotificationOptions): Promise<void> => 
    ipcRenderer.invoke('notification:show', title, body, options),
  
  // HTTP requests (proxy through main process to bypass file:// restrictions)
  httpRequest: (options: HttpRequestOptions): Promise<HttpResponse> => 
    ipcRenderer.invoke('http:request', options),

  // Launcher updates
  checkLauncherUpdate: (currentVersion: string, apiUrl: string, authToken?: string): Promise<CheckLauncherUpdateResponse> => 
    ipcRenderer.invoke('launcher:checkUpdate', currentVersion, apiUrl, authToken),
  downloadLauncherUpdate: (updateInfo: UpdateInfo, apiUrl: string): void => {
    ipcRenderer.send('launcher:downloadUpdate', updateInfo, apiUrl);
  },
  cancelLauncherUpdate: (): void => {
    ipcRenderer.send('launcher:cancelUpdate');
  },
  installLauncherUpdate: (installerPath: string, newVersion: string): Promise<InstallLauncherUpdateResponse> => 
    ipcRenderer.invoke('launcher:installUpdate', installerPath, newVersion),
  restartLauncher: (): void => {
    ipcRenderer.send('launcher:restart');
  },
  onLauncherUpdateProgress: (callback: (progress: number) => void): void => {
    ipcRenderer.on('launcher:update:progress', (_, progress) => callback(progress));
  },
  onLauncherUpdateComplete: (callback: (installerPath: string) => void): void => {
    ipcRenderer.on('launcher:update:complete', (_, path) => callback(path));
  },
  onLauncherUpdateError: (callback: (error: string) => void): void => {
    ipcRenderer.on('launcher:update:error', (_, error) => callback(error));
  },
};

// Expose typed API to renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for TypeScript (using shared types)
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
