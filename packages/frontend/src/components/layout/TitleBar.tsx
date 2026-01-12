/**
 * Cyberpunk Title Bar
 * Techno-Magic Design System
 */

import { useState, useEffect } from 'react';
import { Minus, Square, X, ChevronDown, Bell } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';
import LanguageSwitcher from '../LanguageSwitcher';
import { tauriApi, isTauri } from '../../api/tauri';

export default function TitleBar() {
  const [launcherVersion, setLauncherVersion] = useState<string | null>(null);

  useEffect(() => {
    // Only try to get version in Tauri environment
    if (!isTauri) {
      return;
    }

    const getVersion = async () => {
      try {
        const version = await tauriApi.getAppVersion();
        setLauncherVersion(version);
      } catch (error) {
        // Silently fail in browser mode - this is expected
        if (isTauri) {
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

  const handleMinimize = async () => {
    if (!isTauri) return;
    try {
      await tauriApi.minimizeWindow();
    } catch (error) {
      // Silently fail in browser mode
      if (isTauri) {
        console.error('Failed to minimize window:', error);
      }
    }
  };

  const handleMinimizeToTray = async () => {
    if (!isTauri) return;
    try {
      await tauriApi.hideWindow();
    } catch (error) {
      // Silently fail in browser mode
      if (isTauri) {
        console.error('Failed to hide window:', error);
      }
    }
  };

  const handleMaximize = async () => {
    if (!isTauri) return;
    try {
      await tauriApi.maximizeWindow();
    } catch (error) {
      // Silently fail in browser mode
      if (isTauri) {
        console.error('Failed to maximize window:', error);
      }
    }
  };

  const handleClose = async () => {
    if (!isTauri) return;
    try {
      await tauriApi.closeWindow();
    } catch (error) {
      // Silently fail in browser mode
      if (isTauri) {
        console.error('Failed to close window:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <header className="h-14 bg-dark-secondary/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 select-none draggable region z-30" role="banner" aria-label="Application title bar">
      <div className="flex items-center gap-3">
         <div className="flex space-x-1">
           <div className="w-1 h-6 bg-techno-cyan animate-pulse" />
           <div className="w-1 h-4 bg-magic-purple mt-2" />
           <div className="w-1 h-5 bg-white/50 mt-1" />
         </div>
         <span className="font-display font-bold tracking-[0.2em] text-sm text-white">
          ALAUNCHER <span className="text-techno-cyan">OS</span>
        </span>
        {launcherVersion && (
          <span className="text-[10px] font-mono text-gray-500 border border-white/10 px-2 py-0.5 rounded" aria-label={`Version ${launcherVersion}`}>
            v{launcherVersion}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 no-drag" role="toolbar" aria-label="Window controls">
         <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 mr-2 border-r border-white/10 pr-4">
           <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
           SERVER STATUS: OPTIMAL
         </div>

         <div className="relative">
           <NotificationCenter />
         </div>

         <LanguageSwitcher />

        {isTauri && (
          <>
            <button
              onClick={handleMinimize}
              onKeyDown={(e) => handleKeyDown(e, handleMinimize)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              aria-label="Minimize window"
              type="button"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={handleMinimizeToTray}
              onKeyDown={(e) => handleKeyDown(e, handleMinimizeToTray)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              aria-label="Minimize to system tray"
              type="button"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <button
              onClick={handleMaximize}
              onKeyDown={(e) => handleKeyDown(e, handleMaximize)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              aria-label="Maximize window"
              type="button"
            >
              <Square className="w-3 h-3" />
            </button>

            <button
              onClick={handleClose}
              onKeyDown={(e) => handleKeyDown(e, handleClose)}
              className="w-8 h-8 flex items-center justify-center hover:bg-status-error hover:text-white text-gray-400 transition-colors"
              aria-label="Close application"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
