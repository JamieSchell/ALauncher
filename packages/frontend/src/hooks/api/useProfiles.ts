/**
 * Custom React Query hooks for Profiles API
 *
 * Предоставляет типизированные hooks для работы с профилями клиентов.
 * Все запросы автоматически кешируются и обновляются согласно политикам QueryClient.
 *
 * @module hooks/api/useProfiles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesAPI } from '../../api/profiles';
import { ClientProfile, EconomyLeaderboardPayload } from '@modern-launcher/shared';

/**
 * Query keys для профилей
 */
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...profileKeys.lists(), { filters }] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  economyLeaderboard: (id: string) => [...profileKeys.detail(id), 'economy', 'leaderboard'] as const,
};

/**
 * Hook для получения списка всех профилей
 *
 * @param options - Опции React Query (staleTime, refetchOnWindowFocus и т.д.)
 * @returns Результат запроса с данными профилей
 */
export function useProfiles(options?: { enabled?: boolean; refetchOnWindowFocus?: boolean }) {
  return useQuery({
    queryKey: profileKeys.lists(),
    queryFn: profilesAPI.getProfiles,
    staleTime: 30 * 1000, // 30 секунд
    ...options,
  });
}

/**
 * Hook для получения конкретного профиля по ID
 *
 * @param id - ID профиля
 * @param options - Опции React Query
 * @returns Результат запроса с данными профиля
 */
export function useProfile(id: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: profileKeys.detail(id!),
    queryFn: () => profilesAPI.getProfile(id!),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 60 * 1000, // 1 минута
    ...options,
  });
}

/**
 * Hook для получения таблицы лидеров экономики профиля
 *
 * @param id - ID профиля
 * @param options - Опции React Query
 * @returns Результат запроса с данными таблицы лидеров
 */
export function useEconomyLeaderboard(id: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: profileKeys.economyLeaderboard(id!),
    queryFn: () => profilesAPI.getEconomyLeaderboard(id!),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 60 * 1000, // 1 минута
    ...options,
  });
}

/**
 * Hook для создания нового профиля
 *
 * @returns Мутация для создания профиля
 */
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData: Partial<ClientProfile>) => profilesAPI.createProfile(profileData),
    onSuccess: () => {
      // Инвалидировать список профилей после создания
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

/**
 * Hook для обновления профиля
 *
 * @returns Мутация для обновления профиля
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, profileData }: { id: string; profileData: Partial<ClientProfile> }) =>
      profilesAPI.updateProfile(id, profileData),
    onSuccess: (_, variables) => {
      // Инвалидировать список и конкретный профиль
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook для удаления профиля
 *
 * @returns Мутация для удаления профиля
 */
export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => profilesAPI.deleteProfile(id),
    onSuccess: () => {
      // Инвалидировать список профилей после удаления
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

