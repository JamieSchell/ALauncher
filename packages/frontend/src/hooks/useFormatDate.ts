/**
 * Hook for localized date formatting
 *
 * Предоставляет функции для форматирования дат с учетом текущего языка интерфейса.
 *
 * @module hooks/useFormatDate
 */

import { useLanguageStore } from '../stores/languageStore';
import { formatDate, formatDateTime, formatTime, formatRelativeTime } from '../utils/formatDate';

/**
 * Hook для форматирования дат
 *
 * @example
 * ```tsx
 * const { formatDate, formatDateTime, formatRelativeTime } = useFormatDate();
 *
 * return (
 *   <div>
 *     <p>Date: {formatDate('2024-01-15')}</p>
 *     <p>Relative: {formatRelativeTime('2024-01-15T10:00:00')}</p>
 *   </div>
 * );
 * ```
 */
export function useFormatDate() {
  const language = useLanguageStore((state) => state.language);

  return {
    formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, language, options),
    formatDateTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
      formatDateTime(date, language, options),
    formatTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
      formatTime(date, language, options),
    formatRelativeTime: (date: string | Date) => formatRelativeTime(date, language),
  };
}

