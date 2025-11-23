/**
 * Launcher API
 * Endpoints for launcher version checking and updates
 */

import { Router, Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LauncherUpdateService } from '../services/launcherUpdateService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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
 */
router.get('/check-update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentVersion = req.query.currentVersion as string;
    
    if (!currentVersion) {
      throw new AppError(400, 'currentVersion query parameter is required');
    }

    const updateInfo = await LauncherUpdateService.checkForUpdates(currentVersion);
    
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

export default router;
