/**
 * Settings store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  ram: number;
  width: number;
  height: number;
  fullScreen: boolean;
  autoEnter: boolean;
  selectedProfile: string | null;
  javaPath: string;
  workingDir: string;
}

interface SettingsState extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  ram: 2048,
  width: 1280,
  height: 720,
  fullScreen: false,
  autoEnter: false,
  selectedProfile: null,
  javaPath: 'java',
  workingDir: './minecraft',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
    }
  )
);
