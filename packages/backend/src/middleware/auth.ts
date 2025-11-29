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
