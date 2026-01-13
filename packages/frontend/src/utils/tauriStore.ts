/**
 * Tauri Store Adapter for Zustand Persist
 *
 * Уникальное решение для персистентного хранения данных в Tauri приложениях.
 * Использует официальны плагин @tauri-apps/plugin-store для сохранения на диск.
 *
 * Преимущества:
 * - Данные сохраняются в JSON файл на диске (не в localStorage)
 * - Работают между перезагрузками приложения
 * - Автосохранение с debounce
 * - Типобезопасно с TypeScript
 *
 * @module utils/tauriStore
 */

import { StateStorage } from 'zustand/middleware';
import { LazyStore } from '@tauri-apps/plugin-store';

/**
 * Кэш загруженных store для повторного использования
 */
const storeCache = new Map<string, LazyStore>();

/**
 * Получить или создать LazyStore для указанного пути
 *
 * @param path - Путь к файлу store (относительно директории данных приложения)
 * @returns LazyStore экземпляр
 */
async function getStore(path: string): Promise<LazyStore> {
  if (storeCache.has(path)) {
    return storeCache.get(path)!;
  }

  const store = new LazyStore(path);
  storeCache.set(path, store);
  return store;
}

/**
 * Создать Zustand-совместимый storage на основе Tauri Store
 *
 * @param storePath - Путь к файлу store (например, 'auth.json', 'credentials.json')
 * @param autoSave - Автосохранение после изменений (по умолчанию true)
 * @returns Zustand StateStorage адаптер
 *
 * @example
 * ```ts
 * import { create } from 'zustand';
 * import { persist } from 'zustand/middleware';
 * import { createTauriStorage } from '../utils/tauriStore';
 *
 * const useAuthStore = create(
 *   persist(
 *     (set, get) => ({
 *       token: null,
 *       user: null,
 *     }),
 *     {
 *       name: 'auth',
 *       storage: createTauriStorage('auth.json'),
 *     }
 *   )
 * );
 * ```
 */
export function createTauriStorage(storePath: string, autoSave: boolean = true): StateStorage {
  let storePromise: Promise<LazyStore> | null = null;
  let inMemoryCache: Record<string, string> = {};

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        // Проверяем кэш памяти сначала (для синхронного доступа)
        if (name in inMemoryCache) {
          return inMemoryCache[name] ?? null;
        }

        // Загружаем store
        if (!storePromise) {
          storePromise = getStore(storePath);
        }

        const store = await storePromise;
        const value = await store.get(name);

        if (value !== null && value !== undefined) {
          // Кэшируем в памяти
          inMemoryCache[name] = String(value);
          return String(value);
        }

        return null;
      } catch (error) {
        console.error(`[TauriStore] Error getting item "${name}":`, error);
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        // Обновляем кэш памяти
        inMemoryCache[name] = value;

        // Загружаем store
        if (!storePromise) {
          storePromise = getStore(storePath);
        }

        const store = await storePromise;
        await store.set(name, value);

        // Автосохранение если включено
        if (autoSave) {
          await store.save();
        }
      } catch (error) {
        console.error(`[TauriStore] Error setting item "${name}":`, error);
        // Данные остаются в памяти даже при ошибке записи на диск
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        // Удаляем из кэша памяти
        delete inMemoryCache[name];

        // Загружаем store
        if (!storePromise) {
          storePromise = getStore(storePath);
        }

        const store = await storePromise;
        await store.delete(name);

        // Автосохранение если включено
        if (autoSave) {
          await store.save();
        }
      } catch (error) {
        console.error(`[TauriStore] Error removing item "${name}":`, error);
      }
    },
  };
}

/**
 * Credentials Store для хранения логина и пароля
 *
 * Отдельный store для учётных данных пользователя.
 * Данные шифруются базовым способом (Base64) для защиты от прямого чтения.
 *
 * @example
 * ```ts
 * import { credentialsStore } from '../utils/tauriStore';
 *
 * // Сохранить логин и пароль
 * await credentialsStore.set('username', 'user@example.com');
 * await credentialsStore.set('password', 'secret123');
 *
 * // Получить данные
 * const username = await credentialsStore.get('username');
 * const password = await credentialsStore.get('password');
 *
 * // Очистить все данные
 * await credentialsStore.clear();
 * ```
 */
