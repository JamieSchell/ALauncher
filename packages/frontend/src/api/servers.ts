/**
 * Servers API
 */

import { apiClient } from './client';
import { ServerStatus, ApiResponse } from '@modern-launcher/shared';

export const serversAPI = {
  async getServerStatus(address: string, port: number = 25565): Promise<ServerStatus> {
    try {
      // Use longer timeout for server status requests (15 seconds)
      // This allows time for multiple protocol version attempts on backend
      const response = await apiClient.get<ApiResponse<ServerStatus>>(
        `/servers/${address}/status?port=${port}`,
        { timeout: 15000 }
      );
      const status = response.data.data;
      console.log('Server status response:', status);
      if (!status) {
        throw new Error('No status data in response');
      }
      // Ensure players is an object
      if (status.players && typeof status.players === 'object' && 'online' in status.players) {
        return status;
      }
      // Fallback if players is not in correct format
      return {
        ...status,
        players: {
          online: (status as any).players?.online || (status as any).players || 0,
          max: (status as any).maxPlayers || (status as any).players?.max || 0,
        },
      };
    } catch (error: any) {
      // If timeout or connection error, return offline status instead of throwing
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        console.warn(`Server ${address}:${port} ping timeout, returning offline status`);
        return {
          online: false,
          players: { online: 0, max: 0 },
          version: '',
          motd: '',
          ping: 0,
        };
      }
      console.error('Error fetching server status:', error);
      throw error;
    }
  },

  async getServerStatistics(address: string, port: number = 25565): Promise<Array<{ online: number; average: number; minimum: number; maximum: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<Array<{ online: number; average: number; minimum: number; maximum: number }>>>(
        `/servers/${address}/statistics?port=${port}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching server statistics:', error);
      return [];
    }
  },
};

