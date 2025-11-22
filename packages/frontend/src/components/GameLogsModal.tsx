/**
 * Game Logs Modal Component
 * Displays game output logs in a modal window
 * Supports dragging and resizing
 */

import React from 'react';
import { X, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

export default function GameLogsModal({ isOpen, onClose, logs }: GameLogsModalProps) {
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  
  // Position and size state
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [size, setSize] = React.useState({ width: 900, height: 600 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, width: 0, height: 0 });

  // Center modal on first open
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      const centerX = (window.innerWidth - size.width) / 2;
      const centerY = (window.innerHeight - size.height) / 2;
      setPosition({ x: centerX, y: centerY });
    }
  }, [isOpen, size.width, size.height]);

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle drag
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep modal within viewport
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, size.width, size.height]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  // Handle resize
  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const minWidth = 400;
      const minHeight = 300;
      const maxWidth = window.innerWidth - position.x;
      const maxHeight = window.innerHeight - position.y;
      
      setSize({
        width: Math.max(minWidth, Math.min(resizeStart.width + deltaX, maxWidth)),
        height: Math.max(minHeight, Math.min(resizeStart.height + deltaY, maxHeight)),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, position.x, position.y]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[40]"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: position.x,
              y: position.y,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed',
              width: `${size.width}px`,
              height: `${size.height}px`,
              left: 0,
              top: 0,
              zIndex: 50,
            }}
            className="flex flex-col glass rounded-xl overflow-hidden select-none"
          >
            {/* Header - Draggable */}
            <div 
              className="flex items-center justify-between p-4 border-b border-white/10 cursor-move"
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-2">
                <Terminal className="text-primary-500" size={20} />
                <h2 className="text-xl font-bold text-white">Game Logs</h2>
                <span className="text-sm text-gray-400">({logs.length} lines)</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Close"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Logs Container */}
            <div
              ref={logContainerRef}
              className="flex-1 overflow-auto p-4 font-mono text-sm bg-black/30"
            >
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No logs yet. Game output will appear here.
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => {
                    const isError = log.includes('[ERROR]') || log.toLowerCase().includes('error') || log.toLowerCase().includes('exception');
                    const isWarning = log.includes('[WARN]') || log.toLowerCase().includes('warn');
                    const isExit = log.includes('[EXIT]');
                    const isInfo = log.includes('[INFO]');

                    // Truncate very long paths for readability
                    let displayLog = log;
                    if (log.length > 200) {
                      // Try to shorten Windows paths
                      displayLog = log.replace(/C:\\Users\\[^\\]+\\/g, '...\\');
                      displayLog = displayLog.replace(/C:\\Program Files\\/g, 'C:\\...\\');
                      displayLog = displayLog.replace(/C:\\Windows\\/g, 'C:\\Windows\\...\\');
                    }

                    return (
                      <div
                        key={index}
                        className={`${
                          isError
                            ? 'text-red-400 bg-red-500/10 px-2 py-1 rounded'
                            : isWarning
                            ? 'text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded'
                            : isExit
                            ? 'text-blue-400'
                            : isInfo
                            ? 'text-green-400'
                            : 'text-gray-300'
                        } break-words whitespace-pre-wrap`}
                        title={log.length > 200 ? log : undefined}
                      >
                        {displayLog}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  if (logContainerRef.current) {
                    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                  }
                }}
                className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
              >
                Scroll to Bottom
              </button>
              <button
                onClick={() => {
                  const text = logs.join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm cursor-pointer"
                disabled={logs.length === 0}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Copy All
              </button>
            </div>

            {/* Resize Handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-transparent hover:bg-primary-500/20 transition-colors"
              onMouseDown={handleResizeStart}
              style={{
                cursor: 'nwse-resize',
              }}
            >
              <div className="absolute bottom-1 right-1 w-0 h-0 border-l-[6px] border-l-transparent border-b-[6px] border-b-white/30" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

