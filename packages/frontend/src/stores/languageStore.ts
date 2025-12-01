/**
 * Language Store
 *
 * Управляет языком интерфейса (i18n):
 * - Текущий выбранный язык
 * - Сохранение выбора в localStorage
 *
 * Использует Zustand для управления состоянием.
 * Бизнес-логика локализации находится в i18n модуле.
 *
 * @module stores/languageStore
 */

import { create } from 'zustand';
import { Language } from '../i18n';

/**
 * Состояние языка интерфейса
 */
interface LanguageStore {
  /** Текущий выбранный язык */
  language: Language;
  /**
   * Установить язык интерфейса
   * @param lang - Код языка ('ru' | 'en')
   */
  setLanguage: (lang: Language) => void;
}

// Helper to get initial language from localStorage
const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved === 'ru' || saved === 'en') {
      return saved;
    }
  }
  return 'ru';
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (lang: Language) => {
    set({ language: lang });
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  },
}));

