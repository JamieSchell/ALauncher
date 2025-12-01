/**
 * Custom React Query hooks for Crashes API
 *
 * Предоставляет типизированные hooks для работы с крашами и ошибками.
 * Все запросы автоматически кешируются и обновляются согласно политикам QueryClient.
 *
 * @module hooks/api/useCrashes
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { crashesAPI, LogCrashRequest, LogConnectionIssueRequest, LogLauncherErrorRequest } from '../../api/crashes';

/**
 * Query keys для крашей
 */
export const crashKeys = {
  all: ['crashes'] as const,
  lists: () => [...crashKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...crashKeys.lists(), { filters }] as const,
  connectionIssues: (filters?: Record<string, any>) => [...crashKeys.all, 'connectionIssues', filters] as const,
  launcherErrors: (filters?: Record<string, any>) => [...crashKeys.all, 'launcherErrors', filters] as const,
};

/**
 * Hook для получения списка крашей
 *
 * @param params - Параметры фильтрации и пагинации
 * @param options - Опции React Query
 * @returns Результат запроса с данными крашей
 */
export function useCrashes(
  params?: { limit?: number; offset?: number; profileId?: string; userId?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: crashKeys.list(params || {}),
    queryFn: () => crashesAPI.getCrashes(params),
    staleTime: 30 * 1000, // 30 секунд
    ...options,
  });
}

/**
 * Hook для получения списка проблем с подключением
 *
 * @param params - Параметры фильтрации и пагинации
 * @param options - Опции React Query
 * @returns Результат запроса с данными проблем подключения
 */
export function useConnectionIssues(
  params?: { limit?: number; offset?: number; profileId?: string; serverAddress?: string; issueType?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: crashKeys.connectionIssues(params || {}),
    queryFn: () => crashesAPI.getConnectionIssues(params),
    staleTime: 30 * 1000, // 30 секунд
    ...options,
  });
}

/**
 * Hook для получения списка ошибок лаунчера (Admin only)
 *
 * @param params - Параметры фильтрации и пагинации
 * @param options - Опции React Query
 * @returns Результат запроса с данными ошибок лаунчера
 */
export function useLauncherErrors(
  params?: { limit?: number; offset?: number; errorType?: string; component?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: crashKeys.launcherErrors(params || {}),
    queryFn: () => crashesAPI.getLauncherErrors(params),
    staleTime: 30 * 1000, // 30 секунд
    ...options,
  });
}

/**
 * Hook для логирования краша игры
 *
 * @returns Мутация для логирования краша
 */
export function useLogCrash() {
  return useMutation({
    mutationFn: (data: LogCrashRequest) => crashesAPI.logCrash(data),
  });
}

/**
 * Hook для логирования проблемы с подключением
 *
 * @returns Мутация для логирования проблемы подключения
 */
export function useLogConnectionIssue() {
  return useMutation({
    mutationFn: (data: LogConnectionIssueRequest) => crashesAPI.logConnectionIssue(data),
  });
}

/**
 * Hook для логирования ошибки лаунчера
 *
 * @returns Мутация для логирования ошибки лаунчера
 */
export function useLogLauncherError() {
  return useMutation({
    mutationFn: (data: LogLauncherErrorRequest) => crashesAPI.logLauncherError(data),
  });
}

