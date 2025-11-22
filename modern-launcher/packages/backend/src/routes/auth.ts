/**
 * Authentication routes
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth';
import { AppError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post(
  '/login',
  [
    body('login').trim().notEmpty().withMessage('Login is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const { login, password } = req.body;
      const ipAddress = req.ip;

      // Check rate limit
      const isRateLimited = await AuthService.checkRateLimit(ipAddress);
      if (isRateLimited) {
        throw new AppError(429, 'Too many authentication attempts. Please try again later.');
      }

      const result = await AuthService.authenticate(login, password, ipAddress);

      if (!result.success) {
        throw new AppError(401, result.error || 'Authentication failed');
      }

      res.json({
        success: true,
        data: {
          playerProfile: result.playerProfile,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/register
 * Register new user
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 16 })
      .withMessage('Username must be 3-16 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email address'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { username, password, email } = req.body;

      const result = await AuthService.register(username, password, email);

      if (!result.success) {
        throw new AppError(400, result.error || 'Registration failed');
      }

      res.status(201).json({
        success: true,
        data: {
          userId: result.userId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Revoke session
 */
router.post('/logout', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      await AuthService.revokeSession(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/validate
 * Validate current session
 */
router.get('/validate', authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export default router;
