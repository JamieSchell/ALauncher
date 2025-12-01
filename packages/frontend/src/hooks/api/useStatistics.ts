/**
 * Custom React Query hooks for Statistics API
 *
 * Предоставляет типизированные hooks для работы со статистикой.
 * Все запросы автоматически кешируются и обновляются согласно политикам QueryClient.
 *
 * @module hooks/api/useStatistics
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { statisticsAPI, UserStatistics, AdminAnalytics, GameLaunchRequest, GameSessionEndRequest } from '../../api/statistics';

/**
 * Query keys для статистики
 */
export const statisticsKeys = {
  all: ['statistics'] as const,
  user: (days?: number) => [...statisticsKeys.all, 'user', days] as const,
  admin: (days?: number) => [...statisticsKeys.all, 'admin', days] as const,
};

/**
 * Hook для получения статистики текущего пользователя
 *
 * @param days - Количество дней для статистики (по умолчанию 30)
 * @param options - Опции React Query
 * @returns Результат запроса с данными статистики пользователя
 */
export function useUserStatistics(days: number = 30, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: statisticsKeys.user(days),
    queryFn: () => statisticsAPI.getUserStatistics(days),
    staleTime: 60 * 1000, // 1 минута
    ...options,
  });
}

/**
 * Hook для получения аналитики администратора
 *
 * @param days - Количество дней для аналитики (по умолчанию 30)
 * @param options - Опции React Query
 * @returns Результат запроса с данными аналитики
 */
export function useAdminAnalytics(days: number = 30, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: statisticsKeys.admin(days),
    queryFn: () => statisticsAPI.getAdminAnalytics(days),
    staleTime: 60 * 1000, // 1 минута
    ...options,
  });
}

/**
 * Hook для создания записи о запуске игры
 *
 * @returns Мутация для создания записи о запуске
 */
export function useCreateGameLaunch() {
  return useMutation({
    mutationFn: (data: GameLaunchRequest) => statisticsAPI.createGameLaunch(data),
  });
}

/**
 * Hook для завершения сессии игры
 *
 * @returns Мутация для завершения сессии
 */
export function useEndGameSession() {
  return useMutation({
    mutationFn: (data: GameSessionEndRequest) => statisticsAPI.endGameSession(data),
  });
}

