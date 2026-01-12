import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { ask, message, save, open as openDialog } from '@tauri-apps/plugin-dialog';

// Tauri API service to replace Electron IPC
export const tauriApi = {
  // System information
  async getAppVersion(): Promise<string> {
    return await invoke('get_app_version');
  },

  // File operations
  async readFile(path: string): Promise<string> {
    return await invoke('read_file', { path });
  },

  async writeFile(path: string, content: string): Promise<void> {
    return await invoke('write_file', { path, content });
  },

  async readTextFile(path: string): Promise<string> {
    return await invoke('read_file', { path });
  },

  async writeTextFile(path: string, content: string): Promise<void> {
    return await invoke('write_file', { path, content });
  },

  async createDirectory(path: string): Promise<void> {
    return await invoke('ensure_dir', { path });
  },

  async createDir(path: string): Promise<void> {
    return await invoke('ensure_dir', { path });
  },

  async deleteFile(path: string): Promise<void> {
    // Not implemented in Rust backend yet
    throw new Error('deleteFile not implemented');
  },

  async removeFile(path: string): Promise<void> {
    // Not implemented in Rust backend yet
    throw new Error('removeFile not implemented');
  },

  async fileExists(path: string): Promise<boolean> {
    return await invoke('file_exists', { path });
  },

  async getFileInfo(path: string) {
    return await invoke('get_file_info', { path });
  },

  // Download operations
  async downloadFile(url: string, destPath: string, onProgress?: (progress: number) => void, accessToken?: string): Promise<void> {
    return await invoke('download_file', { url, destPath, onProgress: !!onProgress, accessToken });
  },

  // Updates directory
  async getUpdatesDir(): Promise<string> {
    return await invoke('get_updates_dir');
  },

  // Ensure directory exists
  async ensureDir(path: string): Promise<void> {
    return await invoke('ensure_dir', { path });
  },

  // Dialog operations
  async showMessageBox(options: {
    title?: string;
    message?: string;
    type?: 'info' | 'warning' | 'error';
  }) {
    return await message(options.message || '', {
      title: options.title || 'ALauncher',
    });
  },

  async showConfirmDialog(options: {
    title?: string;
    message?: string;
    type?: 'info' | 'warning' | 'error';
  }) {
    return await ask(options.message || '', {
      title: options.title || 'ALauncher',
    });
  },

  async showSaveDialog(options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) {
    return await save({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
    });
  },

  async showOpenDialog(options: {
    title?: string;
    defaultPath?: string;
    multiple?: boolean;
    directory?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) {
    return await openDialog({
      title: options.title,
      defaultPath: options.defaultPath,
      multiple: options.multiple || false,
      directory: options.directory || false,
      filters: options.filters,
    });
  },

  // Shell operations
  async openUrl(url: string): Promise<void> {
    return await invoke('open_url', { url });
  },

  async openExternal(url: string): Promise<void> {
    return await open(url);
  },

  // Application operations
  async showNotification(options: {
    title: string;
    body?: string;
    icon?: string;
  }) {
    // Tauri has built-in notification support
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(options.title, {
            body: options.body,
            icon: options.icon,
          });
        }
      });
    }
  },

  // Platform detection
  async getPlatform(): Promise<string> {
    return await invoke('get_platform');
  },

  async getArch(): Promise<string> {
    return await invoke('get_arch');
  },

  // Window operations - use Tauri commands instead of frontend API
  async minimizeWindow() {
    try {
      console.log('=== MINIMIZE WINDOW START ===');
      console.log('isTauri:', isTauri);

      if (!isTauri) {
        throw new Error('Not running in Tauri environment');
      }

      console.log('Using window_minimize command...');
      const result = await invoke('window_minimize');
      console.log('✓ Minimize successful via command:', result);
      return result;
    } catch (error) {
      console.error('=== MINIMIZE WINDOW FAILED ===');
      console.error('Final error:', error);
      throw error;
    }
  },

  async maximizeWindow() {
    try {
      console.log('=== MAXIMIZE WINDOW START ===');
      console.log('isTauri:', isTauri);

      if (!isTauri) {
        throw new Error('Not running in Tauri environment');
      }

      console.log('Using window_toggle_maximize command...');
      const result = await invoke('window_toggle_maximize');
      console.log('✓ Maximize/Unmaximize successful via command:', result);
      return result;
    } catch (error) {
      console.error('=== MAXIMIZE WINDOW FAILED ===');
      console.error('Final error:', error);
      throw error;
    }
  },

  async closeWindow() {
    try {
      console.log('=== CLOSE WINDOW START ===');
      console.log('isTauri:', isTauri);

      if (!isTauri) {
        throw new Error('Not running in Tauri environment');
      }

      console.log('Using window_close command...');
      const result = await invoke('window_close');
      console.log('✓ Close successful via command:', result);
      return result;
    } catch (error) {
      console.error('=== CLOSE WINDOW FAILED ===');
      console.error('Final error:', error);
      throw error;
    }
  },

  async hideWindow() {
    try {
      console.log('=== HIDE WINDOW START ===');
      console.log('isTauri:', isTauri);

      if (!isTauri) {
        throw new Error('Not running in Tauri environment');
      }

      console.log('Using window_hide command...');
      const result = await invoke('window_hide');
      console.log('✓ Hide successful via command:', result);
      return result;
    } catch (error) {
      console.error('=== HIDE WINDOW FAILED ===');
      console.error('Final error:', error);
      throw error;
    }
  },

  async openDevtools() {
    try {
      if (!isTauri) {
        throw new Error('Not running in Tauri environment');
      }
      // Пробуем несколько способов открытия DevTools
      const { getCurrentWebviewWindow, WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      
      // Способ 1: getCurrentWebviewWindow (рекомендуемый)
      try {
        const currentWindow = getCurrentWebviewWindow();
        if (currentWindow) {
          await currentWindow.openDevtools();
          return;
        }
      } catch (e) {
        console.log('getCurrentWebviewWindow failed, trying alternatives...', e);
      }
      
      // Способ 2: WebviewWindow.getCurrent()
      try {
        const currentWindow = WebviewWindow.getCurrent();
        if (currentWindow) {
          await currentWindow.openDevtools();
          return;
        }
      } catch (e) {
        console.log('WebviewWindow.getCurrent() failed, trying getByLabel...', e);
      }
      
      // Способ 3: Получить окно по label
      const window = await WebviewWindow.getByLabel('main');
      if (window) {
        await window.openDevtools();
        return;
      }
      
      throw new Error('No webview window found');
    } catch (error) {
      console.error('Failed to open devtools:', error);
      throw error;
    }
  },

  async showWindow() {
    try {
      console.log('=== SHOW WINDOW START ===');
      console.log('isTauri:', isTauri);

      if (!isTauri) {
        throw new Error('Not running in Tauri environment');
      }

      console.log('Using window_show_from_tray command...');
      const result = await invoke('window_show_from_tray');
      console.log('✓ Show successful via command:', result);
      return result;
    } catch (error) {
      console.error('=== SHOW WINDOW FAILED ===');
      console.error('Final error:', error);
      throw error;
    }
  },

  async setAlwaysOnTop(alwaysOnTop: boolean) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const window = getCurrentWindow();
    return window.setAlwaysOnTop(alwaysOnTop);
  },

  // App lifecycle
  async restart() {
    const { relaunch } = await import('@tauri-apps/plugin-process');
    return relaunch();
  },

  async quit() {
    const { exit } = await import('@tauri-apps/plugin-process');
    return exit(0);
  },
};

// Check if we're running in Tauri
export const isTauri = typeof window !== 'undefined' && (
  ('__TAURI_INTERNALS__' in window) ||
  ('__TAURI__' in window) ||
  (typeof (window as any).__TAURI_INTERNALS__ !== 'undefined') ||
  (typeof (window as any).__TAURI__ !== 'undefined')
);

// Debug function to check Tauri availability
export const debugTauri = () => {
  console.log('Tauri debug info:');
  console.log('typeof window:', typeof window);
  console.log('__TAURI_INTERNALS__ in window:', '__TAURI_INTERNALS__' in window);
  console.log('__TAURI__ in window:', '__TAURI__' in window);
  console.log('window.__TAURI_INTERNALS__:', window?.['__TAURI_INTERNALS__']);
  console.log('window.__TAURI__:', window?.['__TAURI__']);
  console.log('isTauri result:', isTauri);
};

// Export a unified API that works with both Tauri and web environments
export const electronToTauriApi = {
  // Helper to transition from Electron IPC to Tauri
  async invoke(channel: string, ...args: any[]) {
    if (!isTauri) {
      console.warn(`Tauri API not available in web environment for channel: ${channel}`);
      return null;
    }
    return invoke(channel, ...args);
  },
};