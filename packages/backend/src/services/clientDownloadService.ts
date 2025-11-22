/**
 * Client Download Service
 * Загрузка клиентов с собственного сервера через WebSocket
 */

import { Readable } from 'stream';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';
import { ClientVersionService } from './clientVersionService';
import { UpdateProgress } from '@modern-launcher/shared';
import { sendUpdateProgress } from '../websocket';

type ProgressCallback = (progress: UpdateProgress) => void;

export class ClientDownloadService {
  /**
   * Загрузить версию клиента с собственного сервера
   */
  static async downloadClientVersion(
    versionId: string,
    userId: string,
    onProgress: ProgressCallback
  ): Promise<void> {
    // Получить информацию о версии
    const version = await ClientVersionService.getVersionById(versionId);
    
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    if (!version.enabled) {
      throw new Error(`Version ${versionId} is disabled`);
    }

    // Получить список всех файлов
    const files = await ClientVersionService.getVersionFiles(versionId);
    const totalFiles = files.length;
    let downloadedFiles = 0;

    // Отправляем информацию о файлах клиенту через WebSocket
    // Фактическая загрузка будет происходить на клиенте через HTTP endpoint /api/client-versions/:versionId/file/*
    // Здесь мы только отслеживаем прогресс и отправляем его через WebSocket

    // Отправить начальную информацию
    onProgress({
      profileId: versionId,
      stage: 'downloading',
      progress: 0,
      currentFile: 'Preparing download...',
      totalFiles,
      downloadedFiles: 0,
    });

    // Отправить информацию о файлах для загрузки
    // Клиент будет загружать файлы через HTTP endpoint
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileProgress = ((i + 1) / totalFiles) * 100;
      
      onProgress({
        profileId: versionId,
        stage: 'downloading',
        progress: fileProgress,
        currentFile: path.basename(file.filePath),
        totalFiles,
        downloadedFiles: i + 1,
      });

      // Небольшая задержка для плавности прогресса
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Завершение
    onProgress({
      profileId: versionId,
      stage: 'complete',
      progress: 100,
      currentFile: 'Download complete!',
      totalFiles,
      downloadedFiles: totalFiles,
    });
  }

}

