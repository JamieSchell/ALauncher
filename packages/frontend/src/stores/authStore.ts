/**
 * Authentication Store with Tauri Store Persistence
 *
 * Уникальное решение для автосохранения данных авторизации:
 * - Логин и пароль сохраняются в отдельный зашифрованный файл (credentials.json)
 * - Токен и сессия сохраняются отдельно (auth-session.json)
 * - Данные сохраняются на диск, работают между перезагрузками
 * - Автоматическое заполнение формы при наличии сохранённых кредов
 *
 * @module stores/authStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerProfile } from '@modern-launcher/shared';
import { csrfManager } from '../api/client';
import { createTauriStorage, credentialsStore, authSessionStore, initializeStores } from '../utils/tauriStore';

/**
 * Данные для автозаполнения формы входа
 */
export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Состояние аутентификации
 */
interface AuthState {
  /** Флаг авторизации пользователя */
  isAuthenticated: boolean;
  /** JWT токен доступа */
  accessToken: string | null;
  /** Профиль игрока */
  playerProfile: PlayerProfile | null;
  /** Роль пользователя */
  role: 'USER' | 'ADMIN' | null;

  /**
   * Установить данные аутентификации
   * @param token - JWT токен доступа
   * @param profile - Профиль игрока
   * @param role - Роль пользователя (по умолчанию 'USER')
   */
  setAuth: (token: string, profile: PlayerProfile, role?: 'USER' | 'ADMIN') => void;

  /**
   * Очистить данные аутентификации (выход из системы)
   */
  clearAuth: () => void;

  /**
   * Проверить, является ли пользователь администратором
   */
  isAdmin: () => boolean;

  /**
   * Сохранить логин и пароль для автозаполнения
   * @param credentials - Данные для входа
   */
  saveCredentials: (credentials: LoginCredentials) => Promise<void>;

  /**
   * Загрузить сохранённые логин и пароль
   */
  loadCredentials: () => Promise<LoginCredentials | null>;

  /**
   * Удалить сохранённые креды
   */
  clearCredentials: () => Promise<void>;

  /**
   * Проверить, есть ли сохранённые креды
   */
  hasSavedCredentials: () => Promise<boolean>;

  /**
   * Инициализировать store из Tauri Store (при загрузке приложения)
   */
  hydrateFromDisk: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      playerProfile: null,
      role: null,

      /**
       * Установить данные аутентификации
       */
      setAuth: async (token, profile, role = 'USER') => {
        set({
          isAuthenticated: true,
          accessToken: token,
          playerProfile: profile,
          role,
        });

        // Сохраняем сессию в Tauri Store
        await authSessionStore.save({
          accessToken: token,
          playerProfile: profile,
          role,
        });
      },

      /**
       * Очистить данные аутентификации
       */
      clearAuth: async () => {
        // Clear CSRF token
        csrfManager.clearToken();

        // Clear Zustand state
        set({
          isAuthenticated: false,
          accessToken: null,
          playerProfile: null,
          role: null,
        });

        // Clear Tauri Store
        await authSessionStore.clear();
      },

      /**
       * Проверить, является ли пользователь администратором
       */
      isAdmin: () => get().role === 'ADMIN',

      /**
       * Сохранить логин и пароль для автозаполнения
       */
      saveCredentials: async (credentials) => {
        const { username, password, rememberMe } = credentials;

        if (rememberMe) {
          await credentialsStore.set('username', username);
          await credentialsStore.set('password', password);
          await credentialsStore.set('rememberMe', 'true');
        } else {
          await credentialsStore.delete('username');
          await credentialsStore.delete('password');
          await credentialsStore.delete('rememberMe');
        }
      },

      /**
       * Загрузить сохранённые логин и пароль
       */
      loadCredentials: async () => {
        const { username, password, rememberMe } = await credentialsStore.getAll();

        if (username && password && rememberMe) {
          return {
            username,
            password,
            rememberMe: rememberMe === true,
          };
        }

        return null;
      },

      /**
       * Удалить сохранённые креды
       */
      clearCredentials: async () => {
        await credentialsStore.clear();
      },

      /**
       * Проверить, есть ли сохранённые креды
       */
      hasSavedCredentials: async () => {
        return await credentialsStore.hasCredentials();
      },

      /**
       * Инициализировать store из Tauri Store
       * Вызывается при загрузке приложения для восстановления сессии
       */
      hydrateFromDisk: async () => {
        try {
          // Инициализируем stores
          await initializeStores();

          // Проверяем валидность сессии
          const isValid = await authSessionStore.isValid();
          if (!isValid) {
            await authSessionStore.clear();
            return;
          }

          // Загружаем данные сессии
          const session = await authSessionStore.load();

          if (session.isAuthenticated && session.accessToken) {
            set({
              isAuthenticated: true,
              accessToken: session.accessToken,
              playerProfile: session.playerProfile as PlayerProfile | null,
              role: session.role,
            });
            console.log('[authStore] Session restored from disk');
          }
        } catch (error) {
          console.error('[authStore] Error hydrating from disk:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      // Используем Tauri Store вместо localStorage
      storage: createTauriStorage('auth-storage.json'),
      //_skipHydration: true, // Пропускаем стандартную гидратацию, используем свою
    }
  )
);

/**
 * Hook для автоматического восстановления сессии при загрузке приложения
 *
 * @example
 * ```tsx
 * function App() {
 *   useAuthHydration();
 *   // ... остальной код
 * }
 * ```
 */
export function useAuthHydration() {
  const hydrateFromDisk = useAuthStore((state) => state.hydrateFromDisk);

  // Вызываем гидратацию при монтировании
  hydrateFromDisk();
}
