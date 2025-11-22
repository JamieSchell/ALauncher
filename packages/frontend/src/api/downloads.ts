/**
 * Downloads API
 */

import { apiClient } from './client';
import { ApiResponse } from '@modern-launcher/shared';

interface ClientFile {
  filePath: string;
  fileHash: string;
  fileSize: number;
  fileType: string;
}

interface ClientVersionInfo {
  id: string;
  version: string;
  title: string;
  description?: string;
  mainClass: string;
  jvmVersion: string;
  jvmArgs: string[];
  clientArgs: string[];
  enabled: boolean;
  files: ClientFile[];
}

interface ClientVersionSummary {
  id: string;
  version: string;
  title: string;
  description?: string;
  enabled: boolean;
}

export const downloadsAPI = {
  async startDownload(version: string) {
    const response = await apiClient.post<ApiResponse<{ version: string; message: string }>>(
      `/updates/download/${version}`
    );
    return response.data;
  },
  
  async getClientVersions() {
    const response = await apiClient.get<ApiResponse<ClientVersionSummary[]>>(
      `/client-versions`
    );
    return response.data;
  },
  
  async getClientVersion(versionId: string) {
    const response = await apiClient.get<ApiResponse<ClientVersionInfo>>(
      `/client-versions/${versionId}`
    );
    return response.data;
  },
  
  async getClientVersionByVersion(version: string) {
    try {
      const response = await apiClient.get<ApiResponse<ClientVersionInfo>>(
        `/client-versions/version/${version}`
      );
      return response.data;
    } catch (error: any) {
      // If version not found (404), return a response with no data instead of throwing
      if (error.response?.status === 404) {
        return {
          success: false,
          data: undefined,
        } as ApiResponse<ClientVersionInfo>;
      }
      // Re-throw other errors
      throw error;
    }
  },
};

