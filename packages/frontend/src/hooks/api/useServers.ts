/**
 * Custom React Query hooks for Servers API
 *
 * Предоставляет типизированные hooks для работы со статусом серверов.
 * Все запросы автоматически кешируются и обновляются согласно политикам QueryClient.
 *
 * @module hooks/api/useServers
 */

import { useQuery } from '@tanstack/react-query';
import { serversAPI } from '../../api/servers';
import { ServerStatus } from '@modern-launcher/shared';

/**
 * Query keys для серверов
 */
export const serverKeys = {
  all: ['servers'] as const,
  status: (address: string, port: number) => [...serverKeys.all, 'status', address, port] as const,
  statistics: (address: string, port: number) => [...serverKeys.all, 'statistics', address, port] as const,
};

/**
 * Hook для получения статуса сервера
 *
 * @param address - Адрес сервера
 * @param port - Порт сервера (по умолчанию 25565)
 * @param options - Опции React Query (enabled, refetchInterval и т.д.)
 * @returns Результат запроса со статусом сервера
 */
export function useServerStatus(
  address: string | null,
  port: number = 25565,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: serverKeys.status(address!, port),
    queryFn: () => serversAPI.getServerStatus(address!, port),
    enabled: !!address && (options?.enabled !== false),
    staleTime: 10 * 1000, // 10 секунд (статус сервера должен обновляться часто)
    refetchInterval: options?.refetchInterval || 30 * 1000, // Обновлять каждые 30 секунд по умолчанию
    ...options,
  });
}

/**
 * Hook для получения статистики сервера
 *
 * @param address - Адрес сервера
 * @param port - Порт сервера (по умолчанию 25565)
 * @param options - Опции React Query
 * @returns Результат запроса со статистикой сервера
 */
export function useServerStatistics(
  address: string | null,
  port: number = 25565,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: serverKeys.statistics(address!, port),
    queryFn: () => serversAPI.getServerStatistics(address!, port),
    enabled: !!address && (options?.enabled !== false),
    staleTime: 60 * 1000, // 1 минута
    ...options,
  });
}

