/**
 * Statistics routes
 * API для работы со статистикой использования лаунчера
 */

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import * as StatisticsService from '../services/statistics';

const router = Router();

/**
 * POST /api/statistics/launch
 * Создать запись о запуске игры
 */
router.post(
  '/launch',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      console.log('[Statistics] POST /api/statistics/launch', {
        userId: req.user!.userId,
        username: req.user!.username,
        profileId: req.body.profileId,
        profileVersion: req.body.profileVersion,
      });

      const launchId = await StatisticsService.createGameLaunch({
        userId: req.user!.userId,
        username: req.user!.username,
        profileId: req.body.profileId,
        profileVersion: req.body.profileVersion,
        serverAddress: req.body.serverAddress,
        serverPort: req.body.serverPort,
        javaVersion: req.body.javaVersion,
        javaPath: req.body.javaPath,
        ram: req.body.ram,
        resolution: req.body.resolution,
        fullScreen: req.body.fullScreen,
        autoEnter: req.body.autoEnter,
        os: req.body.os,
        osVersion: req.body.osVersion,
      });

      console.log('[Statistics] ✅ Game launch created:', launchId);

      // Создать сессию игры
      const sessionId = await StatisticsService.createGameSession({
        launchId,
        userId: req.user!.userId,
        username: req.user!.username,
        profileId: req.body.profileId,
        profileVersion: req.body.profileVersion,
        serverAddress: req.body.serverAddress,
        serverPort: req.body.serverPort,
      });

      console.log('[Statistics] ✅ Game session created:', sessionId);

      res.json({
        success: true,
        data: {
          launchId,
          sessionId,
        },
      });
    } catch (error: any) {
      console.error('[Statistics] ❌ Error creating game launch:', error);
      console.error('[Statistics] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }
);

/**
 * POST /api/statistics/session/end
 * Завершить сессию игры
 */
router.post(
  '/session/end',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const { sessionId, exitCode, crashed } = req.body;

      console.log('[Statistics] POST /api/statistics/session/end', {
        sessionId,
        exitCode,
        crashed,
        userId: req.user!.userId,
      });

      if (!sessionId) {
        throw new AppError(400, 'Session ID is required');
      }

      await StatisticsService.endGameSession(sessionId, exitCode, crashed);

      console.log('[Statistics] ✅ Game session ended successfully:', sessionId);

      res.json({
        success: true,
      });
    } catch (error: any) {
      console.error('[Statistics] ❌ Error ending game session:', error);
      console.error('[Statistics] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }
);

/**
 * GET /api/statistics/user
 * Получить статистику использования для текущего пользователя
 */
router.get(
  '/user',
  authenticateToken,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const days = parseInt(req.query.days as string) || 30;
      const statistics = await StatisticsService.getUserStatistics(req.user!.userId, days);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/statistics/admin/analytics
 * Получить аналитику для администраторов
 */
router.get(
  '/admin/analytics',
  authenticateToken,
  requireAdmin,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const days = parseInt(req.query.days as string) || 30;
      const analytics = await StatisticsService.getAdminAnalytics(days);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

