/**
 * Platform Detection Utilities
 * Simple platform detection for Tauri/Electron environments
 */

import { isTauri } from './tauri';

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
};

export default platformAPI;
