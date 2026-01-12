/**
 * Log Sanitization Utility
 * Защита от логирования чувствительных данных
 */

/**
 * Санитизация пользовательского объекта для логирования
 * Удаляет чувствительные поля перед логированием
 *
 * @param obj - Объект для санитизации
 * @returns Санитизированный объект
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj };

  // Список чувствительных полей которые нужно удалить
  const sensitiveFields = [
    'password',
    'oldPassword',
    'newPassword',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'sessionId',
    'privateKey',
    'hash',
  ];

  // Удаляем чувствительные поля
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  // Маскируем частично чувствительные данные
  if (sanitized.email) {
    sanitized.email = maskEmail(sanitized.email);
  }

  if (sanitized.username) {
    // Показываем только первые 2 символа
    sanitized.username = typeof sanitized.username === 'string'
      ? sanitized.username.substring(0, 2) + '***'
      : '***';
  }

  if (sanitized.login) {
    sanitized.login = typeof sanitized.login === 'string'
      ? sanitized.login.substring(0, 2) + '***'
      : '***';
  }

  return sanitized;
}

/**
 * Маскирование email адреса
 *
 * @param email - Email для маскирования
 * @returns Маскированный email
 * @example
 * maskEmail('user@example.com') // 'us***@example.com'
 */
export function maskEmail(email: string): string {
  if (typeof email !== 'string') {
    return '***@***.***';
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return '***@***.***';
  }

  const [local, domain] = parts;
  const maskedLocal = local.substring(0, 2) + '***';

  return `${maskedLocal}@${domain}`;
}

/**
 * Маскирование IP адреса (показываем только первые 2 октета)
 *
 * @param ip - IP адрес
 * @returns Маскированный IP
 * @example
 * maskIP('192.168.1.100') // '192.168.***.***'
 */
export function maskIP(ip: string): string {
  if (typeof ip !== 'string') {
    return '***.***.***.***';
  }

  const parts = ip.split('.');
  if (parts.length !== 4) {
    return '***.***.***.***';
  }

  return `${parts[0]}.${parts[1]}.***.***`;
}

/**
 * Создание безопасного объекта для логирования аутентификации
 *
 * @param data - Данные для логирования
 * @returns Безопасные данные для логирования
 */
export function createAuthLogData(data: {
  login?: string;
  email?: string;
  ipAddress?: string;
  success?: boolean;
  userId?: string;
}): any {
  return {
    login: data.login ? data.login.substring(0, 2) + '***' : undefined,
    email: data.email ? maskEmail(data.email) : undefined,
    ipAddress: data.ipAddress ? maskIP(data.ipAddress) : undefined,
    success: data.success,
    userId: data.userId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Санитизация ошибки для логирования
 *
 * @param error - Ошибка
 * @returns Санитизированная информация об ошибке
 */
export function sanitizeError(error: any): any {
  if (!error) {
    return { message: 'Unknown error' };
  }

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    // Не включаем stack trace в production
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };
}
