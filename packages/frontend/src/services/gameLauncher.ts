/**
 * Game Launcher Service
 * Отвечает за запуск игровых клиентов и отслеживание их состояния
 */

import { invoke } from '@tauri-apps/api/core';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import ErrorLoggerService from './errorLogger';
import { ClientProfile } from '../api/types';

interface LaunchOptions {
  profile: ClientProfile;
  username?: string;
  session?: string;
  serverAddress?: string;
  serverPort?: number;
}

interface LaunchResult {
  success: boolean;
  processId?: string;
  error?: string;
}

interface GameProcess {
  id: string;
  profileId: string;
  startTime: number;
  status: 'starting' | 'running' | 'crashed' | 'stopped';
  exitCode?: number;
  crashReport?: {
    exitCode: number;
    errorMessage: string;
    stackTrace?: string;
    stderrOutput?: string;
    stdoutOutput?: string;
  };
}

class GameLauncherService {
  private static activeProcesses: Map<string, GameProcess> = new Map();
  private static crashMonitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Инициализация сервиса
   */
  static async initialize() {
    // Начать мониторинг активных процессов
    this.startCrashMonitoring();

    // Добавить обработчик для отслеживания крашей при закрытии окна
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Запуск игрового клиента
   */
  static async launchGame(options: LaunchOptions): Promise<LaunchResult> {
    const { profile, username, session, serverAddress, serverPort } = options;
    const { accessToken } = useAuthStore.getState();
    const { javaPath, ram, width, height, fullScreen } = useSettingsStore.getState();

    try {
      // Логируем попытку запуска
      await ErrorLoggerService.logInfo('GAME_LAUNCH_ATTEMPT', {
        component: 'GameLauncher',
        action: 'launch_game',
        profileId: profile.id,
        profileVersion: profile.version,
        serverAddress: serverAddress || profile.serverAddress,
        serverPort: serverPort || profile.serverPort,
        javaVersion: profile.jvmVersion,
        launcherVersion: await this.getLauncherVersion(),
      });

      // Подготовка параметров запуска
      const launchParams = {
        profileId: profile.id,
        username: username || 'Player',
        uuid: this.generateUUID(),
        accessToken: accessToken || session || 'demo',
        gameDir: `/opt/ALauncher/packages/backend/updates/${profile.clientDirectory || profile.version}`,
        assetsDir: '/opt/ALauncher/packages/backend/updates/assets',
        resolution: {
          width: width || 854,
          height: height || 480,
        },
        fullScreen: fullScreen || false,
        javaPath: javaPath || 'java',
        javaVersion: profile.jvmVersion || '17',
        ram: ram || '2048',
        jvmArgs: profile.jvmArgs || [],
        clientArgs: profile.clientArgs || [],
        mainClass: profile.mainClass,
        classPath: profile.classPath || [],
        serverAddress: serverAddress || profile.serverAddress,
        serverPort: serverPort || profile.serverPort,
      };

      // Запуск процесса через Tauri
      const result = await invoke<{ success: boolean; processId?: string; error?: string }>(
        'launch_game_client',
        { launchParams }
      );

      if (result.success && result.processId) {
        // Регистрация процесса
        const process: GameProcess = {
          id: result.processId,
          profileId: profile.id,
          startTime: Date.now(),
          status: 'starting',
        };

        this.activeProcesses.set(result.processId, process);

        // Начать мониторинг этого процесса
        this.monitorProcess(result.processId);

        await ErrorLoggerService.logInfo('GAME_LAUNCH_SUCCESS', {
          component: 'GameLauncher',
          action: 'launch_game_success',
          processId: result.processId,
          profileId: profile.id,
        });

        return { success: true, processId: result.processId };
      } else {
        const error = result.error || 'Unknown error occurred';

        await ErrorLoggerService.logError(error, {
          component: 'GameLauncher',
          action: 'launch_game_failed',
          profileId: profile.id,
          errorType: 'CLIENT_LAUNCH_ERROR',
          statusCode: 500,
        });

        return { success: false, error };
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);

      await ErrorLoggerService.logError(errorMessage, {
        component: 'GameLauncher',
        action: 'launch_game_error',
        profileId: profile.id,
        errorType: 'CLIENT_LAUNCH_ERROR',
        statusCode: 500,
        stackTrace: error?.stack,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Мониторинг конкретного процесса
   */
  private static async monitorProcess(processId: string) {
    const process = this.activeProcesses.get(processId);
    if (!process) return;

    try {
      // Проверяем статус процесса каждую секунду
      const checkInterval = setInterval(async () => {
        try {
          const status = await invoke<{
            running: boolean;
            exitCode?: number;
            stdout?: string;
            stderr?: string;
          }>('check_game_process', { processId });

          if (!status.running) {
            clearInterval(checkInterval);

            // Процесс завершился
            process.status = 'stopped';
            process.exitCode = status.exitCode;

            // Если exitCode не 0, это краш
            if (status.exitCode && status.exitCode !== 0) {
              process.status = 'crashed';
              process.crashReport = {
                exitCode: status.exitCode,
                errorMessage: `Process exited with code ${status.exitCode}`,
                stderrOutput: status.stderr,
                stdoutOutput: status.stdout,
              };

              // Отправляем отчет о краше
              await this.reportCrash(process);
            }

            await ErrorLoggerService.logInfo('GAME_PROCESS_ENDED', {
              component: 'GameLauncher',
              action: 'process_ended',
              processId: processId,
              exitCode: status.exitCode,
              crashed: process.status === 'crashed',
            });
          }
        } catch (error) {
          console.error(`Error monitoring process ${processId}:`, error);
          clearInterval(checkInterval);
        }
      }, 1000);

      // Очистка через 10 минут (если процесс все еще работает)
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10 * 60 * 1000);
    } catch (error) {
      console.error(`Failed to monitor process ${processId}:`, error);
    }
  }

  /**
   * Отправка отчета о краше на сервер
   */
  private static async reportCrash(process: GameProcess) {
    if (!process.crashReport) return;

    try {
      const { crashesAPI } = await import('../api/crashes');
      const { playerProfile } = useAuthStore.getState();

      await crashesAPI.logGameCrash({
        exitCode: process.crashReport.exitCode,
        errorMessage: process.crashReport.errorMessage,
        stackTrace: process.crashReport.stderrOutput,
        stderrOutput: process.crashReport.stderrOutput,
        stdoutOutput: process.crashReport.stdoutOutput,
        profileId: process.profileId,
        javaVersion: 'unknown', // Будет получено из процесса
        javaPath: 'unknown',
        serverAddress: undefined,
        serverPort: undefined,
      });

      console.log(`[GameLauncher] Crash reported for process ${process.id}`);
    } catch (error) {
      console.error(`[GameLauncher] Failed to report crash for process ${process.id}:`, error);
    }
  }

  /**
   * Запуск мониторинга всех процессов
   */
  private static startCrashMonitoring() {
    if (this.crashMonitoringInterval) return;

    this.crashMonitoringInterval = setInterval(async () => {
      // Проверяем все активные процессы
      for (const [processId, process] of this.activeProcesses.entries()) {
        if (process.status === 'starting' || process.status === 'running') {
          try {
            const status = await invoke<{ running: boolean }>('check_game_process', { processId });

            if (!status.running && process.status === 'running') {
              // Процесс неожиданно завершился
              process.status = 'crashed';
              process.crashReport = {
                exitCode: -1,
                errorMessage: 'Process terminated unexpectedly',
              };

              await this.reportCrash(process);
            } else if (status.running && process.status === 'starting') {
              // Процесс успешно запустился
              process.status = 'running';
            }
          } catch (error) {
            // Не можем проверить статус, возможно процесс уже завершился
          }
        }
      }
    }, 5000); // Проверяем каждые 5 секунд
  }

  /**
   * Получение списка активных процессов
   */
  static getActiveProcesses(): GameProcess[] {
    return Array.from(this.activeProcesses.values());
  }

  /**
   * Проверка, запущена ли игра
   */
  static isGameRunning(): boolean {
    return Array.from(this.activeProcesses.values())
      .some(p => p.status === 'running' || p.status === 'starting');
  }

  /**
   * Получение версии лаунчера
   */
  private static async getLauncherVersion(): Promise<string> {
    try {
      const { tauriApi } = await import('../api/tauri');
      return await tauriApi.getAppVersion();
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Генерация UUID для игрока
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Очистка ресурсов
   */
  static cleanup() {
    if (this.crashMonitoringInterval) {
      clearInterval(this.crashMonitoringInterval);
      this.crashMonitoringInterval = null;
    }

    this.activeProcesses.clear();
  }

  /**
   * Убить процесс игры
   */
  static async killGame(processId: string): Promise<boolean> {
    try {
      await invoke('kill_game_process', { processId });

      const process = this.activeProcesses.get(processId);
      if (process) {
        process.status = 'stopped';
      }

      return true;
    } catch (error) {
      console.error(`Failed to kill process ${processId}:`, error);
      return false;
    }
  }

  /**
   * Убить все игровые процессы
   */
  static async killAllGames(): Promise<void> {
    for (const processId of this.activeProcesses.keys()) {
      await this.killGame(processId);
    }
  }
}

export default GameLauncherService;
export type { LaunchOptions, LaunchResult, GameProcess };