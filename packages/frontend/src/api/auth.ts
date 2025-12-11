/**
 * Authentication API
 */

import { apiClient } from './client';
import { AuthRequest, AuthResponse, ApiResponse } from '@modern-launcher/shared';
import { translateError } from '../utils/translateError';

export interface LoginResponse {
  success: boolean;
  playerProfile?: any;
  accessToken?: string;
  role?: 'USER' | 'ADMIN';
  error?: string;
}

export const authAPI = {
  async login(login: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', {
        login,
        password,
      });
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          playerProfile: response.data.data.playerProfile,
          accessToken: response.data.data.accessToken,
          role: response.data.data.role || 'USER',
        };
      }
      
      const backendError = response.data.error || 'Login failed';
      return {
        success: false,
        error: translateError(backendError),
      };
    } catch (error: any) {
      // Only log unexpected errors, not 401 which are expected for invalid credentials
      if (error.response?.status !== 401) {
        console.error('Login error:', error);
      }

      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.message?.includes('Network')) {
        return {
          success: false,
          error: translateError('Network error: Unable to connect to server. Please check your connection and server address.'),
        };
      }
      
      // Handle CORS errors
      if (error.code === 'ERR_CORS' || error.message?.includes('CORS')) {
        return {
          success: false,
          error: translateError('CORS error: Cross-origin request blocked. Please contact administrator.'),
        };
      }
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          error: translateError('Request timeout: Server did not respond in time. Please check your connection.'),
        };
      }
      
      // Handle connection refused
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          success: false,
          error: translateError('Connection refused: Server is not available. Please check if the server is running.'),
        };
      }
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessage = Array.isArray(errors) 
          ? errors.map((e: any) => e.msg || e.message).join(', ')
          : errors;
        return {
          success: false,
          error: translateError(errorMessage || 'Validation failed'),
        };
      }
      
      // Handle other errors
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred';
      return {
        success: false,
        error: translateError(errorMessage),
      };
    }
  },

  async register(username: string, password: string, email?: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/auth/register', {
        username,
        password,
        email,
      });
      return response.data;
    } catch (error: any) {
      // Only log unexpected errors
      if (error.response?.status !== 400 && error.response?.status !== 409) {
        console.error('Registration error:', error);
      }

      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return {
          success: false,
          error: translateError('Network error: Unable to connect to server. Please check your connection.'),
        };
      }
      
      // Handle CORS errors
      if (error.code === 'ERR_CORS') {
        return {
          success: false,
          error: translateError('CORS error: Cross-origin request blocked. Please contact administrator.'),
        };
      }
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: translateError('Request timeout: Server did not respond in time.'),
        };
      }
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessage = Array.isArray(errors) 
          ? errors.map((e: any) => e.msg || e.message).join(', ')
          : errors;
        return {
          success: false,
          error: translateError(errorMessage || 'Validation failed'),
        };
      }
      
      // Handle other errors
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed';
      return {
        success: false,
        error: translateError(errorMessage),
      };
    }
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  async validate() {
    const response = await apiClient.get('/auth/validate');
    return response.data;
  },
};
