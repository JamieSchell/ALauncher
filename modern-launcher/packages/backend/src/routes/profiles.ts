/**
 * Client profiles routes
 */

import { Router } from 'express';
import { prisma } from '../services/database';
import { AppError } from '../middleware/errorHandler';
import { sign } from '../services/crypto';

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
 * Create new profile
 */
router.post('/', async (req, res, next) => {
  try {
    const profileData = req.body;

    const profile = await prisma.clientProfile.create({
      data: profileData,
    });

    res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profiles/:id
 * Update profile
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const profileData = req.body;

    const profile = await prisma.clientProfile.update({
      where: { id },
      data: profileData,
    });

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/profiles/:id
 * Delete profile
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

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

export default router;
