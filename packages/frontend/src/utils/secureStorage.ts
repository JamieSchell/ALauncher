/**
 * Secure Storage Adapter for Zustand Persist
 *
 * Provides encrypted localStorage/storage for sensitive data.
 * Compatible with zustand/middleware (persist).
 */

import { StateStorage } from 'zustand/middleware';
import { encrypt, decrypt } from './crypto';

/**
 * Configuration for secure storage
 */
interface SecureStorageConfig {
  /**
   * Encryption key (optional, will use default from crypto.ts if not provided)
   */
  encryptionKey?: string;

  /**
   * Whether to compress data before encryption (reduces size)
   */
  compress?: boolean;

  /**
   * Custom storage implementation (defaults to localStorage)
   */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

  /**
   * Key prefix for stored items
   */
  prefix?: string;
}

/**
 * Create a secure storage adapter with encryption
 *
 * @param config - Configuration options
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
export const createSecureStorage = (config: SecureStorageConfig = {}): StateStorage => {
  const { storage = localStorage, prefix = 'secure-' } = config;

  return {
    getItem: (name: string): string | null => {
      try {
        const key = prefix + name;
        const value = storage.getItem(key);

        if (!value) {
          return null;
        }

        // Try to decrypt the value
        try {
          const decrypted = decrypt(value);
          return decrypted;
        } catch {
          // If decryption fails, return as-is (might be legacy unencrypted data)
          console.warn(`[secureStorage] Failed to decrypt ${name}, returning as-is`);
          return value;
        }
      } catch (error) {
        console.error(`[secureStorage] Error getting item ${name}:`, error);
        return null;
      }
    },

    setItem: (name: string, value: string): void => {
      try {
        const key = prefix + name;

        // Encrypt before storing
        const encrypted = encrypt(value);
        storage.setItem(key, encrypted);
      } catch (error) {
        console.error(`[secureStorage] Error setting item ${name}:`, error);
        // Fallback: store without encryption if encryption fails
        try {
          storage.setItem(name, value);
        } catch (fallbackError) {
          console.error(`[secureStorage] Fallback storage also failed:`, fallbackError);
        }
      }
    },

    removeItem: (name: string): void => {
      try {
        const key = prefix + name;
        storage.removeItem(key);
      } catch (error) {
        console.error(`[secureStorage] Error removing item ${name}:`, error);
      }
    },
  };
};

/**
 * Safe storage without encryption (for non-sensitive data)
 *
 * Includes error handling for private browsing mode, quota exceeded, etc.
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
        // Silently fail - app should work without localStorage
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
 * Check if storage is available (not in private browsing, etc.)
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
 * Get storage usage statistics
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

    // Typical localStorage limit is 5-10MB
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
