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
  };
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
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
    }).catch(() => next());
  } else {
    next();
  }
}
