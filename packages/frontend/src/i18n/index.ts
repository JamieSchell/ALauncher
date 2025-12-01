/**
 * Internationalization (i18n) setup
 *
 * Централизованная система интернационализации с типизированными ключами.
 * Обеспечивает типобезопасность и проверку структуры переводов.
 *
 * @module i18n
 */

import { ru } from './locales/ru';
import { en } from './locales/en';
import { TranslationKey } from './types';

export type Language = 'ru' | 'en';

export const languages: Record<Language, { name: string; flag: string }> = {
  ru: { name: 'Русский', flag: '🇷🇺' },
  en: { name: 'English', flag: '🇺🇸' },
};

export const translations = {
  ru,
  en,
};

/**
 * Получить перевод по ключу
 *
 * @param lang - Язык перевода
 * @param key - Типизированный ключ перевода (например, 'common.loading', 'auth.login')
 * @returns Переведенная строка или ключ, если перевод не найден
 *
 * @example
 * ```ts
 * getTranslation('en', 'common.loading'); // 'Loading...'
 * getTranslation('ru', 'auth.login'); // 'Войти'
 * ```
 */
export function getTranslation(
  lang: Language,
  key: TranslationKey | string
): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value];
    } else {
      console.warn(`Translation key not found: ${key} for language: ${lang}`);
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Проверка, что структуры переводов совпадают между локалями
 * Выводит предупреждения в консоль при несоответствиях
 */
export function validateTranslationStructures(): void {
  const ruKeys = getAllKeys(ru);
  const enKeys = getAllKeys(en);

  const missingInEn = ruKeys.filter(key => !enKeys.includes(key));
  const missingInRu = enKeys.filter(key => !ruKeys.includes(key));

  if (missingInEn.length > 0) {
    console.warn('[i18n] Keys in ru.ts missing in en.ts:', missingInEn);
  }

  if (missingInRu.length > 0) {
    console.warn('[i18n] Keys in en.ts missing in ru.ts:', missingInRu);
  }

  if (missingInEn.length === 0 && missingInRu.length === 0) {
    console.log('[i18n] ✓ Translation structures match');
  }
}

/**
 * Рекурсивно получает все ключи из объекта переводов
 */
function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Валидация при загрузке модуля (только в development)
if (process.env.NODE_ENV === 'development') {
  validateTranslationStructures();
}

