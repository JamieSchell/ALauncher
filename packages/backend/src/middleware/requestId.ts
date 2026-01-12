/**
 * Request ID middleware
 * Generates unique identifiers for each request for better tracing and debugging
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Adds a unique ID to each request for tracing
 * Sets X-Request-ID header on response
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  req.id = uuidv4();

  // Set response header for client-side tracing
  res.setHeader('X-Request-ID', req.id);

  next();
}
