/**
 * Client profiles routes
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../services/database';
import { AppError } from '../middleware/errorHandler';
import { sign } from '../services/crypto';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { EconomyLeaderboardConfig } from '@modern-launcher/shared';
import { getEconomyLeaderboard } from '../services/economyLeaderboard';

const router = Router();

/**
 * GET /api/profiles
 * Get all client profiles
 */
router.get('/', async (req, res, next) => {
  try {
    const profiles = await prisma.clientProfile.findMany({
      where: { enabled: true },
      orderBy: { sortIndex: 'asc' },
    });

    // Sign each profile
    const signedProfiles = profiles.map(profile => ({
      profile,
      signature: sign(JSON.stringify(profile)),
    }));

    res.json({
      success: true,
      data: signedProfiles,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profiles/:id
 * Get single profile
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await prisma.clientProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    res.json({
      success: true,
      data: {
        profile,
        signature: sign(JSON.stringify(profile)),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profiles
 * Create new profile (Admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  [
    body('version').trim().notEmpty().withMessage('Version is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('serverAddress').trim().notEmpty().withMessage('Server address is required'),
    body('serverPort').isInt({ min: 1, max: 65535 }).withMessage('Server port must be between 1 and 65535'),
    body('mainClass').trim().notEmpty().withMessage('Main class is required'),
    body('classPath').isArray().withMessage('Class path must be an array'),
    body('jvmArgs').isArray().withMessage('JVM args must be an array'),
    body('clientArgs').isArray().withMessage('Client args must be an array'),
    body('sortIndex').isInt().withMessage('Sort index must be an integer'),
    body('assetIndex').trim().notEmpty().withMessage('Asset index is required'),
    body('clientDirectory').optional().trim().notEmpty().withMessage('Client directory cannot be empty'),
  ],
  async (req: AuthRequest, res, next) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

    const profileData = req.body;

      // Sanitize clientDirectory or generate from title
      let clientDirectory = profileData.clientDirectory;
      if (!clientDirectory) {
        clientDirectory = profileData.title.replace(/[^a-zA-Z0-9_.-]/g, '_');
      }
      // Basic path traversal protection
      clientDirectory = clientDirectory.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');


      // Ensure arrays are properly formatted
    const profile = await prisma.clientProfile.create({
        data: {
          version: profileData.version,
          title: profileData.title,
          description: profileData.description || null,
          clientDirectory: clientDirectory,
          serverAddress: profileData.serverAddress,
          serverPort: profileData.serverPort,
          mainClass: profileData.mainClass,
          classPath: Array.isArray(profileData.classPath) ? profileData.classPath : [],
          jvmArgs: Array.isArray(profileData.jvmArgs) ? profileData.jvmArgs : [],
          clientArgs: Array.isArray(profileData.clientArgs) ? profileData.clientArgs : [],
          sortIndex: profileData.sortIndex || 0,
          assetIndex: profileData.assetIndex,
          jvmVersion: profileData.jvmVersion || null,
          updateFastCheck: profileData.updateFastCheck !== undefined ? profileData.updateFastCheck : true,
          update: Array.isArray(profileData.update) ? profileData.update : [],
          updateVerify: Array.isArray(profileData.updateVerify) ? profileData.updateVerify : [],
          updateExclusions: Array.isArray(profileData.updateExclusions) ? profileData.updateExclusions : [],
          tags: Array.isArray(profileData.tags) ? profileData.tags : [],
          enabled: profileData.enabled !== undefined ? profileData.enabled : true,
          economyConfig: profileData.economyConfig || null,
        },
    });

    res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
  }
);

/**
 * PUT /api/profiles/:id
 * Update profile (Admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  [
    body('version').optional().trim().notEmpty().withMessage('Version cannot be empty'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('serverAddress').optional().trim().notEmpty().withMessage('Server address cannot be empty'),
    body('serverPort').optional().isInt({ min: 1, max: 65535 }).withMessage('Server port must be between 1 and 65535'),
    body('mainClass').optional().trim().notEmpty().withMessage('Main class cannot be empty'),
    body('classPath').optional().isArray().withMessage('Class path must be an array'),
    body('jvmArgs').optional().isArray().withMessage('JVM args must be an array'),
    body('clientArgs').optional().isArray().withMessage('Client args must be an array'),
    body('clientDirectory').optional().trim().notEmpty().withMessage('Client directory cannot be empty'),
  ],
  async (req: AuthRequest, res, next) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

    const { id } = req.params;
    const profileData = req.body;

      // Check if profile exists
      const existing = await prisma.clientProfile.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(404, 'Profile not found');
      }

      // Prepare update data
      const updateData: any = {};
      if (profileData.version !== undefined) updateData.version = profileData.version;
      if (profileData.title !== undefined) updateData.title = profileData.title;
      if (profileData.description !== undefined) updateData.description = profileData.description;
      if (profileData.serverAddress !== undefined) updateData.serverAddress = profileData.serverAddress;
      if (profileData.serverPort !== undefined) updateData.serverPort = profileData.serverPort;
      if (profileData.mainClass !== undefined) updateData.mainClass = profileData.mainClass;
      if (profileData.classPath !== undefined) updateData.classPath = Array.isArray(profileData.classPath) ? profileData.classPath : [];
      if (profileData.jvmArgs !== undefined) updateData.jvmArgs = Array.isArray(profileData.jvmArgs) ? profileData.jvmArgs : [];
      if (profileData.clientArgs !== undefined) updateData.clientArgs = Array.isArray(profileData.clientArgs) ? profileData.clientArgs : [];
      if (profileData.sortIndex !== undefined) updateData.sortIndex = profileData.sortIndex;
      if (profileData.assetIndex !== undefined) updateData.assetIndex = profileData.assetIndex;
      if (profileData.jvmVersion !== undefined) updateData.jvmVersion = profileData.jvmVersion;
      if (profileData.updateFastCheck !== undefined) updateData.updateFastCheck = profileData.updateFastCheck;
      if (profileData.update !== undefined) updateData.update = Array.isArray(profileData.update) ? profileData.update : [];
      if (profileData.updateVerify !== undefined) updateData.updateVerify = Array.isArray(profileData.updateVerify) ? profileData.updateVerify : [];
      if (profileData.updateExclusions !== undefined) updateData.updateExclusions = Array.isArray(profileData.updateExclusions) ? profileData.updateExclusions : [];
      if (profileData.tags !== undefined) updateData.tags = Array.isArray(profileData.tags) ? profileData.tags : [];
      if (profileData.enabled !== undefined) updateData.enabled = profileData.enabled;
      if (profileData.economyConfig !== undefined) updateData.economyConfig = profileData.economyConfig;
      if (profileData.clientDirectory !== undefined) {
        // Basic path traversal protection
        updateData.clientDirectory = profileData.clientDirectory.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
      }

    const profile = await prisma.clientProfile.update({
      where: { id },
        data: updateData,
    });

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
  }
);

/**
 * DELETE /api/profiles/:id
 * Delete profile (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if profile exists
    const profile = await prisma.clientProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    await prisma.clientProfile.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Profile deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profiles/:id/economy/top
 * Get top balances for server leaderboard
 */
router.get('/:id/economy/top', async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await prisma.clientProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    const economyConfig = profile.economyConfig
      ? (profile.economyConfig as unknown as EconomyLeaderboardConfig)
      : null;

    if (!economyConfig || economyConfig.enabled === false) {
      return res.json({
        success: true,
        data: {
          players: [],
          currencySymbol: economyConfig?.currencySymbol,
          precision: typeof economyConfig?.precision === 'number' ? economyConfig.precision : 0,
          limit: 0,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    const leaderboard = await getEconomyLeaderboard(economyConfig);

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
