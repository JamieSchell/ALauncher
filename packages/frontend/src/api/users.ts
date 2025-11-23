/**
 * Users API
 */

import { apiClient } from './client';
import { ApiResponse } from '@modern-launcher/shared';

export interface UserProfile {
  id: string;
  username: string;
  uuid: string;
  email: string | null;
  skinUrl: string | null;
  cloakUrl: string | null;
  role: 'USER' | 'ADMIN';
  banned?: boolean;
  bannedAt?: string | null;
  banReason?: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export interface UserListItem {
  id: string;
  username: string;
  email: string | null;
  uuid: string;
  role: 'USER' | 'ADMIN';
  banned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const usersAPI = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
    return response.data.data!;
  },

  /**
   * Update user profile (email)
   */
  async updateProfile(data: { email?: string }): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.put<ApiResponse<UserProfile>>('/users/me', data);
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
    const response = await apiClient.patch<ApiResponse>('/users/me/password', data);
    return response.data;
  },

  /**
   * Upload skin
   */
  async uploadSkin(file: File): Promise<ApiResponse<UserProfile>> {
    const formData = new FormData();
    formData.append('skin', file);
    
    // Don't set Content-Type header - browser will set it with boundary
    const response = await apiClient.post<ApiResponse<UserProfile>>('/users/me/skin', formData);
    return response.data;
  },

  /**
   * Upload cloak
   */
  async uploadCloak(file: File): Promise<ApiResponse<UserProfile>> {
    const formData = new FormData();
    formData.append('cloak', file);
    
    // Don't set Content-Type header - browser will set it with boundary
    const response = await apiClient.post<ApiResponse<UserProfile>>('/users/me/cloak', formData);
    return response.data;
  },

  /**
   * Get list of all users (Admin only)
   */
  async getUsers(params?: { limit?: number; offset?: number; search?: string; role?: string; banned?: boolean }) {
    const response = await apiClient.get<ApiResponse<UserListItem[]> & { pagination?: { total: number; limit: number; offset: number } }>('/users', { params });
    return response.data;
  },

  /**
   * Ban or unban a user (Admin only)
   */
  async banUser(userId: string, banned: boolean, banReason?: string): Promise<ApiResponse<UserListItem>> {
    const response = await apiClient.patch<ApiResponse<UserListItem>>(`/users/${userId}/ban`, { banned, banReason });
    return response.data;
  },

  /**
   * Update user profile (Admin only)
   */
  async updateUser(userId: string, data: { email?: string; username?: string; role?: 'USER' | 'ADMIN' }): Promise<ApiResponse<UserListItem>> {
    const response = await apiClient.patch<ApiResponse<UserListItem>>(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * Delete a user (Admin only)
   */
  async deleteUser(userId: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/users/${userId}`);
    return response.data;
  },
};

