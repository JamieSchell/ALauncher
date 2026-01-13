/**
 * Game Launcher Service
 * Отвечает за запуск игровых клиентов и отслеживание их состояния
 */

import { tauriApi } from '../api/tauri';
import { isTauri } from '../api/tauri';
import { useAuthStore } from '../stores/authStore';
import { crashesAPI } from '../api/crashes';
import { useSettingsStore } from '../stores/settingsStore';
import ErrorLoggerService from './errorLogger';
import { GameProfile } from '../api/types';
import { platformAPI } from '../api/platformSimple';

// Динамический импорт invoke для Tauri
let invoke: Function | null = null;

// Загружаем invoke при инициализации модуля
if (typeof window !== 'undefined' && (
  window.location?.protocol === 'tauri:' ||
  '__TAURI__' in window ||
  '__TAURI_INTERNALS__' in window
)) {
  import('@tauri-apps/api/core').then(module => {
    invoke = module.invoke;
    console.log('[GameLauncher] ✅ Tauri invoke API loaded');
  }).catch((e) => {
    console.error('[GameLauncher] ❌ Failed to load Tauri invoke API:', e);
  });
}

// Helper function to get invoke safely
async function getInvoke(): Promise<Function> {
  if (!invoke) {
    // Try to load invoke if not loaded yet
    try {
      const module = await import('@tauri-apps/api/core');
      invoke = module.invoke;
      console.log('[GameLauncher] ✅ Tauri invoke API loaded on demand');
    } catch (e) {
      throw new Error('Tauri invoke API not available. Make sure you are running in Tauri environment.');
    }
  }
  return invoke;
}

interface LaunchOptions {
  profile: GameProfile;
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
  // Track intervals for cleanup
  monitorInterval?: NodeJS.Timeout;
  cleanupTimeout?: NodeJS.Timeout;
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
    // Проверка: игра запускается только в Tauri
    if (!isTauri) {
      return {
        success: false,
        error: 'Game launch is only available in Tauri desktop app. Please use the desktop application instead of web browser.',
      };
    }

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

      // Получаем правильную директорию для обновлений через Tauri
      let updatesDir = '/opt/ALauncher/packages/backend/updates'; // fallback
      try {
        const invokeFn = await getInvoke();
        updatesDir = await invokeFn<string>('get_updates_dir', {});
        console.log('[GameLauncher] Using updates directory:', updatesDir);
      } catch (e) {
        console.warn('[GameLauncher] Failed to get updates dir, using fallback:', e);
      }

      // Dynamic import of path module (Tauri only)
      const { path } = await import('@tauri-apps/api');
      const gameDir = await path.join(updatesDir, profile.clientDirectory || profile.version);
      const assetsDir = await path.join(updatesDir, 'assets');

      // Подготовка параметров запуска (все поля в snake_case как в Rust)
      const launchParams = {
        profile_id: profile.id,
        username: username || 'Player',
        uuid: this.generateUUID(),
        access_token: accessToken || session || 'demo',
        game_dir: gameDir,
        assets_dir: assetsDir,
        resolution: {
          width: width || 854,
          height: height || 480,
        },
        full_screen: fullScreen || false,
        java_path: javaPath || 'java',
        java_version: profile.jvmVersion || '17',
        ram: String(ram || '2048'),
        jvm_args: profile.jvmArgs || [],
        client_args: profile.clientArgs || [],
        main_class: profile.mainClass,
        class_path: profile.classPath || [],
        server_address: serverAddress || profile.serverAddress,
        server_port: serverPort || profile.serverPort,
      };

      console.log('[GameLauncher] Launch params prepared:', JSON.stringify(launchParams, null, 2));

      // Проверка обязательных полей
      if (!profile.mainClass) {
        const error = 'mainClass is not defined in profile';
        console.error('[GameLauncher]', error);
        await ErrorLoggerService.logError(error, {
          component: 'GameLauncher',
          action: 'launch_game_failed',
          profileId: profile.id,
          errorType: 'MISSING_REQUIRED_FIELD',
          statusCode: 500,
        });
        return { success: false, error };
      }

      // Получаем invoke безопасно
      const invokeFn = await getInvoke();

      console.log('[GameLauncher] Invoking launch_game_client command...');

      let result;
      try {
        result = await invokeFn<{ success: boolean; processId?: string; error?: string }>(
          'launch_game_client',
          { launchParams }
        );
        console.log('[GameLauncher] Launch result:', JSON.stringify(result, null, 2));
      } catch (invokeError) {
        const errorMsg = `Invoke error: ${invokeError}`;
        console.error('[GameLauncher]', errorMsg, invokeError);
        await ErrorLoggerService.logError(errorMsg, {
          component: 'GameLauncher',
          action: 'launch_game_invoke_error',
          profileId: profile.id,
          errorType: 'INVOKE_ERROR',
          statusCode: 500,
        });
        return { success: false, error: errorMsg };
      }

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

