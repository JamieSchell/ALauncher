/**
 * Custom React Query hooks for Notifications API
 *
 * Предоставляет типизированные hooks для работы с уведомлениями.
 * Все запросы автоматически кешируются и обновляются согласно политикам QueryClient.
 *
 * @module hooks/api/useNotifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../../api/notifications';
import { GetNotificationsParamsDTO, CreateNotificationRequestDTO } from '@modern-launcher/shared';

/**
 * Query keys для уведомлений
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: GetNotificationsParamsDTO) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

/**
 * Hook для получения списка уведомлений
 *
 * @param params - Параметры фильтрации уведомлений
 * @param options - Опции React Query
 * @returns Результат запроса с данными уведомлений
 */
export function useNotifications(
  params?: GetNotificationsParamsDTO,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsAPI.getNotifications(params),
    staleTime: 10 * 1000, // 10 секунд (уведомления должны обновляться чаще)
    refetchOnWindowFocus: true, // Обновлять при фокусе окна
    ...options,
  });
}

/**
 * Hook для получения количества непрочитанных уведомлений
 *
 * @param options - Опции React Query
 * @returns Результат запроса с количеством непрочитанных уведомлений
 */
export function useUnreadNotificationsCount(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: 10 * 1000, // 10 секунд
    refetchOnWindowFocus: true,
    ...options,
  });
}

/**
 * Hook для создания уведомления (Admin only)
 *
 * @returns Мутация для создания уведомления
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationRequestDTO) => notificationsAPI.createNotification(data),
    onSuccess: () => {
      // Инвалидировать список уведомлений
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Hook для отметки уведомления как прочитанного
 *
 * @returns Мутация для отметки уведомления
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsAPI.markAsRead(notificationId),
    onSuccess: () => {
      // Инвалидировать список уведомлений и счетчик
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Hook для отметки всех уведомлений как прочитанных
 *
 * @returns Мутация для отметки всех уведомлений
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      // Инвалидировать список уведомлений и счетчик
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Hook для удаления уведомления
 *
 * @returns Мутация для удаления уведомления
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsAPI.deleteNotification(notificationId),
    onSuccess: () => {
      // Инвалидировать список уведомлений и счетчик
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Hook для удаления всех уведомлений (или отфильтрованных)
 *
 * @returns Мутация для удаления всех уведомлений
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: { readOnly?: boolean; type?: string }) => notificationsAPI.deleteAllNotifications(params),
    onSuccess: () => {
      // Инвалидировать список уведомлений и счетчик
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

