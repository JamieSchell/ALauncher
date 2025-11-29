/**
 * Authentication store using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerProfile } from '@modern-launcher/shared';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  playerProfile: PlayerProfile | null;
  role: 'USER' | 'ADMIN' | null;
  setAuth: (token: string, profile: PlayerProfile, role?: 'USER' | 'ADMIN') => void;
  clearAuth: () => void;
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
    }
  )
);
