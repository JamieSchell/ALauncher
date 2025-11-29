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
  clientJarSize: string; // Converted to string for JSON serialization
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
    fileSize: string; // Converted to string for JSON serialization
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
      clientJarSize: v.clientJarSize.toString(),
      jvmArgs: v.jvmArgs as string[],
      clientArgs: v.clientArgs as string[],
      files: v.files.map(file => ({
        ...file,
        fileSize: file.fileSize.toString(),
      })),
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
      clientJarSize: version.clientJarSize.toString(),
      jvmArgs: version.jvmArgs as string[],
      clientArgs: version.clientArgs as string[],
      files: version.files.map(file => ({
        ...file,
        fileSize: file.fileSize.toString(),
      })),
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
      clientJarSize: clientVersion.clientJarSize.toString(),
      jvmArgs: clientVersion.jvmArgs as string[],
      clientArgs: clientVersion.clientArgs as string[],
      files: clientVersion.files.map(file => ({
        ...file,
        fileSize: file.fileSize.toString(),
      })),
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
    
    // Попытаться найти профиль, использующий эту версию, чтобы получить clientDirectory
    const profile = await prisma.clientProfile.findFirst({
      where: { version: version.version },
      select: { clientDirectory: true },
    });
    
    // Использовать clientDirectory из профиля, если найден, иначе fallback на version
    const clientDir = profile?.clientDirectory || version.version;
    const basePath = path.join(config.paths.updates, clientDir);

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

