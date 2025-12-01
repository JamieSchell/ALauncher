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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-all duration-200 border border-transparent hover:border-white/15 group"
        title={`Language: ${currentLang.name}`}
      >
        <Globe size={16} className="text-white/80 group-hover:text-white transition-colors" aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-48 bg-surface-base/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-1.5">
              {(Object.keys(languages) as Language[]).map((lang) => {
                const langInfo = languages[lang];
                const isSelected = language === lang;

                return (
                  <motion.button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative w-full h-11 px-4 flex items-center gap-3 transition-all duration-200 group ${
                      isSelected 
                        ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 text-heading border-l-2 border-primary-500' 
                        : 'text-body-muted hover:bg-interactive-hover-secondary hover:text-heading'
                    }`}
                    style={{ alignItems: 'center' }}
                  >
                    {/* Selected indicator background */}
                    {isSelected && (
                      <motion.div
                        layoutId="selectedLanguage"
                        className="absolute inset-0 bg-gradient-to-r from-primary-500/15 to-primary-600/8 rounded-r-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    <div className="relative z-10 flex items-center justify-center shrink-0" style={{ width: '28px', height: '28px' }}>
                      <span className="text-xl" style={{ lineHeight: '1', display: 'block' }}>{langInfo.flag}</span>
                    </div>
                    <span className={`flex-1 text-sm font-medium relative z-10 ${
                      isSelected ? 'text-heading' : 'text-body-muted group-hover:text-heading'
                    }`} style={{ lineHeight: '1.5', display: 'flex', alignItems: 'center' }}>
                      {langInfo.name}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="relative z-10 flex items-center justify-center w-5 h-5"
                      >
                        <Check size={18} className="text-emerald-400" strokeWidth={3} />
                      </motion.div>
                    )}
                    {!isSelected && (
                      <div className="w-5 h-5 relative z-10 flex items-center justify-center" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

