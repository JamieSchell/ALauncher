/**
 * Statistics API
 */

import { apiClient } from './client';
import { ApiResponse } from '@modern-launcher/shared';

export interface GameLaunchRequest {
  profileId?: string;
  profileVersion?: string;
  serverAddress?: string;
  serverPort?: number;
  javaVersion?: string;
  javaPath?: string;
  ram?: number;
  resolution?: string;
  fullScreen?: boolean;
  autoEnter?: boolean;
  os?: string;
  osVersion?: string;
}

export interface GameSessionEndRequest {
  sessionId: string;
  exitCode?: number;
  crashed?: boolean;
}

export interface UserStatistics {
  totalPlayTime: number; // в секундах
  totalLaunches: number;
  totalSessions: number;
  playTimeByProfile: Array<{
    profileId: string | null;
    duration: number;
    sessions: number;
  }>;
  popularProfiles: Array<{
    profileId: string | null;
    launches: number;
  }>;
  launchHistory: Array<{
    id: string;
    createdAt: string;
    profileId: string | null;
    profileVersion: string | null;
    serverAddress: string | null;
    serverPort: number | null;
    duration: number | null;
    exitCode: number | null;
    crashed: boolean;
  }>;
  dailyStats: Array<{
    date: string;
    launches: number;
    playTime: number;
  }>;
}

export interface AdminAnalytics {
  activeUsers: Array<{
    userId: string | null;
    launches: number;
  }>;
  popularServers: Array<{
    serverAddress: string | null;
    serverPort: number | null;
    launches: number;
  }>;
  popularProfiles: Array<{
    profileId: string | null;
    launches: number;
  }>;
  totalLaunches: number;
  totalSessions: number;
  totalPlayTime: number;
  totalCrashes: number;
  totalConnectionIssues: number;
  crashedSessions: number;
  dailyStats: Array<{
    date: string;
    launches: number;
    sessions: number;
    playTime: number;
    crashes: number;
    connectionIssues: number;
  }>;
}

export const statisticsAPI = {
  /**
   * Создать запись о запуске игры
   */
  async createGameLaunch(data: GameLaunchRequest): Promise<ApiResponse<{ launchId: string; sessionId: string }>> {
    const response = await apiClient.post<ApiResponse<{ launchId: string; sessionId: string }>>('/statistics/launch', data);
    return response.data;
  },

  /**
   * Завершить сессию игры
   */
  async endGameSession(data: GameSessionEndRequest): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/statistics/session/end', data);
    return response.data;
  },

  /**
   * Получить статистику использования для текущего пользователя
   */
  async getUserStatistics(days: number = 30): Promise<ApiResponse<UserStatistics>> {
    const response = await apiClient.get<ApiResponse<UserStatistics>>('/statistics/user', {
      params: { days },
    });
    return response.data;
  },

  /**
   * Получить аналитику для администраторов
   */
  async getAdminAnalytics(days: number = 30): Promise<ApiResponse<AdminAnalytics>> {
    const response = await apiClient.get<ApiResponse<AdminAnalytics>>('/statistics/admin/analytics', {
      params: { days },
    });
    return response.data;
  },
};

