/**
 * Type definitions for Electron API
 * These types are available in both Electron and browser environments
 * 
 * Uses shared types from @modern-launcher/shared for consistency
 */

import type { ElectronAPI } from '@modern-launcher/shared';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

