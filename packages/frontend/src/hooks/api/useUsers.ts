/**
 * Custom React Query hooks for Users API
 *
 * Предоставляет типизированные hooks для работы с пользователями.
 * Все запросы автоматически кешируются и обновляются согласно политикам QueryClient.
 *
 * @module hooks/api/useUsers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, UserProfile, UserListItem, ChangePasswordRequest } from '../../api/users';

/**
 * Query keys для пользователей
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
};

/**
 * Hook для получения профиля текущего пользователя
 *
 * @param options - Опции React Query
 * @returns Результат запроса с данными профиля пользователя
 */
export function useUserProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: usersAPI.getProfile,
    staleTime: 60 * 1000, // 1 минута
    ...options,
  });
}

/**
 * Hook для получения списка всех пользователей (Admin only)
 *
 * @param params - Параметры фильтрации и пагинации
 * @param options - Опции React Query
 * @returns Результат запроса с данными пользователей
 */
export function useUsers(
  params?: { limit?: number; offset?: number; search?: string; role?: string; banned?: boolean },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: userKeys.list(params || {}),
    queryFn: () => usersAPI.getUsers(params),
    staleTime: 30 * 1000, // 30 секунд
    ...options,
  });
}

/**
 * Hook для обновления профиля текущего пользователя
 *
 * @returns Мутация для обновления профиля
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email?: string }) => usersAPI.updateProfile(data),
    onSuccess: () => {
      // Инвалидировать профиль текущего пользователя
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
}

/**
 * Hook для изменения пароля текущего пользователя
 *
 * @returns Мутация для изменения пароля
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => usersAPI.changePassword(data),
  });
}

/**
 * Hook для загрузки скина пользователя
 *
 * @returns Мутация для загрузки скина
 */
export function useUploadSkin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, username }: { file: File; username?: string }) =>
      usersAPI.uploadSkin(file, username),
    onSuccess: () => {
      // Инвалидировать профиль текущего пользователя
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
}

/**
 * Hook для загрузки плаща пользователя
 *
 * @returns Мутация для загрузки плаща
 */
export function useUploadCloak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, username }: { file: File; username?: string }) =>
      usersAPI.uploadCloak(file, username),
    onSuccess: () => {
      // Инвалидировать профиль текущего пользователя
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
}

/**
 * Hook для бана/разбана пользователя (Admin only)
 *
 * @returns Мутация для бана/разбана пользователя
 */
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, banned, banReason }: { userId: string; banned: boolean; banReason?: string }) =>
      usersAPI.banUser(userId, banned, banReason),
    onSuccess: () => {
      // Инвалидировать список пользователей
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook для обновления пользователя (Admin only)
 *
 * @returns Мутация для обновления пользователя
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { email?: string; username?: string; role?: 'USER' | 'ADMIN' } }) =>
      usersAPI.updateUser(userId, data),
    onSuccess: () => {
      // Инвалидировать список пользователей
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook для удаления пользователя (Admin only)
 *
 * @returns Мутация для удаления пользователя
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersAPI.deleteUser(userId),
    onSuccess: () => {
      // Инвалидировать список пользователей
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

