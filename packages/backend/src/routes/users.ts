/**
 * User routes
 */

import { Router } from 'express';
import { prisma } from '../services/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        uuid: true,
        email: true,
        skinUrl: true,
        cloakUrl: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/me
 * Update user profile
 */
router.put('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { email, skinUrl, cloakUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        email,
        skinUrl,
        cloakUrl,
      },
      select: {
        id: true,
        username: true,
        uuid: true,
        email: true,
        skinUrl: true,
        cloakUrl: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:username/profile
 * Get user profile by username (public)
 */
router.get('/:username/profile', async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        uuid: true,
        skinUrl: true,
        cloakUrl: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
