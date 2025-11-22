/**
 * Authentication API
 */

import { apiClient } from './client';
import { AuthRequest, AuthResponse, ApiResponse } from '@modern-launcher/shared';

export const authAPI = {
  async login(login: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      login,
      password,
    });
    return response.data.data!;
  },

  async register(username: string, password: string, email?: string) {
    const response = await apiClient.post<ApiResponse>('/auth/register', {
      username,
      password,
      email,
    });
    return response.data;
  },

  async logout() {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  async validate() {
    const response = await apiClient.get<ApiResponse>('/auth/validate');
    return response.data;
  },
};
