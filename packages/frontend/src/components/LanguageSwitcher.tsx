/**
 * Language Switcher Component
 */

import { useState, useRef, useEffect } from 'react';
import { useLanguageStore } from '../stores/languageStore';
import { languages, Language } from '../i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!isOpen || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== ' ')) {
      return;
    }

    const languagesList = Object.keys(languages) as Language[];
    const currentIndex = languagesList.indexOf(language);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % languagesList.length;
      setLanguage(languagesList[nextIndex]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + languagesList.length) % languagesList.length;
      setLanguage(languagesList[prevIndex]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

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
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="language-dropdown"
        aria-label={`Language: ${currentLang.name}`}
        style={{
          position: 'relative',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid transparent',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        title={`Language: ${currentLang.name}`}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="2" style={{ display: 'block' }} aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </button>

      {isOpen && (
        <div
          id="language-dropdown"
          ref={listboxRef}
          role="listbox"
          aria-label="Select language"
          aria-activedescendant={`lang-option-${language}`}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '192px',
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            zIndex: 50,
            overflow: 'hidden'
          }}
        >
          <div role="presentation" style={{ padding: '6px' }}>
            {(Object.keys(languages) as Language[]).map((lang) => {
              const langInfo = languages[lang];
              const isSelected = language === lang;

              return (
                <button
                  key={lang}
                  id={`lang-option-${lang}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleLanguageChange(lang)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: isSelected ? 'white' : '#9ca3af',
                    border: isSelected ? '1px solid rgb(99, 102, 241)' : '1px solid transparent',
                    borderLeft: isSelected ? '2px solid rgb(99, 102, 241)' : '2px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  type="button"
                >
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '20px', lineHeight: '1', display: 'block' }}>{langInfo.flag}</span>
                  </div>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, lineHeight: '1.5' }}>
                    {langInfo.name}
                  </span>
                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(52, 211, 153)" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
