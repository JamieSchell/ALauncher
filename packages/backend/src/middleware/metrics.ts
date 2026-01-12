/**
 * Metrics Middleware
 * Tracks HTTP requests and response times
 */

import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics';

declare global {
  namespace Express {
    interface Request {
      _startTime?: number;
    }
  }
}

/**
 * Middleware to track HTTP metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Record request start time
  req._startTime = Date.now();

  // Record incoming request
  metricsService.recordRequest(req.method, req.path);
  metricsService.incrementConnections();

  // Track response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = req._startTime ? Date.now() - req._startTime : 0;
    metricsService.recordResponse(res.statusCode, duration);
    metricsService.decrementConnections();
    return originalJson.call(this, data);
  };

  // Also track on finish (for non-JSON responses)
  res.on('finish', () => {
    const duration = req._startTime ? Date.now() - req._startTime : 0;
    metricsService.recordResponse(res.statusCode, duration);
    metricsService.decrementConnections();
  });

  next();
}
