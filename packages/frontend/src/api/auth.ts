/**
 * Authentication API
 */

import { apiClient } from './client';
import { AuthRequest, AuthResponse, ApiResponse } from '@modern-launcher/shared';

export const authAPI = {
  async login(login: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<{
        playerProfile: any;
        accessToken: string;
      }>>('/auth/login', {
        login,
        password,
      });
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          playerProfile: response.data.data.playerProfile,
          accessToken: response.data.data.accessToken,
        };
      }
      
      return {
        success: false,
        error: response.data.error || 'Login failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'An error occurred',
      };
    }
  },

  async register(username: string, password: string, email?: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/auth/register', {
        username,
        password,
        email,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed',
      };
    }
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
