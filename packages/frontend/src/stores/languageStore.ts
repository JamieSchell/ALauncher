/**
 * Language store for i18n
 */

import { create } from 'zustand';
import { Language } from '../i18n';

interface LanguageStore {
  language: Language;
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

