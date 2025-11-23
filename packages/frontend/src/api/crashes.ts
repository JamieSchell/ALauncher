/**
 * Crashes and Connection Issues API
 */

import { apiClient } from './client';
import { ApiResponse } from '@modern-launcher/shared';

export interface GameCrash {
  id: string;
  userId?: string;
  username?: string;
  profileId?: string;
  profileVersion?: string;
  serverAddress?: string;
  serverPort?: number;
  exitCode: number;
  errorMessage?: string;
  stackTrace?: string;
  stderrOutput?: string;
  stdoutOutput?: string;
  javaVersion?: string;
  javaPath?: string;
  os?: string;
  osVersion?: string;
  createdAt: string;
}

export interface ServerConnectionIssue {
  id: string;
  userId?: string;
  username?: string;
  profileId?: string;
  profileVersion?: string;
  serverAddress: string;
  serverPort: number;
  issueType: 'CONNECTION_REFUSED' | 'CONNECTION_TIMEOUT' | 'AUTHENTICATION_FAILED' | 'SERVER_FULL' | 'VERSION_MISMATCH' | 'NETWORK_ERROR' | 'UNKNOWN';
  errorMessage?: string;
  logOutput?: string;
  javaVersion?: string;
  os?: string;
  createdAt: string;
}

export interface LauncherError {
  id: string;
  userId?: string;
  username?: string;
  errorType: 'PROFILE_LOAD_ERROR' | 'FILE_DOWNLOAD_ERROR' | 'API_ERROR' | 'AUTHENTICATION_ERROR' | 'VALIDATION_ERROR' | 'FILE_SYSTEM_ERROR' | 'NETWORK_ERROR' | 'ELECTRON_ERROR' | 'JAVA_DETECTION_ERROR' | 'CLIENT_LAUNCH_ERROR' | 'UNKNOWN_ERROR';
  errorMessage: string;
  stackTrace?: string;
  component?: string;
  action?: string;
  url?: string;
  statusCode?: number;
  userAgent?: string;
  os?: string;
  osVersion?: string;
  launcherVersion?: string;
  createdAt: string;
}

export interface LogLauncherErrorRequest {
  errorType: LauncherError['errorType'];
  errorMessage: string;
  stackTrace?: string;
  component?: string;
  action?: string;
  url?: string;
  statusCode?: number;
  userAgent?: string;
  os?: string;
  osVersion?: string;
  launcherVersion?: string;
}

export interface LogCrashRequest {
  exitCode: number;
  errorMessage?: string;
  stackTrace?: string;
  stderrOutput?: string;
  stdoutOutput?: string;
  profileId?: string;
  profileVersion?: string;
  serverAddress?: string;
  serverPort?: number;
  javaVersion?: string;
  javaPath?: string;
  os?: string;
  osVersion?: string;
  username?: string;
}

export interface LogConnectionIssueRequest {
  serverAddress: string;
  serverPort: number;
  issueType: 'CONNECTION_REFUSED' | 'CONNECTION_TIMEOUT' | 'AUTHENTICATION_FAILED' | 'SERVER_FULL' | 'VERSION_MISMATCH' | 'NETWORK_ERROR' | 'UNKNOWN';
  errorMessage?: string;
  logOutput?: string;
  profileId?: string;
  profileVersion?: string;
  javaVersion?: string;
  os?: string;
  username?: string;
}

export const crashesAPI = {
  /**
   * Log a game crash
   */
  async logCrash(data: LogCrashRequest): Promise<GameCrash> {
    const response = await apiClient.post<ApiResponse<GameCrash>>('/crashes', data);
    return response.data.data!;
  },

  /**
   * Log a server connection issue
   */
  async logConnectionIssue(data: LogConnectionIssueRequest): Promise<ServerConnectionIssue> {
    const response = await apiClient.post<ApiResponse<ServerConnectionIssue>>('/crashes/connection-issues', data);
    return response.data.data!;
  },

  /**
   * Get crashes (requires authentication)
   */
  async getCrashes(params?: { limit?: number; offset?: number; profileId?: string; userId?: string }) {
    const response = await apiClient.get<ApiResponse<GameCrash[]> & { pagination?: { total: number; limit: number; offset: number } }>('/crashes', { params });
    return response.data;
  },

  /**
   * Get connection issues (requires authentication)
   */
  async getConnectionIssues(params?: { limit?: number; offset?: number; profileId?: string; serverAddress?: string; issueType?: string }) {
    const response = await apiClient.get<ApiResponse<ServerConnectionIssue[]> & { pagination?: { total: number; limit: number; offset: number } }>('/crashes/connection-issues', { params });
    return response.data;
  },

  /**
   * Log a launcher error
   */
  async logLauncherError(data: LogLauncherErrorRequest): Promise<LauncherError> {
    const response = await apiClient.post<ApiResponse<LauncherError>>('/crashes/launcher-errors', data);
    return response.data.data!;
  },

  /**
   * Get launcher errors (Admin only)
   */
  async getLauncherErrors(params?: { limit?: number; offset?: number; errorType?: string; component?: string }) {
    const response = await apiClient.get<ApiResponse<LauncherError[]> & { pagination?: { total: number; limit: number; offset: number } }>('/crashes/launcher-errors', { params });
    return response.data;
  },
};

