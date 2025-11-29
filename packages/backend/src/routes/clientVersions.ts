/**
 * Client Versions Routes
 * API для работы с версиями клиентов
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import { config } from '../config';
import { prisma } from '../services/database';
import { ClientVersionService } from '../services/clientVersionService';
import { AppError } from '../middleware/errorHandler';
import { AuthService } from '../services/auth';
import { verifyFileIntegrity, verifyVersionIntegrity, syncVersion, getSyncStats } from '../services/fileSyncService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/client-versions
 * Получить список всех доступных версий клиентов
 */
router.get('/', async (req, res, next) => {
  try {
    const versions = await ClientVersionService.getAvailableVersions();
    
    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/client-versions/version/:version
 * Получить информацию о версии по номеру версии
 * ВАЖНО: Этот роут должен быть ПЕРЕД /:versionId, чтобы Express правильно его обрабатывал
 */
router.get('/version/:version', async (req, res, next) => {
  try {
    const { version } = req.params;
    
    const clientVersion = await ClientVersionService.getVersionByVersion(version);
    
    if (!clientVersion) {
      throw new AppError(404, 'Version not found');
    }
    
    res.json({
      success: true,
      data: clientVersion,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/client-versions/:versionId/files
 * Получить список всех файлов версии
 */
router.get('/:versionId/files', async (req, res, next) => {
  try {
    const { versionId } = req.params;
    
    const files = await ClientVersionService.getVersionFiles(versionId);
    
    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/client-versions/:versionId
 * Получить информацию о конкретной версии
 * ВАЖНО: Этот роут должен быть ПОСЛЕ более специфичных роутов
 */
router.get('/:versionId', async (req, res, next) => {
  try {
    const { versionId } = req.params;
    
    const version = await ClientVersionService.getVersionById(versionId);
    
    if (!version) {
      throw new AppError(404, 'Version not found');
    }
    
    res.json({
      success: true,
      data: version,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/client-versions/:versionId/file/:filePath(*)
 * Скачать конкретный файл версии
 */
router.get('/:versionId/file/*', async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const filePath = req.params[0]; // Everything after /file/
    
    // Проверка авторизации
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized');
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.validateSession(token);
    
    if (!payload) {
      throw new AppError(401, 'Invalid token');
    }

    // Получить информацию о файле
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

    if (!file) {
      throw new AppError(404, 'File not found');
    }

    // Если есть downloadUrl, редиректим на него
    if (file.downloadUrl) {
      return res.redirect(file.downloadUrl);
    }

    // Иначе отдаем файл с сервера
    const version = file.version;
    
    // Попытаться найти профиль, использующий эту версию, чтобы получить clientDirectory
    const profile = await prisma.clientProfile.findFirst({
      where: { version: version.version },
      select: { clientDirectory: true },
    });
    
    // Использовать clientDirectory из профиля, если найден, иначе fallback на version
    const clientDir = profile?.clientDirectory || version.version;
    const basePath = path.join(config.paths.updates, clientDir);
    const fullPath = path.join(basePath, filePath);

    // Security: prevent path traversal
    if (!fullPath.startsWith(basePath)) {
      throw new AppError(403, 'Access denied');
    }

    // Проверка существования файла
    try {
      await fs.access(fullPath);
    } catch {
      throw new AppError(404, 'File not found on server');
    }

    // Проверка целостности файла перед отправкой
    const isIntegrityValid = await verifyFileIntegrity(versionId, filePath);
    
    if (!isIntegrityValid) {
      logger.warn(`[FileSync] Integrity check failed for file: ${filePath} (version: ${version.version})`);
      throw new AppError(403, 'File integrity check failed. File has been modified or corrupted.');
    }

    // КРИТИЧЕСКАЯ ПРОВЕРКА для client.jar - пересчитать хеш и сравнить с БД
    if (filePath === 'client.jar') {
      const fileContent = await fs.readFile(fullPath);
      const actualHash = crypto.createHash('sha256').update(fileContent).digest('hex');
      
      if (actualHash !== file.fileHash) {
        logger.error(`[FileDownload] CRITICAL: client.jar hash mismatch on server!`);
        logger.error(`[FileDownload] Expected hash (from DB): ${file.fileHash}`);
        logger.error(`[FileDownload] Actual hash (from disk): ${actualHash}`);
        logger.error(`[FileDownload] File path: ${fullPath}`);
        throw new AppError(500, 'client.jar file is corrupted on server. Please re-sync the files using: profile sync <profile-id>');
      }
      
      logger.debug(`[FileDownload] ✓ client.jar hash verified: ${actualHash.substring(0, 16)}...`);
    }

    // Отправка файла с оптимизацией для быстрой загрузки
    // Используем поток с увеличенным буфером для лучшей производительности
    const fileStream = createReadStream(fullPath, { highWaterMark: 256 * 1024 }); // 256KB буфер
    
    // Установить заголовки
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.setHeader('X-File-Hash', file.fileHash);
    res.setHeader('X-File-Size', file.fileSize.toString());
    res.setHeader('X-File-Verified', file.verified ? 'true' : 'false');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Кэширование на 1 час
    res.setHeader('Accept-Ranges', 'bytes'); // Поддержка частичных запросов
    res.setHeader('Content-Length', file.fileSize.toString());
    
    // Отправить файл через поток
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      logger.error(`[FileDownload] Error streaming file ${filePath}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Error streaming file' });
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/client-versions/version/:version/sync
 * Ручная синхронизация файлов версии (только для админов)
 */
router.post('/version/:version/sync', async (req, res, next) => {
  try {
    const { version } = req.params;
    
    // Проверка авторизации (только админы)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized');
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.validateSession(token);
    
    if (!payload) {
      throw new AppError(401, 'Invalid token');
    }

    // Проверить, является ли пользователь админом
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const result = await syncVersion(version);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/client-versions/version/:version/verify
 * Проверить целостность всех файлов версии (только для админов)
 */
router.post('/version/:version/verify', async (req, res, next) => {
  try {
    const { version } = req.params;
    
    // Проверка авторизации (только админы)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized');
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.validateSession(token);
    
    if (!payload) {
      throw new AppError(401, 'Invalid token');
    }

    // Проверить, является ли пользователь админом
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const result = await verifyVersionIntegrity(version);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/client-versions/version/:version/sync-stats
 * Получить статистику синхронизации версии (только для админов)
 */
router.get('/version/:version/sync-stats', async (req, res, next) => {
  try {
    const { version } = req.params;
    
    // Проверка авторизации (только админы)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized');
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.validateSession(token);
    
    if (!payload) {
      throw new AppError(401, 'Invalid token');
    }

    // Проверить, является ли пользователь админом
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const stats = await getSyncStats(version);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

