/**
 * Rate Limiting Middleware
 * Защита от brute force и DoS атак
 */

import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { config } from '../config';

/**
 * Генерирует безопасный ключ для rate limiter
 * Хеширует входные данные чтобы избежать проблем с символами
 */
function generateSafeKey(prefix: string, ...parts: string[]): string {
  const data = parts.filter(Boolean).join(':');
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `${prefix}:${hash}`;
}

/**
 * Строгий rate limiter для auth endpoints
 * 5 попыток за 15 минут на IP + login комбинацию
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: 900, // 15 минут в секундах
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Используем комбинацию IP и (если есть) login для более точной защиты
  keyGenerator: (req) => {
    const login = (req.body as any)?.login || (req.body as any)?.username || '';
    if (login) {
      return generateSafeKey('auth', login);
    }
    return generateSafeKey('auth', Date.now().toString()); // Fallback to time-based (not ideal but works)
  },
  // Логируем превышение лимита
  handler: (req, res) => {
    const login = (req.body as any)?.login || (req.body as any)?.username || '';
    console.warn(`[RateLimit] Auth limit exceeded for ${login || 'unknown user'}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: 900,
    });
  },
  // Пропускаем запросы если rate limiting отключён в конфиге
  skip: () => !config.rateLimit.enabled,
});

/**
 * Rate limiter для регистрации
 * 3 попытки за час
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // 3 попытки регистрации
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] Registration limit exceeded`);
    res.status(429).json({
      success: false,
      error: 'Too many registration attempts. Please try again later.',
      retryAfter: 3600,
    });
  },
  skip: () => !config.rateLimit.enabled,
});

/**
 * Rate limiter для password reset
 * 3 попытки за час
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // 3 попытки
  message: {
    success: false,
    error: 'Too many password reset attempts. Please try again later.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] Password reset limit exceeded`);
    res.status(429).json({
      success: false,
      error: 'Too many password reset attempts. Please try again later.',
      retryAfter: 3600,
    });
  },
  skip: () => !config.rateLimit.enabled,
});

/**
 * Общий rate limiter для API endpoints
 * 100 запросов за 15 минут
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] API limit exceeded`);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.',
      retryAfter: 900,
    });
  },
  skip: () => !config.rateLimit.enabled,
});

/**
 * Rate limiter для создания/обновления ресурсов (profiles, users, etc.)
 * 20 запросов за минуту
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 20, // 20 запросов
  message: {
    success: false,
    error: 'Too many write operations. Please slow down.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] Write limit exceeded`);
    res.status(429).json({
      success: false,
      error: 'Too many write operations. Please slow down.',
      retryAfter: 60,
    });
  },
  skip: () => !config.rateLimit.enabled,
});

/**
 * Rate limiter для загрузки файлов
 * 10 файлов за 5 минут
 */
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 10, // 10 файлов
  message: {
    success: false,
    error: 'Too many file uploads. Please wait before uploading more.',
    retryAfter: 300,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RateLimit] Upload limit exceeded`);
    res.status(429).json({
      success: false,
      error: 'Too many file uploads. Please wait before uploading more.',
      retryAfter: 300,
    });
  },
  skip: () => !config.rateLimit.enabled,
});
