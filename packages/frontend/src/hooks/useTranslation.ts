/**
 * Hook for translations
 *
 * Предоставляет типизированную функцию перевода `t` и текущий язык.
 * Все ключи переводов типобезопасны благодаря TypeScript.
 *
 * @module hooks/useTranslation
 */

import { useLanguageStore } from '../stores/languageStore';
import { getTranslation, Language, TranslationKey } from '../i18n';

export interface UseTranslationReturn {
  /**
   * Функция перевода с типизированными ключами
   * @param key - Типизированный ключ перевода (например, 'common.loading', 'auth.login')
   * @returns Переведенная строка
   */
  t: (key: TranslationKey | string) => string;
  /** Текущий язык интерфейса */
  language: Language;
}

/**
 * Hook для использования переводов в компонентах
 *
 * @example
 * ```tsx
 * const { t, language } = useTranslation();
 *
 * return (
 *   <div>
 *     <h1>{t('common.loading')}</h1>
 *     <p>{t('auth.welcomeBack')}</p>
 *   </div>
 * );
 * ```
 */
export function useTranslation(): UseTranslationReturn {
  const language = useLanguageStore((state) => state.language);

  const t = (key: TranslationKey | string): string => {
    return getTranslation(language, key);
  };

  return { t, language };
}

