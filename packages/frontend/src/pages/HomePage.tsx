/**
 * Home Page - Main launcher interface
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Download, AlertCircle, Terminal, Wifi, WifiOff, Users, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { profilesAPI } from '../api/profiles';
import { serversAPI } from '../api/servers';
import { downloadsAPI } from '../api/downloads';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import GameLogsModal from '../components/GameLogsModal';
import DownloadProgressModal from '../components/DownloadProgressModal';
import ServerBadge from '../components/ServerBadge';
import { useDownloadProgress, useClientDownload } from '../hooks/useWebSocket';
import { ServerStatus, UpdateProgress } from '@modern-launcher/shared';

export default function HomePage() {
  const navigate = useNavigate();
  const { playerProfile, accessToken } = useAuthStore();
  const { selectedProfile, ram, width, height, fullScreen, autoEnter, javaPath, workingDir } = useSettingsStore();
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [gameLogs, setGameLogs] = useState<string[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [serverStatuses, setServerStatuses] = useState<Record<string, ServerStatus>>({});
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingVersion, setDownloadingVersion] = useState<string | null>(null);
  const [checkingFiles, setCheckingFiles] = useState(false);
  const [clientReady, setClientReady] = useState<Record<string, boolean>>({});

  // Listen to game logs and errors
  React.useEffect(() => {
    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.warn('electronAPI is not available. Preload script may not have loaded.');
      return;
    }

    const handleLog = (log: string) => {
      console.log('Game log:', log);
      setGameLogs(prev => [...prev.slice(-49), log]); // Keep last 50 logs
    };

    const handleError = (error: string) => {
      console.error('Game error:', error);
      setGameLogs(prev => [...prev.slice(-49), `[ERROR] ${error}`]);
      setLaunchError(error);
    };

    const handleExit = (code: number) => {
      console.log('Game exited with code:', code);
      setGameLogs(prev => [...prev.slice(-49), `[EXIT] Game exited with code ${code}`]);
      setLaunching(false);
      if (code !== 0 && code !== null) {
        setLaunchError(`Game exited with code ${code}. Check logs for details.`);
      } else {
        // Clear error on successful exit
        setLaunchError(null);
      }
    };

    window.electronAPI.onGameLog(handleLog);
    window.electronAPI.onGameError(handleError);
    window.electronAPI.onGameExit(handleExit);

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.getProfiles,
    refetchOnWindowFocus: true, // Auto-refresh when window gets focus
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Fetch server statuses for all profiles
  React.useEffect(() => {
    if (!profiles) return;

    const fetchStatuses = async () => {
      const statusPromises = profiles.map(async (item) => {
        const profile = item.profile;
        try {
          const status = await serversAPI.getServerStatus(profile.serverAddress, profile.serverPort);
          return { key: `${profile.serverAddress}:${profile.serverPort}`, status };
        } catch (error) {
          console.error(`Failed to ping ${profile.serverAddress}:${profile.serverPort}`, error);
          return {
            key: `${profile.serverAddress}:${profile.serverPort}`,
            status: {
              online: false,
              players: { online: 0, max: 0 },
              version: '',
              motd: '',
              ping: 0,
            } as ServerStatus,
          };
        }
      });

      const results = await Promise.all(statusPromises);
      const statusMap: Record<string, ServerStatus> = {};
      results.forEach(({ key, status }) => {
        statusMap[key] = status;
      });
      setServerStatuses(statusMap);
    };

    fetchStatuses();

    // Refresh statuses every 30 seconds
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, [profiles]);

  const selectedProfileData = profiles?.find(p => p.profile.id === selectedProfile);

  // Check client files when profile is selected
  React.useEffect(() => {
    if (selectedProfileData && !clientReady[selectedProfileData.profile.version]) {
      checkClientFiles(selectedProfileData.profile.version).then(ready => {
        setClientReady(prev => ({ ...prev, [selectedProfileData.profile.version]: ready }));
      });
    }
  }, [selectedProfileData?.profile.version]);

  const handleLaunch = async () => {
    if (!selectedProfileData || !playerProfile) return;

    const profile = selectedProfileData.profile;
    
    // Проверить наличие файлов клиента
    setCheckingFiles(true);
    setLaunchError(null);
    
    const filesReady = await checkClientFiles(profile.version);
    setCheckingFiles(false);
    
    if (!filesReady) {
      // Файлы не найдены - запустить загрузку
      setDownloadingVersion(profile.version);
      setShowDownloadModal(true);
      setDownloadProgress({
        profileId: profile.version,
        stage: 'downloading',
        progress: 0,
        currentFile: 'Checking files...',
        totalFiles: 0,
        downloadedFiles: 0,
      });

      try {
        // Получить информацию о версии клиента с сервера
        let versionId: string;
        try {
          const versionInfo = await downloadsAPI.getClientVersionByVersion(profile.version);
          if (!versionInfo.data) {
            throw new Error('Version not found on server');
          }
          versionId = versionInfo.data.id;
        } catch (error: any) {
          setDownloadProgress({
            profileId: profile.version,
            stage: 'complete',
            progress: 0,
            currentFile: `Error: Version ${profile.version} not found on server. Please contact administrator.`,
            totalFiles: 0,
            downloadedFiles: 0,
          });
          setLaunchError(`Version ${profile.version} not found on server. Please contact administrator.`);
          return;
        }

        // Получить список файлов и начать загрузку
        const versionInfo = await downloadsAPI.getClientVersionByVersion(profile.version);
        if (!versionInfo.data) {
          throw new Error('Version info not found');
        }

        const files = versionInfo.data.files;
        setDownloadProgress(prev => prev ? {
          ...prev,
          totalFiles: files.length,
          currentFile: 'Preparing download...',
        } : null);

        // Получить путь к updates директории
        const appPaths = await window.electronAPI.getAppPaths();
        const updatesDir = `${appPaths.userData}/updates/${profile.version}`;

        // Загрузить каждый файл
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const destPath = `${updatesDir}/${file.filePath}`;

          // Проверить, существует ли файл и правильный ли хеш
          try {
            const exists = await window.electronAPI.fileExists(destPath);
            if (exists) {
              const hash = await window.electronAPI.calculateFileHash(destPath, 'sha256');
              if (hash === file.fileHash) {
                // Файл уже загружен и валиден
                const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;
                setDownloadProgress(prev => prev ? {
                  ...prev,
                  progress: ((i + 1) / files.length) * 100,
                  currentFile: fileName,
                  downloadedFiles: i + 1,
                } : null);
                continue;
              }
            }
          } catch {
            // Файл не существует или ошибка проверки, продолжаем загрузку
          }

          // Загрузить файл через HTTP endpoint
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7240';
          const fileUrl = `${apiUrl}/api/client-versions/${versionId}/file/${file.filePath}`;

          const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;
          setDownloadProgress(prev => prev ? {
            ...prev,
            currentFile: fileName,
          } : null);

          await window.electronAPI.downloadFile(fileUrl, destPath, (progress) => {
            // Обновить прогресс загрузки
            const fileProgress = ((i + progress / 100) / files.length) * 100;
            setDownloadProgress(prev => prev ? {
              ...prev,
              progress: fileProgress,
              downloadedFiles: i + (progress === 100 ? 1 : 0),
            } : null);
          });

          // Проверить хеш после загрузки
          const hash = await window.electronAPI.calculateFileHash(destPath, 'sha256');
          if (hash !== file.fileHash) {
            throw new Error(`Hash mismatch for ${file.filePath}`);
          }
        }

        // Завершение загрузки
        setDownloadProgress(prev => prev ? {
          ...prev,
          stage: 'complete',
          progress: 100,
          currentFile: 'Download complete! Client ready. Enjoy the game!',
          downloadedFiles: files.length,
        } : null);
        
        // Обновить статус готовности
        setClientReady(prev => ({ ...prev, [profile.version]: true }));
        
        // Закрыть модальное окно через 2 секунды и запустить игру
        setTimeout(async () => {
          setShowDownloadModal(false);
          setDownloadProgress(null);
          setDownloadingVersion(null);
          // Автоматически запустить игру после загрузки
          await launchGame();
        }, 2000);
        
        return;
      } catch (error: any) {
        console.error('Download error:', error);
        setDownloadProgress({
          profileId: profile.version,
          stage: 'complete',
          progress: 0,
          currentFile: `Error: ${error.message || 'Failed to start download'}`,
          totalFiles: 0,
          downloadedFiles: 0,
        });
        return;
      }
    }

    // Файлы готовы - запустить игру
    setClientReady(prev => ({ ...prev, [profile.version]: true }));
    await launchGame();
  };

  // Launch game function
  const launchGame = async () => {
    if (!selectedProfileData || !playerProfile) return;

    setLaunching(true);
    setLaunchError(null);
    setGameLogs([]); // Clear previous logs

    try {
      const profile = selectedProfileData.profile;
      
      // Build launch arguments
      const jvmArgs = [
        `-Xms${ram}M`,
        `-Xmx${ram}M`,
        ...profile.jvmArgs,
      ];

      const gameArgs = [
        '--username', playerProfile.username,
        '--uuid', playerProfile.uuid,
        '--accessToken', accessToken || '',
        '--version', profile.version,
        '--width', width.toString(),
        '--height', height.toString(),
        ...profile.clientArgs,
      ];

      if (fullScreen) {
        gameArgs.push('--fullscreen', 'true');
      }

      if (autoEnter) {
        gameArgs.push('--server', profile.serverAddress);
        gameArgs.push('--port', profile.serverPort.toString());
      }

      // Launch via Electron IPC
      // classPath will be resolved in main process
      const result = await window.electronAPI.launchGame({
        javaPath,
        jvmArgs,
        mainClass: profile.mainClass,
        classPath: profile.classPath,
        gameArgs,
        workingDir,
        version: profile.version,
      });

      if (result.success) {
        console.log('Game launched successfully, PID:', result.pid);
        setGameLogs(prev => [...prev, `[INFO] Game launched successfully! PID: ${result.pid}`]);
        setLaunchError(null); // Clear any previous errors
        // Don't set launching to false immediately - let the game process handle it
        // The launching state will be reset when game exits
      } else {
        const errorMsg = result.error || 'Failed to launch game';
        // Provide more helpful error messages
        let userFriendlyError = errorMsg;
        if (errorMsg.includes('Java executable not found') || errorMsg.includes('Java is not available')) {
          userFriendlyError = 'Java не найдена. Установите Java 17 или выше, или укажите путь к Java в настройках.';
        } else if (errorMsg.includes('Client JAR not found') || errorMsg.includes('No valid classpath')) {
          userFriendlyError = 'Файлы Minecraft не найдены. Загрузите их через: npm run download-minecraft ' + selectedProfileData.profile.version;
        } else if (errorMsg.includes('Failed to start')) {
          userFriendlyError = 'Не удалось запустить игру. Проверьте логи для деталей.';
        } else if (errorMsg.includes('UnsatisfiedLinkError') || errorMsg.includes('lwjgl') || errorMsg.includes('no lwjgl')) {
          userFriendlyError = 'Ошибка загрузки нативных библиотек LWJGL. Убедитесь, что файлы Minecraft полностью загружены. Попробуйте перезагрузить файлы через: npm run download-minecraft ' + selectedProfileData.profile.version;
        }
        
        setLaunchError(userFriendlyError);
        setGameLogs(prev => [...prev, `[ERROR] ${errorMsg}`]);
        console.error('Launch failed:', result.error);
        setLaunching(false);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Произошла неожиданная ошибка';
      setLaunchError(errorMessage);
      setGameLogs(prev => [...prev, `[ERROR] ${errorMessage}`]);
      console.error('Launch error:', error);
      setLaunching(false);
    }
  };

  // Client download hook
  const { downloadClient, isConnected: wsConnected } = useClientDownload();

  // Check if client files are downloaded
  const checkClientFiles = async (version: string): Promise<boolean> => {
    try {
      // Получить информацию о версии клиента с сервера
      const versionInfo = await downloadsAPI.getClientVersionByVersion(version);
      if (!versionInfo.data) {
        return false;
      }

      const files = versionInfo.data.files;
      if (files.length === 0) {
        return false;
      }

      // Получить путь к updates директории
      const appPaths = await window.electronAPI.getAppPaths();
      const updatesDir = `${appPaths.userData}/updates/${version}`;

      // Проверить каждый файл
      for (const file of files) {
        const destPath = `${updatesDir}/${file.filePath}`;
        
        try {
          const exists = await window.electronAPI.fileExists(destPath);
          if (!exists) {
            return false;
          }
          
          const hash = await window.electronAPI.calculateFileHash(destPath, 'sha256');
          if (hash !== file.fileHash) {
            return false;
          }
        } catch {
          return false;
        }
      }

      return true;
    } catch (error: any) {
      // Don't log 404 errors as they're expected when version is not in database
      if (error.response?.status === 404) {
        // Version not found in database - this is normal, just return false
        return false;
      }
      // Only log unexpected errors
      console.error('Error checking client files:', error);
      return false;
    }
  };

  // Handle download - загрузка с собственного сервера через WebSocket
  const handleDownload = async (version: string) => {
    try {
      setDownloadingVersion(version);
      setShowDownloadModal(true);
      setDownloadProgress({
        profileId: version,
        stage: 'downloading',
        progress: 0,
        currentFile: 'Connecting to server...',
        totalFiles: 0,
        downloadedFiles: 0,
      });

      // Получить информацию о версии клиента с сервера
      let versionId: string;
      try {
        const versionInfo = await downloadsAPI.getClientVersionByVersion(version);
        if (!versionInfo.data) {
          throw new Error('Version not found on server');
        }
        versionId = versionInfo.data.id;
      } catch (error: any) {
        // Если версия не найдена на сервере, используем fallback на старый способ
        console.warn('Client version not found on server, using fallback download');
        setDownloadProgress({
          profileId: version,
          stage: 'downloading',
          progress: 0,
          currentFile: 'Version not found on server. Please contact administrator.',
          totalFiles: 0,
          downloadedFiles: 0,
        });
        return;
      }

      // Получить список файлов и начать загрузку
      const versionInfo = await downloadsAPI.getClientVersionByVersion(version);
      if (!versionInfo.data) {
        throw new Error('Version info not found');
      }

      const files = versionInfo.data.files;
      setDownloadProgress(prev => prev ? {
        ...prev,
        totalFiles: files.length,
        currentFile: 'Preparing download...',
      } : null);

      // Получить путь к updates директории
      const appPaths = await window.electronAPI.getAppPaths();
      const updatesDir = `${appPaths.userData}/updates/${version}`;

      // Загрузить каждый файл
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const destPath = `${updatesDir}/${file.filePath}`;

        // Проверить, существует ли файл и правильный ли хеш
        try {
          const exists = await window.electronAPI.fileExists(destPath);
          if (exists) {
            const hash = await window.electronAPI.calculateFileHash(destPath, 'sha256');
            if (hash === file.fileHash) {
              // Файл уже загружен и валиден
        const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;
        setDownloadProgress(prev => prev ? {
          ...prev,
          progress: ((i + 1) / files.length) * 100,
          currentFile: fileName,
          downloadedFiles: i + 1,
        } : null);
              continue;
            }
          }
        } catch {
          // Файл не существует или ошибка проверки, продолжаем загрузку
        }

        // Загрузить файл через HTTP endpoint
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7240';
        const fileUrl = `${apiUrl}/api/client-versions/${versionId}/file/${file.filePath}`;

        const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;
        setDownloadProgress(prev => prev ? {
          ...prev,
          currentFile: fileName,
        } : null);

        await window.electronAPI.downloadFile(fileUrl, destPath, (progress) => {
          // Обновить прогресс загрузки
          const fileProgress = ((i + progress / 100) / files.length) * 100;
          setDownloadProgress(prev => prev ? {
            ...prev,
            progress: fileProgress,
            downloadedFiles: i + (progress === 100 ? 1 : 0),
          } : null);
        });

        // Проверить хеш после загрузки
        const hash = await window.electronAPI.calculateFileHash(destPath, 'sha256');
        if (hash !== file.fileHash) {
          throw new Error(`Hash mismatch for ${file.filePath}`);
        }
      }

      // Завершение
      setDownloadProgress(prev => prev ? {
        ...prev,
        stage: 'complete',
        progress: 100,
        currentFile: 'Download complete!',
        downloadedFiles: files.length,
      } : null);
    } catch (error: any) {
      console.error('Download error:', error);
      setDownloadProgress({
        profileId: version,
        stage: 'complete',
        progress: 0,
        currentFile: `Error: ${error.message || 'Failed to start download'}`,
        totalFiles: 0,
        downloadedFiles: 0,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading profiles...</div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Profiles Available</h2>
          <p className="text-gray-400">Contact your server administrator to add profiles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Launch Minecraft</h1>
          <p className="text-gray-400">Select a profile and launch your game</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          title="Refresh profiles"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((item) => {
          const profile = item.profile;
          const serverKey = `${profile.serverAddress}:${profile.serverPort}`;
          const serverStatus = serverStatuses[serverKey];

          const tags = (profile.tags as string[]) || [];

          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ 
                scale: 1.02,
                y: -2,
              }}
              onClick={() => navigate(`/server/${profile.id}`)}
              className="glass-card rounded-xl p-6 cursor-pointer transition-all relative overflow-hidden group"
              style={{ willChange: 'transform' }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/20 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              
              {/* Arrow icon - appears on hover */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="absolute top-4 right-4 z-10"
              >
                <ArrowRight 
                  size={24} 
                  className="text-primary-400 group-hover:text-primary-300 transition-colors" 
                />
              </motion.div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-8">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary-300 transition-colors">
                      {profile.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map((tag) => (
                        <ServerBadge key={tag} type={tag} />
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-4">Minecraft {profile.version}</p>
                
                {/* Client Status */}
                <div className="w-full mb-3 px-4 py-2 bg-white/5 rounded-lg flex items-center justify-center gap-2 text-sm">
                  {clientReady[profile.version] ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-400 font-medium">Client Ready</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-gray-400">Client Not Downloaded</span>
                    </>
                  )}
                </div>
                
                {/* Server Status */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    {serverStatus ? (
                      <>
                        {serverStatus.online ? (
                          <Wifi className="text-green-500" size={16} />
                        ) : (
                          <WifiOff className="text-red-500" size={16} />
                        )}
                        <span className={`text-xs font-medium ${serverStatus.online ? 'text-green-400' : 'text-red-400'}`}>
                          {serverStatus.online 
                            ? `Online ${serverStatus.players?.online || 0}` 
                            : 'Offline'}
                        </span>
                        {serverStatus.online && serverStatus.ping !== undefined && serverStatus.ping !== null && serverStatus.ping > 0 && (
                          <span className="text-xs text-gray-500">
                            {serverStatus.ping}ms
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-500">Checking...</span>
                      </>
                    )}
                  </div>
                  {serverStatus?.online && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Users size={14} />
                      <span>
                        {serverStatus.players?.online || 0}/{serverStatus.players?.max || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Game Logs Modal */}
      <GameLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        logs={gameLogs}
      />
      
      <DownloadProgressModal
        isOpen={showDownloadModal}
        onClose={() => {
          setShowDownloadModal(false);
          setDownloadProgress(null);
          setDownloadingVersion(null);
        }}
        progress={downloadProgress}
      />
    </div>
  );
}
