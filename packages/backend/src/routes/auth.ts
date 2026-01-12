/**
 * Authentication routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth';
import { AppError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../validation';
import { logger } from '../utils/logger';
import { createAuthLogData } from '../utils/logSanitizer';

const router = Router();

const loginSchema = z.object({
  login: z.string().min(1, 'Login is required').trim(),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be 3-16 characters')
    .max(16, 'Username must be 3-16 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address').optional(),
});

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post(
  '/login',
  validate(loginSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { login, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      // Check rate limit
      const isRateLimited = await AuthService.checkRateLimit(ipAddress);
      if (isRateLimited) {
        logger.info('Authentication rate limit exceeded', createAuthLogData({ login, ipAddress }));
        throw new AppError(429, 'Too many authentication attempts. Please try again later.');
      }

      const result = await AuthService.authenticate(login, password, ipAddress);

      // Log authentication attempt (without sensitive data)
      if (result.success) {
        logger.info('Authentication successful', createAuthLogData({ login, ipAddress, success: true }));
      } else {
        logger.warn('Authentication failed', createAuthLogData({ login, ipAddress, success: false }));
      }

      if (!result.success) {
        throw new AppError(401, result.error || 'Authentication failed');
      }

      // Decode token to get role
      const payload = AuthService.verifyToken(result.accessToken!);
      
      res.json({
        success: true,
        data: {
          playerProfile: result.playerProfile,
          accessToken: result.accessToken,
          role: payload?.role || 'USER',
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
  validate(registerSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
