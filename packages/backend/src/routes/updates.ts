/**
 * Update routes - handle file updates and downloads
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config';
import { prisma } from '../services/database';
import { HasherService } from '../services/hasher';
import { sign } from '../services/crypto';
import { AppError } from '../middleware/errorHandler';
import { DownloadService } from '../services/downloadService';
import { sendUpdateProgress } from '../websocket';
import { AuthService } from '../services/auth';

const router = Router();

/**
 * GET /api/updates/:profileId/:dirType
 * Get hashed directory for updates
 */
router.get('/:profileId/:dirType', async (req, res, next) => {
  try {
    const { profileId, dirType } = req.params;

    // Validate dirType
    if (!['client', 'asset', 'jvm'].includes(dirType)) {
      throw new AppError(400, 'Invalid directory type');
    }

    // Get profile
    const profile = await prisma.clientProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    // Construct directory path
    let dirPath: string;
    switch (dirType) {
      case 'client':
        dirPath = path.join(config.paths.updates, profile.version);
        break;
      case 'asset':
        dirPath = path.join(config.paths.updates, 'assets', profile.assetIndex);
        break;
      case 'jvm':
        dirPath = path.join(config.paths.updates, 'jvm');
        break;
      default:
        throw new AppError(400, 'Invalid directory type');
    }

    // Check if directory exists
    try {
      await fs.access(dirPath);
    } catch {
      throw new AppError(404, 'Update directory not found');
    }

    // Hash directory
    const hashedDir = await HasherService.hashDirectory(
      dirPath,
      dirType === 'client' ? (profile.updateVerify as string[] | undefined) : undefined,
      dirType === 'client' ? (profile.updateExclusions as string[] | undefined) : undefined
    );

    // Sign the hashed dir
    const signature = sign(JSON.stringify(hashedDir));

    res.json({
      success: true,
      data: {
        hashedDir,
        signature,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/updates/:profileId/:dirType/file/*
 * Download a specific file
 */
router.get('/:profileId/:dirType/file/*', async (req, res, next) => {
  try {
    const { profileId, dirType } = req.params;
    const filePath = req.params[0]; // Everything after /file/

    // Validate dirType
    if (!['client', 'asset', 'jvm'].includes(dirType)) {
      throw new AppError(400, 'Invalid directory type');
    }

    // Get profile
    const profile = await prisma.clientProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    // Construct base directory path
    let basePath: string;
    switch (dirType) {
      case 'client':
        basePath = path.join(config.paths.updates, profile.version);
        break;
      case 'asset':
        basePath = path.join(config.paths.updates, 'assets', profile.assetIndex);
        break;
      case 'jvm':
        basePath = path.join(config.paths.updates, 'jvm');
        break;
      default:
        throw new AppError(400, 'Invalid directory type');
    }

    // Security: prevent path traversal
    const fullPath = path.join(basePath, filePath);
    if (!fullPath.startsWith(basePath)) {
      throw new AppError(403, 'Access denied');
    }

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      throw new AppError(404, 'File not found');
    }

    // Send file
    res.sendFile(fullPath);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/updates/sync/:profileId
 * Trigger sync for a profile
 */
router.post('/sync/:profileId', async (req, res, next) => {
  try {
    const { profileId } = req.params;

    const profile = await prisma.clientProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    // This would trigger background sync job
    // For now, just return success
    res.json({
      success: true,
      message: 'Sync triggered',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/updates/download/:version
 * Start downloading Minecraft version files
 * Downloads in background and sends progress via WebSocket
 */
router.post('/download/:version', async (req, res, next) => {
  try {
    const { version } = req.params;

    // Validate version format
    if (!version || !/^\d+\.\d+(\.\d+)?$/.test(version)) {
      throw new AppError(400, 'Invalid version format');
    }

    // Get user from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized');
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.validateSession(token);
    
    if (!payload) {
      throw new AppError(401, 'Invalid token');
    }

    // Start download in background
    DownloadService.downloadMinecraftVersion(version, (progress) => {
      sendUpdateProgress(payload.userId, progress);
    }).catch((error) => {
      sendUpdateProgress(payload.userId, {
        profileId: version,
        stage: 'complete',
        progress: 0,
        currentFile: `Error: ${error.message}`,
        totalFiles: 0,
        downloadedFiles: 0,
      });
    });

    res.json({
      success: true,
      data: {
        version,
        message: 'Download started. Progress will be sent via WebSocket.',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
