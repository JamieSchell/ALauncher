/**
 * Date and Time Formatting Utilities
 *
 * Утилиты для локализованного форматирования дат и времени.
 * Используют текущий язык интерфейса для корректного отображения.
 *
 * @module utils/formatDate
 */

import { Language } from '../i18n';

/**
 * Локаль для каждого языка
 */
const locales: Record<Language, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

/**
 * Форматировать дату в зависимости от языка
 *
 * @param date - Дата для форматирования (строка или Date объект)
 * @param language - Язык интерфейса
 * @param options - Опции форматирования (по умолчанию: день, месяц, год)
 * @returns Отформатированная строка даты
 *
 * @example
 * ```ts
 * formatDate('2024-01-15', 'ru'); // '15.01.2024'
 * formatDate('2024-01-15', 'en'); // '1/15/2024'
 * ```
 */
export function formatDate(
  date: string | Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = locales[language];

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  };

  return dateObj.toLocaleDateString(locale, defaultOptions);
}

/**
 * Форматировать дату и время в зависимости от языка
 *
 * @param date - Дата для форматирования (строка или Date объект)
 * @param language - Язык интерфейса
 * @param options - Опции форматирования
 * @returns Отформатированная строка даты и времени
 *
 * @example
 * ```ts
 * formatDateTime('2024-01-15T10:30:00', 'ru'); // '15.01.2024, 10:30:00'
 * formatDateTime('2024-01-15T10:30:00', 'en'); // '1/15/2024, 10:30:00 AM'
 * ```
 */
export function formatDateTime(
  date: string | Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = locales[language];

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return dateObj.toLocaleString(locale, defaultOptions);
}

/**
 * Форматировать время в зависимости от языка
 *
 * @param date - Дата для форматирования (строка или Date объект)
 * @param language - Язык интерфейса
 * @param options - Опции форматирования
 * @returns Отформатированная строка времени
 *
 * @example
 * ```ts
 * formatTime('2024-01-15T10:30:00', 'ru'); // '10:30:00'
 * formatTime('2024-01-15T10:30:00', 'en'); // '10:30:00 AM'
 * ```
 */
export function formatTime(
  date: string | Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = locales[language];

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return dateObj.toLocaleTimeString(locale, defaultOptions);
}

/**
 * Форматировать относительное время (например, "2 часа назад")
 *
 * @param date - Дата для форматирования (строка или Date объект)
 * @param language - Язык интерфейса
 * @returns Отформатированная строка относительного времени
 *
 * @example
 * ```ts
 * formatRelativeTime('2024-01-15T10:00:00', 'ru'); // '2 часа назад'
 * formatRelativeTime('2024-01-15T10:00:00', 'en'); // '2 hours ago'
 * ```
 */
export function formatRelativeTime(
  date: string | Date,
  language: Language
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return language === 'ru' ? 'Только что' : 'Just now';
  }
  if (diffMins < 60) {
    return language === 'ru' ? `${diffMins} мин назад` : `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return language === 'ru' ? `${diffHours} ч назад` : `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return language === 'ru' ? `${diffDays} дн назад` : `${diffDays}d ago`;
  }
  return formatDate(dateObj, language);
}

