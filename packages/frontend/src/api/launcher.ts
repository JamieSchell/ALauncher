/**
 * Launcher API
 */

import { apiClient } from './client';
import { ApiResponse } from '@modern-launcher/shared';

export interface LauncherVersionInfo {
  version: string;
  name: string;
}

export interface LauncherUpdateCheck {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: LauncherUpdateInfo;
  isRequired?: boolean;
}

export interface LauncherUpdateInfo {
  version: string;
  downloadUrl: string;
  fileHash?: string;
  fileSize?: bigint;
  releaseNotes?: string;
  isRequired: boolean;
  createdAt: Date;
}

export const launcherAPI = {
  /**
   * Get current launcher version
   */
  async getVersion(): Promise<LauncherVersionInfo> {
    const response = await apiClient.get<ApiResponse<LauncherVersionInfo>>('/launcher/version');
    return response.data.data!;
  },

  /**
   * Check for launcher updates
   */
  async checkUpdate(currentVersion: string): Promise<LauncherUpdateCheck> {
    const response = await apiClient.get<ApiResponse<LauncherUpdateCheck>>(
      `/launcher/check-update?currentVersion=${encodeURIComponent(currentVersion)}`
    );
    return response.data.data!;
  },
};