        console.error('[GameLauncher] Launch failed. Full result:', JSON.stringify(result, null, 2));

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
          const invokeFn = await getInvoke();
          const status = await invokeFn<{
            running: boolean;
            exitCode?: number;
            stdout?: string;
            stderr?: string;
          }>('check_game_process', { processId });

          if (!status.running) {
            // Clear intervals
            clearInterval(checkInterval);
            if (process.cleanupTimeout) {
              clearTimeout(process.cleanupTimeout);
            }

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

            // Remove from active processes after completion
            this.activeProcesses.delete(processId);

            await ErrorLoggerService.logInfo('GAME_PROCESS_ENDED', {
              component: 'GameLauncher',
              action: 'process_ended',
              processId: processId,
              exitCode: status.exitCode,
              crashed: process.status === 'crashed',
            });

            console.log(`[GameLauncher] Process ${processId} ended with code ${status.exitCode}.`);
            console.log(`[GameLauncher] stdout:`, status.stdout);
            console.error(`[GameLauncher] stderr:`, status.stderr);
          }
        } catch (error) {
          console.error(`Error monitoring process ${processId}:`, error);
          // Clear intervals on error
          clearInterval(checkInterval);
          if (process.cleanupTimeout) {
            clearTimeout(process.cleanupTimeout);
          }
          // Remove from active processes
          this.activeProcesses.delete(processId);
        }
      }, 1000);

      // Store interval reference for cleanup
      process.monitorInterval = checkInterval;

      // Очистка через 10 минут (если процесс все еще работает)
      const cleanupTimeout = setTimeout(() => {
        clearInterval(checkInterval);
        // Remove from active processes if still present
        if (this.activeProcesses.has(processId)) {
          console.warn(`[GameLauncher] Process ${processId} timeout, cleaning up`);
          this.activeProcesses.delete(processId);
        }
      }, 10 * 60 * 1000);

      // Store timeout reference
      process.cleanupTimeout = cleanupTimeout;
    } catch (error) {
      console.error(`Failed to monitor process ${processId}:`, error);
      // Clean up on failure
      this.activeProcesses.delete(processId);
    }
  }

  /**
   * Отправка отчета о краше на сервер
   */
  private static async reportCrash(process: GameProcess) {
    if (!process.crashReport) return;

    try {
      const { playerProfile } = useAuthStore.getState();

      await crashesAPI.logCrash({
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
      const now = Date.now();
      const ZOMBIE_THRESHOLD = 30 * 60 * 1000; // 30 minutes

      // Очистка zombie процессов
      for (const [processId, process] of this.activeProcesses.entries()) {
        if (now - process.startTime > ZOMBIE_THRESHOLD) {
          console.warn(`[GameLauncher] Cleaning up zombie process: ${processId}`);
          // Clear intervals
          if (process.monitorInterval) {
            clearInterval(process.monitorInterval);
          }
          if (process.cleanupTimeout) {
            clearTimeout(process.cleanupTimeout);
          }
          this.activeProcesses.delete(processId);
        }
      }

      // Проверяем все активные процессы
      for (const [processId, process] of this.activeProcesses.entries()) {
        if (process.status === 'starting' || process.status === 'running') {
          try {
            const invokeFn = await getInvoke();
            const status = await invokeFn<{ running: boolean }>('check_game_process', { processId });

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
    // Clear crash monitoring interval
    if (this.crashMonitoringInterval) {
      clearInterval(this.crashMonitoringInterval);
      this.crashMonitoringInterval = null;
    }

    // Clear all process intervals and timeouts
    for (const [processId, process] of this.activeProcesses.entries()) {
      // Clear monitor interval
      if (process.monitorInterval) {
        clearInterval(process.monitorInterval);
      }

      // Clear cleanup timeout
      if (process.cleanupTimeout) {
        clearTimeout(process.cleanupTimeout);
      }

      console.log(`[GameLauncher] Cleaned up process ${processId}`);
    }

    // Clear all processes
    this.activeProcesses.clear();
    console.log('[GameLauncher] All processes cleaned up');
  }

  /**
   * Убить процесс игры
   */
  static async killGame(processId: string): Promise<boolean> {
    try {
      const invokeFn = await getInvoke();
      await invokeFn('kill_game_process', { processId });

      const process = this.activeProcesses.get(processId);
      if (process) {
        // Clear intervals
        if (process.monitorInterval) {
          clearInterval(process.monitorInterval);
        }
        if (process.cleanupTimeout) {
          clearTimeout(process.cleanupTimeout);
        }

        process.status = 'stopped';

        // Remove from active processes
        this.activeProcesses.delete(processId);
      }

      return true;
    } catch (error) {
      console.error(`Failed to kill process ${processId}:`, error);

      // Clean up from active processes even if kill failed
      const process = this.activeProcesses.get(processId);
      if (process) {
        if (process.monitorInterval) {
          clearInterval(process.monitorInterval);
        }
        if (process.cleanupTimeout) {
          clearTimeout(process.cleanupTimeout);
        }
        this.activeProcesses.delete(processId);
      }

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