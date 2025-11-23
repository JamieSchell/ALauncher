/**
 * Notifications API
 */

import { apiClient } from './client';
import { ApiResponse } from '@modern-launcher/shared';

export type NotificationType = 
  | 'CLIENT_UPDATE_AVAILABLE'
  | 'SERVER_STATUS_CHANGE'
  | 'GAME_CRASH'
  | 'CONNECTION_ISSUE'
  | 'LAUNCHER_ERROR'
  | 'SYSTEM_MESSAGE'
  | 'ADMIN_ALERT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  data?: any;
}

export const notificationsAPI = {
  /**
   * Get user notifications
   */
  async getNotifications(params?: GetNotificationsParams) {
    const response = await apiClient.get<ApiResponse<Notification[]> & { 
      pagination?: { total: number; limit: number; offset: number };
      unreadCount?: number;
    }>('/notifications', { params });
    return response.data;
  },

  /**
   * Create a notification (Admin only or for self)
   */
  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    const response = await apiClient.post<ApiResponse<Notification>>('/notifications', data);
    return response.data.data!;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`
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
  async deleteAllNotifications(params?: { readOnly?: boolean; type?: NotificationType }): Promise<void> {
    await apiClient.delete('/notifications', { params });
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data.data!.count;
  },
};