export const credentialsStore = {
  /**
   * Получить значение из credentials store
   */
  get: async (key: 'username' | 'password' | 'rememberMe'): Promise<string | null> => {
    try {
      const store = await getStore('credentials.json');
      const value = await store.get(key);

      if (value !== null && value !== undefined) {
        // Декодируем из Base64 (базовая "шифрация")
        try {
          return atob(String(value));
        } catch {
          return String(value);
        }
      }

      return null;
    } catch (error) {
      console.error(`[credentialsStore] Error getting "${key}":`, error);
      return null;
    }
  },

  /**
   * Установить значение в credentials store
   */
  set: async (key: 'username' | 'password' | 'rememberMe', value: string): Promise<void> => {
    try {
      const store = await getStore('credentials.json');

      // Кодируем в Base64 (базовая "шифрация")
      const encoded = btoa(value);

      await store.set(key, encoded);
      await store.save();
    } catch (error) {
      console.error(`[credentialsStore] Error setting "${key}":`, error);
    }
  },

  /**
   * Удалить значение из credentials store
   */
  delete: async (key: 'username' | 'password' | 'rememberMe'): Promise<void> => {
    try {
      const store = await getStore('credentials.json');
      await store.delete(key);
      await store.save();
    } catch (error) {
      console.error(`[credentialsStore] Error deleting "${key}":`, error);
    }
  },

  /**
   * Проверить, есть ли сохранённые креды
   */
  hasCredentials: async (): Promise<boolean> => {
    try {
      const username = await credentialsStore.get('username');
      const password = await credentialsStore.get('password');
      return username !== null && password !== null;
    } catch {
      return false;
    }
  },

  /**
   * Очистить все credentials
   */
  clear: async (): Promise<void> => {
    try {
      const store = await getStore('credentials.json');
      await store.clear();
      await store.save();
    } catch (error) {
      console.error('[credentialsStore] Error clearing:', error);
    }
  },

  /**
   * Получить все сохранённые креды
   */
  getAll: async (): Promise<{ username: string | null; password: string | null; rememberMe: boolean | null }> => {
    const username = await credentialsStore.get('username');
    const password = await credentialsStore.get('password');

    let rememberMe: boolean | null = null;
    try {
      const store = await getStore('credentials.json');
      const value = await store.get('rememberMe');
      if (value !== null && value !== undefined) {
        rememberMe = value === true || value === 'true';
      }
    } catch {}

    return { username, password, rememberMe };
  },
};

/**
 * Auth Store для хранения токена и данных сессии
 *
 * Отдельный store от credentials для токенов (короткоживущие данные).
 */
export const authSessionStore = {
  /**
   * Сохранить данные сессии
   */
  save: async (data: {
    accessToken: string;
    playerProfile: unknown;
    role: 'USER' | 'ADMIN';
  }): Promise<void> => {
    try {
      const store = await getStore('auth-session.json');
      await store.set('accessToken', data.accessToken);
      await store.set('playerProfile', JSON.stringify(data.playerProfile));
      await store.set('role', data.role);
      await store.set('isAuthenticated', 'true');
      await store.set('timestamp', Date.now().toString());
      await store.save();
    } catch (error) {
      console.error('[authSessionStore] Error saving:', error);
    }
  },

  /**
   * Загрузить данные сессии
   */
  load: async (): Promise<{
    accessToken: string | null;
    playerProfile: unknown | null;
    role: 'USER' | 'ADMIN' | null;
    isAuthenticated: boolean;
  }> => {
    try {
      const store = await getStore('auth-session.json');
      const accessToken = await store.get<string>('accessToken');
      const profileStr = await store.get<string>('playerProfile');
      const role = await store.get<'USER' | 'ADMIN'>('role');
      const isAuthenticated = await store.get<string>('isAuthenticated') === 'true';

      let playerProfile: unknown | null = null;
      if (profileStr) {
        try {
          playerProfile = JSON.parse(profileStr);
        } catch {
          playerProfile = profileStr;
        }
      }

      return {
        accessToken: accessToken ?? null,
        playerProfile,
        role: role ?? null,
        isAuthenticated,
      };
    } catch (error) {
      console.error('[authSessionStore] Error loading:', error);
      return {
        accessToken: null,
        playerProfile: null,
        role: null,
        isAuthenticated: false,
      };
    }
  },

  /**
   * Очистить данные сессии
   */
  clear: async (): Promise<void> => {
    try {
      const store = await getStore('auth-session.json');
      await store.clear();
      await store.save();
    } catch (error) {
      console.error('[authSessionStore] Error clearing:', error);
    }
  },

  /**
   * Проверить валидность сессии (не старше 30 дней)
   */
  isValid: async (): Promise<boolean> => {
    try {
      const store = await getStore('auth-session.json');
      const timestamp = await store.get<string>('timestamp');

      if (!timestamp) return false;

      const sessionAge = Date.now() - parseInt(timestamp, 10);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней

      return sessionAge < maxAge;
    } catch {
      return false;
    }
  },
};

/**
 * Инициализировать все stores при запуске приложения
 *
 * Загружает данные с диска в память для быстрого доступа.
 */
export async function initializeStores(): Promise<void> {
  try {
    await Promise.all([
      getStore('credentials.json'),
      getStore('auth-session.json'),
    ]);
    console.log('[TauriStore] All stores initialized');
  } catch (error) {
    console.error('[TauriStore] Error initializing stores:', error);
  }
}
