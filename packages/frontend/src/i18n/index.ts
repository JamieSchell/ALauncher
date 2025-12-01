/**
 * Internationalization (i18n) setup
 */

import { ru } from './locales/ru';
import { en } from './locales/en';

export type Language = 'ru' | 'en';

export const languages: Record<Language, { name: string; flag: string }> = {
  ru: { name: 'Русский', flag: '🇷🇺' },
  en: { name: 'English', flag: '🇺🇸' },
};

export const translations = {
  ru,
  en,
};

export type TranslationKey = keyof typeof ru;

// Helper function to get nested translation
export function getTranslation(
  lang: Language,
  key: string
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

