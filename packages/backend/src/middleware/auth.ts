/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    uuid: string;
    role: 'USER' | 'ADMIN';
  };
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    if (!token) {
      console.log('[Auth] No token provided');
      throw new AppError(401, 'Authentication required');
    }

    const payload = await AuthService.validateSession(token);
    
    if (!payload) {
      throw new AppError(401, 'Invalid or expired token');
    }
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    AuthService.validateSession(token).then(payload => {
      if (payload) {
        req.user = payload;
      }
      next();
    }).catch((error) => {
      // Database errors are handled in validateSession, but catch any unexpected errors
      console.warn('[Auth] Optional auth failed:', error instanceof Error ? error.message : String(error));
      next(); // Continue without authentication
    });
  } else {
    next();
  }
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new AppError(403, 'Admin access required'));
  }

  next();
}

/**
 * Middleware to check if user has required role(s)
 *
 * @param roles - Array of allowed roles
 * @returns Middleware function
 *
 * @example
 * // Only admins can access
 * app.get('/admin', authenticateToken, requireRole(['ADMIN']), handler)
 *
 * // Both users and admins can access
 * app.get('/profile', authenticateToken, requireRole(['USER', 'ADMIN']), handler)
 */
export function requireRole(roles: Array<'USER' | 'ADMIN'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, `Insufficient permissions. Required: ${roles.join(' or ')}, Provided: ${req.user.role}`));
    }

    next();
  };
}

/**
 * Middleware to check if user is the owner of a resource or has admin role
 *
 * @param getUserIdFn - Function to extract user ID from request params/body
 * @returns Middleware function
 *
 * @example
 * // User can only edit their own profile, admins can edit any
 * app.put('/users/:id', authenticateToken, requireOwnership('id'), updateUserHandler)
 */
export function requireOwnership(getUserIdFn: (req: AuthRequest) => string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    // Admins can access any resource
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = getUserIdFn(req);
    if (req.user.userId !== resourceUserId) {
      return next(new AppError(403, 'You can only access your own resources'));
    }

    next();
  };
}

