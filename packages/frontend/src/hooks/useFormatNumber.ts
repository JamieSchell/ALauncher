/**
 * Hook for localized number formatting
 *
 * Предоставляет функции для форматирования чисел с учетом текущего языка интерфейса.
 *
 * @module hooks/useFormatNumber
 */

import { useLanguageStore } from '../stores/languageStore';
import { formatNumber, formatCurrency, formatNumberWithPrecision } from '../utils/formatNumber';

/**
 * Hook для форматирования чисел
 *
 * @example
 * ```tsx
 * const { formatNumber, formatCurrency } = useFormatNumber();
 *
 * return (
 *   <div>
 *     <p>Number: {formatNumber(1234.56)}</p>
 *     <p>Currency: {formatCurrency(1234.56, 'USD')}</p>
 *   </div>
 * );
 * ```
 */
export function useFormatNumber() {
  const language = useLanguageStore((state) => state.language);

  return {
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, language, options),
    formatCurrency: (value: number, currency: string, options?: Intl.NumberFormatOptions) =>
      formatCurrency(value, language, currency, options),
    formatNumberWithPrecision: (value: number, precision: number) =>
      formatNumberWithPrecision(value, language, precision),
  };
}

