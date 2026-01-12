/**
 * Audit Log Service
 * Records sensitive operations for security auditing and compliance
 */

import { prisma } from './database';
import { Request } from 'express';
import { AuthRequest } from '../middleware/auth';

interface AuditLogData {
  userId?: string;
  username?: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Sensitive paths that require audit logging
 */
const AUDIT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/users',
  '/api/profiles',
  '/api/admin',
  '/api/launcher',
];

/**
 * Check if a path should be audited
 */
function shouldAuditPath(path: string): boolean {
  return AUDIT_PATHS.some(auditPath => path.startsWith(auditPath));
}

/**
 * Create an audit log entry
 *
 * @param data - Audit log data
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        username: data.username,
        action: data.action,
        method: data.method,
        path: data.path,
        statusCode: data.statusCode,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestId: data.requestId,
        success: data.success,
        errorMessage: data.errorMessage,
        metadata: data.metadata as any,
      },
    });
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break the application
    console.error('[AuditLog] Failed to create audit log:', error);
  }
}

/**
 * Extract audit data from Express request
 */
export function extractAuditData(req: Request, statusCode: number, success: boolean, errorMessage?: string): AuditLogData {
  const authReq = req as AuthRequest;

  return {
    userId: authReq.user?.userId,
    username: authReq.user?.username,
    action: `${req.method} ${req.path}`,
    method: req.method,
    path: req.path,
    statusCode,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    requestId: req.id,
    success,
    errorMessage,
  };
}

/**
 * Audit middleware factory
 * Creates middleware that logs requests for sensitive paths
 */
export function auditMiddleware(paths: string[] = AUDIT_PATHS) {
  return async (req: Request, res: any, next: any) => {
    // Check if this path should be audited
    const shouldAudit = paths.some(path => req.path.startsWith(path));

    if (!shouldAudit) {
      return next();
    }

    // Capture the original res.json to log the response
    const originalJson = res.json;
    const chunks: Buffer[] = [];

    // Log request start
    const startTime = Date.now();

    // Capture response
    res.json = function(data: any) {
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 300;
      const duration = Date.now() - startTime;

      // Create audit log
      createAuditLog({
        ...extractAuditData(req, statusCode, success),
        metadata: { duration },
      });

      return originalJson.call(this, data);
    };

    // Also capture errors
    res.on('finish', () => {
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 300;
      const duration = Date.now() - startTime;

      // Only log if not already logged via res.json
      if (statusCode !== 200) {
        createAuditLog({
          ...extractAuditData(req, statusCode, success),
          metadata: { duration },
        });
      }
    });

    next();
  };
}

/**
 * Clean up old audit logs (call periodically)
 *
 * @param daysToKeep - Number of days to retain logs (default: 90)
 * @returns Number of logs deleted
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('[AuditLog] Failed to cleanup old logs:', error);
    return 0;
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get recent audit logs (admin only)
 */
export async function getRecentAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
