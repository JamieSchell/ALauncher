/**
 * Custom window title bar
 */

import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  const handleMinimize = () => {
    window.electronAPI.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI.maximizeWindow();
  };

  const handleClose = () => {
    window.electronAPI.closeWindow();
  };

  return (
    <div className="flex items-center justify-between h-8 bg-black/50 window-drag px-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-gradient-to-br from-primary-500 to-primary-700 rounded" />
        <span className="text-sm font-semibold text-white">Modern Launcher</span>
      </div>

      <div className="flex items-center gap-1 window-no-drag">
        <button
          onClick={handleMinimize}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Minimize"
        >
          <Minus size={16} className="text-white" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Maximize"
        >
          <Square size={14} className="text-white" />
        </button>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-red-600 rounded transition-colors"
          title="Close"
        >
          <X size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
