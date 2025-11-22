/**
 * Server Details Page
 * Детальная информация о выбранном сервере
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  Download, 
  Wifi, 
  WifiOff, 
  Server, 
  Clock, 
  Package,
  Info,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { profilesAPI } from '../api/profiles';
import { serversAPI } from '../api/servers';
import { downloadsAPI } from '../api/downloads';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import ServerBadge from '../components/ServerBadge';
import DownloadProgressModal from '../components/DownloadProgressModal';
import ServerStatusChart from '../components/ServerStatusChart';
import { ServerStatus, UpdateProgress } from '@modern-launcher/shared';

export default function ServerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playerProfile, accessToken } = useAuthStore();
  const { selectedProfile, ram, width, height, fullScreen, autoEnter, javaPath, workingDir, updateSettings } = useSettingsStore();
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [checkingFiles, setCheckingFiles] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingVersion, setDownloadingVersion] = useState<string | null>(null);
  const [clientReady, setClientReady] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profilesAPI.getProfile(id!),
    enabled: !!id,
  });

  const { data: serverStatus, error: serverStatusError } = useQuery({
    queryKey: ['serverStatus', profileData?.profile.serverAddress, profileData?.profile.serverPort],
    queryFn: async () => {
      try {
        return await serversAPI.getServerStatus(
          profileData!.profile.serverAddress,
          profileData!.profile.serverPort
        );
      } catch (error) {
        console.error('Failed to get server status:', error);
        // Return offline status on error
        return {
          online: false,
          players: { online: 0, max: 0 },
          version: '',
          motd: '',
          ping: 0,
        } as ServerStatus;
      }
    },
    enabled: !!profileData,
    refetchInterval: 5000, // Обновлять каждые 5 секунд
    retry: 2, // Retry twice on failure
    staleTime: 0, // Always consider data stale
  });

  // Check if client files are downloaded
  const checkClientFiles = async (version: string): Promise<boolean> => {
    try {
      const versionInfo = await downloadsAPI.getClientVersionByVersion(version);
      if (!versionInfo.data) {
        return false;
      }

      const files = versionInfo.data.files;
      if (files.length === 0) {
        return false;
      }

      const appPaths = await window.electronAPI.getAppPaths();
      const updatesDir = `${appPaths.userData}/updates/${version}`;

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

  // Check client files when profile is loaded
  React.useEffect(() => {
    if (profileData) {
      checkClientFiles(profileData.profile.version).then(ready => {
        setClientReady(ready);
      });
    }
  }, [profileData?.profile.version]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <div className="text-white">Loading server information...</div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Server Not Found</h2>
          <p className="text-gray-400 mb-4">The server you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const profile = profileData.profile;
  const tags = (profile.tags as string[]) || [];

  const handleLaunch = async () => {
    if (!profileData || !playerProfile || !window.electronAPI) {
      setLaunchError('Electron API is not available');
      return;
    }

    const profile = profileData.profile;
    
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

        const appPaths = await window.electronAPI.getAppPaths();
        const updatesDir = `${appPaths.userData}/updates/${profile.version}`;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const destPath = `${updatesDir}/${file.filePath}`;

          try {
            const exists = await window.electronAPI.fileExists(destPath);
            if (exists) {
              const hash = await window.electronAPI.calculateFileHash(destPath, 'sha256');
              if (hash === file.fileHash) {
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

          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7240';
          const fileUrl = `${apiUrl}/api/client-versions/${versionId}/file/${file.filePath}`;

          const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;
          setDownloadProgress(prev => prev ? {
            ...prev,
            currentFile: fileName,
          } : null);

          await window.electronAPI.downloadFile(fileUrl, destPath, (progress) => {
            const fileProgress = ((i + progress / 100) / files.length) * 100;
            setDownloadProgress(prev => prev ? {
              ...prev,
              progress: fileProgress,
              downloadedFiles: i + (progress === 100 ? 1 : 0),
            } : null);
          });

          const hash = await window.electronAPI.calculateFileHash(destPath, 'sha256');
          if (hash !== file.fileHash) {
            throw new Error(`Hash mismatch for ${file.filePath}`);
          }
        }

        setDownloadProgress(prev => prev ? {
          ...prev,
          stage: 'complete',
          progress: 100,
          currentFile: 'Download complete! Client ready. Enjoy the game!',
          downloadedFiles: files.length,
        } : null);
        
        setClientReady(true);
        
        setTimeout(async () => {
          setShowDownloadModal(false);
          setDownloadProgress(null);
          setDownloadingVersion(null);
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
    setClientReady(true);
    await launchGame();
  };

  // Launch game function
  const launchGame = async () => {
    if (!profileData || !playerProfile || !window.electronAPI) return;

    setLaunching(true);
    setLaunchError(null);

    try {
      const profile = profileData.profile;
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
        setLaunchError(null);
      } else {
        setLaunchError(result.error || 'Failed to launch game');
        setLaunching(false);
      }
    } catch (error: any) {
      setLaunchError(error.message || 'An error occurred');
      setLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600/20 via-primary-500/10 to-purple-600/20 p-6 border border-primary-500/30"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-transparent to-purple-600/10 animate-pulse" />
        
        <div className="relative flex items-start gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/20 rounded-lg transition-all hover:scale-110 mt-1 backdrop-blur-sm"
            title="Go Back"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-primary-100 to-purple-200 bg-clip-text text-transparent">
                {profile.title}
              </h1>
              <div className="flex gap-2 flex-wrap">
                {tags.map((tag) => (
                  <ServerBadge key={tag} type={tag} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Server Description Card - занимает 3 колонки */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden glass rounded-2xl p-8 h-full border border-white/10 bg-gradient-to-br from-gray-900/50 to-gray-800/50"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-transparent to-purple-600/10 animate-pulse" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-500/20 rounded-xl">
                  <Info size={24} className="text-primary-400" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-primary-100 to-purple-200 bg-clip-text text-transparent">
                  Описание сервера
                </h2>
              </div>
              
              {profile.description ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
                    {profile.description}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center"
                >
                  <Info size={48} className="text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 italic text-lg">Описание сервера отсутствует</p>
                  <p className="text-gray-500 text-sm mt-2">Добавьте описание для этого сервера в настройках</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar - занимает 2 колонки */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Launch Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden glass rounded-2xl p-6 space-y-4 border border-white/10 bg-gradient-to-br from-gray-900/50 to-gray-800/50"
          >
            {/* Animated background gradient */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
            
            <div className="relative">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Play size={20} className="text-green-400" />
                </div>
                Quick Launch
              </h2>
              {selectedProfile === profile.id && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-sm px-3 py-2 bg-primary-500/20 border border-primary-500/50 rounded-lg mb-3 backdrop-blur-sm"
                >
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                  <span className="text-primary-300 font-medium">This server is selected</span>
                </motion.div>
              )}
            </div>
            
            {selectedProfile !== profile.id && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateSettings({ selectedProfile: profile.id })}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-lg border border-primary-500/30"
              >
                Select This Server
              </motion.button>
            )}
            
            {/* Client Status */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="w-full px-4 py-3 bg-white/5 rounded-xl flex items-center justify-center gap-2 text-sm border border-white/10 backdrop-blur-sm"
            >
              {clientReady ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                  <span className="text-green-400 font-medium">Client Ready</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" />
                  <span className="text-yellow-400 font-medium">Client Not Downloaded</span>
                </>
              )}
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLaunch}
              disabled={launching || checkingFiles || !playerProfile || downloadingVersion === profile.version}
              className="relative w-full px-6 py-5 bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:via-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-2xl shadow-green-500/30 overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {checkingFiles ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Checking Files...</span>
                </>
              ) : downloadingVersion === profile.version ? (
                <>
                  <Download className="animate-bounce" size={24} />
                  <span>Downloading...</span>
                </>
              ) : launching ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Launching...</span>
                </>
              ) : clientReady ? (
                <>
                  <Play size={24} />
                  <span>Launch Game</span>
                </>
              ) : (
                <>
                  <Download size={24} />
                  <span>Download & Launch</span>
                </>
              )}
            </motion.button>
            {launchError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{launchError}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Server Status Card - полностью графический */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden glass rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-gray-900/50 to-gray-800/50"
          >
            {/* Animated glow effect */}
            {serverStatus?.online && (
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
            )}
            
            {/* Header */}
            <div className="relative flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="p-2 bg-primary-500/20 rounded-lg">
                  <Server size={20} className="text-primary-400" />
                </div>
                Server Status
              </h2>
            </div>

            {/* Графический компонент статуса */}
            <ServerStatusChart 
              status={serverStatus} 
              isLoading={!serverStatus}
              serverAddress={profile?.serverAddress}
              serverPort={profile?.serverPort}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Download Progress Modal */}
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

