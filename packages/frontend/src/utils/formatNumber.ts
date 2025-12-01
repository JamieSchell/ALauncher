/**
 * Number Formatting Utilities
 *
 * Утилиты для локализованного форматирования чисел.
 * Используют текущий язык интерфейса для корректного отображения.
 *
 * @module utils/formatNumber
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
 * Форматировать число в зависимости от языка
 *
 * @param value - Число для форматирования
 * @param language - Язык интерфейса
 * @param options - Опции форматирования
 * @returns Отформатированная строка числа
 *
 * @example
 * ```ts
 * formatNumber(1234.56, 'ru'); // '1 234,56'
 * formatNumber(1234.56, 'en'); // '1,234.56'
 * ```
 */
export function formatNumber(
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions
): string {
  const locale = locales[language];
  const formatter = new Intl.NumberFormat(locale, options);
  return formatter.format(value);
}

/**
 * Форматировать число с валютой
 *
 * @param value - Число для форматирования
 * @param language - Язык интерфейса
 * @param currency - Код валюты (например, 'USD', 'EUR', 'RUB')
 * @param options - Дополнительные опции форматирования
 * @returns Отформатированная строка числа с валютой
 *
 * @example
 * ```ts
 * formatCurrency(1234.56, 'ru', 'RUB'); // '1 234,56 ₽'
 * formatCurrency(1234.56, 'en', 'USD'); // '$1,234.56'
 * ```
 */
export function formatCurrency(
  value: number,
  language: Language,
  currency: string,
  options?: Intl.NumberFormatOptions
): string {
  const locale = locales[language];
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options,
  });
  return formatter.format(value);
}

/**
 * Форматировать число с заданной точностью
 *
 * @param value - Число для форматирования
 * @param language - Язык интерфейса
 * @param precision - Количество знаков после запятой
 * @returns Отформатированная строка числа
 *
 * @example
 * ```ts
 * formatNumberWithPrecision(1234.567, 'ru', 2); // '1 234,57'
 * formatNumberWithPrecision(1234.567, 'en', 2); // '1,234.57'
 * ```
 */
export function formatNumberWithPrecision(
  value: number,
  language: Language,
  precision: number
): string {
  return formatNumber(value, language, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

