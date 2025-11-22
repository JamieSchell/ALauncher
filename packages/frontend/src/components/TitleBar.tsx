/**
 * Custom window title bar
 * Draggable window with controls: minimize, minimize to tray, maximize, close
 */

import { Minus, Square, X, ChevronDown } from 'lucide-react';

export default function TitleBar() {
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
    <div className="flex items-center justify-between h-10 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm window-drag px-4 border-b border-white/10 relative z-[100]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-white">M</span>
        </div>
        <span className="text-sm font-semibold text-white">Modern Launcher</span>
      </div>

      <div className="flex items-center gap-1 window-no-drag">
        <button
          onClick={handleMinimize}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Minimize"
        >
          <Minus size={16} className="text-white" />
        </button>
        <button
          onClick={handleMinimizeToTray}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Minimize to Tray"
        >
          <ChevronDown size={16} className="text-white" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Maximize"
        >
          <Square size={14} className="text-white" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-red-600/80 rounded transition-colors"
          title="Close"
        >
          <X size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
