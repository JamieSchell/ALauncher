/**
 * Notifications API
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../services/database';
import { AppError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { UserRole, Prisma, NotificationType } from '@prisma/client';

// NotificationType enum values for validation
const NotificationTypeValues = Object.values(NotificationType);

const router = Router();

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get(
  '/',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const offset = parseInt(req.query.offset as string, 10) || 0;
      const unreadOnly = req.query.unreadOnly === 'true';
      const type = req.query.type as NotificationType | undefined;

      const where: any = { userId };
      if (unreadOnly) {
        where.read = false;
      }
      if (type) {
        where.type = type as NotificationType;
      }

      try {
        const [notifications, total, unreadCount] = await Promise.all([
          prisma.notification.findMany({
            where,
            orderBy: {
              createdAt: 'desc',
            },
            take: limit,
            skip: offset,
          }),
          prisma.notification.count({ where }),
          prisma.notification.count({
            where: { userId, read: false },
          }),
        ]);

        res.json({
          success: true,
          data: notifications,
          pagination: {
            total,
            limit,
            offset,
          },
          unreadCount,
        });
      } catch (error: any) {
        // If table doesn't exist, return empty list
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          res.json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              limit,
              offset,
            },
            unreadCount: 0,
          });
          return;
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/notifications
 * Create a notification (Admin only or system)
 */
router.post(
  '/',
  authenticateToken,
  [
    body('type').isIn(NotificationTypeValues).withMessage('Invalid notification type'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('userId').optional().isString(),
    body('data').optional().isObject(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '));
      }

      // Only admins can create notifications for other users
      const targetUserId = req.body.userId || req.user!.userId;
      if (targetUserId !== req.user!.userId && req.user!.role !== UserRole.ADMIN) {
        throw new AppError(403, 'Access denied. Only admins can create notifications for other users.');
      }

      try {
        const notification = await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: req.body.type as NotificationType,
            title: req.body.title,
            message: req.body.message,
            data: req.body.data || null,
          },
        });

        res.status(201).json({ success: true, data: notification });
      } catch (error: any) {
        // If table doesn't exist, return error
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          throw new AppError(503, 'Notifications table does not exist. Please run migration: npm run apply-notifications-migration');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch(
  '/:id/read',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.userId;
      const notificationId = req.params.id;

      try {
        const notification = await prisma.notification.findUnique({
          where: { id: notificationId },
        });

        if (!notification) {
          throw new AppError(404, 'Notification not found');
        }

        if (notification.userId !== userId) {
          throw new AppError(403, 'Access denied');
        }

        const updated = await prisma.notification.update({
          where: { id: notificationId },
          data: {
            read: true,
            readAt: new Date(),
          },
        });

        res.json({ success: true, data: updated });
      } catch (error: any) {
        // If table doesn't exist, return 404
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          throw new AppError(404, 'Notification not found');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch(
  '/read-all',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.userId;

      try {
        await prisma.notification.updateMany({
          where: { userId, read: false },
          data: {
            read: true,
            readAt: new Date(),
          },
        });

        res.json({ success: true });
      } catch (error: any) {
        // If table doesn't exist, return success (nothing to update)
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          res.json({ success: true });
          return;
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.userId;
      const notificationId = req.params.id;

      try {
        const notification = await prisma.notification.findUnique({
          where: { id: notificationId },
        });

        if (!notification) {
          throw new AppError(404, 'Notification not found');
        }

        if (notification.userId !== userId) {
          throw new AppError(403, 'Access denied');
        }

        await prisma.notification.delete({
          where: { id: notificationId },
        });

        res.json({ success: true });
      } catch (error: any) {
        // If table doesn't exist, return 404
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          throw new AppError(404, 'Notification not found');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/notifications
 * Delete all notifications (or filtered)
 */
router.delete(
  '/',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.userId;
      const readOnly = req.query.readOnly === 'true';
      const type = req.query.type as NotificationType | undefined;

      const where: any = { userId };
      if (readOnly) {
        where.read = true;
      }
      if (type) {
        where.type = type;
      }

      try {
        await prisma.notification.deleteMany({ where });
        res.json({ success: true });
      } catch (error: any) {
        // If table doesn't exist, return success (nothing to delete)
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          res.json({ success: true });
          return;
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/notifications/unread-count
 * Get unread notifications count
 */
router.get(
  '/unread-count',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.userId;

      try {
        const count = await prisma.notification.count({
          where: { userId, read: false },
        });

        res.json({ success: true, count });
      } catch (error: any) {
        // If table doesn't exist, return 0
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          res.json({ success: true, count: 0 });
          return;
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;

