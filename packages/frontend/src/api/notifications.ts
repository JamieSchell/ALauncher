/**
 * Notifications API
 */

import { apiClient } from './client';
import {
  ApiResponse,
  NotificationDTO,
  NotificationTypeDTO,
  GetNotificationsParamsDTO,
  CreateNotificationRequestDTO,
} from '@modern-launcher/shared';

export const notificationsAPI = {
  /**
   * Get user notifications
   */
  async getNotifications(params?: GetNotificationsParamsDTO): Promise<ApiResponse<NotificationDTO[]>> {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Create a notification (Admin only or for self)
   */
  async createNotification(data: CreateNotificationRequestDTO): Promise<NotificationDTO> {
    const response = await apiClient.post('/notifications', data);
    return response.data.data!;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationDTO> {
    const response = await apiClient.patch(
      `/notifications/${notificationId}/read`,
    );
    return response.data.data!;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Delete all notifications (or filtered)
   */
  async deleteAllNotifications(params?: { readOnly?: boolean; type?: string }): Promise<void> {
    await apiClient.delete('/notifications', { params });
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data!.count;
  },
};

// Export types for compatibility
export type { NotificationDTO as Notification, NotificationTypeDTO as NotificationType } from '@modern-launcher/shared';