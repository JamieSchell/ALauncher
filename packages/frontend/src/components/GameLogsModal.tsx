/**
 * Game Logs Modal Component
 * Displays game output logs in a modal window
 * Supports dragging and resizing
 */

import React from 'react';
import { X, Terminal, Search, Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

export default function GameLogsModal({ isOpen, onClose, logs }: GameLogsModalProps) {
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Position and size state - responsive
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [size, setSize] = React.useState(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    // Responsive sizing
    if (screenWidth < 640) { // sm
      return { width: screenWidth - 20, height: screenHeight - 100 };
    } else if (screenWidth < 768) { // md
      return { width: Math.min(700, screenWidth - 40), height: Math.min(500, screenHeight - 100) };
    } else if (screenWidth < 1024) { // lg
      return { width: Math.min(800, screenWidth - 40), height: Math.min(550, screenHeight - 100) };
    } else { // xl+
      return { width: 900, height: 600 };
    }
  });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredLogs, setFilteredLogs] = React.useState<string[]>(logs);
  const [currentMatchIndex, setCurrentMatchIndex] = React.useState(-1);
  const [matchIndices, setMatchIndices] = React.useState<number[]>([]);

  // Update size on window resize
  React.useEffect(() => {
    const updateSize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      let newWidth = 900;
      let newHeight = 600;
      
      // Responsive sizing
      if (screenWidth < 640) { // sm
        newWidth = screenWidth - 20;
        newHeight = screenHeight - 100;
      } else if (screenWidth < 768) { // md
        newWidth = Math.min(700, screenWidth - 40);
        newHeight = Math.min(500, screenHeight - 100);
      } else if (screenWidth < 1024) { // lg
        newWidth = Math.min(800, screenWidth - 40);
        newHeight = Math.min(550, screenHeight - 100);
      } else { // xl+
        newWidth = 900;
        newHeight = 600;
      }
      
      setSize({ width: newWidth, height: newHeight });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Center modal on first open
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      const centerX = Math.max(10, (window.innerWidth - size.width) / 2);
      const centerY = Math.max(10, (window.innerHeight - size.height) / 2);
      setPosition({ x: centerX, y: centerY });
    }
  }, [isOpen, size.width, size.height]);

  // Filter logs based on search query
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      setMatchIndices([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = logs.filter(log => log.toLowerCase().includes(query));
    const indices = logs
      .map((log, index) => log.toLowerCase().includes(query) ? index : -1)
      .filter(index => index !== -1);
    
    setFilteredLogs(filtered);
    setMatchIndices(indices);
    setCurrentMatchIndex(indices.length > 0 ? 0 : -1);
  }, [logs, searchQuery]);

  // Auto-scroll to bottom when new logs arrive (only if not searching)
  React.useEffect(() => {
    if (logContainerRef.current && !searchQuery.trim()) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, searchQuery]);

  // Scroll to current match
  React.useEffect(() => {
    if (currentMatchIndex >= 0 && matchIndices.length > 0 && logContainerRef.current) {
      const matchIndex = matchIndices[currentMatchIndex];
      const logElements = logContainerRef.current.querySelectorAll('[data-log-index]');
      const targetElement = Array.from(logElements).find(
        el => parseInt(el.getAttribute('data-log-index') || '-1') === matchIndex
      );
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the match
        targetElement.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2', 'ring-offset-black/30');
        setTimeout(() => {
          targetElement.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2', 'ring-offset-black/30');
        }, 2000);
      }
    }
  }, [currentMatchIndex, matchIndices]);

  const handleSearchNext = () => {
    if (matchIndices.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchIndices.length);
  };

  const handleSearchPrevious = () => {
    if (matchIndices.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchIndices.length) % matchIndices.length);
  };

  const handleExportLogs = async () => {
    if (!window.electronAPI || logs.length === 0) {
      alert('Cannot export logs: Electron API not available or no logs to export');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `game-logs-${timestamp}.txt`;
      const logsText = logs.join('\n');
      const logsData = new TextEncoder().encode(logsText);

      // Get user's Documents folder or use temp
      const appPaths = await window.electronAPI.getAppPaths();
      const exportPath = `${appPaths.userData}/${fileName}`;

      // Ensure directory exists
      await window.electronAPI.ensureDir(appPaths.userData);
      
      // Write file
      await window.electronAPI.writeFile(exportPath, logsData);
      
      alert(`Logs exported successfully to:\n${exportPath}`);
    } catch (error: any) {
      alert(`Failed to export logs: ${error.message}`);
    }
  };

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
            className="flex flex-col bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl overflow-hidden select-none shadow-lg"
          >
            {/* Header - Draggable */}
            <div 
              className="flex items-center justify-between p-4 border-b border-white/10 cursor-move"
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-2">
                <Terminal className="text-primary-500" size={20} />
                <h2 className="text-xl font-bold text-white">Game Logs</h2>
                <span className="text-sm text-gray-400">
                  ({searchQuery ? `${filteredLogs.length}/${logs.length}` : logs.length} lines)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportLogs}
                  disabled={logs.length === 0}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export logs to file"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Download size={18} className="text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-2 border-b border-white/10 bg-white/5" onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          handleSearchPrevious();
                        } else {
                          handleSearchNext();
                        }
                      }
                    }}
                  />
                </div>
                {searchQuery && matchIndices.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <button
                      onClick={handleSearchPrevious}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors"
                      title="Previous match (Shift+Enter)"
                    >
                      ↑
                    </button>
                    <span>
                      {currentMatchIndex + 1} / {matchIndices.length}
                    </span>
                    <button
                      onClick={handleSearchNext}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors"
                      title="Next match (Enter)"
                    >
                      ↓
                    </button>
                  </div>
                )}
                {searchQuery && matchIndices.length === 0 && (
                  <span className="text-xs text-red-400">No matches</span>
                )}
              </div>
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
              ) : filteredLogs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No logs match your search query.
                </div>
              ) : (
                <div className="space-y-1">
                  {searchQuery ? (
                    // Show filtered logs with original indices
                    filteredLogs.map((log) => {
                      const originalIndex = logs.indexOf(log);
                      const isError = log.includes('[ERROR]') || log.toLowerCase().includes('error') || log.toLowerCase().includes('exception');
                      const isWarning = log.includes('[WARN]') || log.toLowerCase().includes('warn');
                      const isExit = log.includes('[EXIT]');
                      const isInfo = log.includes('[INFO]');

                      // Highlight search matches
                      const query = searchQuery.toLowerCase();
                      const parts = log.split(new RegExp(`(${query})`, 'gi'));
                      
                      let displayLog = log;
                      if (log.length > 200) {
                        displayLog = log.replace(/C:\\Users\\[^\\]+\\/g, '...\\');
                        displayLog = displayLog.replace(/C:\\Program Files\\/g, 'C:\\...\\');
                        displayLog = displayLog.replace(/C:\\Windows\\/g, 'C:\\Windows\\...\\');
                      }

                      return (
                        <div
                          key={originalIndex}
                          data-log-index={originalIndex}
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
                          {displayLog.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                            part.toLowerCase() === searchQuery.toLowerCase() ? (
                              <mark key={i} className="bg-yellow-500/50 text-yellow-200 px-0.5 rounded">
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )}
                        </div>
                      );
                    })
                  ) : (
                    // Show all logs
                    logs.map((log, index) => {
                      const isError = log.includes('[ERROR]') || log.toLowerCase().includes('error') || log.toLowerCase().includes('exception');
                      const isWarning = log.includes('[WARN]') || log.toLowerCase().includes('warn');
                      const isExit = log.includes('[EXIT]');
                      const isInfo = log.includes('[INFO]');

                      let displayLog = log;
                      if (log.length > 200) {
                        displayLog = log.replace(/C:\\Users\\[^\\]+\\/g, '...\\');
                        displayLog = displayLog.replace(/C:\\Program Files\\/g, 'C:\\...\\');
                        displayLog = displayLog.replace(/C:\\Windows\\/g, 'C:\\Windows\\...\\');
                      }

                      return (
                        <div
                          key={index}
                          data-log-index={index}
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
                    })
                  )}
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

