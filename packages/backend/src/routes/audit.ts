/**
 * Audit Log routes
 * Admin API for accessing security audit logs
 */

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { getUserAuditLogs, getRecentAuditLogs } from '../services/auditLog';

const router = Router();

/**
 * GET /api/audit/recent
 * Get recent audit logs (admin only)
 *
 * Returns the most recent audit log entries across all users.
 * Useful for security monitoring and compliance.
 */
router.get(
  '/recent',
  authenticateToken,
  requireAdmin,
  [
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await getRecentAuditLogs(limit);

      res.json({
        success: true,
        data: {
          logs,
          count: logs.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/audit/user/:userId
 * Get audit logs for a specific user (admin only)
 *
 * Retrieves audit log entries for a specific user.
 * Useful for investigating user activity.
 */
router.get(
  '/user/:userId',
  authenticateToken,
  requireAdmin,
  [
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await getUserAuditLogs(userId, limit);

      res.json({
        success: true,
        data: {
          userId,
          logs,
          count: logs.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
