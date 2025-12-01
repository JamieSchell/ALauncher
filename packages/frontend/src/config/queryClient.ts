/**
 * React Query Client Configuration
 *
 * Единая конфигурация QueryClient для всего приложения.
 * Определяет политики кеширования, retry стратегии и другие настройки.
 *
 * @module config/queryClient
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Создает и настраивает QueryClient с оптимальными политиками кеширования
 *
 * Настройки:
 * - staleTime: время, в течение которого данные считаются актуальными
 * - gcTime: время хранения неактивных данных в кеше (garbage collection time)
 * - refetchOnWindowFocus: автоматическое обновление при фокусе окна
 * - retry: стратегия повторных попыток при ошибках
 *
 * @returns Настроенный экземпляр QueryClient
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Данные считаются актуальными 30 секунд
        staleTime: 30 * 1000,
        // Неактивные данные хранятся в кеше 5 минут
        gcTime: 5 * 60 * 1000, // ранее cacheTime
        // Не обновлять автоматически при фокусе окна (можно переопределить в конкретных запросах)
        refetchOnWindowFocus: false,
        // Повторять запрос при ошибке 1 раз
        retry: 1,
        // Интервал между повторными попытками
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Не обновлять при переподключении
        refetchOnReconnect: true,
        // Не обновлять при монтировании, если данные свежие
        refetchOnMount: true,
      },
      mutations: {
        // Повторять мутации при ошибке 0 раз (по умолчанию)
        retry: 0,
        // Интервал между повторными попытками для мутаций
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Экспорт предварительно созданного QueryClient
 * Используется в main.tsx для QueryClientProvider
 */
export const queryClient = createQueryClient();

