/**
 * Client Versions Routes
 * API для работы с версиями клиентов
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config';
import { prisma } from '../services/database';
import { ClientVersionService } from '../services/clientVersionService';
import { AppError } from '../middleware/errorHandler';
import { AuthService } from '../services/auth';

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
    const basePath = path.join(config.paths.updates, version.version);
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

    // Отправка файла
    res.sendFile(fullPath, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
        'X-File-Hash': file.fileHash,
        'X-File-Size': file.fileSize.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

