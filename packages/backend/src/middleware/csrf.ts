/**
 * CSRF Middleware
 *
 * Middleware to protect against Cross-Site Request Forgery attacks.
 *
 * Validates CSRF tokens for state-changing requests (POST, PUT, DELETE, PATCH).
 * Safe methods (GET, HEAD, OPTIONS) are exempt from CSRF checks.
 *
 * @example
 * ```ts
 * import { csrfMiddleware } from './middleware/csrf';
 *
 * // Apply to all routes
 * app.use(csrfMiddleware);
 *
 * // Apply to specific routes
 * app.post('/api/users', csrfMiddleware, createUserHandler);
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import { csrfService } from '../services/csrf';
import { AuthRequest } from './auth';
import { ErrorCodeV1 } from '@modern-launcher/shared';

/**
 * Extended request interface with CSRF flag
 */
interface CsrfRequest extends AuthRequest {
  csrfProcessed?: boolean;
}

/**
 * CSRF token header name
 */
export const CSRF_HEADER = 'x-csrf-token';

/**
 * CSRF token response header name
 */
export const CSRF_RESPONSE_HEADER = 'x-csrf-token';

/**
 * Methods that require CSRF protection
 */
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Methods that are safe and don't require CSRF protection
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Paths that are exempt from CSRF protection
 * Note: When middleware is mounted on '/api', req.path excludes the '/api' prefix
 */
const EXEMPT_PATHS = [
  '/auth/login',
  '/auth/register',
  '/v1/auth/login',
  '/v1/auth/register',
  '/csrf-token',
  '/v1/csrf-token',
  '/health',
];

/**
 * Check if a path is exempt from CSRF protection
 *
 * @param path - Request path
 * @returns true if path is exempt
 */
function isExemptPath(path: string): boolean {
  return EXEMPT_PATHS.some(exemptPath => path.startsWith(exemptPath));
}

/**
 * Extract session identifier from request
 *
 * For authenticated requests, uses user ID.
 * For unauthenticated requests, uses session ID from header or generates one.
 *
 * @param req - Express request
 * @returns Session identifier
 */
function extractSessionId(req: Request): string {
  const authReq = req as AuthRequest;

  // For authenticated requests, use user ID
  if (authReq.user?.userId) {
    return `user-${authReq.user.userId}`;
  }

  // For unauthenticated requests, try to get session ID from header
  const sessionId = req.headers['x-session-id'] as string;
  if (sessionId) {
    return `session-${sessionId}`;
  }

  // Fallback: use IP address (less secure but better than nothing)
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `anon-${ip}`;
}

/**
 * CSRF middleware
 *
 * Validates CSRF tokens for state-changing requests.
 * Generates new tokens for authenticated requests.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 * @returns void or Response (for early exit)
 *
 * @example
 * ```ts
 * import { csrfMiddleware } from './middleware/csrf';
 *
 * app.use(csrfMiddleware);
 * ```
 */
export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const csrfReq = req as CsrfRequest;

  // Prevent duplicate processing (middleware may be applied to overlapping paths)
  if (csrfReq.csrfProcessed) {
    return next();
  }

  // Mark as processed
  csrfReq.csrfProcessed = true;

  const path = req.path;
  const method = req.method;

  // Skip CSRF for safe methods
  if (SAFE_METHODS.includes(method)) {
    return next();
  }

  // Skip CSRF for exempt paths
  if (isExemptPath(path)) {
    return next();
  }

  const sessionId = extractSessionId(req);

  // For protected methods, validate token
  if (PROTECTED_METHODS.includes(method)) {
    const token = req.headers[CSRF_HEADER] as string;

    if (!token) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token is required',
        errorCode: ErrorCodeV1.FORBIDDEN,
      });
    }

    const isValid = csrfService.validateToken(sessionId, token);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired CSRF token',
        errorCode: ErrorCodeV1.FORBIDDEN,
      });
    }

    // Invalidate token after validation (one-time use)
    csrfService.invalidateToken(sessionId);

    // Generate new token for next request
    const newToken = csrfService.generateToken(sessionId);

    // Set new token in response header
    res.setHeader(CSRF_RESPONSE_HEADER, newToken);
  }

  next();
}

/**
 * CSRF token generation middleware
 *
 * Generates a new CSRF token for the current session.
 * Can be used as an endpoint or middleware.
 *
 * @param req - Express request
 * @param res - Express response
 * @returns Express response (for chaining)
 *
 * @example
 * ```ts
 * // As an endpoint
 * app.get('/api/csrf-token', csrfTokenMiddleware);
 *
 * // Or manually in a route
 * app.get('/api/csrf-token', (req, res) => {
 *   const sessionId = extractSessionId(req);
 *   const token = csrfService.generateToken(sessionId);
 *   res.json({ success: true, data: { token } });
 * });
 * ```
 */
export function csrfTokenMiddleware(
  req: Request,
  res: Response
): Response {
  const sessionId = extractSessionId(req);
  const token = csrfService.generateToken(sessionId);

  res.setHeader(CSRF_RESPONSE_HEADER, token);
  return res.json({
    success: true,
    data: {
      token,
      headerName: CSRF_HEADER,
    },
  });
}

/**
 * Get CSRF token endpoint handler
 *
 * @param req - Express request
 * @param res - Express response
 * @returns Express response (for chaining)
 *
 * @example
 * ```ts
 * app.get('/api/csrf-token', getCsrfTokenHandler);
 * ```
 */
export function getCsrfTokenHandler(
  req: Request,
  res: Response
): Response {
  return csrfTokenMiddleware(req, res);
}
