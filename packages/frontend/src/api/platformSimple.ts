/**
 * Platform Detection Utilities
 * Simple platform detection for Tauri/Electron environments
 */

import { isTauri } from './tauri';
import { listen } from '@tauri-apps/api/event';

/**
 * Store registered callbacks for game events
 * Allows for cleanup and prevents duplicate listeners
 */
interface GameEventCallbacks {
  exit: Array<(exitCode: number) => void>;
  error: Array<(error: string) => void>;
  log: Array<(log: string) => void>;
}

const gameCallbacks: GameEventCallbacks = {
  exit: [],
  error: [],
  log: [],
};

/**
 * Flag indicating if event listeners have been registered
 */
let eventListenersRegistered = false;

/**
 * Register Tauri event listeners for game events
 * This should be called once when the first callback is registered
 */
async function registerEventListeners(): Promise<void> {
  if (eventListenersRegistered || !isTauri) {
    return;
  }

  try {
    // Listen for game exit events
    await listen<number>('game://exit', (event) => {
      console.log('[platformAPI] Game exit event received:', event.payload);
      gameCallbacks.exit.forEach(callback => {
        try {
          callback(event.payload);
        } catch (error) {
          console.error('[platformAPI] Error in exit callback:', error);
        }
      });
    });

    // Listen for game error events
    await listen<string>('game://error', (event) => {
      console.log('[platformAPI] Game error event received:', event.payload);
      gameCallbacks.error.forEach(callback => {
        try {
          callback(event.payload);
        } catch (error) {
          console.error('[platformAPI] Error in error callback:', error);
        }
      });
    });

    // Listen for game log events
    await listen<string>('game://log', (event) => {
      gameCallbacks.log.forEach(callback => {
        try {
          callback(event.payload);
        } catch (error) {
          console.error('[platformAPI] Error in log callback:', error);
        }
      });
    });

    eventListenersRegistered = true;
    console.log('[platformAPI] Game event listeners registered successfully');
  } catch (error) {
    console.error('[platformAPI] Failed to register event listeners:', error);
  }
}

/**
 * Check if running in Electron environment
 * For ALauncher, we use Tauri, so this is always false
 */
export const isElectron = false;

/**
 * Check if running in Tauri environment
 * Re-exported from tauri module for convenience
 */
export { isTauri } from './tauri';

/**
 * Alias for isTauri (for backward compatibility)
 */
export const isTauriApp = isTauri;

/**
 * Platform information interface
 */
export interface PlatformInfo {
  isTauri: boolean;
  isElectron: boolean;
  isWeb: boolean;
  platform: 'tauri' | 'electron' | 'web';
  os: 'windows' | 'macos' | 'linux' | 'unknown';
}

/**
 * Platform API interface
 * Provides a unified interface for platform-specific operations
 */
export const platformAPI = {
  /**
   * Check if we're in a desktop environment
   */
  isDesktop: isTauri,

  /**
   * Get platform type
   */
  getPlatform: (): 'tauri' | 'electron' | 'web' => {
    if (isTauri) return 'tauri';
    if (isElectron) return 'electron';
    return 'web';
  },

  /**
   * Get comprehensive platform information
   */
  getPlatformInfo: (): PlatformInfo => {
    const os = platformAPI.getOS();
    return {
      isTauri,
      isElectron,
      isWeb: !isTauri && !isElectron,
      platform: platformAPI.getPlatform(),
      os,
    };
  },

  /**
   * Get operating system
   */
  getOS: (): 'windows' | 'macos' | 'linux' | 'unknown' => {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) return 'windows';
    if (platform.includes('mac')) return 'macos';
    if (platform.includes('linux')) return 'linux';
    return 'unknown';
  },

  /**
   * Check if running on Windows
   */
  isWindows: (): boolean => {
    return navigator.platform.toLowerCase().includes('win');
  },

  /**
   * Check if running on macOS
   */
  isMacOS: (): boolean => {
    return navigator.platform.toLowerCase().includes('mac');
  },

  /**
   * Check if running on Linux
   */
  isLinux: (): boolean => {
    return navigator.platform.toLowerCase().includes('linux');
  },

  /**
   * Get updates directory (Tauri only)
   */
  async getUpdatesDir(): Promise<string> {
    if (!isTauri) {
      throw new Error('getUpdatesDir is only available in Tauri desktop app');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('get_updates_dir');
  },

  /**
   * Check if file exists (Tauri only)
   */
  async fileExists(path: string): Promise<boolean> {
    if (!isTauri) {
      throw new Error('fileExists is only available in Tauri desktop app');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('file_exists', { path });
  },

  /**
   * Download file to local path (Tauri only)
   */
  async downloadFile(
    url: string,
    destPath: string,
    onProgress?: (progress: number) => void,
    accessToken?: string
  ): Promise<void> {
    if (!isTauri) {
      throw new Error('downloadFile is only available in Tauri desktop app');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('download_file', { url, destPath, onProgress: !!onProgress, accessToken });
    if (onProgress) {
      onProgress(100);
    }
  },

  /**
   * Ensure directory exists (Tauri only)
   */
  async ensureDir(path: string): Promise<void> {
    if (!isTauri) {
      throw new Error('ensureDir is only available in Tauri desktop app');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('ensure_dir', { path });
  },

  /**
   * Register game exit callback (Tauri only)
   * Note: In browser this is a no-op since game cannot run
   */
  onGameExit(callback: (exitCode: number) => void): void {
    if (!isTauri) {
      console.warn('[platformAPI] onGameExit called in browser - ignoring');
      return;
    }
    gameCallbacks.exit.push(callback);
    // Ensure event listeners are registered
    registerEventListeners().catch(console.error);
  },

  /**
   * Register game error callback (Tauri only)
   * Note: In browser this is a no-op since game cannot run
   */
  onGameError(callback: (error: string) => void): void {
    if (!isTauri) {
      console.warn('[platformAPI] onGameError called in browser - ignoring');
      return;
    }
    gameCallbacks.error.push(callback);
    // Ensure event listeners are registered
    registerEventListeners().catch(console.error);
  },

  /**
   * Register game log callback (Tauri only)
   * Note: In browser this is a no-op since game cannot run
   */
  onGameLog(callback: (log: string) => void): void {
    if (!isTauri) {
      console.warn('[platformAPI] onGameLog called in browser - ignoring');
      return;
    }
    gameCallbacks.log.push(callback);
    // Ensure event listeners are registered
    registerEventListeners().catch(console.error);
  },

  /**
   * Write text to file (Tauri only)
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!isTauri) {
      throw new Error('writeFile is only available in Tauri desktop app');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('write_file', { path, content });
  },

  /**
   * Read text from file (Tauri only)
   */
  async readFile(path: string): Promise<string> {
    if (!isTauri) {
      throw new Error('readFile is only available in Tauri desktop app');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('read_file', { path });
  },
};

export default platformAPI;
