/**
 * Launcher Update Service
 * Сервис для управления обновлениями лаунчера
 */

import { prisma } from './database';
import { logger } from '../utils/logger';

export interface LauncherUpdateInfo {
  version: string;
  downloadUrl: string;
  fileHash?: string;
  fileSize?: bigint | number | string; // Can be bigint, number, or string for JSON serialization
  releaseNotes?: string;
  isRequired: boolean;
  createdAt: Date;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: LauncherUpdateInfo;
  isRequired?: boolean;
}

/**
 * Сравнение версий (semantic versioning)
 * Возвращает: 1 если v1 > v2, -1 если v1 < v2, 0 если равны
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Проверка наличия обновлений
 */
export async function checkForUpdates(currentVersion: string): Promise<UpdateCheckResult> {
  try {
    // Получить все включенные версии, отсортированные по дате создания (новые первыми)
    const versions = await prisma.$queryRaw<Array<{
      version: string;
      downloadUrl: string | null;
      fileHash: string | null;
      fileSize: bigint | null;
      releaseNotes: string | null;
      isRequired: boolean;
      createdAt: Date;
    }>>`
      SELECT 
        version,
        downloadUrl,
        fileHash,
        fileSize,
        releaseNotes,
        isRequired,
        createdAt
      FROM launcher_versions
      WHERE enabled = 1
      ORDER BY createdAt DESC
      LIMIT 10
    `;

    if (versions.length === 0) {
      return {
        hasUpdate: false,
        currentVersion,
      };
    }

    // Найти самую новую версию
    let latestVersion = versions[0];
    
    // Проверить, есть ли более новая версия
    const hasUpdate = compareVersions(latestVersion.version, currentVersion) > 0;

    if (!hasUpdate) {
      return {
        hasUpdate: false,
        currentVersion,
      };
    }

    // Проверить, есть ли обязательные обновления между текущей и последней версией
    const isRequired = versions.some(v => 
      v.isRequired && 
      compareVersions(v.version, currentVersion) > 0 &&
      compareVersions(latestVersion.version, v.version) >= 0
    );

    return {
      hasUpdate: true,
      currentVersion,
      latestVersion: {
        version: latestVersion.version,
        downloadUrl: latestVersion.downloadUrl || '',
        fileHash: latestVersion.fileHash || undefined,
        fileSize: latestVersion.fileSize ? Number(latestVersion.fileSize) : undefined,
        releaseNotes: latestVersion.releaseNotes || undefined,
        isRequired: latestVersion.isRequired || isRequired,
        createdAt: latestVersion.createdAt,
      },
      isRequired,
    };
  } catch (error) {
    logger.error('Error checking for launcher updates:', error);
    throw error;
  }
}

/**
 * Получить информацию о конкретной версии
 */
export async function getVersionInfo(version: string): Promise<LauncherUpdateInfo | null> {
  try {
    const result = await prisma.$queryRaw<Array<{
      version: string;
      downloadUrl: string | null;
      fileHash: string | null;
      fileSize: bigint | null;
      releaseNotes: string | null;
      isRequired: boolean;
      createdAt: Date;
    }>>`
      SELECT 
        version,
        downloadUrl,
        fileHash,
        fileSize,
        releaseNotes,
        isRequired,
        createdAt
      FROM launcher_versions
      WHERE version = ${version} AND enabled = 1
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    const v = result[0];
    return {
      version: v.version,
      downloadUrl: v.downloadUrl || '',
      fileHash: v.fileHash || undefined,
      fileSize: v.fileSize ? Number(v.fileSize) : undefined,
      releaseNotes: v.releaseNotes || undefined,
      isRequired: v.isRequired,
      createdAt: v.createdAt,
    };
  } catch (error) {
    logger.error(`Error getting version info for ${version}:`, error);
    throw error;
  }
}

/**
 * Получить список всех версий (для админки)
 */
export async function getAllVersions(): Promise<LauncherUpdateInfo[]> {
  try {
    const versions = await prisma.$queryRaw<Array<{
      version: string;
      downloadUrl: string | null;
      fileHash: string | null;
      fileSize: bigint | null;
      releaseNotes: string | null;
      isRequired: boolean;
      createdAt: Date;
    }>>`
      SELECT 
        version,
        downloadUrl,
        fileHash,
        fileSize,
        releaseNotes,
        isRequired,
        createdAt
      FROM launcher_versions
      ORDER BY createdAt DESC
    `;

    return versions.map(v => ({
      version: v.version,
      downloadUrl: v.downloadUrl || '',
      fileHash: v.fileHash || undefined,
      fileSize: v.fileSize ? Number(v.fileSize) : undefined,
      releaseNotes: v.releaseNotes || undefined,
      isRequired: v.isRequired,
      createdAt: v.createdAt,
    }));
  } catch (error) {
    logger.error('Error getting all launcher versions:', error);
    throw error;
  }
}

/**
 * Export service object
 */
export const LauncherUpdateService = {
  checkForUpdates,
  getVersionInfo,
  getAllVersions,
};
