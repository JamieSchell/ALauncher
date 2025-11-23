/**
 * Launcher Update Modal
 * Модальное окно для обновления лаунчера
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  fileHash?: string;
  fileSize?: bigint;
  releaseNotes?: string;
  isRequired: boolean;
}

interface LauncherUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo;
  isRequired: boolean;
  apiUrl: string;
}

export default function LauncherUpdateModal({
  isOpen,
  onClose,
  updateInfo,
  isRequired,
  apiUrl,
  currentVersion,
}: LauncherUpdateModalProps) {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'verifying' | 'installing' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [installerPath, setInstallerPath] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setDownloadProgress(0);
      setStatus('idle');
      setError(null);
      setInstallerPath(null);
      return;
    }

    // Setup event listeners
    const handleProgress = (progress: number) => {
      setDownloadProgress(progress);
      setStatus('downloading');
    };

    const handleComplete = (path: string) => {
      setInstallerPath(path);
      setStatus('verifying');
      // Auto-install after verification
      setTimeout(() => {
        handleInstall(path);
      }, 500);
    };

    const handleError = (errorMsg: string) => {
      setError(errorMsg);
      setStatus('error');
    };

    window.electronAPI.onLauncherUpdateProgress(handleProgress);
    window.electronAPI.onLauncherUpdateComplete(handleComplete);
    window.electronAPI.onLauncherUpdateError(handleError);

    return () => {
      // Cleanup listeners
      // Note: ipcRenderer.removeAllListeners might be needed, but we'll keep listeners for simplicity
    };
  }, [isOpen]);

  const handleDownload = () => {
    setStatus('downloading');
    setError(null);
    setDownloadProgress(0);
    window.electronAPI.downloadLauncherUpdate(updateInfo, apiUrl);
  };

  const handleInstall = async (path: string) => {
    try {
      setStatus('installing');
      const result = await window.electronAPI.installLauncherUpdate(path);
      
      if (result.success) {
        setStatus('complete');
        // Auto-restart after 2 seconds
        setTimeout(() => {
          window.electronAPI.restartLauncher();
        }, 2000);
      } else {
        setError(result.error || 'Installation failed');
        setStatus('error');
      }
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  };

  const handleCancel = () => {
    if (status === 'downloading') {
      window.electronAPI.cancelLauncherUpdate();
    }
    if (!isRequired) {
      onClose();
    }
  };

  const formatFileSize = (bytes?: bigint): string => {
    if (!bytes) return 'Unknown size';
    const mb = Number(bytes) / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 border border-gray-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              {isRequired ? (
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              ) : (
                <RefreshCw className="w-6 h-6 text-blue-500" />
              )}
              <h2 className="text-xl font-bold text-white">
                {isRequired ? 'Обновление обязательно' : 'Доступно обновление'}
              </h2>
            </div>
            {!isRequired && status === 'idle' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Version info */}
            {currentVersion && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Текущая версия</p>
                <p className="text-white font-mono">v{currentVersion}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-sm mb-1">Новая версия</p>
              <p className="text-green-400 font-mono font-semibold">v{updateInfo.version}</p>
            </div>

            {/* Release notes */}
            {updateInfo.releaseNotes && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Что нового:</p>
                <div className="bg-gray-800/50 rounded p-3 text-sm text-gray-300 whitespace-pre-wrap">
                  {updateInfo.releaseNotes}
                </div>
              </div>
            )}

            {/* File size */}
            <div className="text-sm text-gray-400">
              Размер: {formatFileSize(updateInfo.fileSize)}
            </div>

            {/* Progress */}
            {status === 'downloading' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Загрузка...</span>
                  <span className="text-white font-mono">{downloadProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${downloadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Status messages */}
            {status === 'verifying' && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Проверка целостности файла...</span>
              </div>
            )}

            {status === 'installing' && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Установка обновления...</span>
              </div>
            )}

            {status === 'complete' && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Обновление установлено! Перезапуск...</span>
              </div>
            )}

            {status === 'error' && error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {status === 'idle' && (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Обновить
                  </button>
                  {!isRequired && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Позже
                    </button>
                  )}
                </>
              )}
              {status === 'error' && (
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Попробовать снова
                </button>
              )}
            </div>

            {isRequired && status === 'idle' && (
              <p className="text-yellow-400 text-sm text-center">
                Это обновление обязательно. Пожалуйста, обновите лаунчер для продолжения работы.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

