/**
 * Download Progress Modal Component
 * Premium download progress indicator with animations
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, CheckCircle2, Loader2, Package, AlertCircle } from 'lucide-react';
import { UpdateProgress } from '@modern-launcher/shared';

interface DownloadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UpdateProgress | null;
}

const stageIcons = {
  downloading: Download,
  verifying: Loader2,
  extracting: Package,
  complete: CheckCircle2,
};

const stageLabels = {
  downloading: 'Downloading',
  verifying: 'Verifying',
  extracting: 'Extracting',
  complete: 'Complete',
};

const stageColors = {
  downloading: 'from-blue-500 to-cyan-500',
  verifying: 'from-yellow-500 to-orange-500',
  extracting: 'from-purple-500 to-pink-500',
  complete: 'from-green-500 to-emerald-500',
};

export default function DownloadProgressModal({ isOpen, onClose, progress }: DownloadProgressModalProps) {
  const progressPercent = progress?.progress || 0;
  const isComplete = progress?.stage === 'complete';
  // Проверка ошибки: если в currentFile есть ключевые слова ошибки, или если complete но progress = 0 и totalFiles = 0
  const hasError = progress?.currentFile?.toLowerCase().includes('error') || 
                   progress?.currentFile?.toLowerCase().includes('not found') ||
                   progress?.currentFile?.toLowerCase().includes('failed') ||
                   (isComplete && progress?.progress === 0 && progress?.totalFiles === 0 && progress?.currentFile?.toLowerCase().includes('error'));
  
  // Определить иконку и цвет с учетом ошибки
  const StageIcon = hasError ? AlertCircle : (progress ? stageIcons[progress.stage] : Download);
  const stageColor = hasError 
    ? 'from-red-500 to-red-600' 
    : (progress ? stageColors[progress.stage] : 'from-blue-500 to-cyan-500');
  const stageLabel = hasError 
    ? 'Error' 
    : (progress ? stageLabels[progress.stage] : 'Preparing Download');
  
  const modalRef = React.useRef<HTMLDivElement>(null);
  
  // Position state for dragging
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [modalWidth, setModalWidth] = React.useState(672);

  // Update modal width on window resize
  React.useEffect(() => {
    const updateWidth = () => {
      setModalWidth(Math.min(672, window.innerWidth - 40));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Center modal on first open (with offset to avoid title bar)
  React.useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (modalRef.current) {
          const width = Math.min(672, window.innerWidth - 40);
          const modalHeight = modalRef.current.offsetHeight || 400;
          const titleBarHeight = 40; // Height of title bar
          const centerX = Math.max(20, (window.innerWidth - width) / 2);
          // Offset Y position to be below title bar
          const centerY = Math.max(titleBarHeight + 20, (window.innerHeight - modalHeight) / 2);
          setPosition({ x: centerX, y: centerY });
          setModalWidth(width);
        } else {
          // Fallback: center with estimated height
          const width = Math.min(672, window.innerWidth - 40);
          const estimatedHeight = 400;
          const titleBarHeight = 40; // Height of title bar
          const centerX = Math.max(20, (window.innerWidth - width) / 2);
          // Offset Y position to be below title bar
          const centerY = Math.max(titleBarHeight + 20, (window.innerHeight - estimatedHeight) / 2);
          setPosition({ x: centerX, y: centerY });
          setModalWidth(width);
        }
      });
    }
  }, [isOpen]);

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
      const width = modalWidth;
      const modalHeight = modalRef.current?.offsetHeight || 400;
      const titleBarHeight = 40; // Height of title bar
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep modal within viewport with padding, but below title bar
      const maxX = window.innerWidth - width - 20;
      const maxY = window.innerHeight - modalHeight - 20;
      
      setPosition({
        x: Math.max(20, Math.min(newX, maxX)),
        y: Math.max(titleBarHeight + 10, Math.min(newY, maxY)),
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
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - starts from top */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isComplete || hasError ? onClose : undefined}
            style={{
              position: 'fixed',
              top: 0, // Start from top
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 60,
            }}
            className="bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${modalWidth}px`,
              maxWidth: '90vw',
              transform: 'translate(0, 0)',
              zIndex: 70,
            }}
            className="p-6"
          >
            <div className="glass rounded-2xl overflow-hidden shadow-2xl">
              {/* Header - Draggable */}
              <div 
                onMouseDown={handleDragStart}
                className={`relative p-6 bg-gradient-to-r from-primary-600/20 to-primary-700/20 border-b border-white/10 ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                } select-none`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stageColor} shadow-lg`}>
                      <StageIcon 
                        size={24} 
                        className={`text-white ${progress?.stage === 'downloading' ? 'animate-spin' : ''}`}
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {stageLabel}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">
                        Minecraft {progress?.profileId || '...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Progress Content */}
              <div className="p-6 space-y-6">
                {/* Main Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${
                      hasError ? 'text-red-400' : 'text-gray-300'
                    }`}>
                      {progress?.currentFile || 'Initializing...'}
                    </span>
                    <span className="text-gray-400">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
                    {/* Animated Background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${stageColor} opacity-20`}
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{
                        backgroundSize: '200% 200%',
                      }}
                    />
                    
                    {/* Progress Fill */}
                    <motion.div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${stageColor} rounded-full shadow-lg`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      {/* Shine Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Stats Grid */}
                {progress && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {progress.downloadedFiles}
                      </div>
                      <div className="text-xs text-gray-400">Files</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {progress.totalFiles}
                      </div>
                      <div className="text-xs text-gray-400">Total</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {progress.totalFiles > 0 
                          ? Math.round((progress.downloadedFiles / progress.totalFiles) * 100)
                          : 0}%
                      </div>
                      <div className="text-xs text-gray-400">Complete</div>
                    </div>
                  </div>
                )}

                {/* Stage Indicator - только если нет ошибки */}
                {progress && !hasError && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className={`w-2 h-2 rounded-full ${
                      progress.stage === 'downloading' ? 'bg-blue-500 animate-pulse' :
                      progress.stage === 'verifying' ? 'bg-yellow-500 animate-pulse' :
                      progress.stage === 'extracting' ? 'bg-purple-500 animate-pulse' :
                      'bg-green-500'
                    }`} />
                    <span>
                      {progress.stage === 'downloading' && 'Downloading files...'}
                      {progress.stage === 'verifying' && 'Verifying integrity...'}
                      {progress.stage === 'extracting' && 'Extracting archives...'}
                      {progress.stage === 'complete' && 'Download complete!'}
                    </span>
                  </div>
                )}

                {/* Error Message - показывать всегда, если есть ошибка */}
                {hasError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <AlertCircle size={24} className="text-red-400" />
                    <div className="flex-1">
                      <div className="text-red-400 font-semibold">Download Error</div>
                      <div className="text-sm text-gray-300 mt-1">
                        {progress?.currentFile || 'An error occurred during download'}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Success Message - только если complete и нет ошибки */}
                {isComplete && !hasError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                  >
                    <CheckCircle2 size={24} className="text-green-400" />
                    <div>
                      <div className="text-green-400 font-semibold">Download Complete!</div>
                      <div className="text-sm text-gray-400">
                        All files have been downloaded successfully.
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

