/**
 * Custom window title bar
 * Draggable window with controls: minimize, minimize to tray, maximize, close
 */

import { useState, useEffect } from 'react';
import { Minus, Square, X, ChevronDown, Gamepad2 } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import LanguageSwitcher from './LanguageSwitcher';

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
    
    // Get version immediately
    getVersion();
    
    // Refresh version periodically
    const interval = setInterval(() => {
      getVersion();
    }, 30000); // Every 30 seconds
    
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

  return (
    <div className="flex items-center justify-between h-10 bg-[#2a2a2a]/90 backdrop-blur-sm window-drag px-4 border-b border-[#3d3d3d]/50 relative z-[100]">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-gradient-to-br from-[#6b8e23] to-[#556b2f] rounded flex items-center justify-center border border-[#7a9f35]/30">
          <Gamepad2 size={16} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white">Modern Launcher</span>
        {launcherVersion && (
          <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-[#1f1f1f] rounded border border-[#3d3d3d]">
            v{launcherVersion}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 window-no-drag">
        <NotificationCenter />
        <LanguageSwitcher />
        <button
          onClick={handleMinimize}
          className="p-1.5 hover:bg-[#1f1f1f] rounded transition-colors"
          title="Minimize"
        >
          <Minus size={16} className="text-gray-300" />
        </button>
        <button
          onClick={handleMinimizeToTray}
          className="p-1.5 hover:bg-[#1f1f1f] rounded transition-colors"
          title="Minimize to Tray"
        >
          <ChevronDown size={16} className="text-gray-300" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 hover:bg-[#1f1f1f] rounded transition-colors"
          title="Maximize"
        >
          <Square size={14} className="text-gray-300" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-[#5a3d3d]/30 hover:text-[#cc6b6b] rounded transition-colors"
          title="Close"
        >
          <X size={16} className="text-gray-300" />
        </button>
      </div>
    </div>
  );
}
