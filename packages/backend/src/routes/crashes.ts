/**
 * Game Crashes and Connection Issues API
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../services/database';
import { AppError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ConnectionIssueType, LauncherErrorType, UserRole } from '@prisma/client';

const router = Router();

/**
 * POST /api/crashes
 * Log a game crash
 */
router.post(
  '/',
  [
    body('exitCode').isInt().withMessage('Exit code must be an integer'),
    body('errorMessage').optional().isString(),
    body('stackTrace').optional().isString(),
    body('stderrOutput').optional().isString(),
    body('stdoutOutput').optional().isString(),
    body('profileId').optional().isString(),
    body('profileVersion').optional().isString(),
    body('serverAddress').optional().isString(),
    body('serverPort').optional().isInt(),
    body('javaVersion').optional().isString(),
    body('javaPath').optional().isString(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const crashData = {
        userId: req.user?.userId || null,
        username: req.user?.username || req.body.username || null,
        profileId: req.body.profileId || null,
        profileVersion: req.body.profileVersion || null,
        serverAddress: req.body.serverAddress || null,
        serverPort: req.body.serverPort || null,
        exitCode: req.body.exitCode,
        errorMessage: req.body.errorMessage || null,
        stackTrace: req.body.stackTrace || null,
        stderrOutput: req.body.stderrOutput || null,
        stdoutOutput: req.body.stdoutOutput || null,
        javaVersion: req.body.javaVersion || null,
        javaPath: req.body.javaPath || null,
        os: req.body.os || process.platform,
        osVersion: req.body.osVersion || null,
      };

      const crash = await prisma.gameCrash.create({
        data: crashData,
      });

      res.status(201).json({ success: true, data: crash });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/crashes
 * Get crashes (Admin only or own crashes)
 */
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { limit = 50, offset = 0, profileId, userId } = req.query;

    const where: any = {};
    
    // Non-admins can only see their own crashes
    if (req.user?.role !== UserRole.ADMIN) {
      where.userId = req.user?.userId;
    } else {
      // Admins can filter by userId
      if (userId) {
        where.userId = userId as string;
      }
    }

    if (profileId) {
      where.profileId = profileId as string;
    }

    const crashes = await prisma.gameCrash.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    const total = await prisma.gameCrash.count({ where });

    res.json({
      success: true,
      data: crashes,
      pagination: {
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/crashes/connection-issues
 * Log a server connection issue
 */
router.post(
  '/connection-issues',
  [
    body('serverAddress').trim().notEmpty().withMessage('Server address is required'),
    body('serverPort').isInt({ min: 1, max: 65535 }).withMessage('Server port must be between 1 and 65535'),
    body('issueType').isIn(Object.values(ConnectionIssueType)).withMessage('Invalid issue type'),
    body('errorMessage').optional().isString(),
    body('logOutput').optional().isString(),
    body('profileId').optional().isString(),
    body('profileVersion').optional().isString(),
    body('javaVersion').optional().isString(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const issueData = {
        userId: req.user?.userId || null,
        username: req.user?.username || req.body.username || null,
        profileId: req.body.profileId || null,
        profileVersion: req.body.profileVersion || null,
        serverAddress: req.body.serverAddress,
        serverPort: req.body.serverPort,
        issueType: req.body.issueType as ConnectionIssueType,
        errorMessage: req.body.errorMessage || null,
        logOutput: req.body.logOutput || null,
        javaVersion: req.body.javaVersion || null,
        os: req.body.os || process.platform,
      };

      const issue = await prisma.serverConnectionIssue.create({
        data: issueData,
      });

      res.status(201).json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/crashes/connection-issues
 * Get connection issues (Admin only or own issues)
 */
router.get('/connection-issues', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { limit = 50, offset = 0, profileId, serverAddress, issueType } = req.query;

    const where: any = {};
    
    // Non-admins can only see their own issues
    if (req.user?.role !== UserRole.ADMIN) {
      where.userId = req.user?.userId;
    }

    if (profileId) {
      where.profileId = profileId as string;
    }

    if (serverAddress) {
      where.serverAddress = serverAddress as string;
    }

    if (issueType) {
      where.issueType = issueType as ConnectionIssueType;
    }

    const issues = await prisma.serverConnectionIssue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    const total = await prisma.serverConnectionIssue.count({ where });

    res.json({
      success: true,
      data: issues,
      pagination: {
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/crashes/launcher-errors
 * Log a launcher error
 */
router.post(
  '/launcher-errors',
  [
    body('errorType').isIn(Object.values(LauncherErrorType)).withMessage('Invalid error type'),
    body('errorMessage').trim().notEmpty().withMessage('Error message is required'),
    body('stackTrace').optional().isString(),
    body('component').optional().isString(),
    body('action').optional().isString(),
    body('url').optional().isString(),
    body('statusCode').optional().isInt(),
    body('userAgent').optional().isString(),
    body('os').optional().isString(),
    body('osVersion').optional().isString(),
    body('launcherVersion').optional().isString(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const errorData = {
        userId: req.user?.userId || null,
        username: req.user?.username || req.body.username || null,
        errorType: req.body.errorType as LauncherErrorType,
        errorMessage: req.body.errorMessage,
        stackTrace: req.body.stackTrace || null,
        component: req.body.component || null,
        action: req.body.action || null,
        url: req.body.url || null,
        statusCode: req.body.statusCode || null,
        userAgent: req.body.userAgent || req.headers['user-agent'] || null,
        os: req.body.os || process.platform,
        osVersion: req.body.osVersion || null,
        launcherVersion: req.body.launcherVersion || null,
      };

      try {
        const launcherError = await prisma.launcherError.create({
          data: errorData,
        });

        res.status(201).json({ success: true, data: launcherError });
      } catch (dbError: any) {
        console.error('[LauncherErrors] Database error on create:', dbError);
        // Если таблица не существует, возвращаем ошибку
        if (
          dbError.message?.includes('does not exist') || 
          dbError.message?.includes('Unknown table') || 
          dbError.code === 'P2021' ||
          dbError.code === 'P2001' ||
          dbError.message?.includes('Table') && dbError.message?.includes('doesn\'t exist')
        ) {
          throw new AppError(500, 'Launcher errors table does not exist. Please apply migration.');
        }
        throw dbError;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/crashes/launcher-errors
 * Get launcher errors (Admin only)
 */
router.get(
  '/launcher-errors',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      // Проверка прав администратора
      if (req.user?.role !== UserRole.ADMIN) {
        throw new AppError(403, 'Access denied. Admin only.');
      }

      const limit = parseInt(req.query.limit as string, 10) || 50;
      const offset = parseInt(req.query.offset as string, 10) || 0;
      const errorType = req.query.errorType as LauncherErrorType | undefined;
      const component = req.query.component as string | undefined;

      const where: any = {};
      if (errorType) {
        where.errorType = errorType;
      }
      if (component) {
        where.component = { contains: component };
      }

      try {
        const [errors, total] = await Promise.all([
          prisma.launcherError.findMany({
            where,
            orderBy: {
              createdAt: 'desc',
            },
            take: limit,
            skip: offset,
          }),
          prisma.launcherError.count({ where }),
        ]);

        res.json({
          success: true,
          data: errors,
          pagination: {
            total,
            limit,
            offset,
          },
        });
      } catch (dbError: any) {
        console.error('[LauncherErrors] Database error:', dbError);
        // Если таблица не существует, возвращаем пустой список
        if (
          dbError.message?.includes('does not exist') || 
          dbError.message?.includes('Unknown table') || 
          dbError.code === 'P2021' ||
          dbError.code === 'P2001' ||
          dbError.message?.includes('Table') && dbError.message?.includes('doesn\'t exist')
        ) {
          console.warn('[LauncherErrors] Table does not exist, returning empty list');
          res.json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              limit,
              offset,
            },
          });
          return;
        }
        throw dbError;
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;

