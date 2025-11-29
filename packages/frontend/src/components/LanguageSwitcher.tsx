/**
 * Language Switcher Component
 */

import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '../stores/languageStore';
import { languages, Language } from '../i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  const currentLang = languages[language];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#1f1f1f] transition-colors border border-transparent hover:border-[#3d3d3d]/50"
        title={`Language: ${currentLang.name}`}
      >
        <Globe size={16} className="text-gray-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-48 bg-[#2a2a2a] border border-[#3d3d3d]/50 rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="py-1">
              {(Object.keys(languages) as Language[]).map((lang) => {
                const langInfo = languages[lang];
                const isSelected = language === lang;

                return (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[#1f1f1f] transition-colors ${
                      isSelected ? 'bg-[#1f1f1f]' : ''
                    }`}
                  >
                    <span className="text-xl">{langInfo.flag}</span>
                    <span className="flex-1 text-sm text-gray-300">{langInfo.name}</span>
                    {isSelected && (
                      <Check size={16} className="text-[#6b8e23]" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

