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
  setAuth: (token: string, profile: PlayerProfile) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      playerProfile: null,
      setAuth: (token, profile) => set({
        isAuthenticated: true,
        accessToken: token,
        playerProfile: profile,
      }),
      clearAuth: () => set({
        isAuthenticated: false,
        accessToken: null,
        playerProfile: null,
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
