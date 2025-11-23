/**
 * Settings store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettings {
  desktop?: boolean;
  sound?: boolean;
  clientUpdates?: boolean;
  serverStatus?: boolean;
  gameCrashes?: boolean;
  connectionIssues?: boolean;
  launcherErrors?: boolean;
  systemMessages?: boolean;
}

interface Settings {
  ram: number;
  width: number;
  height: number;
  fullScreen: boolean;
  autoEnter: boolean;
  selectedProfile: string | null;
  javaPath: string;
  workingDir: string;
  notifications?: NotificationSettings;
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
  notifications: {
    desktop: true,
    sound: true,
    clientUpdates: true,
    serverStatus: true,
    gameCrashes: true,
    connectionIssues: true,
    launcherErrors: true,
    systemMessages: true,
  },
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
