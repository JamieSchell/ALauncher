/**
 * Type definitions for Electron API
 * These types are available in both Electron and browser environments
 */

declare global {
  interface Window {
    electronAPI?: {
      // Window controls
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      minimizeToTray: () => void;
      closeWindow: () => void;
      
      // Launcher
      launchGame: (args: any) => Promise<{ success: boolean; pid?: number; error?: string }>;
      
      // App info
      getAppVersion: () => Promise<string>;
      getAppPaths: () => Promise<{ userData: string; appData: string; temp: string }>;
      getUpdatesDir: () => Promise<string>;
      
      // Java operations
      findJavaInstallations: () => Promise<{ success: boolean; installations: Array<{ path: string; version: string; major: number; full: string }>; error?: string }>;
      checkJavaVersion: (javaPath: string, requiredVersion: string) => Promise<{ success: boolean; valid: boolean; currentVersion?: string; requiredVersion: string; error?: string }>;
      getJavaVersion: (javaPath: string) => Promise<{ success: boolean; version?: string; major?: number; full?: string; error?: string }>;
      
      // Dialog operations
      selectJavaFile: () => Promise<{ success: boolean; path?: string; version?: string; major?: number; canceled?: boolean; error?: string }>;
      
      // Listeners
      onGameLog: (callback: (log: string) => void) => void;
      onGameError: (callback: (error: string) => void) => void;
      onGameExit: (callback: (code: number) => void) => void;
      onGameCrash: (callback: (data: any) => void) => void;
      onGameConnectionIssue: (callback: (data: any) => void) => void;
      
      // File operations
      ensureDir: (dirPath: string) => Promise<void>;
      writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
      deleteFile: (filePath: string) => Promise<void>;
      readFile: (filePath: string) => Promise<string>;
      calculateFileHash: (filePath: string, algorithm: 'sha256' | 'sha1') => Promise<string>;
      downloadFile: (url: string, destPath: string, onProgress?: (progress: number) => void, authToken?: string) => Promise<void>;
      fileExists: (filePath: string) => Promise<boolean>;
      
      // HTTP request (IPC proxy for Electron production)
      httpRequest: (options: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        data?: any;
        timeout?: number;
      }) => Promise<{
        data: any;
        status: number;
        statusText: string;
        headers: Record<string, string>;
      }>;
      
      // Notifications
      showNotification: (title: string, body: string, options?: { icon?: string; sound?: boolean }) => Promise<void>;
      
      // Launcher updates
      checkLauncherUpdate: (currentVersion: string, apiUrl: string, authToken?: string) => Promise<{ success: boolean; hasUpdate?: boolean; updateInfo?: any; isRequired?: boolean; error?: string }>;
      downloadLauncherUpdate: (updateInfo: any, apiUrl: string) => void;
      cancelLauncherUpdate: () => void;
      installLauncherUpdate: (installerPath: string, newVersion: string) => Promise<{ success: boolean; error?: string; message?: string }>;
      restartLauncher: () => void;
      onLauncherUpdateProgress: (callback: (progress: number) => void) => void;
      onLauncherUpdateComplete: (callback: (installerPath: string) => void) => void;
      onLauncherUpdateError: (callback: (error: string) => void) => void;
    };
  }
}

export {};

