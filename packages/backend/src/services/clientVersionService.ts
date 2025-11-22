/**
 * Client Version Service
 * Управление версиями клиентов на сервере
 */

import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { config } from '../config';

const prisma = new PrismaClient();

export interface ClientVersionInfo {
  id: string;
  version: string;
  title: string;
  description?: string;
  clientJarPath: string;
  clientJarHash: string;
  clientJarSize: bigint;
  librariesPath?: string;
  assetsPath?: string;
  mainClass: string;
  jvmVersion: string;
  jvmArgs: string[];
  clientArgs: string[];
  enabled: boolean;
  files: Array<{
    filePath: string;
    fileHash: string;
    fileSize: bigint;
    fileType: string;
  }>;
}

export class ClientVersionService {
  /**
   * Получить все доступные версии клиентов
   */
  static async getAvailableVersions(): Promise<ClientVersionInfo[]> {
    const versions = await prisma.clientVersion.findMany({
      where: { enabled: true },
      include: {
        files: {
          select: {
            filePath: true,
            fileHash: true,
            fileSize: true,
            fileType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return versions.map(v => ({
      ...v,
      jvmArgs: v.jvmArgs as string[],
      clientArgs: v.clientArgs as string[],
    }));
  }

  /**
   * Получить информацию о версии по ID
   */
  static async getVersionById(versionId: string): Promise<ClientVersionInfo | null> {
    const version = await prisma.clientVersion.findUnique({
      where: { id: versionId },
      include: {
        files: {
          select: {
            filePath: true,
            fileHash: true,
            fileSize: true,
            fileType: true,
          },
        },
      },
    });

    if (!version) return null;

    return {
      ...version,
      jvmArgs: version.jvmArgs as string[],
      clientArgs: version.clientArgs as string[],
    };
  }

  /**
   * Получить информацию о версии по номеру версии
   */
  static async getVersionByVersion(version: string): Promise<ClientVersionInfo | null> {
    const clientVersion = await prisma.clientVersion.findUnique({
      where: { version },
      include: {
        files: {
          select: {
            filePath: true,
            fileHash: true,
            fileSize: true,
            fileType: true,
          },
        },
      },
    });

    if (!clientVersion) return null;

    return {
      ...clientVersion,
      jvmArgs: clientVersion.jvmArgs as string[],
      clientArgs: clientVersion.clientArgs as string[],
    };
  }

  /**
   * Получить путь к файлу на сервере
   */
  static async getFilePath(versionId: string, filePath: string): Promise<string | null> {
    const file = await prisma.clientFile.findUnique({
      where: {
        versionId_filePath: {
          versionId,
          filePath,
        },
      },
      include: {
        version: true,
      },
    });

    if (!file) return null;

    // Если есть downloadUrl, вернуть его
    if (file.downloadUrl) {
      return file.downloadUrl;
    }

    // Иначе вернуть локальный путь
    const version = file.version;
    const basePath = version.downloadUrl 
      ? path.join(config.paths.updates, version.version)
      : path.join(config.paths.updates, version.version);

    return path.join(basePath, filePath);
  }

  /**
   * Проверить существование файла на сервере
   */
  static async fileExists(versionId: string, filePath: string): Promise<boolean> {
    const file = await prisma.clientFile.findUnique({
      where: {
        versionId_filePath: {
          versionId,
          filePath,
        },
      },
    });

    if (!file) return false;

    // Если есть downloadUrl, считаем что файл доступен
    if (file.downloadUrl) return true;

    // Проверяем локальный файл
    const localPath = await this.getFilePath(versionId, filePath);
    if (!localPath) return false;

    try {
      await fs.access(localPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получить список всех файлов версии
   */
  static async getVersionFiles(versionId: string): Promise<Array<{
    filePath: string;
    fileHash: string;
    fileSize: bigint;
    fileType: string;
    downloadUrl?: string;
  }>> {
    const files = await prisma.clientFile.findMany({
      where: { versionId },
      select: {
        filePath: true,
        fileHash: true,
        fileSize: true,
        fileType: true,
        downloadUrl: true,
      },
    });

    return files;
  }

  /**
   * Вычислить хеш файла
   */
  static async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

