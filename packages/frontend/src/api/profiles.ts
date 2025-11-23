/**
 * Profiles API
 */

import { apiClient } from './client';
import { ClientProfile, ApiResponse } from '@modern-launcher/shared';

export const profilesAPI = {
  async getProfiles() {
    const response = await apiClient.get<ApiResponse<Array<{
      profile: ClientProfile;
      signature: string;
    }>>>('/profiles');
    return response.data.data!;
  },

  async getProfile(id: string) {
    const response = await apiClient.get<ApiResponse<{
      profile: ClientProfile;
      signature: string;
    }>>(`/profiles/${id}`);
    return response.data.data!;
  },

  async createProfile(profileData: Partial<ClientProfile>) {
    const response = await apiClient.post<ApiResponse<ClientProfile>>('/profiles', profileData);
    return response.data;
  },

  async updateProfile(id: string, profileData: Partial<ClientProfile>) {
    const response = await apiClient.put<ApiResponse<ClientProfile>>(`/profiles/${id}`, profileData);
    return response.data;
  },

  async deleteProfile(id: string) {
    const response = await apiClient.delete<ApiResponse>(`/profiles/${id}`);
    return response.data;
  },
};
