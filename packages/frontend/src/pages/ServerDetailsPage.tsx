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
  Info,
  AlertCircle,
  Loader2,
  Users,
  Activity,
  Cpu,
  Monitor,
  RefreshCw,
  Settings as SettingsIcon,
  Crown
} from 'lucide-react';
import { profilesAPI } from '../api/profiles';
import { serversAPI } from '../api/servers';
import { downloadsAPI } from '../api/downloads';
import { crashesAPI } from '../api/crashes';
import { statisticsAPI } from '../api/statistics';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import ServerBadge from '../components/ServerBadge';
import DownloadProgressModal from '../components/DownloadProgressModal';
import ServerStatusChart from '../components/ServerStatusChart';
import { ServerStatus, UpdateProgress } from '@modern-launcher/shared';
import { useTranslation } from '../hooks/useTranslation';
import { API_CONFIG } from '../config/api';
// Simple path join function for browser (replaces Node.js path.join)
const joinPath = (...parts: string[]): string => {
  return parts
    .filter(Boolean)
    .map(part => part.replace(/[/\\]+$/, '').replace(/^[/\\]+/, ''))
    .join('/')
    .replace(/\\/g, '/');
};

export default function ServerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playerProfile, accessToken } = useAuthStore();
  const { selectedProfile, ram, width, height, fullScreen, autoEnter, javaPath, workingDir, updateSettings } = useSettingsStore();
  const { t } = useTranslation();
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [checkingFiles, setCheckingFiles] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingVersion, setDownloadingVersion] = useState<string | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<number | null>(null);

  const { data: profileData, isLoading, isError, error } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profilesAPI.getProfile(id!),
    enabled: !!id,
  });

  // Get profile safely - use null if not available
  const profile = profileData?.profile || null;
  const profileId = profile?.id || null;
  const economyConfig = profile?.economyConfig as any;
  const economyEnabled = Boolean(economyConfig && economyConfig.enabled !== false);

  const { 
    data: serverStatus, 
    error: serverStatusError,
    isFetching: isFetchingStatus,
    refetch: refetchServerStatus
  } = useQuery({
    queryKey: ['serverStatus', profile?.serverAddress, profile?.serverPort],
    queryFn: async () => {
      try {
        if (!profile) {
          throw new Error('Profile data is not available');
        }
        return await serversAPI.getServerStatus(
          profile.serverAddress,
          profile.serverPort
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
    enabled: !!profile,
    refetchInterval: 5000, // Обновлять каждые 5 секунд
    retry: 2, // Retry twice on failure
    staleTime: 0, // Always consider data stale
  });

  React.useEffect(() => {
    if (serverStatus) {
      setLastStatusUpdate(Date.now());
    }
  }, [serverStatus]);

  // Economy leaderboard query - must be before early return to maintain hook order
  const {
    data: economyLeaderboard,
    isLoading: isEconomyLoading,
    isError: isEconomyError,
    refetch: refetchEconomy,
  } = useQuery({
    queryKey: ['economyLeaderboard', profileId],
    queryFn: async () => {
      if (!profileId) {
        return {
          players: [],
          currencySymbol: '',
          precision: 0,
          limit: 0,
          lastUpdated: new Date().toISOString(),
        };
      }
      try {
        return await profilesAPI.getEconomyLeaderboard(profileId);
      } catch (error: any) {
        console.error('[EconomyLeaderboard] Failed to fetch leaderboard:', error);
        // Return empty leaderboard on error instead of throwing
        return {
          players: [],
          currencySymbol: '',
          precision: 0,
          limit: 0,
          lastUpdated: new Date().toISOString(),
        };
      }
    },
    enabled: economyEnabled && !!profileId,
    staleTime: 60000,
    retry: false, // Don't retry on error to avoid blocking page load
  });

  // formatBalance hook - must be before early return to maintain hook order
  const formatBalance = React.useCallback(
    (value: number) => {
      const precision = economyLeaderboard?.precision ?? 0;
      const formatter = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
      const formatted = formatter.format(value ?? 0);
      return economyLeaderboard?.currencySymbol
        ? `${formatted} ${economyLeaderboard.currencySymbol}`
        : formatted;
    },
    [economyLeaderboard?.precision, economyLeaderboard?.currencySymbol]
  );

  const leaderboardPlayers = economyLeaderboard?.players ?? [];

  // Check if client files are downloaded
  const checkClientFiles = async (version: string): Promise<boolean> => {
    try {
      // Найти профиль по версии, чтобы получить clientDirectory и assetIndex
      if (!profileData?.profile) {
        console.warn(`[ClientCheck] Profile not found for version ${version}`);
        return false;
      }
      
      const profile = profileData.profile;
      const clientDir = profile.clientDirectory || version;
      const assetIndex = profile.assetIndex;
      
      // Получить правильный путь к updates директории
      const updatesDirBase = await window.electronAPI.getUpdatesDir();
      const clientFilesDir = `${updatesDirBase}/${clientDir}`;
      const assetsDir = `${updatesDirBase}/assets/${assetIndex}`;

      // Проверить client.jar
      const clientJarPath = `${clientFilesDir}/client.jar`;
      const clientJarExists = await window.electronAPI.fileExists(clientJarPath);
      
      if (!clientJarExists) {
        console.log(`[ClientCheck] client.jar not found for version ${version}`);
        return false;
      }

      // Проверка хеша client.jar отключена - проверяем только существование

      // Проверить assets - должны быть скачаны
      if (assetIndex) {
        const assetIndexFile = `${assetsDir}/index.json`;
        let assetsReady = false;
        
        if (await window.electronAPI.fileExists(assetIndexFile)) {
          try {
            const assetIndexContent = await window.electronAPI.readFile(assetIndexFile);
            const assetIndexData = JSON.parse(assetIndexContent);
            if (assetIndexData.objects && Object.keys(assetIndexData.objects).length > 0) {
              // Проверить, что хотя бы несколько asset файлов существуют
              const assetEntries = Object.entries(assetIndexData.objects);
              let foundAssets = 0;
              const checkCount = Math.min(10, assetEntries.length); // Проверить первые 10 assets
              
              for (let i = 0; i < checkCount; i++) {
                const [assetPath, assetInfo]: [string, any] = assetEntries[i] as [string, any];
                const hash = assetInfo.hash;
                const hashPrefix = hash.substring(0, 2);
                const assetFilePath = `${assetsDir}/objects/${hashPrefix}/${hash}`;
                if (await window.electronAPI.fileExists(assetFilePath)) {
                  foundAssets++;
                }
              }
              
              // Если найдено хотя бы 50% проверенных assets, считаем assets готовыми
              assetsReady = foundAssets >= checkCount * 0.5;
            }
          } catch (e) {
            console.warn('[ClientCheck] Failed to parse asset index:', e);
          }
        }
        
        if (!assetsReady) {
          console.log(`[ClientCheck] Assets not ready for version ${version} (assetIndex: ${assetIndex})`);
          return false;
        }
      }

      // Если локальных файлов нет, пытаемся получить информацию с сервера для проверки всех файлов
      const versionInfo = await downloadsAPI.getClientVersionByVersion(version);
      
      // Если версия есть в БД и есть список файлов - проверяем все файлы
      if (versionInfo.data && versionInfo.data.files && versionInfo.data.files.length > 0) {
        const files = versionInfo.data.files;
        
        // Проверить каждый файл клиента (не assets, они проверены выше)
        for (const file of files) {
          // Пропустить assets, они проверены отдельно
          if (file.type === 'asset') continue;
          
          const destPath = `${clientFilesDir}/${file.filePath}`;
          
          try {
            const exists = await window.electronAPI.fileExists(destPath);
            if (!exists) {
              console.log(`[ClientCheck] File not found: ${file.filePath}`);
              return false;
            }
            
            // Проверка хеша отключена - проверяем только существование файла
          } catch (error) {
            console.warn(`[ClientCheck] Error checking file ${file.filePath}:`, error);
            return false;
          }
        }
      }

      console.log(`[ClientCheck] All files ready for version ${version}`);
      return true;
    } catch (error: any) {
      // Don't log 404 errors as they're expected when version is not in database
      if (error.response?.status === 404) {
        // Version not found in database - check local files directly
        try {
          const updatesDirBase = await window.electronAPI.getUpdatesDir();
          const clientDir = profileData?.profile?.clientDirectory || version;
          const updatesDir = `${updatesDirBase}/${clientDir}`;
          const clientJarPath = `${updatesDir}/client.jar`;
          const exists = await window.electronAPI.fileExists(clientJarPath);
          if (exists) {
            console.log(`[ClientCheck] Version ${version} not in DB, but found local client.jar`);
          }
          return exists;
        } catch {
          return false;
        }
      }
      // Only log unexpected errors
      console.error('Error checking client files:', error);
      return false;
    }
  };

  // Check client files when profile is loaded
  React.useEffect(() => {
    if (profileData?.profile?.version) {
      checkClientFiles(profileData.profile.version).then(ready => {
        setClientReady(ready);
      });
    }
  }, [profileData?.profile?.version]);

  // Listen to game exit events
  React.useEffect(() => {
    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.warn('electronAPI is not available. Preload script may not have loaded.');
      return;
    }

    const handleExit = async (code: number) => {
      console.log('Game exited with code:', code);
      setLaunching(false);
      
          // Завершить сессию игры в статистике
          if (currentSessionId) {
            try {
              console.log('[Statistics] Ending game session...', {
                sessionId: currentSessionId,
                exitCode: code,
                crashed: code !== 0 && code !== null,
              });
              
              const result = await statisticsAPI.endGameSession({
                sessionId: currentSessionId,
                exitCode: code,
                crashed: code !== 0 && code !== null,
              });
              
              if (result.success) {
                console.log('[Statistics] ✅ Game session ended successfully');
              } else {
                console.warn('[Statistics] ⚠️ Failed to end game session:', result);
              }
              
              setCurrentSessionId(null);
            } catch (error: any) {
              console.error('[Statistics] ❌ Error ending game session:', error);
              console.error('[Statistics] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
              });
            }
          } else {
            console.warn('[Statistics] ⚠️ No session ID available to end session');
          }
      
      if (code !== 0 && code !== null) {
        setLaunchError(`Game exited with code ${code}. Check logs for details.`);
      } else {
        // Clear error on successful exit
        setLaunchError(null);
      }
    };

    const handleError = (error: string) => {
      console.error('Game error:', error);
      setLaunchError(error);
    };

    const handleCrash = async (crashData: any) => {
      console.error('Game crashed:', crashData);
      try {
        await crashesAPI.logCrash(crashData);
        console.log('Crash logged successfully');
      } catch (error) {
        console.error('Failed to log crash:', error);
      }
    };

    const handleConnectionIssue = async (issueData: any) => {
      console.error('Connection issue detected:', issueData);
      if (!profileData?.profile) return;
      
      try {
        await crashesAPI.logConnectionIssue({
          serverAddress: profileData.profile.serverAddress,
          serverPort: profileData.profile.serverPort,
          issueType: issueData.type || 'UNKNOWN',
          errorMessage: issueData.message,
          logOutput: issueData.message,
          profileId: profileData.profile.id,
          profileVersion: profileData.profile.version,
          username: playerProfile?.username,
        });
        console.log('Connection issue logged successfully');
      } catch (error) {
        console.error('Failed to log connection issue:', error);
      }
    };

    window.electronAPI.onGameExit(handleExit);
    window.electronAPI.onGameError(handleError);
    window.electronAPI.onGameCrash(handleCrash);
    window.electronAPI.onGameConnectionIssue(handleConnectionIssue);

    return () => {
      // Cleanup listeners if needed
      // Note: ipcRenderer.removeListener would be needed, but preload doesn't expose it
      // The listeners will be cleaned up when component unmounts
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#6b8e23] animate-spin mx-auto mb-4" />
          <div className="text-white">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto bg-[#1b1b1b]/90 border border-red-500/30 rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('errors.serverError')}</h2>
          <p className="text-gray-400 text-sm">
            {t('server.failedToLoadDetails') || 'Не удалось загрузить детали сервера. Попробуйте обновить страницу или выбрать другой профиль.'}
          </p>
          <p className="text-xs text-gray-500 break-all">
            {(error as Error)?.message || String(error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#6b8e23] hover:bg-[#7a9f35] text-white rounded-lg transition-colors"
          >
            {t('common.retry') || 'Повторить'}
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t('errors.notFound')}</h2>
          <p className="text-gray-400 mb-4">{t('server.notFound')}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#6b8e23] hover:bg-[#7a9f35] text-white rounded-lg transition-colors"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  if (!profileData.profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto bg-[#1b1b1b]/90 border border-red-500/30 rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('errors.serverError')}</h2>
          <p className="text-gray-400 text-sm">
            {t('server.failedToLoadDetails') || 'Не удалось загрузить детали сервера. Профиль не найден в ответе сервера.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#6b8e23] hover:bg-[#7a9f35] text-white rounded-lg transition-colors"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  // Use the profile that was already defined before early return
  // profile is already defined at line 66, so we don't redefine it here
  const tags = (profile?.tags as string[]) || [];
  const onlinePlayers = serverStatus?.players?.online ?? 0;
  const maxPlayers = serverStatus?.players?.max ?? 0;
  const ping = serverStatus?.ping ?? 0;
  const javaRequirement = profile?.jvmVersion || '8';
  const StatusIcon = (serverStatus?.online ?? false) ? Wifi : WifiOff;
  const statusLabel = (serverStatus?.online ?? false) ? t('server.serverOnline') : t('server.serverOffline');
  const lastCheckedLabel = lastStatusUpdate ? new Date(lastStatusUpdate).toLocaleTimeString() : t('common.loading');
  const resolutionLabel = `${width}x${height}`;

  const statusCards = [
    {
      key: 'players',
      label: t('server.players'),
      value: maxPlayers ? `${onlinePlayers}/${maxPlayers}` : `${onlinePlayers}`,
      icon: Users,
    },
    {
      key: 'ping',
      label: t('server.ping'),
      value: serverStatus ? `${ping} ms` : '—',
      icon: Activity,
    },
    {
      key: 'lastChecked',
      label: t('server.lastChecked'),
      value: lastCheckedLabel,
      icon: Clock,
    },
    {
      key: 'java',
      label: t('server.javaRequirement'),
      value: `Java ${javaRequirement}`,
      icon: Cpu,
    },
  ];

  // formatBalance and leaderboardPlayers are already defined before early return
  // Don't redefine them here to avoid hook order violation

  const launchPreferences = [
    {
      key: 'ram',
      label: t('settings.ram'),
      value: `${ram} MB`,
      icon: Cpu,
    },
    {
      key: 'resolution',
      label: t('settings.resolution'),
      value: resolutionLabel,
      icon: Monitor,
    },
    {
      key: 'fullscreen',
      label: t('settings.fullScreen'),
      value: fullScreen ? t('common.yes') : t('common.no'),
      icon: Monitor,
    },
    {
      key: 'autoEnter',
      label: t('settings.autoEnter'),
      value: autoEnter ? t('common.yes') : t('common.no'),
      icon: SettingsIcon,
    },
  ];

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
        // Сначала проверяем, есть ли локальные файлы
        // Используем clientDirectory из профиля, если он есть, иначе fallback на version
        const clientDir = profile.clientDirectory || profile.version;
        const updatesDirBase = await window.electronAPI.getUpdatesDir();
        const updatesDir = `${updatesDirBase}/${clientDir}`;
        const clientJarPath = `${updatesDir}/client.jar`;
        const hasLocalFiles = await window.electronAPI.fileExists(clientJarPath);

        if (hasLocalFiles) {
          // Локальные файлы найдены - используем их без загрузки
          console.log(`[Download] Found local files for version ${profile.version}, skipping download`);
          setDownloadProgress(prev => prev ? {
            ...prev,
            stage: 'complete',
            progress: 100,
            currentFile: 'Local files found, ready to launch!',
            totalFiles: 1,
            downloadedFiles: 1,
          } : null);
          
          setClientReady(true);
          
          setTimeout(async () => {
            setShowDownloadModal(false);
            setDownloadProgress(null);
            setDownloadingVersion(null);
            await launchGame();
          }, 1000);
          
          return;
        }

        // Локальных файлов нет - пытаемся загрузить с сервера
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
            currentFile: `Error: Version ${profile.version} not found on server and no local files available. Please contact administrator.`,
            totalFiles: 0,
            downloadedFiles: 0,
          });
          setLaunchError(`Version ${profile.version} not found on server and no local files available. Please contact administrator.`);
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

        // Параллельная загрузка файлов с ограничением количества одновременных загрузок
        const MAX_CONCURRENT_DOWNLOADS = 2; // Консервативное значение для стабильности
        const baseUrl = API_CONFIG.baseUrlWithoutApi;
        
        // Функция для загрузки одного файла
        const downloadSingleFile = async (file: any, index: number): Promise<void> => {
          const destPath = `${updatesDir}/${file.filePath}`;
          const fileDir = destPath.substring(0, Math.max(destPath.lastIndexOf('/'), destPath.lastIndexOf('\\')));
          
          // Создать директорию
          if (fileDir) {
            try {
              await window.electronAPI.ensureDir(fileDir);
            } catch {
              // Ignore errors
            }
          }

          // Простая проверка существования файла (без проверки хеша)
          try {
            const exists = await window.electronAPI.fileExists(destPath);
            if (exists) {
              // Файл уже существует - пропустить загрузку
              console.log(`[Download] File ${file.filePath} already exists, skipping download.`);
              const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;
              setDownloadProgress(prev => prev ? {
                ...prev,
                progress: ((index + 1) / files.length) * 100,
                currentFile: fileName,
                downloadedFiles: index + 1,
              } : null);
              return;
            }
          } catch (error: any) {
            // Ошибка при проверке - попробуем скачать
            console.warn(`[Download] Error checking file ${file.filePath}, will try to download:`, error.message);
          }

          const fileUrl = `${baseUrl}/api/client-versions/${versionId}/file?path=${encodeURIComponent(file.filePath)}`;
          const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;
          
          setDownloadProgress(prev => prev ? {
            ...prev,
            currentFile: fileName,
          } : null);

          await window.electronAPI.downloadFile(fileUrl, destPath, (progress) => {
            // Обновить прогресс для текущего файла
            const fileProgress = ((index + progress / 100) / files.length) * 100;
            setDownloadProgress(prev => prev ? {
              ...prev,
              progress: fileProgress,
              downloadedFiles: index + (progress === 100 ? 1 : 0),
            } : null);
          }, accessToken || undefined);

          // Простая проверка существования файла после загрузки (без проверки хеша)
          await new Promise(resolve => setTimeout(resolve, 200)); // Задержка для синхронизации

          // Проверить, что файл был создан
          let fileExists = false;
          let attempts = 0;
          const maxAttempts = 5;
          
          while (attempts < maxAttempts && !fileExists) {
            try {
              fileExists = await window.electronAPI.fileExists(destPath);
              if (fileExists) {
                break;
              }
            } catch (error: any) {
              // Игнорируем ошибки проверки
            }
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }

          if (!fileExists) {
            throw new Error(`File was not created after download: ${file.filePath}`);
          }
          
          console.log(`[Download] ✓ File ${file.filePath} downloaded successfully.`);
        };

        // Загрузить файлы параллельно с ограничением
        const downloadPromises: Array<{ promise: Promise<void>; index: number }> = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Если достигли лимита параллельных загрузок, ждем завершения одной
          if (downloadPromises.length >= MAX_CONCURRENT_DOWNLOADS) {
            // Ждем завершения первой загрузки из очереди
            const completed = await Promise.race(
              downloadPromises.map(item => item.promise.then(() => item.index).catch(() => item.index))
            );
            // Удалить завершенный промис
            const index = downloadPromises.findIndex(item => item.index === completed);
            if (index !== -1) {
              downloadPromises.splice(index, 1);
            }
          }
          
          // Добавить новую загрузку в очередь
          const downloadPromise = downloadSingleFile(file, i)
            .catch((error) => {
              console.error(`[Download] Failed to download ${file.filePath}:`, error);
              // Возвращаем ошибку вместо выброса, чтобы продолжить загрузку остальных файлов
              return { error: error.message || String(error), filePath: file.filePath };
            });
          
          downloadPromises.push({ promise: downloadPromise, index: i });
        }
        
        // Дождаться завершения всех оставшихся загрузок
        const results = await Promise.allSettled(downloadPromises.map(item => item.promise));
        
        // Проверить, есть ли ошибки
        const errors: Array<{ filePath: string; error: string }> = [];
        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            errors.push({ filePath: files[idx]?.filePath || 'unknown', error: result.reason?.message || String(result.reason) });
          } else if (result.value && typeof result.value === 'object' && 'error' in result.value) {
            errors.push({ filePath: (result.value as any).filePath, error: (result.value as any).error });
          }
        });
        
        if (errors.length > 0) {
          console.error(`[Download] ${errors.length} file(s) failed to download:`, errors);
          // Показать предупреждение, но продолжить
          setDownloadProgress(prev => prev ? {
            ...prev,
            currentFile: `Warning: ${errors.length} file(s) failed. Check console for details.`,
          } : null);
          
          // Если критичные файлы (client.jar) не скачались - выбросить ошибку
          const criticalErrors = errors.filter(e => e.filePath === 'client.jar');
          if (criticalErrors.length > 0) {
            throw new Error(`Critical file client.jar failed to download: ${criticalErrors[0].error}`);
          }
        }

        // Скачать assets после скачивания файлов клиента
        if (profile.assetIndex) {
          setDownloadProgress(prev => prev ? {
            ...prev,
            currentFile: 'Downloading assets...',
          } : null);
          
          try {
            const assetsDir = `${updatesDirBase}/assets/${profile.assetIndex}`;
            const assetsIndexPath = `${assetsDir}/index.json`;
            
            // Проверить, есть ли уже assets
            const assetsExist = await window.electronAPI.fileExists(assetsIndexPath);
            
            if (!assetsExist) {
              // Скачать assets через API
              const baseUrl = API_CONFIG.baseUrlWithoutApi;
              const assetsUrl = `${baseUrl}/api/updates/${profile.id}/asset/file?path=index.json`;
              
              // Создать директорию для assets
              await window.electronAPI.ensureDir(assetsDir).catch(() => {});
              
              // Скачать index.json
              await window.electronAPI.downloadFile(assetsUrl, assetsIndexPath, () => {}, accessToken);
              
              // Прочитать index.json через HTTP запрос
              const indexResponse = await fetch(assetsUrl, {
                headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
              });
              const indexContent = await indexResponse.text();
              const assetIndex = JSON.parse(indexContent);
              const objects = assetIndex.objects || {};
              const assetEntries = Object.entries(objects);
              
              setDownloadProgress(prev => prev ? {
                ...prev,
                currentFile: `Downloading ${assetEntries.length} assets...`,
                totalFiles: files.length + assetEntries.length,
              } : null);
              
              let downloadedAssets = 0;
              for (const [assetPath, assetInfo] of assetEntries) {
                const asset = assetInfo as any;
                const hash = asset.hash;
                const hashPrefix = hash.substring(0, 2);
                const assetFilePath = `${assetsDir}/objects/${hashPrefix}/${hash}`;
                
                // Проверить, существует ли файл
                const assetExists = await window.electronAPI.fileExists(assetFilePath);
                if (!assetExists) {
                  // Скачать asset
                  const assetFileUrl = `${baseUrl}/api/updates/${profile.id}/asset/file?path=objects/${hashPrefix}/${hash}`;
                  const assetDir = assetFilePath.substring(0, Math.max(assetFilePath.lastIndexOf('/'), assetFilePath.lastIndexOf('\\')));
                  await window.electronAPI.ensureDir(assetDir).catch(() => {});
                  await window.electronAPI.downloadFile(assetFileUrl, assetFilePath, () => {}, accessToken);
                }
                
                downloadedAssets++;
                if (downloadedAssets % 100 === 0) {
                  setDownloadProgress(prev => prev ? {
                    ...prev,
                    currentFile: `Downloaded ${downloadedAssets}/${assetEntries.length} assets...`,
                    downloadedFiles: files.length + downloadedAssets,
                    progress: ((files.length + downloadedAssets) / (files.length + assetEntries.length)) * 100,
                  } : null);
                }
              }
            }
          } catch (error: any) {
            console.warn('[Download] Failed to download assets:', error);
            // Не прерываем загрузку, если assets не скачались
          }
        }

        // Завершение загрузки - проверить, что все файлы действительно скачаны
        setDownloadProgress(prev => prev ? {
          ...prev,
          stage: 'verifying',
          progress: 95,
          currentFile: 'Verifying downloaded files...',
        } : null);
        
        // Финальная проверка всех файлов перед запуском
        const finalCheck = await checkClientFiles(profile.version);
        if (!finalCheck) {
          setDownloadProgress(prev => prev ? {
            ...prev,
            stage: 'complete',
            progress: 0,
            currentFile: 'Error: Some files are missing. Please try downloading again.',
            downloadedFiles: 0,
          } : null);
          setLaunchError('Some files failed to download. Please try again.');
          return;
        }
        
        // Все файлы проверены и готовы
        setDownloadProgress(prev => prev ? {
          ...prev,
          stage: 'complete',
          progress: 100,
          currentFile: 'Download complete! All files verified. Client ready!',
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
      
      // Get Java version requirement - use profile.jvmVersion first, then try ClientVersion, then default
      let jvmVersion = profile.jvmVersion || '8'; // Use profile jvmVersion first
      
      // If not set in profile, try to get from ClientVersion
      if (!profile.jvmVersion) {
        try {
          const versionInfo = await downloadsAPI.getClientVersionByVersion(profile.version);
          if (versionInfo.data?.jvmVersion) {
            jvmVersion = versionInfo.data.jvmVersion;
          }
        } catch (error) {
          console.warn('Failed to get ClientVersion info, using default Java 8');
        }
      }
      
      // LaunchWrapper requires Java 8 exactly - cannot use Java 9+
      // Check if mainClass is LaunchWrapper (old Forge for 1.12.2)
      if (profile.mainClass === 'net.minecraft.launchwrapper.Launch') {
        jvmVersion = '8';
        console.log('[Launch] LaunchWrapper detected - forcing Java 8 (LaunchWrapper does not work with Java 9+)');
        if (profile.jvmVersion && profile.jvmVersion !== '8') {
          console.warn(`[Launch] WARNING: Profile has jvmVersion=${profile.jvmVersion}, but LaunchWrapper requires Java 8. Using Java 8.`);
        }
      } else if (!profile.jvmVersion && profile.version.startsWith('1.12') && profile.tags?.includes('FORGE')) {
        // For Minecraft 1.12.2 and below with Forge, default to Java 8 if not specified
        jvmVersion = '8';
        console.log('[Launch] Defaulting to Java 8 for Minecraft 1.12.2 with Forge (no jvmVersion in profile)');
      }
      
      const jvmArgs = [
        `-Xms${ram}M`,
        `-Xmx${ram}M`,
        ...profile.jvmArgs,
      ];

      // Get updates directory for variable replacement
      const updatesDirBase = await window.electronAPI.getUpdatesDir();
      const clientDir = profile.clientDirectory || profile.version;
      const gameDir = joinPath(updatesDirBase, clientDir);
      const assetsDir = joinPath(updatesDirBase, 'assets', profile.assetIndex);

      // Function to replace variables in clientArgs
      const replaceVariables = (arg: string): string => {
        return arg
          .replace(/\$\{username\}/g, playerProfile.username)
          .replace(/\$\{uuid\}/g, playerProfile.uuid)
          .replace(/\$\{accessToken\}/g, accessToken || '')
          .replace(/\$\{gameDir\}/g, gameDir)
          .replace(/\$\{assetsDir\}/g, assetsDir)
          .replace(/\$\{serverAddress\}/g, profile.serverAddress)
          .replace(/\$\{serverPort\}/g, profile.serverPort.toString())
          .replace(/\$\{version\}/g, profile.version)
          .replace(/\$\{version_name\}/g, profile.version)
          .replace(/\$\{game_directory\}/g, gameDir)
          .replace(/\$\{assets_root\}/g, assetsDir)
          .replace(/\$\{assets_index_name\}/g, profile.assetIndex)
          .replace(/\$\{auth_player_name\}/g, playerProfile.username)
          .replace(/\$\{auth_uuid\}/g, playerProfile.uuid)
          .replace(/\$\{auth_access_token\}/g, accessToken || '')
          .replace(/\$\{user_type\}/g, 'mojang');
      };

      // Filter out duplicate arguments from clientArgs that we're adding explicitly
      // These arguments are dynamically set by the launcher and should not be in clientArgs
      // IMPORTANT: Do NOT filter --tweakClass as it's required for Forge!
      const duplicateArgs = new Set(['--version', '--username', '--uuid', '--accessToken', '--width', '--height', '--server', '--port', '--fullscreen', '--userType', '--userProperties', '--gameDir', '--assetsDir', '--assetIndex']);
      const filteredClientArgs: string[] = [];
      
      for (let i = 0; i < profile.clientArgs.length; i++) {
        const arg = profile.clientArgs[i];
        // Skip if this argument is in our duplicate list
        if (duplicateArgs.has(arg)) {
          // Skip the next argument too (it's the value for this flag)
          i++; // Skip next iteration
          continue;
        }
        // Also skip arguments that start with these flags (case-insensitive)
        const argLower = arg.toLowerCase();
        if (argLower.startsWith('--version') || 
            argLower.startsWith('--username') || 
            argLower.startsWith('--uuid') || 
            argLower.startsWith('--accesstoken') ||
            argLower.startsWith('--width') ||
            argLower.startsWith('--height') ||
            argLower.startsWith('--server') ||
            argLower.startsWith('--port') ||
            argLower.startsWith('--fullscreen') ||
            argLower.startsWith('--usertype') ||
            argLower.startsWith('--userproperties') ||
            argLower.startsWith('--gamedir') ||
            argLower.startsWith('--assetsdir') ||
            argLower.startsWith('--assetindex')) {
          // Skip this argument and its value if it's the next one
          if (i + 1 < profile.clientArgs.length && !profile.clientArgs[i + 1].startsWith('--')) {
            i++; // Skip next iteration (the value)
          }
          continue;
        }
        // Replace variables in the argument
        const replacedArg = replaceVariables(arg);
        filteredClientArgs.push(replacedArg);
      }

      // Log clientArgs for debugging Forge issues
      if (profile.mainClass === 'net.minecraft.launchwrapper.Launch') {
        console.log('[Launch] Forge LaunchWrapper detected - checking arguments:');
        console.log('[Launch] Original clientArgs:', profile.clientArgs);
        console.log('[Launch] Filtered clientArgs:', filteredClientArgs);
        const hasTweakClass = filteredClientArgs.includes('--tweakClass');
        console.log('[Launch] Has --tweakClass:', hasTweakClass);
        if (!hasTweakClass) {
          console.warn('[Launch] ⚠️  WARNING: --tweakClass is missing! Adding it automatically for Forge.');
          // Automatically add --tweakClass for Forge LaunchWrapper
          filteredClientArgs.push('--tweakClass', 'net.minecraftforge.fml.common.launcher.FMLTweaker');
        }
      }

      const gameArgs = [
        '--username', playerProfile.username,
        '--uuid', playerProfile.uuid,
        '--accessToken', accessToken || '',
        '--version', profile.version,
        '--width', width.toString(),
        '--height', height.toString(),
        ...filteredClientArgs,
      ];

      if (fullScreen) {
        gameArgs.push('--fullscreen', 'true');
      }

      if (autoEnter) {
        gameArgs.push('--server', profile.serverAddress);
        gameArgs.push('--port', profile.serverPort.toString());
      }

      // clientDir is already declared above for variable replacement
      
      const result = await window.electronAPI.launchGame({
        javaPath,
        jvmArgs,
        mainClass: profile.mainClass,
        classPath: profile.classPath,
        gameArgs,
        workingDir,
        version: profile.version,
        clientDirectory: clientDir, // Pass clientDirectory for file lookup
        jvmVersion,
        profileId: profile.id,
        serverAddress: profile.serverAddress,
        serverPort: profile.serverPort,
        userId: playerProfile?.uuid,
        username: playerProfile?.username,
      });

      if (result.success) {
        console.log('Game launched successfully, PID:', result.pid);
        setLaunchError(null);
        
        // Логировать запуск игры в статистике
        try {
          // Determine OS platform (process.platform is not available in renderer)
          let osPlatform: string | null = null;
          if (window.electronAPI) {
            // In Electron, we can get OS info from main process if needed
            // For now, use navigator or set to null
            const userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.includes('win')) osPlatform = 'win32';
            else if (userAgent.includes('mac')) osPlatform = 'darwin';
            else if (userAgent.includes('linux')) osPlatform = 'linux';
          }
          
          console.log('[Statistics] Creating game launch record...', {
            profileId: profile.id,
            profileVersion: profile.version,
            serverAddress: profile.serverAddress,
            serverPort: profile.serverPort,
          });
          
          const launchResult = await statisticsAPI.createGameLaunch({
            profileId: profile.id,
            profileVersion: profile.version,
            serverAddress: profile.serverAddress,
            serverPort: profile.serverPort,
            javaVersion: jvmVersion,
            javaPath: javaPath,
            ram: ram,
            resolution: `${width}x${height}`,
            fullScreen: fullScreen,
            autoEnter: autoEnter,
            os: osPlatform,
            osVersion: null,
          });
          
          if (launchResult.success && launchResult.data) {
            setCurrentSessionId(launchResult.data.sessionId);
            console.log('[Statistics] ✅ Game launch logged successfully:', launchResult.data);
          } else {
            console.warn('[Statistics] ⚠️ Failed to log game launch:', launchResult);
          }
        } catch (error: any) {
          console.error('[Statistics] ❌ Error logging game launch:', error);
          console.error('[Statistics] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          // Не блокируем запуск игры, если логирование не удалось
        }
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
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1e1e] via-[#1a1a1a] to-[#111] p-8 border border-[#3d3d3d]/50"
      >
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="p-2.5 border border-white/10 rounded-xl bg-black/20 hover:bg-black/40 transition-colors"
              title={t('common.back')}
            >
              <ArrowLeft size={18} className="text-gray-200" />
            </motion.button>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${serverStatus?.online ? 'text-green-300 border-green-500/40 bg-green-500/10' : 'text-red-300 border-red-500/40 bg-red-500/10'}`}>
              <StatusIcon size={14} />
              {statusLabel}
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Minecraft {profile.version}
            </span>
          </div>

          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              {profile.title}
            </h1>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {tags.map(tag => (
                  <ServerBadge key={tag} type={tag} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-[#2f2f2f] bg-[#151515]/80 p-5 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-[#1f1f1f] border border-[#2f2f2f]">
                  <Icon size={18} className="text-[#7fb640]" />
                </div>
                <span className="text-xs uppercase tracking-[0.25em] text-gray-500">
                  {card.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-white mt-4">{card.value}</p>
            </motion.div>
          );
        })}
      </motion.section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-[#1b1b1b]/90 rounded-3xl p-8 border border-[#2f2f2f]"
          >
            <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#242424] rounded-2xl border border-[#2f2f2f]">
                  <Info size={22} className="text-[#7fb640]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('server.description')}</h2>
                  <p className="text-sm text-gray-500">{t('server.thisServerSelected')}</p>
                </div>
              </div>
              {profile.description ? (
                <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                  {profile.description}
                </p>
              ) : (
                <div className="text-center py-10 rounded-2xl border border-dashed border-[#2f2f2f] bg-black/10">
                  <Info size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">{t('server.noDescription')}</p>
                  <p className="text-gray-500 text-sm mt-2">{t('server.addDescription')}</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-[#1b1b1b]/90 rounded-3xl p-6 border border-[#2f2f2f]"
          >
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#242424] rounded-2xl border border-[#2f2f2f]">
                    <Server size={20} className="text-[#7fb640]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('server.connectionHealth')}</h2>
                    <p className="text-sm text-gray-500">
                      {t('server.lastChecked')}: {lastCheckedLabel}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => refetchServerStatus()}
                  disabled={isFetchingStatus}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-[#2f2f2f] text-gray-300 hover:text-white hover:border-[#7fb640]/60 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isFetchingStatus ? 'animate-spin' : ''} />
                  {t('server.refreshStatus')}
                </button>
              </div>
              <ServerStatusChart 
                status={serverStatus} 
                isLoading={!serverStatus}
                serverAddress={profile?.serverAddress}
                serverPort={profile?.serverPort}
              />
              {serverStatusError && (
                <div className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {t('errors.serverError')}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden bg-[#1b1b1b]/90 rounded-3xl p-6 border border-[#2f2f2f] space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#242424] rounded-2xl border border-[#2f2f2f]">
                <Play size={18} className="text-[#7fb640]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('server.quickLaunch')}</h2>
                <p className="text-sm text-gray-500">{t('server.launchGame')}</p>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="w-full px-4 py-3 bg-[#111111] rounded-2xl flex items-center justify-between border border-[#2f2f2f]"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${clientReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                <span className={clientReady ? 'text-green-300 font-medium' : 'text-yellow-300 font-medium'}>
                  {clientReady ? t('server.clientReady') : t('server.clientNotDownloaded')}
                </span>
              </div>
              <Clock size={16} className="text-gray-500" />
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLaunch}
              disabled={launching || checkingFiles || !playerProfile || downloadingVersion === profile.version}
              className="relative w-full px-6 py-4 bg-gradient-to-r from-[#78b73b] to-[#4a7a20] text-white font-bold rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#7fb640]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden group border border-[#7fb640]/40 shadow-lg shadow-[#618f2a]/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
              {checkingFiles ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{t('server.checkingFiles')}</span>
                </>
              ) : downloadingVersion === profile.version ? (
                <>
                  <Download className="animate-bounce" size={20} />
                  <span>{t('server.downloading')}</span>
                </>
              ) : launching ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{t('server.launching')}</span>
                </>
              ) : clientReady ? (
                <>
                  <Play size={20} />
                  <span>{t('server.launchGame')}</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>{t('server.downloadAndLaunch')}</span>
                </>
              )}
            </motion.button>

            {launchError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/40 rounded-2xl text-red-200 text-sm"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{launchError}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden bg-[#1b1b1b]/90 rounded-3xl p-6 border border-[#2f2f2f] space-y-5"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#242424] rounded-2xl border border-[#2f2f2f]">
                  <Crown size={18} className="text-[#facc15]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t('server.economyTitle')}</h3>
                  <p className="text-sm text-gray-500">{t('server.economySubtitle')}</p>
                </div>
              </div>
              {economyEnabled && (
                <button
                  onClick={() => refetchEconomy()}
                  disabled={isEconomyLoading}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-[#2f2f2f] text-gray-300 hover:text-white hover:border-[#7fb640]/60 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isEconomyLoading ? 'animate-spin' : ''} />
                  {t('server.economyRefresh')}
                </button>
              )}
            </div>

            {!economyEnabled ? (
              <div className="p-5 rounded-2xl border border-dashed border-[#2f2f2f] text-center text-sm text-gray-500 bg-[#111111]/60">
                {t('server.economyDisabled')}
              </div>
            ) : isEconomyLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-12 rounded-2xl bg-[#111]/60 border border-[#2f2f2f] animate-pulse" />
                ))}
              </div>
            ) : isEconomyError ? (
              <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-sm text-red-200 flex items-center gap-2">
                <AlertCircle size={16} />
                {t('server.economyError')}
              </div>
            ) : leaderboardPlayers.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-[#2f2f2f] text-center text-sm text-gray-500 bg-[#111111]/60">
                {t('server.economyEmpty')}
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboardPlayers.map(player => (
                  <div
                    key={`${player.rank}-${player.username}`}
                    className="flex items-center justify-between bg-[#111] rounded-2xl border border-[#2f2f2f] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-[#1f1f1f] border border-[#2f2f2f] text-white font-bold flex items-center justify-center">
                        {player.rank}
                      </span>
                      <div>
                        <p className="text-white font-semibold">{player.username}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{t('server.economyPlayer')}</p>
                      </div>
                    </div>
                    <p className="text-[#7fb640] font-bold text-lg font-mono">
                      {formatBalance(player.balance)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden bg-[#1b1b1b]/90 rounded-3xl p-6 border border-[#2f2f2f] space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#242424] rounded-2xl border border-[#2f2f2f]">
                <SettingsIcon size={18} className="text-[#7fb640]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t('server.launchPreferences')}</h3>
                <p className="text-sm text-gray-500">{t('server.launchPreferencesHint')}</p>
              </div>
            </div>
            <div className="space-y-4">
              {launchPreferences.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between bg-[#111] rounded-2xl border border-[#2f2f2f] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#1f1f1f] border border-[#2f2f2f]">
                        <Icon size={16} className="text-[#7fb640]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{item.label}</p>
                        <p className="text-white text-sm">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

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

