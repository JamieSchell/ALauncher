/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../services/database';
import { LauncherErrorType } from '@prisma/client';
import { ErrorCodeV1 } from '@modern-launcher/shared';
import { metricsService } from '../services/metrics';
import os from 'os';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    /**
     * Optional machine-readable error code; если не указан,
     * будет выведен из statusCode в errorHandler.
     */
    public code?: ErrorCodeV1,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Map HTTP status codes to generic error codes (v1).
 */
function mapStatusToErrorCode(statusCode: number): ErrorCodeV1 {
  if (statusCode >= 500) {
    return ErrorCodeV1.INTERNAL_ERROR;
  }

  switch (statusCode) {
    case 400:
      return ErrorCodeV1.VALIDATION_FAILED;
    case 401:
      return ErrorCodeV1.AUTH_REQUIRED;
    case 403:
      return ErrorCodeV1.FORBIDDEN;
    case 404:
      return ErrorCodeV1.NOT_FOUND;
    case 429:
      return ErrorCodeV1.RATE_LIMITED;
    default:
      return ErrorCodeV1.UNKNOWN;
  }
}

/**
 * Determine error type from error and request
 */
function determineErrorType(err: Error | AppError, req: Request): LauncherErrorType {
  const message = err.message.toLowerCase();
  const stack = err.stack?.toLowerCase() || '';
  
  // Database connection errors
  if (message.includes('can\'t reach database') || 
      message.includes('database server') || 
      message.includes('connection refused') ||
      message.includes('econnrefused') ||
      message.includes('prisma') && (message.includes('connection') || message.includes('timeout'))) {
    return 'NETWORK_ERROR'; // Database connection is a network issue
  }
  
  // Optional files (like .blockmap) - don't log as errors
  if (message.includes('blockmap') && message.includes('optional')) {
    return 'UNKNOWN_ERROR'; // Don't log optional file errors
  }
  
  if (message.includes('authentication') || message.includes('auth') || message.includes('token')) {
    return 'AUTHENTICATION_ERROR';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }
  if (message.includes('file') || message.includes('download') || message.includes('fs')) {
    return 'FILE_DOWNLOAD_ERROR';
  }
  if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
    return 'NETWORK_ERROR';
  }
  if (message.includes('filesystem') || message.includes('permission denied') || message.includes('eacces') || message.includes('enoent')) {
    return 'FILE_SYSTEM_ERROR';
  }
  
  // Check if it's an API error
  if (req.path.startsWith('/api/')) {
    return 'API_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
}

/**
 * Log error to database automatically
 */
async function logErrorToDatabase(
  err: Error | AppError,
  req: Request,
  statusCode: number
): Promise<void> {
  try {
    // Skip logging for optional .blockmap files (they're not errors)
    const errorMessage = err.message || String(err);
    const requestUrl = req.originalUrl || req.url || '';
    
    // Check both error message and request URL for .blockmap files
    if ((errorMessage.includes('blockmap') || requestUrl.includes('.blockmap')) && 
        (errorMessage.includes('optional') || errorMessage.includes('not found') || statusCode === 404)) {
      return; // Don't log optional file errors
    }
    
    const errorType = determineErrorType(err, req);
    const stackTrace = err.stack || null;
    
    // Extract user info from request (if authenticated)
    const userId = (req as any).user?.userId || null;
    const username = (req as any).user?.username || null;
    
    // Get launcher version from headers
    const launcherVersion = req.headers['x-launcher-version'] as string || null;
    
    await prisma.launcherError.create({
      data: {
        userId,
        username,
        errorType,
        errorMessage: errorMessage.substring(0, 10000), // Limit length
        stackTrace: stackTrace ? stackTrace.substring(0, 50000) : null, // Limit length
        component: req.path,
        action: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        userAgent: req.headers['user-agent'] || null,
        os: process.platform,
        osVersion: os.release() || null,
        launcherVersion,
      },
    });
    
    // Error logged to database (silent)
  } catch (dbError) {
    // Don't log database errors to prevent infinite loops
    logger.error('[ErrorHandler] Failed to log error to database:', dbError);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorMessage = err.message || String(err);
  const errorCode =
    err instanceof AppError && err.code ? err.code : mapStatusToErrorCode(statusCode);

  // Determine error type for metrics
  const errorType = determineErrorType(err, req);

  // Record error in metrics
  metricsService.recordError(errorType);

  // Skip logging for optional .blockmap files (they're not errors)
  const isBlockmapError = errorMessage.includes('blockmap') &&
                          (errorMessage.includes('not found') || statusCode === 404);

  // Log to console (only for non-4xx errors and not for optional .blockmap files)
  if (!isBlockmapError && statusCode >= 500) {
    if (err instanceof AppError) {
      logger.error(`${statusCode} - ${err.message}`, {
        path: req.path,
        method: req.method,
      });
    } else {
      logger.error('Unexpected error:', err);
    }
  }

  // Automatically log to database (async, don't wait) - but skip for .blockmap files
  if (!isBlockmapError) {
    logErrorToDatabase(err, req, statusCode).catch(() => {
      // Silently fail to prevent infinite loops
    });
  }

  // Send response
  if (err instanceof AppError) {
    return res.status(statusCode).json({
      success: false,
      error: err.message,
      errorCode,
    });
  }

  // Unexpected errors
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    errorCode: ErrorCodeV1.INTERNAL_ERROR,
  });
}
