/**
 * Profiles API
 */

import { apiClient } from './client';
import { ClientProfile, ApiResponse, EconomyLeaderboardPayload } from '@modern-launcher/shared';

export const profilesAPI = {
  async getProfiles() {
    const response = await apiClient.get('/profiles');
    return response.data.data!;
  },

  async getProfile(id: string) {
    const response = await apiClient.get(`/profiles/${id}`);
    return response.data.data!;
  },

  async createProfile(profileData: Partial<ClientProfile>) {
    const response = await apiClient.post('/profiles', profileData);
    return response.data;
  },

  async updateProfile(id: string, profileData: Partial<ClientProfile>) {
    const response = await apiClient.put(`/profiles/${id}`, profileData);
    return response.data;
  },

  async deleteProfile(id: string) {
    const response = await apiClient.delete(`/profiles/${id}`);
    return response.data;
  },

  async getEconomyLeaderboard(id: string) {
    const response = await apiClient.get(
      `/profiles/${id}/economy/top`
    );
    return response.data.data!;
  },
};
