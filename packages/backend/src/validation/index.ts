/**
 * Centralized request validation using Zod
 */

import { type RequestHandler } from 'express';
import type { ZodTypeAny, ZodError } from 'zod';
import { AppError } from '../middleware/errorHandler';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Create Express middleware that validates a part of the request
 * against a Zod schema and replaces it with the parsed (typed) data.
 */
export const validate =
  <T extends ZodTypeAny>(schema: T, part: RequestPart = 'body'): RequestHandler =>
  (req, _res, next) => {
    const value = (req as any)[part];
    const result = schema.safeParse(value);

    if (!result.success) {
      const error = result.error as ZodError;
      const message = error.issues.map((e) => e.message).join(', ');
      return next(new AppError(400, `Validation failed: ${message}`));
    }

    // Overwrite with parsed value to guarantee type safety downstream
    (req as any)[part] = result.data;
    next();
  };


