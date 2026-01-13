/**
 * Secure Storage Adapter for Zustand Persist
 *
 * For Tauri desktop applications, localStorage is isolated and secure enough.
 * No additional encryption needed for desktop context.
 */

import { StateStorage } from 'zustand/middleware';

/**
 * Create a secure storage adapter using localStorage
 *
 * In Tauri desktop apps, localStorage is isolated per application.
 * This provides sufficient security without complex encryption.
 *
 * @param config - Configuration options (prefix for keys)
 * @returns Zustand-compatible storage adapter
 *
 * @example
 * ```ts
 * import { create } from 'zustand';
 * import { persist } from 'zustand/middleware';
 * import { createSecureStorage } from '../utils/secureStorage';
 *
 * const useAuthStore = create(
 *   persist(
 *     (set, get) => ({
 *       accessToken: null,
 *       user: null,
 *     }),
 *     {
 *       name: 'auth-storage',
 *       storage: createSecureStorage(),
 *     }
 *   )
 * );
 * ```
 */
export const createSecureStorage = (config: { prefix?: string } = {}): StateStorage => {
  const { prefix = 'secure-' } = config;

  return {
    getItem: (name: string): string | null => {
      try {
        const key = prefix + name;
        return localStorage.getItem(key) ?? null;
      } catch (error) {
        console.error(`[secureStorage] Error getting item ${name}:`, error);
        return null;
      }
    },

    setItem: (name: string, value: string): void => {
      try {
        const key = prefix + name;
        localStorage.setItem(key, value);
      } catch (error) {
        console.error(`[secureStorage] Error setting item ${name}:`, error);
      }
    },

    removeItem: (name: string): void => {
      try {
        const key = prefix + name;
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`[secureStorage] Error removing item ${name}:`, error);
      }
    },
  };
};

/**
 * Clear all secure data with prefix (useful for logout/testing)
 *
 * Removes all records with the secure prefix from localStorage.
 */
export function clearSecureData(prefix: string = 'secure-'): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(`[secureStorage] Cleared ${keysToRemove.length} items with prefix "${prefix}"`);
  } catch (error) {
    console.error('[secureStorage] Error clearing data:', error);
  }
}

/**
 * Safe storage without encryption (for non-sensitive data)
 *
 * Uses localStorage with error handling.
 *
 * @param storage - Storage implementation (defaults to localStorage)
 * @returns Safe storage adapter
 *
 * @example
 * ```ts
 * const usePreferencesStore = create(
 *   persist(
 *     (set, get) => ({
 *       theme: 'dark',
 *       language: 'en',
 *     }),
 *     {
 *       name: 'preferences-storage',
 *       storage: createSafeStorage(),
 *     }
 *   )
 * );
 * ```
 */
export const createSafeStorage = (storage: Storage = localStorage): StateStorage => {
  return {
    getItem: (name: string): string | null => {
      try {
        return storage.getItem(name);
      } catch (error) {
        console.warn(`[safeStorage] localStorage not available:`, error);
        return null;
      }
    },

    setItem: (name: string, value: string): void => {
      try {
        storage.setItem(name, value);
      } catch (error) {
        console.warn(`[safeStorage] Failed to save to localStorage:`, error);
      }
    },

    removeItem: (name: string): void => {
      try {
        storage.removeItem(name);
      } catch (error) {
        console.warn(`[safeStorage] Failed to remove from localStorage:`, error);
      }
    },
  };
};

/**
 * Check if localStorage is available (not in private browsing, etc.)
 *
 * @returns true if storage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get localStorage usage statistics
 *
 * @returns Object with storage usage info
 */
export const getStorageStats = (): { used: number; available: number; total: number } => {
  try {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }

    const estimatedLimit = 5 * 1024 * 1024; // 5MB

    return {
      used: total,
      available: estimatedLimit - total,
      total: estimatedLimit,
    };
  } catch {
    return { used: 0, available: 0, total: 0 };
  }
};
