import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { ask, message, save, open as openDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, mkdir, remove, exists } from '@tauri-apps/plugin-fs';

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
    return await readTextFile(path);
  },

  async writeTextFile(path: string, content: string): Promise<void> {
    return await writeTextFile(path, content);
  },

  async createDirectory(path: string): Promise<void> {
    return await invoke('create_directory', { path });
  },

  async createDir(path: string): Promise<void> {
    return await mkdir(path, { recursive: true });
  },

  async deleteFile(path: string): Promise<void> {
    return await invoke('delete_file', { path });
  },

  async removeFile(path: string): Promise<void> {
    return await remove(path);
  },

  async fileExists(path: string): Promise<boolean> {
    return await exists(path);
  },

  async getFileInfo(path: string) {
    return await invoke('get_file_info', { path });
  },

  // Dialog operations
  async showMessageBox(options: {
    title?: string;
    message?: string;
    type?: 'info' | 'warning' | 'error';
  }) {
    return await message(options.message || '', {
      title: options.title || 'ALauncher',
      type: options.type || 'info',
    });
  },

  async showConfirmDialog(options: {
    title?: string;
    message?: string;
    type?: 'info' | 'warning' | 'error';
  }) {
    return await ask(options.message || '', {
      title: options.title || 'ALauncher',
      type: options.type || 'info',
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

  // Window operations
  async minimizeWindow() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const window = getCurrentWindow();
    return window.minimize();
  },

  async maximizeWindow() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const window = getCurrentWindow();
    return window.toggleMaximize();
  },

  async closeWindow() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const window = getCurrentWindow();
    return window.close();
  },

  async hideWindow() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const window = getCurrentWindow();
    return window.hide();
  },

  async showWindow() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const window = getCurrentWindow();
    return window.show();
    return window.unminimize();
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
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

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