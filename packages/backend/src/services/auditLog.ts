/**
 * Audit Log Service
 *
 * Records sensitive operations for security auditing, compliance, and forensics.
 * Automatically logs authentication attempts, user management, profile changes,
 * and other sensitive operations with full context.
 *
 * @example
 * ```ts
 * import { createAuditLog, auditMiddleware } from './services/auditLog';
 *
 * // Manual audit log entry
 * await createAuditLog({
 *   userId: '123',
 *   username: 'admin',
 *   action: 'DELETE /api/users/456',
 *   method: 'DELETE',
 *   path: '/api/users/456',
 *   statusCode: 200,
 *   ipAddress: '192.168.1.1',
 *   success: true,
 * });
 *
 * // Automatic middleware (applied to sensitive paths)
 * app.use('/api/auth', auditMiddleware());
 * ```
 *
 * @feature Automatic audit logging via middleware
 * @feature Tracks user identity, IP, user agent, request ID
 * @feature Records success/failure and error messages
 * @feature Periodic cleanup of old logs (default: 90 days retention)
 * @feature Per-user and global audit log queries
 */

import { prisma } from './database';
import { Request } from 'express';
import { AuthRequest } from '../middleware/auth';

/**
 * Audit log entry data structure
 *
 * @interface AuditLogData
 */
interface AuditLogData {
  /** User ID (if authenticated) */
  userId?: string;
  /** Username (if authenticated) */
  username?: string;
  /** Action performed (e.g., "POST /api/auth/login") */
  action: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** HTTP response status code */
  statusCode: number;
  /** Client IP address */
  ipAddress?: string;
  /** Client user agent */
  userAgent?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message (if failed) */
  errorMessage?: string;
  /** Additional metadata (e.g., duration, changes made) */
  metadata?: Record<string, any>;
}

/**
 * Sensitive paths that require audit logging
 *
 * These paths are automatically logged when using auditMiddleware.
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
 *
 * @param path - Request path to check
 * @returns true if path should be audited
 */
function shouldAuditPath(path: string): boolean {
  return AUDIT_PATHS.some(auditPath => path.startsWith(auditPath));
}

/**
 * Create an audit log entry
 *
 * Writes an audit log to the database. Silently fails to prevent breaking
 * the application if audit logging fails.
 *
 * @param data - Audit log data
 *
 * @example
 * ```ts
 * await createAuditLog({
 *   userId: 'user-123',
 *   username: 'johndoe',
 *   action: 'POST /api/auth/login',
 *   method: 'POST',
 *   path: '/api/auth/login',
 *   statusCode: 200,
 *   ipAddress: '192.168.1.100',
 *   userAgent: 'Mozilla/5.0...',
 *   requestId: 'req-abc123',
 *   success: true,
 *   metadata: { duration: 45 },
 * });
 * ```
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
 *
 * Automatically extracts user info, IP address, user agent, and request ID
 * from an Express request object for audit logging.
 *
 * @param req - Express request object (cast to AuthRequest for user info)
 * @param statusCode - HTTP response status code
 * @param success - Whether the operation succeeded
 * @param errorMessage - Optional error message
 * @returns Audit log data extracted from request
 *
 * @example
 * ```ts
 * const auditData = extractAuditData(req, 200, true);
 * // { userId: '123', username: 'admin', action: 'GET /api/users', ... }
 * ```
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
 *
 * Creates Express middleware that automatically logs requests to sensitive paths.
 * Captures both successful and failed requests with timing information.
 *
 * @param paths - Array of path prefixes to audit (default: AUDIT_PATHS)
 * @returns Express middleware function
 *
 * @example
 * ```ts
 * // Use default paths
 * app.use(auditMiddleware());
 *
 * // Use custom paths
 * app.use(auditMiddleware(['/api/sensitive', '/api/admin']));
 *
 * // Apply to specific route
 * app.use('/api/auth', auditMiddleware(['/api/auth']));
 * ```
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
 * Clean up old audit logs
 *
 * Deletes audit logs older than the specified retention period.
 * Should be called periodically (e.g., daily) to manage database size.
 *
 * @param daysToKeep - Number of days to retain logs (default: 90)
 * @returns Number of logs deleted
 *
 * @example
 * ```ts
 * // Delete logs older than 90 days (default)
 * const deleted = await cleanupOldAuditLogs();
 * console.log(`Deleted ${deleted} old audit logs`);
 *
 * // Delete logs older than 30 days
 * const deleted = await cleanupOldAuditLogs(30);
 *
 * // Schedule daily cleanup
 * setInterval(() => {
 *   cleanupOldAuditLogs(90).then(count => {
 *     console.log(`Cleanup: removed ${count} old audit logs`);
 *   });
 * }, 24 * 60 * 60 * 1000);
 * ```
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
 * Get audit logs for a specific user
 *
 * Retrieves audit log entries for a specific user, ordered by most recent first.
 *
 * @param userId - User ID to get audit logs for
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of audit log entries for the user
 *
 * @example
 * ```ts
 * // Get last 100 audit logs for user
 * const logs = await getUserAuditLogs('user-123');
 * logs.forEach(log => {
 *   console.log(`${log.action} - ${log.success ? 'Success' : 'Failed'}`);
 * });
 *
 * // Get last 50 audit logs
 * const logs = await getUserAuditLogs('user-123', 50);
 * ```
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
 *
 * Retrieves the most recent audit log entries across all users.
 * For admin use - provides system-wide audit trail visibility.
 *
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of recent audit log entries
 *
 * @example
 * ```ts
 * // Get last 100 audit logs system-wide
 * const logs = await getRecentAuditLogs();
 * logs.forEach(log => {
 *   console.log(`[${log.username}] ${log.action} - ${log.success ? 'OK' : 'FAIL'}`);
 * });
 *
 * // Get last 50 audit logs
 * const logs = await getRecentAuditLogs(50);
 * ```
 */
export async function getRecentAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
