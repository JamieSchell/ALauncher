/**
 * Application Initializer Service
 * Отвечает за инициализацию всех систем при запуске приложения
 */

import ErrorLoggerService from './errorLogger';
import GameLauncherService from './gameLauncher';

class AppInitializer {
  private static isInitialized = false;
  private static startTime = Date.now();

  /**
   * Инициализация всех систем приложения
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('[AppInitializer] Initializing application systems...');

      // 1. Инициализация логгера ошибок
      await ErrorLoggerService.initialize();

      // 2. Настройка глобальных обработчиков ошибок
      ErrorLoggerService.setupGlobalErrorHandlers();

      // 3. Инициализация сервиса запуска игр
      await GameLauncherService.initialize();

      // 4. Логирование запуска приложения
      await this.logAppStartup();

      // 5. Настройка мониторинга производительности
      this.setupPerformanceMonitoring();

      // 6. Настройка обработки критических ошибок
      this.setupCriticalErrorHandling();

      this.isInitialized = true;

      console.log('[AppInitializer] All systems initialized successfully');

      // Логируем успешную инициализацию
      await ErrorLoggerService.logInfo('APP_INITIALIZED', {
        component: 'AppInitializer',
        action: 'app_startup_complete',
      });

    } catch (error: any) {
      console.error('[AppInitializer] Failed to initialize:', error);

      // Логируем критическую ошибку инициализации
      await ErrorLoggerService.logError(error, {
        component: 'AppInitializer',
        action: 'app_initialization_failed',
        statusCode: 500,
      });

      throw error;
    }
  }

  /**
   * Логирование запуска приложения
   */
  private static async logAppStartup(): Promise<void> {
    const initTime = Date.now() - this.startTime;

    const systemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      initTime: `${initTime}ms`,
    };

    await ErrorLoggerService.logInfo('APP_STARTUP', {
      component: 'AppInitializer',
      action: 'application_startup',
      systemInfo: JSON.stringify(systemInfo),
    });
  }

  /**
   * Настройка мониторинга производительности
   */
  private static setupPerformanceMonitoring(): void {
    // Мониторинг загрузки страницы
    window.addEventListener('load', () => {
      const loadTime = Date.now() - this.startTime;
      ErrorLoggerService.logPerformance('page_load', loadTime);
    });

    // Мониторинг первых значимых отрисовок (First Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              ErrorLoggerService.logPerformance('first_contentful_paint', entry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('[AppInitializer] Performance monitoring not available:', error);
      }
    }

    // Мониторинг долгих операций
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - start;

        // Логируем только медленные запросы (> 5 секунд)
        if (duration > 5000) {
          ErrorLoggerService.logPerformance(`fetch_${args[0]}`, duration);
        }

        return response;
      } catch (error) {
        const duration = Date.now() - start;
        ErrorLoggerService.logNetworkError(
          args[0] instanceof Request ? args[0].url : String(args[0]),
          'FETCH',
          0,
          error as Error
        );
        throw error;
      }
    };
  }

  /**
   * Настройка обработки критических ошибок
   */
  private static setupCriticalErrorHandling(): void {
    // Отслеживание ошибок памяти
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        // Если используется более 90% памяти, логируем предупреждение
        if (usedMemory > 0.9) {
          ErrorLoggerService.logError(
            new Error(`High memory usage: ${Math.round(usedMemory * 100)}%`),
            {
              component: 'MemoryMonitor',
              action: 'memory_usage_warning',
            }
          );
        }
      };

      // Проверяем каждые 30 секунд
      setInterval(checkMemory, 30000);
    }

    // Отслеживание ошибок WebGL (важно для игрового лаунчера)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      ErrorLoggerService.logError(
        new Error('WebGL not supported'),
        {
          component: 'WebGLChecker',
          action: 'webgl_support_check',
        }
      );
    }

    // Отслеживание ошибок WebAssembly (важно для Tauri)
    if ('WebAssembly' in window) {
      // Проверяем поддерживаемые функции
      try {
        const memory = new WebAssembly.Memory({ initial: 1 });
        memory.grow(1);
      } catch (error) {
        ErrorLoggerService.logError(
          new Error('WebAssembly memory allocation failed'),
          {
            component: 'WebAssemblyChecker',
            action: 'wasm_memory_check',
          }
        );
      }
    }
  }

  /**
   * Очистка ресурсов при выгрузке приложения
   */
  static cleanup(): void {
    console.log('[AppInitializer] Cleaning up application resources...');

    GameLauncherService.cleanup();
    ErrorLoggerService.cleanup();

    // Отправляем финальный лог
    const uptime = Date.now() - this.startTime;
    console.log(`[AppInitializer] Application uptime: ${Math.round(uptime / 1000)}s`);
  }

  /**
   * Получение статистики инициализации
   */
  static getInitStats() {
    return {
      isInitialized: this.isInitialized,
      startTime: this.startTime,
      uptime: Date.now() - this.startTime,
    };
  }
}

// Автоматическая инициализация при импорте
if (typeof window !== 'undefined') {
  // Инициализируем после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      AppInitializer.initialize().catch(console.error);
    });
  } else {
    // DOM уже загружен
    AppInitializer.initialize().catch(console.error);
  }

  // Очистка при закрытии
  window.addEventListener('beforeunload', () => {
    AppInitializer.cleanup();
  });
}

export default AppInitializer;