/**
 * Hook for translations
 */

import { useLanguageStore } from '../stores/languageStore';
import { getTranslation, Language } from '../i18n';

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return { t, language };
}

