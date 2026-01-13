/**
 * Zod Validation Schemas
 * Centralized input validation for the application
 */

import { z } from 'zod';

/**
 * Common validation constants
 */
export const VALIDATION = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  EMAIL_MAX: 255,
  PROFILE_TITLE_MIN: 3,
  PROFILE_TITLE_MAX: 50,
  SERVER_VERSION_MAX: 20,
  URL_MAX: 2048,
} as const;

/**
 * Username validation schema
 * - Alphanumeric characters only
 * - No spaces or special characters
 * - Case insensitive (stored as lowercase)
 */
export const usernameSchema = z
  .string({
    required_error: 'Username is required',
    invalid_type_error: 'Username must be a string',
  })
  .min(VALIDATION.USERNAME_MIN, `Username must be at least ${VALIDATION.USERNAME_MIN} characters`)
  .max(VALIDATION.USERNAME_MAX, `Username must not exceed ${VALIDATION.USERNAME_MAX} characters`)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .trim();

/**
 * Password validation schema
 * - At least 8 characters
 * - At least one letter (a-z, A-Z)
 * - At least one number (0-9)
 * - Special characters allowed but not required
 * - Spaces trimmed
 */
export const passwordSchema = z
  .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  })
  .min(VALIDATION.PASSWORD_MIN, `Password must be at least ${VALIDATION.PASSWORD_MIN} characters`)
  .max(VALIDATION.PASSWORD_MAX, `Password must not exceed ${VALIDATION.PASSWORD_MAX} characters`)
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .trim();

/**
 * Email validation schema
 * - Standard email format
 * - Case insensitive (stored as lowercase)
 */
export const emailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  })
  .max(VALIDATION.EMAIL_MAX, `Email must not exceed ${VALIDATION.EMAIL_MAX} characters`)
  .email('Invalid email format')
  .toLowerCase()
  .trim();

/**
 * Authentication login schema
 */
export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Registration schema
 */
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Profile creation/update schema
 */
export const profileSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.PROFILE_TITLE_MIN, `Profile title must be at least ${VALIDATION.PROFILE_TITLE_MIN} characters`)
    .max(VALIDATION.PROFILE_TITLE_MAX, `Profile title must not exceed ${VALIDATION.PROFILE_TITLE_MAX} characters`)
    .trim(),
  version: z
    .string()
    .max(VALIDATION.SERVER_VERSION_MAX, 'Version string too long')
    .optional(),
  serverAddress: z.string().url('Invalid server address').optional().or(z.literal('')),
  serverPort: z
    .number()
    .int('Port must be an integer')
    .min(1, 'Port must be at least 1')
    .max(65535, 'Port must not exceed 65535')
    .optional(),
  javaPath: z.string().optional(),
  jvmArgs: z.string().optional(),
  minRam: z
    .number()
    .int('Min RAM must be an integer')
    .min(512, 'Min RAM must be at least 512 MB')
    .max(32768, 'Min RAM must not exceed 32768 MB (32 GB)')
    .optional(),
  maxRam: z
    .number()
    .int('Max RAM must be an integer')
    .min(512, 'Max RAM must be at least 512 MB')
    .max(32768, 'Max RAM must not exceed 32768 MB (32 GB)')
    .optional(),
}).refine((data) => {
  // Ensure maxRam >= minRam if both are provided
  if (data.minRam && data.maxRam && data.maxRam < data.minRam) {
    return false;
  }
  return true;
}, {
  message: 'Max RAM must be greater than or equal to Min RAM',
  path: ['maxRam'],
});

export type ProfileInput = z.infer<typeof profileSchema>;

/**
 * Client profile schema for backend API
 */
export const clientProfileSchema = z.object({
  title: z.string().min(1).max(100),
  version: z.string().max(50),
  serverAddress: z.string().url().optional(),
  serverPort: z.number().int().min(1).max(65535).optional(),
  javaArgs: z.string().optional(),
  minRam: z.number().int().min(512).max(32768).optional(),
  maxRam: z.number().int().min(512).max(32768).optional(),
});

export type ClientProfileInput = z.infer<typeof clientProfileSchema>;

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .max(VALIDATION.URL_MAX, `URL must not exceed ${VALIDATION.URL_MAX} characters`)
  .url('Invalid URL format')
  .refine((url) => {
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    return !dangerousProtocols.some((protocol) => url.toLowerCase().startsWith(protocol));
  }, { message: 'URL protocol not allowed' })
  .refine((url) => {
    // Ensure http or https
    return url.startsWith('http://') || url.startsWith('https://');
  }, { message: 'URL must use HTTP or HTTPS protocol' });

export type UrlInput = z.infer<typeof urlSchema>;

/**
 * Notification schema
 */
export const notificationSchema = z.object({
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
});

export type NotificationInput = z.infer<typeof notificationSchema>;

/**
 * User update schema (for admin)
 */
export const userUpdateSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isBanned: z.boolean().optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/**
 * Statistics query schema
 */
export const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
});

export type StatsQueryInput = z.infer<typeof statsQuerySchema>;

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Search filter schema
 */
export const searchFilterSchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(['active', 'banned', 'all']).optional(),
  role: z.enum(['USER', 'ADMIN', 'all']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type SearchFilterInput = z.infer<typeof searchFilterSchema>;

/**
 * Helper function to validate and return formatted errors
 */
export const validateInput = <T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};

    // Проверяем, что error.errors существует и является массивом
    if (result.error && 'errors' in result.error && Array.isArray(result.error.errors)) {
      for (const error of result.error.errors) {
        const key = error.path?.join('.') || '';
        errors[key] = error.message;
      }
    } else if (result.error && 'issues' in result.error && Array.isArray(result.error.issues)) {
      // Zod может использовать 'issues' вместо 'errors' в некоторых версиях
      for (const issue of result.error.issues) {
        const key = issue.path?.join('.') || '';
        errors[key] = issue.message;
      }
    } else {
      // Fallback для неизвестного формата ошибки
      errors['_'] = 'Validation failed';
    }

    return { success: false, errors };
  }

  return { success: true, data: result.data };
};

/**
 * Helper function to get the first error message
 */
export const getFirstError = (errors: Record<string, string>): string | null => {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : null;
};

export default {
  usernameSchema,
  passwordSchema,
  emailSchema,
  loginSchema,
  registerSchema,
  profileSchema,
  urlSchema,
  notificationSchema,
  validateInput,
  getFirstError,
};
