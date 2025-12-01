/**
 * Custom Window Title Bar Component
 * 
 * Кастомная панель заголовка окна для Electron приложения.
 * Включает:
 * - Кнопки управления окном (минимизация, максимизация, закрытие)
 * - Версию лаунчера
 * - Центр уведомлений
 * - Переключатель языка
 * 
 * @component
 * @example
 * ```tsx
 * import { TitleBar } from '@/components/layout';
 * 
 * function App() {
 *   return (
 *     <>
 *       <TitleBar />
 *       <div>Rest of app content</div>
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X, ChevronDown, Gamepad2 } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';
import LanguageSwitcher from '../LanguageSwitcher';

/**
 * Custom Window Title Bar Component
 * 
 * @returns Title bar with window controls, notifications, and language switcher
 */
export default function TitleBar() {
  const [launcherVersion, setLauncherVersion] = useState<string | null>(null);

  // Get launcher version
  useEffect(() => {
    const getVersion = async () => {
      if (window.electronAPI) {
        try {
          const version = await window.electronAPI.getAppVersion();
          setLauncherVersion(version);
        } catch (error) {
          console.error('Failed to get launcher version:', error);
        }
      }
    };
    
    getVersion();
    
    const interval = setInterval(() => {
      getVersion();
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMinimizeToTray = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeToTray();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <header 
      className="flex items-center justify-between h-12 bg-surface-base/80 backdrop-blur-xl window-drag px-6 border-b border-white/10 relative z-[100]"
      role="banner"
      aria-label="Application title bar"
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-8 h-8 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-lg flex items-center justify-center border border-primary-500/30 shadow-lg shadow-primary-500/20"
          aria-hidden="true"
        >
          <Gamepad2 size={18} className="text-white" strokeWidth={2.5} />
        </motion.div>
        <span className="text-sm font-bold text-white tracking-tight">Modern Launcher</span>
        {launcherVersion && (
          <span className="text-xs text-white/60 font-medium px-2 py-1 bg-white/5 rounded-md border border-white/10" aria-label={`Version ${launcherVersion}`}>
            v{launcherVersion}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 window-no-drag" role="toolbar" aria-label="Window controls">
        <NotificationCenter />
        <LanguageSwitcher />
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMinimize}
          onKeyDown={(e) => handleKeyDown(e, handleMinimize)}
          className="p-2 hover:bg-white/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base"
          aria-label="Minimize window"
          type="button"
        >
          <Minus size={16} className="text-white/70" aria-hidden="true" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMinimizeToTray}
          onKeyDown={(e) => handleKeyDown(e, handleMinimizeToTray)}
          className="p-2 hover:bg-white/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base"
          aria-label="Minimize to system tray"
          type="button"
        >
          <ChevronDown size={16} className="text-white/70" aria-hidden="true" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMaximize}
          onKeyDown={(e) => handleKeyDown(e, handleMaximize)}
          className="p-2 hover:bg-white/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base"
          aria-label="Maximize window"
          type="button"
        >
          <Square size={14} className="text-white/70" aria-hidden="true" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          onKeyDown={(e) => handleKeyDown(e, handleClose)}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-surface-base"
          aria-label="Close window"
          type="button"
        >
          <X size={16} className="text-white/70" aria-hidden="true" />
        </motion.button>
      </div>
    </header>
  );
}
