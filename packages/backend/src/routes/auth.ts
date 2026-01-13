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
import { authLimiter, registerLimiter } from '../middleware/rateLimiter';
import { csrfService } from '../services/csrf';
import { CSRF_RESPONSE_HEADER } from '../middleware/csrf';

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
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .refine(
      (password) => /[a-zA-Z0-9]/.test(password),
      'Password must contain at least one letter or number'
    )
    .refine(
      (password) => !/^(password|123456|qwerty|admin|letmein)$/i.test(password),
      'Password is too common. Please choose a more secure password.'
    ),
  email: z.string().email('Invalid email address').optional(),
});

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { login, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

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

      // Generate CSRF token for authenticated user
      const sessionId = `user-${payload?.userId || result.playerProfile?.uuid || login}`;
      const csrfToken = csrfService.generateToken(sessionId);

      // Set CSRF token in response header
      res.setHeader(CSRF_RESPONSE_HEADER, csrfToken);

      res.json({
        success: true,
        data: {
          playerProfile: result.playerProfile,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          refreshExpiresIn: result.refreshExpiresIn,
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
  registerLimiter,
  validate(registerSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password, email } = req.body;

      const result = await AuthService.register(username, password, email);

      if (!result.success) {
        throw new AppError(400, result.error || 'Registration failed');
      }

      // Generate CSRF token for newly registered user
      const sessionId = `user-${result.userId}`;
      const csrfToken = csrfService.generateToken(sessionId);

      // Set CSRF token in response header
      res.setHeader(CSRF_RESPONSE_HEADER, csrfToken);

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
 * Revoke current session
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
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token is required');
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    if (!result.success) {
      throw new AppError(401, result.error || 'Token refresh failed');
    }

    // Generate CSRF token for refreshed session
    const payload = AuthService.verifyToken(result.accessToken!);
    const sessionId = `user-${payload?.userId || 'unknown'}`;
    const csrfToken = csrfService.generateToken(sessionId);

    // Set CSRF token in response header
    res.setHeader(CSRF_RESPONSE_HEADER, csrfToken);

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        refreshExpiresIn: result.refreshExpiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
router.get('/sessions', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const currentToken = authHeader?.substring(7) || '';

    const sessions = await AuthService.getUserSessions(req.user.userId);

    res.json({
      success: true,
      data: {
        sessions,
        currentToken,
        count: sessions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/auth/sessions/:id
 * Revoke a specific session by ID
 */
router.delete('/sessions/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await AuthService.revokeSessionById(id, req.user.userId);

    if (!deleted) {
      throw new AppError(404, 'Session not found or already revoked');
    }

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/auth/sessions
 * Revoke all other sessions (except current)
 */
router.delete('/sessions', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const currentToken = authHeader?.substring(7) || '';

    if (!currentToken) {
      throw new AppError(400, 'Invalid session token');
    }

    const count = await AuthService.revokeAllOtherSessions(req.user.userId, currentToken);

    res.json({
      success: true,
      message: `Revoked ${count} other session(s)`,
      data: { revokedCount: count },
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
