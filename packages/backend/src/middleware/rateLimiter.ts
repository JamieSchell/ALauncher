/**
 * Rate Limiting Middleware
 * Защита от brute force и DoS атак
 */

import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { config } from '../config';

/**
 * Генерирует безопасный ключ для rate limiter
 * Хеширует входные данные чтобы избежать проблем с символами (включая IPv6)
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
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const login = (req.body as any)?.login || (req.body as any)?.username || '';
    return generateSafeKey('auth', ip, login);
  },
  // Логируем превышение лимита
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const login = (req.body as any)?.login || (req.body as any)?.username || '';
    console.warn(`[RateLimit] Auth limit exceeded for ${login ? `login: ${login}` : `IP: ${ip}`}`);
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
 * 3 попытки за час на IP
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
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return generateSafeKey('register', ip);
  },
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    console.warn(`[RateLimit] Registration limit exceeded for IP: ${ip}`);
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
 * 3 попытки за час на IP
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
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return generateSafeKey('password-reset', ip);
  },
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    console.warn(`[RateLimit] Password reset limit exceeded for IP: ${ip}`);
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
 * 100 запросов за 15 минут на IP
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
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return generateSafeKey('api', ip);
  },
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    console.warn(`[RateLimit] API limit exceeded for IP: ${ip}`);
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
 * 20 запросов за минуту на IP
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
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return generateSafeKey('write', ip);
  },
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    console.warn(`[RateLimit] Write limit exceeded for IP: ${ip}`);
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
 * 10 файлов за 5 минут на IP
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
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return generateSafeKey('upload', ip);
  },
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    console.warn(`[RateLimit] Upload limit exceeded for IP: ${ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many file uploads. Please wait before uploading more.',
      retryAfter: 300,
    });
  },
  skip: () => !config.rateLimit.enabled,
});
