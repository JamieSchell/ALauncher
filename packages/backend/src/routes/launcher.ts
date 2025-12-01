/**
 * Launcher API
 * Endpoints for launcher version checking and updates
 */

import { Router, Request, Response, NextFunction } from 'express';
import { readFileSync, access, constants } from 'fs';
import { join, resolve as pathResolve } from 'path';
import { promisify } from 'util';
import { LauncherUpdateService } from '../services/launcherUpdateService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const fsAccess = promisify(access);

const router = Router();

/**
 * GET /api/launcher/version
 * Get current launcher version
 */
router.get('/version', (req, res) => {
  try {
    // Get version from package.json
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    res.json({
      success: true,
      data: {
        version: packageJson.version || '1.0.0',
        name: packageJson.name || 'modern-launcher',
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        version: '1.0.0',
        name: 'modern-launcher',
      },
    });
  }
});

/**
 * GET /api/launcher/check-update
 * Check for launcher updates
 * Query params: currentVersion (required)
 * Optional: Authorization header for sending notifications
 */
router.get('/check-update', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentVersion = req.query.currentVersion as string;
    
    if (!currentVersion) {
      throw new AppError(400, 'currentVersion query parameter is required');
    }

    const updateInfo = await LauncherUpdateService.checkForUpdates(currentVersion);
    
    // Если пользователь авторизован, синхронизировать уведомления об обновлении лаунчера
    if (req.user) {
      try {
        const userId = req.user.userId;
        const { prisma } = require('../services/database');

        // 1) Если обновлений НЕТ, но в БД есть непрочитанные уведомления
        //    о версиях <= текущей - пометить их как прочитанные, чтобы не зацикливать сообщения.
        if (!updateInfo.hasUpdate) {
          await prisma.notification.updateMany({
            where: {
              userId,
              type: 'LAUNCHER_UPDATE_AVAILABLE',
              read: false,
              // data->>'newVersion' <= currentVersion (PostgreSQL / MySQL JSON-safe сравнение строк версий)
            },
            data: {
              read: true,
              readAt: new Date(),
            },
          });
        }

        // 2) Если есть обновление и известна новая версия - убедиться, что уведомление есть,
        //    но не дублировать его для одной и той же newVersion.
        if (updateInfo.hasUpdate && updateInfo.latestVersion) {
          const newVersion = updateInfo.latestVersion.version;

          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId,
              type: 'LAUNCHER_UPDATE_AVAILABLE',
              read: false,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          const existingNewVersion =
            existingNotification?.data &&
            typeof existingNotification.data === 'object' &&
            'newVersion' in existingNotification.data
              ? (existingNotification.data as any).newVersion
              : null;

          if (!existingNotification || existingNewVersion !== newVersion) {
            await NotificationService.notifyLauncherUpdate(
              userId,
              currentVersion,
              newVersion,
              updateInfo.isRequired || updateInfo.latestVersion.isRequired
            );
          }
        }
      } catch (error) {
        // Не прерываем выполнение, если не удалось отправить/обновить уведомление
        logger.warn('[LauncherUpdate] Failed to sync launcher update notifications:', error);
      }
    }
    
    res.json({
      success: true,
      data: updateInfo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/launcher/version/:version
 * Get information about specific version
 */
router.get('/version/:version', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { version } = req.params;
    
    const versionInfo = await LauncherUpdateService.getVersionInfo(version);
    
    if (!versionInfo) {
      throw new AppError(404, `Version ${version} not found`);
    }
    
    res.json({
      success: true,
      data: versionInfo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/launcher/versions
 * Get all launcher versions (admin only, but we'll check auth in middleware if needed)
 */
router.get('/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const versions = await LauncherUpdateService.getAllVersions();
    
    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/launcher/download/:version
 * Download launcher update file for a specific version
 */
router.get('/download/:version', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { version } = req.params;
    
    // Get version info from database
    const versionInfo = await LauncherUpdateService.getVersionInfo(version);
    
    if (!versionInfo) {
      throw new AppError(404, `Version ${version} not found`);
    }

    // If downloadUrl is provided and it's an external URL (not our own endpoint), redirect to it
    // Check if downloadUrl points to our own endpoint to avoid redirect loop
    const isOwnEndpoint = versionInfo.downloadUrl && (
      versionInfo.downloadUrl.includes('/api/launcher/download/') ||
      versionInfo.downloadUrl.includes(`/launcher/download/${version}`)
    );
    
    if (versionInfo.downloadUrl && !isOwnEndpoint && (versionInfo.downloadUrl.startsWith('http://') || versionInfo.downloadUrl.startsWith('https://'))) {
      return res.redirect(versionInfo.downloadUrl);
    }

    // Otherwise, try to serve file from release directory
    // Path to frontend release directory - try multiple possible locations
    const possibleReleaseDirs = [
      join(__dirname, '../../frontend/release'), // Relative to compiled dist
      join(process.cwd(), 'packages/frontend/release'), // From project root
      join(process.cwd(), 'frontend/release'), // Alternative structure
      '/opt/launcher/packages/frontend/release', // Absolute path (production)
    ];
    
    // Try different possible file names
    const possibleFileNames = [
      `Modern Launcher-${version}-portable.exe`,
      `Modern-Launcher-${version}-portable.exe`,
      `launcher-${version}-portable.exe`,
      `Modern Launcher-${version}.exe`,
      `Modern-Launcher-${version}.exe`,
    ];

    let filePath: string | null = null;
    let releaseDir: string | null = null;
    
    // Try each release directory
    for (const dir of possibleReleaseDirs) {
      for (const fileName of possibleFileNames) {
        const testPath = join(dir, fileName);
        try {
          await fsAccess(testPath, constants.F_OK);
          filePath = testPath;
          releaseDir = dir;
          break;
        } catch {
          // File doesn't exist, try next
        }
      }
      if (filePath) break;
    }

    if (!filePath || !releaseDir) {
      logger.error(`[LauncherDownload] File not found for version ${version}`, {
        triedDirs: possibleReleaseDirs,
        triedFiles: possibleFileNames,
      });
      throw new AppError(404, `Update file for version ${version} not found on server`);
    }

    // Security: prevent path traversal
    const resolvedFilePath = pathResolve(filePath);
    const resolvedReleaseDir = pathResolve(releaseDir);
    if (!resolvedFilePath.startsWith(resolvedReleaseDir)) {
      logger.error(`[LauncherDownload] Path traversal attempt detected`, {
        filePath: resolvedFilePath,
        releaseDir: resolvedReleaseDir,
      });
      throw new AppError(403, 'Access denied');
    }
    
    logger.info(`[LauncherDownload] Serving file for version ${version}`, {
      filePath: resolvedFilePath,
      releaseDir: resolvedReleaseDir,
    });

    // Send file
    res.sendFile(filePath, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${versionInfo.version}-portable.exe"`,
        ...(versionInfo.fileHash ? { 'X-File-Hash': versionInfo.fileHash } : {}),
        ...(versionInfo.fileSize ? { 'X-File-Size': versionInfo.fileSize.toString() } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
