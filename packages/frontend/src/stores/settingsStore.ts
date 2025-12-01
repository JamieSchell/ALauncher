/**
 * Settings Store
 *
 * Управляет настройками лаунчера:
 * - Параметры запуска игры (RAM, разрешение, Java путь)
 * - Настройки уведомлений
 * - Выбранный профиль
 * - Рабочая директория
 *
 * Использует Zustand с persist middleware для сохранения настроек в localStorage.
 * Бизнес-логика работы с настройками находится в компонентах и сервисах.
 *
 * @module stores/settingsStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Настройки уведомлений
 */
interface NotificationSettings {
  /** Показывать уведомления на рабочем столе */
  desktop?: boolean;
  /** Воспроизводить звук уведомлений */
  sound?: boolean;
  /** Уведомления об обновлениях клиента */
  clientUpdates?: boolean;
  /** Уведомления о статусе сервера */
  serverStatus?: boolean;
  /** Уведомления о крашах игры */
  gameCrashes?: boolean;
  /** Уведомления о проблемах подключения */
  connectionIssues?: boolean;
  /** Уведомления об ошибках лаунчера */
  launcherErrors?: boolean;
  /** Системные сообщения */
  systemMessages?: boolean;
}

/**
 * Настройки лаунчера
 */
interface Settings {
  /** Выделяемая память (RAM) в МБ */
  ram: number;
  /** Ширина окна игры */
  width: number;
  /** Высота окна игры */
  height: number;
  /** Запуск в полноэкранном режиме */
  fullScreen: boolean;
  /** Автоматический вход на сервер */
  autoEnter: boolean;
  /** ID выбранного профиля */
  selectedProfile: string | null;
  /** Путь к Java исполняемому файлу */
  javaPath: string;
  /** Рабочая директория для игры */
  workingDir: string;
  /** Настройки уведомлений */
  notifications?: NotificationSettings;
}

/**
 * Состояние настроек с методами обновления
 */
interface SettingsState extends Settings {
  /**
   * Обновить настройки (частичное обновление)
   * @param settings - Объект с новыми значениями настроек
   */
  updateSettings: (settings: Partial<Settings>) => void;
  /**
   * Сбросить настройки к значениям по умолчанию
   */
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
