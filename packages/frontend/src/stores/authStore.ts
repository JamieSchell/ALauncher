/**
 * Authentication Store
 *
 * Управляет состоянием аутентификации пользователя:
 * - Токен доступа
 * - Профиль игрока
 * - Роль пользователя (USER/ADMIN)
 * - Состояние авторизации
 *
 * Использует Zustand с persist middleware для сохранения состояния.
 * Чувствительные данные (токены) шифруются перед сохранением.
 * Бизнес-логика аутентификации находится в API слое (api/auth.ts).
 *
 * @module stores/authStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerProfile } from '@modern-launcher/shared';
import { createSecureStorage } from '../utils/secureStorage';

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
   * @returns true, если роль пользователя 'ADMIN'
   */
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      playerProfile: null,
      role: null,
      setAuth: (token, profile, role = 'USER') => set({
        isAuthenticated: true,
        accessToken: token,
        playerProfile: profile,
        role,
      }),
      clearAuth: () => set({
        isAuthenticated: false,
        accessToken: null,
        playerProfile: null,
        role: null,
      }),
      isAdmin: () => get().role === 'ADMIN',
    }),
    {
      name: 'auth-storage',
      // Use encrypted storage to protect access tokens
      storage: createSecureStorage({
        prefix: 'secure-',
      }),
    }
  )
);
