/**
 * Server Details Page
 * Детальная информация о выбранном сервере
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useProfile, useEconomyLeaderboard, useServerStatus } from '../hooks/api';
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
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { useFormatDate } from '../hooks/useFormatDate';
import { useFormatNumber } from '../hooks/useFormatNumber';
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
  const { getAnimationProps, shouldAnimate } = useOptimizedAnimation();
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [checkingFiles, setCheckingFiles] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingVersion, setDownloadingVersion] = useState<string | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<number | null>(null);

  const { data: profileData, isLoading, isError, error } = useProfile(id, {
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
  } = useServerStatus(
    profile?.serverAddress || null,
    profile?.serverPort || 25565,
    {
      enabled: !!profile,
      refetchInterval: 5000, // Обновлять каждые 5 секунд
    }
  );

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
  } = useEconomyLeaderboard(profileId, {
    enabled: !!profileId && economyEnabled,
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
      const assetsRoot = `${updatesDirBase}/assets`;

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
        const assetIndexFile = `${assetsRoot}/indexes/${assetIndex}.json`;
        let assetsReady = false;
        
        const assetIndexExists = await window.electronAPI.fileExists(assetIndexFile);
        if (assetIndexExists) {
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
                const assetFilePath = `${assetsRoot}/objects/${hashPrefix}/${hash}`;
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
        } else {
          console.log(`[ClientCheck] Asset index file not found: ${assetIndexFile}, skipping assets check`);
          // Если asset index не найден, не блокируем проверку - считаем assets опциональными
          assetsReady = true;
        }
        
        // Assets проверка не блокирует, если client.jar есть - только логируем
        if (!assetsReady) {
          console.log(`[ClientCheck] ⚠️ Assets not fully ready for version ${version} (assetIndex: ${assetIndex}), but client.jar exists - continuing`);
        } else {
          console.log(`[ClientCheck] ✓ Assets ready for version ${version}`);
        }
      }

      // Пытаемся получить информацию с сервера для проверки всех файлов
      let versionInfo;
      try {
        versionInfo = await downloadsAPI.getClientVersionByVersion(version, profileData?.profile?.clientDirectory || undefined);
      } catch (error: any) {
        // Если версии нет в БД (404), это нормально - проверяем только client.jar
        if (error.response?.status === 404) {
          console.log(`[ClientCheck] Version ${version} not in DB, but client.jar exists - considering ready`);
          return true;
        }
        throw error;
      }
      
      // Если версия есть в БД и есть список файлов - проверяем все файлы
      if (versionInfo.data && versionInfo.data.files && versionInfo.data.files.length > 0) {
        const files = versionInfo.data.files;
        console.log(`[ClientCheck] Found ${files.length} files in DB to check`);
        
        let checkedFiles = 0;
        let missingFiles: string[] = [];
        
        // Проверить каждый файл клиента (не assets, они проверены выше)
        for (const file of files) {
          // Пропустить assets, они проверены отдельно
          if (file.fileType === 'asset') continue;
          
          const destPath = `${clientFilesDir}/${file.filePath}`;
          
          try {
            const exists = await window.electronAPI.fileExists(destPath);
            if (!exists) {
              console.log(`[ClientCheck] ❌ File not found: ${file.filePath}`);
              missingFiles.push(file.filePath);
              // Не возвращаем false сразу - проверим все файлы для диагностики
            } else {
              checkedFiles++;
            }
          } catch (error) {
            console.warn(`[ClientCheck] Error checking file ${file.filePath}:`, error);
            missingFiles.push(file.filePath);
          }
        }
        
        if (missingFiles.length > 0) {
          console.log(`[ClientCheck] ⚠️ Missing ${missingFiles.length} files (showing first 5):`, missingFiles.slice(0, 5));
          // Если есть отсутствующие файлы (например, новые моды), считаем клиент НЕ готовым,
          // чтобы запустить процесс догрузки недостающих файлов перед запуском игры.
          console.log(`[ClientCheck] ⚠️ Some files missing, client is NOT ready - download required`);
          return false;
        }
        
        console.log(`[ClientCheck] ✓ All ${checkedFiles} files checked and found`);
      } else {
        console.log(`[ClientCheck] No files list in DB, but client.jar exists - considering ready`);
      }

      console.log(`[ClientCheck] ✅ All files ready for version ${version}`);
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
            console.log(`[ClientCheck] Version ${version} not in DB, but found local client.jar in ${clientDir}`);
            // Если client.jar найден, считаем клиент готовым (для обратной совместимости)
            return true;
          }
          return false;
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
            // Session ID not available - this is normal if session wasn't created during launch
            // (e.g., if statistics API was unavailable or user wasn't authenticated)
            console.debug('[Statistics] No session ID available to end session (session may not have been created during launch)');
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
      <div className="space-y-lg">
        {/* Header Skeleton */}
        <div className="space-y-sm">
          <div className="h-10 w-64 bg-gray-700/50 rounded-lg animate-pulse" />
          <div className="h-6 w-96 bg-gray-700/30 rounded-lg animate-pulse" />
        </div>

        {/* Server Info Skeleton */}
        <div className="bg-surface-elevated/90 border border-white/15 rounded-2xl p-lg space-y-base">
          <div className="flex items-center justify-between pb-lg border-b border-white/10">
            <div className="space-y-sm flex-1">
              <div className="h-8 w-48 bg-gray-700/50 rounded-lg animate-pulse" />
              <div className="h-5 w-32 bg-gray-700/30 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-gray-700/50 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
            <div className="h-20 bg-gray-700/30 rounded-lg animate-pulse" />
            <div className="h-20 bg-gray-700/30 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Launch Button Skeleton */}
        <div className="h-14 w-full bg-gray-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto bg-surface-elevated/90 border border-error/30 rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-heading leading-tight">{t('errors.serverError')}</h2>
          <p className="text-body-muted text-sm leading-relaxed">
            {t('server.failedToLoadDetails') || 'Не удалось загрузить детали сервера. Попробуйте обновить страницу или выбрать другой профиль.'}
          </p>
          <p className="text-xs text-body-subtle break-all leading-normal">
            {(error as Error)?.message || String(error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-lg transition-colors"
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
          <h2 className="text-2xl font-bold text-heading leading-tight mb-2">{t('errors.notFound')}</h2>
          <p className="text-body-muted leading-relaxed mb-4">{t('server.notFound')}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-lg transition-colors"
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
        <div className="text-center max-w-md mx-auto bg-surface-elevated/90 border border-error/30 rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-heading leading-tight">{t('errors.serverError')}</h2>
          <p className="text-body-muted text-sm leading-relaxed">
            {t('server.failedToLoadDetails') || 'Не удалось загрузить детали сервера. Профиль не найден в ответе сервера.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-lg transition-colors"
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
  const { formatTime } = useFormatDate();
  const lastCheckedLabel = lastStatusUpdate ? formatTime(new Date(lastStatusUpdate)) : t('common.loading');
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
      // Файлы отсутствуют или не полные — запускаем загрузку с сервера
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
        // Всегда загружаем недостающие/обновлённые файлы с сервера для этого профиля
        let versionId: string;
        try {
          const versionInfo = await downloadsAPI.getClientVersionByVersion(profile.version, profile.clientDirectory || undefined);
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

        const versionInfo = await downloadsAPI.getClientVersionByVersion(profile.version, profile.clientDirectory || undefined);
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
        const clientDirForDownload = profile.clientDirectory || undefined;
        // Базовая директория для файлов клиента на диске пользователя
        const updatesDirBase = await window.electronAPI.getUpdatesDir();
        const clientDirOnDisk = profile.clientDirectory || profile.version;
        const updatesDir = `${updatesDirBase}/${clientDirOnDisk}`;
        
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

          const fileUrl = `${baseUrl}/api/client-versions/${versionId}/file?path=${encodeURIComponent(file.filePath)}${
            clientDirForDownload ? `&clientDirectory=${encodeURIComponent(clientDirForDownload)}` : ''
          }`;
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
            // Корневая директория assets соответствует новой схеме:
            // <updatesDirBase>/assets/indexes/<assetIndex>.json
            // <updatesDirBase>/assets/objects/<hashPrefix>/<hash>
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
          const versionInfo = await downloadsAPI.getClientVersionByVersion(profile.version, profile.clientDirectory || undefined);
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
      // Рабочая директория игры = директория клиента в updates,
      // чтобы все файлы (config, saves, logs) создавались именно там
      const gameDir = joinPath(updatesDirBase, clientDir);
      // Каноничная структура assets, идентичная HomePage:
      // assets_root = <updatesDirBase>/assets
      // index: assets_root/indexes/<assetIndex>.json
      // objects: assets_root/objects/<hashPrefix>/<hash>
      const assetsRoot = joinPath(updatesDirBase, 'assets');
      const assetIndexName = profile.assetIndex;

      // Function to replace variables in clientArgs
      const replaceVariables = (arg: string): string => {
        return arg
          .replace(/\$\{username\}/g, playerProfile.username)
          .replace(/\$\{uuid\}/g, playerProfile.uuid)
          .replace(/\$\{accessToken\}/g, accessToken || '')
          .replace(/\$\{gameDir\}/g, gameDir)
          .replace(/\$\{assetsDir\}/g, assetsRoot)
          .replace(/\$\{serverAddress\}/g, profile.serverAddress)
          .replace(/\$\{serverPort\}/g, profile.serverPort.toString())
          .replace(/\$\{version\}/g, profile.version)
          .replace(/\$\{version_name\}/g, profile.version)
          .replace(/\$\{game_directory\}/g, gameDir)
          .replace(/\$\{assets_root\}/g, assetsRoot)
          .replace(/\$\{assets_index_name\}/g, assetIndexName)
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
      // ВАЖНО: передаём workingDir = gameDir, чтобы запускаться из директории клиента
      const result = await window.electronAPI.launchGame({
        javaPath,
        jvmArgs,
        mainClass: profile.mainClass,
        classPath: profile.classPath,
        gameArgs,
        workingDir: gameDir,
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
    <div className="max-w-7xl mx-auto px-base sm:px-lg lg:px-xl py-xl">
      <motion.section
        initial={shouldAnimate ? { opacity: 0, y: -20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.4 })}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-elevated via-surface-base to-background-primary p-8 lg:p-10 border border-white/10 shadow-xl"
        style={{ marginBottom: '48px' }}
      >
        {/* Premium Background Pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        
        {/* Subtle Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex flex-col gap-6 lg:gap-8">
          <div className="flex items-center gap-3 flex-wrap">
            <motion.button
              whileHover={shouldAnimate ? { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              onClick={() => navigate('/')}
              className="p-2.5 border border-white/10 rounded-xl bg-surface-base/50 hover:bg-interactive-hover-secondary transition-all duration-200 group"
              title={t('common.back')}
            >
              <ArrowLeft size={18} className="text-body-subtle group-hover:text-heading transition-colors" />
            </motion.button>
            <motion.span 
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                serverStatus?.online 
                  ? 'text-success-400 border-success-border bg-success-bg shadow-sm shadow-success-500/10' 
                  : 'text-error-400 border-error-border bg-error-bg shadow-sm shadow-error-500/10'
              }`}
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            >
              <StatusIcon size={14} />
              {statusLabel}
            </motion.span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-500/20 to-primary-600/15 border border-primary-500/40 text-primary-400 text-xs font-semibold uppercase tracking-[0.3em] shadow-sm shadow-primary-500/10">
              Minecraft {profile.version}
            </span>
          </div>

          <div className="pt-2">
            <h1 className="text-4xl lg:text-5xl font-black text-heading tracking-tight leading-tight mb-4 lg:mb-6">
              {profile.title}
            </h1>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4 lg:mt-6">
                {tags.map(tag => (
                  <ServerBadge key={tag} type={tag} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.3 })}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        style={{ 
          marginTop: '48px', 
          marginBottom: '48px', 
          gap: '32px',
          rowGap: '32px',
          columnGap: '32px'
        }}
      >
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={getAnimationProps({ duration: 0.3, delay: shouldAnimate ? index * 0.05 : 0 })}
              whileHover={shouldAnimate ? { y: -4, scale: 1.02 } : undefined}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-surface-base/90 to-surface-elevated/70 p-6 lg:p-8 backdrop-blur hover:border-primary-500/30 transition-all duration-300 group"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 flex items-center justify-between mb-5 lg:mb-6 gap-3">
                <motion.div 
                  className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/15 border border-primary-500/30 group-hover:from-primary-500/30 group-hover:to-primary-600/20 transition-all duration-300 flex-shrink-0"
                  whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
                >
                  <Icon size={18} className="text-primary-400" />
                </motion.div>
                <span className="text-xs uppercase tracking-[0.25em] text-body-subtle font-semibold text-right flex-1 min-w-0 truncate">
                  {card.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-heading leading-tight mt-5 lg:mt-6">{card.value}</p>
            </motion.div>
          );
        })}
      </motion.section>

      <div className="grid grid-cols-1 xl:grid-cols-3" style={{ marginTop: '48px', gap: '48px', rowGap: '48px', columnGap: '48px' }}>
        <div className="xl:col-span-2">
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
            transition={getAnimationProps({ duration: 0.3 })}
            className="relative overflow-hidden bg-surface-elevated/90 rounded-3xl p-8 lg:p-10 border border-white/10 shadow-lg"
            style={{ marginBottom: '32px' }}
          >
            <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
            <div className="relative">
              <div className="flex items-center gap-4 lg:gap-5 mb-8 lg:mb-10">
                <motion.div 
                  className="p-4 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-2xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                  whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
                >
                  <Info size={22} className="text-primary-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-heading leading-tight">{t('server.description')}</h2>
                  <p className="text-sm text-body-muted mt-1">{t('server.thisServerSelected')}</p>
                </div>
              </div>
              {profile.description ? (
                <p className="text-body leading-relaxed whitespace-pre-wrap">
                  {profile.description}
                </p>
              ) : (
                <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-surface-base/50">
                  <Info size={32} className="text-body-dim mx-auto mb-3" />
                  <p className="text-body-muted">{t('server.noDescription')}</p>
                  <p className="text-body-dim text-sm mt-2">{t('server.addDescription')}</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
            transition={getAnimationProps({ duration: 0.3, delay: 0.1 })}
            className="relative overflow-hidden bg-surface-elevated/90 rounded-3xl p-8 lg:p-10 border border-white/10 shadow-lg"
            style={{ marginBottom: '32px' }}
          >
            <div className="relative flex flex-col gap-5 lg:gap-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-2xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                    whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
                  >
                    <Server size={20} className="text-primary-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-heading leading-tight">{t('server.connectionHealth')}</h2>
                    <p className="text-sm text-body-muted mt-1">
                      {t('server.lastChecked')}: {lastCheckedLabel}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => refetchServerStatus()}
                  disabled={isFetchingStatus}
                  whileHover={shouldAnimate && !isFetchingStatus ? { scale: 1.05 } : undefined}
                  whileTap={shouldAnimate && !isFetchingStatus ? { scale: 0.95 } : undefined}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-white/10 bg-surface-base/50 text-body-muted hover:text-heading hover:border-primary-500/60 hover:bg-interactive-hover-secondary disabled:opacity-50 transition-all duration-200"
                >
                  <RefreshCw size={16} className={isFetchingStatus ? 'animate-spin' : ''} />
                  {t('server.refreshStatus')}
                </motion.button>
              </div>
              <ServerStatusChart 
                status={serverStatus} 
                isLoading={!serverStatus}
                serverAddress={profile?.serverAddress}
                serverPort={profile?.serverPort}
              />
              {serverStatusError && (
                <motion.div 
                  initial={shouldAnimate ? { opacity: 0, y: -5 } : false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                  className="text-sm text-error-400 flex items-center gap-2 p-3 rounded-lg bg-error-bg border border-error-border"
                >
                  <AlertCircle size={16} />
                  {t('errors.serverError')}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        <div>
          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
            transition={getAnimationProps({ duration: 0.3, delay: 0.2 })}
            className="relative overflow-hidden bg-surface-elevated/90 rounded-3xl p-8 lg:p-10 border border-white/10 space-y-6 lg:space-y-8 shadow-lg"
            style={{ marginBottom: '48px' }}
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <motion.div 
                className="p-3 lg:p-4 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-2xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
              >
                <Play size={18} className="text-primary-400" />
              </motion.div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-heading leading-tight">{t('server.quickLaunch')}</h2>
                <p className="text-sm text-body-muted mt-1 lg:mt-2">{t('server.launchGame')}</p>
              </div>
            </div>

            <motion.div
              whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
              className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-br from-surface-base/80 to-surface-elevated/60 rounded-2xl flex items-center justify-between border border-white/10 hover:border-primary-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-2 text-sm">
                <motion.span 
                  className={`w-2 h-2 rounded-full ${clientReady ? 'bg-success-400 shadow-sm shadow-success-400/50' : 'bg-warning-400'}`}
                  animate={clientReady && shouldAnimate ? { scale: [1, 1.2, 1] } : false}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className={`font-semibold ${clientReady ? 'text-success-400' : 'text-warning-400'}`}>
                  {clientReady ? t('server.clientReady') : t('server.clientNotDownloaded')}
                </span>
              </div>
              <Clock size={16} className="text-body-subtle" />
            </motion.div>

            <motion.button
              whileHover={shouldAnimate && !checkingFiles && !launching ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate && !checkingFiles && !launching ? { scale: 0.98 } : undefined}
              onClick={handleLaunch}
              disabled={launching || checkingFiles || !playerProfile || downloadingVersion === profile.version}
              className="relative w-full px-7 lg:px-8 py-5 lg:py-6 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-600 text-white font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-interactive-focus-primary focus:ring-offset-2 focus:ring-offset-surface-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden group border border-primary-500/40 shadow-lg shadow-primary-500/30 hover:from-primary-600 hover:via-primary-700 hover:to-primary-700"
            >
              {shouldAnimate && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
              )}
              {checkingFiles ? (
                <>
                  <motion.div
                    animate={shouldAnimate ? { rotate: 360 } : false}
                    transition={shouldAnimate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                  >
                    <Loader2 size={20} />
                  </motion.div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{t('server.checkingFiles')}</span>
                    <span className="text-xs text-body-subtle">Verifying client files...</span>
                  </div>
                </>
              ) : downloadingVersion === profile.version ? (
                <>
                  <motion.div
                    animate={shouldAnimate ? { y: [0, -4, 0] } : false}
                    transition={shouldAnimate ? { duration: 0.6, repeat: Infinity } : {}}
                  >
                    <Download size={20} />
                  </motion.div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{t('server.downloading')}</span>
                    <span className="text-xs text-body-subtle">Preparing download...</span>
                  </div>
                </>
              ) : launching ? (
                <>
                  <motion.div
                    animate={shouldAnimate ? { rotate: 360 } : false}
                    transition={shouldAnimate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                  >
                    <Loader2 size={20} />
                  </motion.div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{t('server.launching')}</span>
                    <span className="text-xs text-body-subtle">Starting game...</span>
                  </div>
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
            initial={shouldAnimate ? { opacity: 0, x: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
            transition={getAnimationProps({ duration: 0.3, delay: 0.3 })}
            className="relative overflow-hidden bg-surface-elevated/90 rounded-3xl p-8 lg:p-10 border border-white/10 space-y-6 lg:space-y-8 shadow-lg"
            style={{ marginBottom: '48px' }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-3 bg-gradient-to-br from-warning-500/20 to-warning-600/15 rounded-2xl border border-warning-500/30 shadow-sm shadow-warning-500/10"
                  whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
                >
                  <Crown size={18} className="text-warning-400" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-heading leading-tight">{t('server.economyTitle')}</h3>
                  <p className="text-sm text-body-muted mt-1">{t('server.economySubtitle')}</p>
                </div>
              </div>
              {economyEnabled && (
                <motion.button
                  onClick={() => refetchEconomy()}
                  disabled={isEconomyLoading}
                  whileHover={shouldAnimate && !isEconomyLoading ? { scale: 1.05 } : undefined}
                  whileTap={shouldAnimate && !isEconomyLoading ? { scale: 0.95 } : undefined}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-white/10 bg-surface-base/50 text-body-muted hover:text-heading hover:border-primary-500/60 hover:bg-interactive-hover-secondary disabled:opacity-50 transition-all duration-200"
                >
                  <RefreshCw size={16} className={isEconomyLoading ? 'animate-spin' : ''} />
                  {t('server.economyRefresh')}
                </motion.button>
              )}
            </div>

            {!economyEnabled ? (
              <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-sm text-body-muted bg-surface-base/50">
                {t('server.economyDisabled')}
              </div>
            ) : isEconomyLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-12 rounded-2xl bg-surface-base/60 border border-white/10 animate-pulse" />
                ))}
              </div>
            ) : isEconomyError ? (
              <motion.div 
                initial={shouldAnimate ? { opacity: 0, y: -5 } : false}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                className="p-4 rounded-2xl border border-error-border bg-error-bg text-sm text-error-400 flex items-center gap-2"
              >
                <AlertCircle size={16} />
                {t('server.economyError')}
              </motion.div>
            ) : leaderboardPlayers.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-sm text-body-muted bg-surface-base/50">
                {t('server.economyEmpty')}
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboardPlayers.map((player, index) => (
                  <motion.div
                    key={`${player.rank}-${player.username}`}
                    initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                    animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                    transition={getAnimationProps({ duration: 0.2, delay: shouldAnimate ? index * 0.05 : 0 })}
                    whileHover={shouldAnimate ? { scale: 1.02, x: 4 } : undefined}
                    className="flex items-center justify-between bg-gradient-to-r from-surface-base/80 to-surface-elevated/60 rounded-2xl border border-white/10 hover:border-primary-500/30 px-4 lg:px-6 py-3 lg:py-4 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 lg:gap-4">
                      <span className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/15 border border-primary-500/30 text-heading font-bold flex items-center justify-center shadow-sm shadow-primary-500/10 group-hover:from-primary-500/30 group-hover:to-primary-600/20 transition-all duration-300">
                        {player.rank}
                      </span>
                      <div>
                        <p className="text-heading font-semibold lg:text-lg">{player.username}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-body-subtle">{t('server.economyPlayer')}</p>
                      </div>
                    </div>
                    <p className="text-success-400 font-bold text-lg lg:text-xl font-mono">
                      {formatBalance(player.balance)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
            transition={getAnimationProps({ duration: 0.3, delay: 0.4 })}
            className="relative overflow-hidden bg-surface-elevated/90 rounded-3xl p-8 lg:p-10 border border-white/10 space-y-6 lg:space-y-8 shadow-lg"
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <motion.div 
                className="p-3 lg:p-4 bg-gradient-to-br from-info-500/20 to-info-600/15 rounded-2xl border border-info-500/30 shadow-sm shadow-info-500/10"
                whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
              >
                <SettingsIcon size={18} className="text-info-400" />
              </motion.div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-heading leading-tight">{t('server.launchPreferences')}</h3>
                <p className="text-sm text-body-muted mt-1 lg:mt-2">{t('server.launchPreferencesHint')}</p>
              </div>
            </div>
            <div className="space-y-5 lg:space-y-6">
              {launchPreferences.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div 
                    key={item.key} 
                    initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                    animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                    transition={getAnimationProps({ duration: 0.2, delay: shouldAnimate ? index * 0.05 : 0 })}
                    whileHover={shouldAnimate ? { scale: 1.02, x: 4 } : undefined}
                    className="flex items-center justify-between bg-gradient-to-r from-surface-base/80 to-surface-elevated/60 rounded-2xl border border-white/10 hover:border-info-500/30 px-5 lg:px-7 py-4 lg:py-5 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2 lg:p-3 rounded-xl bg-gradient-to-br from-info-500/20 to-info-600/15 border border-info-500/30 group-hover:from-info-500/30 group-hover:to-info-600/20 transition-all duration-300">
                        <Icon size={16} className="text-info-400" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-body-subtle font-semibold">{item.label}</p>
                        <p className="text-heading text-sm lg:text-base font-medium">{item.value}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-xl"></div>

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


