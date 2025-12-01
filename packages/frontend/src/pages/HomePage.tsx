/**
 * Home Page - Main launcher interface
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { Play, Download, AlertCircle, Terminal, Wifi, WifiOff, Users, Loader2, ArrowRight, HardDrive, Gauge, Server } from 'lucide-react';
import { profilesAPI } from '../api/profiles';
import { serversAPI } from '../api/servers';
import { downloadsAPI } from '../api/downloads';
import { crashesAPI } from '../api/crashes';
import { statisticsAPI } from '../api/statistics';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import GameLogsModal from '../components/GameLogsModal';
import DownloadProgressModal from '../components/DownloadProgressModal';
import ServerBadge from '../components/ServerBadge';
import { useDownloadProgress, useClientDownload } from '../hooks/useWebSocket';
import { ServerStatus, UpdateProgress } from '@modern-launcher/shared';
import { createNotification, checkClientUpdates } from '../services/notificationService';
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

export default function HomePage() {
  const navigate = useNavigate();
  const { playerProfile, accessToken, isAdmin } = useAuthStore();
  const { selectedProfile, ram, width, height, fullScreen, autoEnter, javaPath, workingDir } = useSettingsStore();
  const { t } = useTranslation();
  const { getAnimationProps, shouldAnimate } = useOptimizedAnimation();
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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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

    const handleExit = async (code: number) => {
      console.log('Game exited with code:', code);
      setGameLogs(prev => [...prev.slice(-49), `[EXIT] Game exited with code ${code}`]);
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
            setGameLogs(prev => [...prev, `[STATS] Session ended: Exit code ${code}`]);
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
          setGameLogs(prev => [...prev, `[STATS] Error ending session: ${error.message || 'Unknown error'}`]);
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
      if (!selectedProfileData) return;
      
      try {
        await crashesAPI.logConnectionIssue({
          serverAddress: selectedProfileData.profile.serverAddress,
          serverPort: selectedProfileData.profile.serverPort,
          issueType: issueData.type || 'UNKNOWN',
          errorMessage: issueData.message,
          logOutput: issueData.message,
          profileId: selectedProfileData.profile.id,
          profileVersion: selectedProfileData.profile.version,
          username: playerProfile?.username,
        });
        console.log('Connection issue logged successfully');
      } catch (error) {
        console.error('Failed to log connection issue:', error);
      }
    };

    window.electronAPI.onGameLog(handleLog);
    window.electronAPI.onGameError(handleError);
    window.electronAPI.onGameExit(handleExit);
    window.electronAPI.onGameCrash(handleCrash);
    window.electronAPI.onGameConnectionIssue(handleConnectionIssue);

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

  // Store previous server statuses to detect changes
  const previousServerStatusesRef = React.useRef<Record<string, ServerStatus>>({});

  // Fetch server statuses for all profiles
  React.useEffect(() => {
    if (!profiles) return;

    const fetchStatuses = async () => {
      const statusPromises = profiles.map(async (item) => {
        const profile = item.profile;
        const serverKey = `${profile.serverAddress}:${profile.serverPort}`;
        try {
          const status = await serversAPI.getServerStatus(profile.serverAddress, profile.serverPort);
          
          // Check for status changes and create notifications
          const previousStatus = previousServerStatusesRef.current[serverKey];
          if (previousStatus && previousStatus.online !== status.online) {
            // Server status changed
            const profileName = profile.title || profile.name || `${profile.serverAddress}:${profile.serverPort}`;
            await createNotification({
              type: 'SERVER_STATUS_CHANGE',
              title: status.online ? t('server.serverOnline') : t('server.serverOffline'),
              message: status.online 
                ? `${profileName} is now online (${status.players?.online || 0} players)`
                : `${profileName} is now offline`,
              data: {
                profileId: profile.id,
                serverAddress: profile.serverAddress,
                serverPort: profile.serverPort,
                previousStatus: previousStatus.online,
                currentStatus: status.online,
              },
            });
          }
          
          return { key: serverKey, status };
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
      
      // Update previous statuses
      previousServerStatusesRef.current = statusMap;
      setServerStatuses(statusMap);
    };

    fetchStatuses();

    // Refresh statuses every 30 seconds
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, [profiles]);

  const selectedProfileData = profiles?.find(p => p.profile.id === selectedProfile);

  // Check client files for all profiles when they are loaded
  React.useEffect(() => {
    if (!profiles || !window.electronAPI) return;

    const checkAllProfiles = async () => {
      const versionsToCheck = profiles.map(p => p.profile.version);
      const checkedVersions = new Set(Object.keys(clientReady));
      
      for (const version of versionsToCheck) {
        // Проверяем только если еще не проверяли
        if (!checkedVersions.has(version)) {
          const ready = await checkClientFiles(version);
          setClientReady(prev => ({ ...prev, [version]: ready }));
          
          // Check for client updates if files are ready
          if (ready) {
            await checkClientUpdates(version);
          }
        }
      }
    };

    checkAllProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]);

  // Check client files when profile is selected (only check, don't auto-download)
  React.useEffect(() => {
    if (selectedProfileData && clientReady[selectedProfileData.profile.version] === undefined) {
      const version = selectedProfileData.profile.version;
      checkClientFiles(version).then((ready) => {
        setClientReady(prev => ({ ...prev, [version]: ready }));
        // Only check files, don't auto-download
        // Download will start only when user clicks "Play" button
      });
    }
  }, [selectedProfileData?.profile.version]);

  const handleLaunch = async () => {
    if (!selectedProfileData || !playerProfile) return;

    const profile = selectedProfileData.profile;
    
    console.log('[Launch] Starting launch process for version:', profile.version);
    
    // Проверить наличие файлов клиента
    setCheckingFiles(true);
    setLaunchError(null);
    
    console.log('[Launch] Checking client files...');
    const filesReady = await checkClientFiles(profile.version);
    console.log('[Launch] Client files ready:', filesReady);
    setCheckingFiles(false);
    
    if (!filesReady) {
      console.log('[Launch] Files not ready, starting download...');
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
          
          setClientReady(prev => ({ ...prev, [profile.version]: true }));
          
          setTimeout(async () => {
            setShowDownloadModal(false);
            setDownloadProgress(null);
            setDownloadingVersion(null);
            await launchGame();
          }, 1000);
          
          return;
        }

        // Локальных файлов нет - пытаемся загрузить с сервера
        console.log('[Download] Getting version info from server...');
        let versionId: string;
        try {
          const versionInfo = await downloadsAPI.getClientVersionByVersion(profile.version);
          if (!versionInfo.data) {
            throw new Error('Version not found on server');
          }
          versionId = versionInfo.data.id;
          console.log('[Download] Version ID:', versionId);
        } catch (error: any) {
          console.error('[Download] Failed to get version info:', error);
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

        // Получить список файлов и начать загрузку
        const versionInfo = await downloadsAPI.getClientVersionByVersion(profile.version);
        if (!versionInfo.data) {
          throw new Error('Version info not found');
        }

        const files = versionInfo.data.files;
        console.log('[Download] Files to download:', files.length);
        setDownloadProgress(prev => prev ? {
          ...prev,
          totalFiles: files.length,
          currentFile: 'Preparing download...',
        } : null);

        // Используем уже объявленные переменные updatesDirBase и updatesDir из начала блока try
        console.log('[Download] Updates directory:', updatesDir);

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
        const downloadPromises: Array<{ promise: Promise<void | { error: string; filePath: string }>; index: number }> = [];
        
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
          } else if (result.status === 'fulfilled') {
            const value = result.value;
            if (value !== undefined && value !== null && typeof value === 'object' && 'error' in value) {
              errors.push({ filePath: (value as { error: string; filePath: string }).filePath, error: (value as { error: string; filePath: string }).error });
            }
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
              
              // Прочитать index.json через HTTP запрос (так как readFile может быть недоступен)
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
      
      // Build launch arguments
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

      // Launch via Electron IPC
      // classPath will be resolved in main process
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
        setGameLogs(prev => [...prev, `[INFO] Game launched successfully! PID: ${result.pid}`]);
        setLaunchError(null); // Clear any previous errors
        
        // Логировать запуск игры в статистике
        console.log('[Statistics] Attempting to log game launch...', {
          hasAccessToken: !!accessToken,
          hasPlayerProfile: !!playerProfile,
          profileId: profile.id,
        });
        
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
            osVersion: null, // Можно добавить позже
          });
          
          if (launchResult.success && launchResult.data) {
            setCurrentSessionId(launchResult.data.sessionId);
            console.log('[Statistics] ✅ Game launch logged successfully:', launchResult.data);
            setGameLogs(prev => [...prev, `[STATS] Launch logged: Session ${launchResult.data.sessionId}`]);
          } else {
            console.warn('[Statistics] ⚠️ Failed to log game launch:', launchResult);
            setGameLogs(prev => [...prev, `[STATS] Warning: Failed to log launch`]);
          }
        } catch (error: any) {
          console.error('[Statistics] ❌ Error logging game launch:', error);
          console.error('[Statistics] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          setGameLogs(prev => [...prev, `[STATS] Error: ${error.message || 'Failed to log launch'}`]);
          // Не блокируем запуск игры, если логирование не удалось
        }
        
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
      console.log(`[ClientCheck] Starting check for version: ${version}`);
      
      // Найти профиль по версии, чтобы получить clientDirectory и assetIndex
      const profile = profiles?.find(p => p.profile.version === version);
      if (!profile) {
        console.warn(`[ClientCheck] Profile not found for version ${version}`);
        return false;
      }
      
      const clientDir = profile.profile.clientDirectory || version;
      const assetIndex = profile.profile.assetIndex;
      
      console.log(`[ClientCheck] Using clientDir: ${clientDir}, assetIndex: ${assetIndex}`);
      
      // Получить правильный путь к updates директории
      const updatesDirBase = await window.electronAPI.getUpdatesDir();
      const clientFilesDir = `${updatesDirBase}/${clientDir}`;
      const assetsDir = `${updatesDirBase}/assets/${assetIndex}`;

      console.log(`[ClientCheck] Checking clientFilesDir: ${clientFilesDir}`);

      // Проверить client.jar - это обязательный файл
      const clientJarPath = `${clientFilesDir}/client.jar`;
      console.log(`[ClientCheck] Checking client.jar at: ${clientJarPath}`);
      const clientJarExists = await window.electronAPI.fileExists(clientJarPath);
      
      if (!clientJarExists) {
        console.log(`[ClientCheck] ❌ client.jar not found for version ${version} at ${clientJarPath}`);
        return false;
      }
      
      console.log(`[ClientCheck] ✓ client.jar found`);

      // Проверка хеша client.jar отключена - проверяем только существование

      // Проверить assets - должны быть скачаны
      if (assetIndex) {
        const assetIndexFile = `${assetsDir}/index.json`;
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
        versionInfo = await downloadsAPI.getClientVersionByVersion(version);
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
          // Если есть отсутствующие файлы, но client.jar есть, всё равно считаем клиент готовым
          // (файлы могут быть загружены позже или не критичны для запуска)
          console.log(`[ClientCheck] ⚠️ Some files missing, but client.jar exists - considering ready`);
          return true;
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
          // Использовать clientDirectory из профиля, если доступен
          const profile = profiles?.find(p => p.profile.version === version);
          const clientDir = profile?.profile.clientDirectory || version;
          const updatesDir = `${updatesDirBase}/${clientDir}`;
          const clientJarPath = `${updatesDir}/client.jar`;
          console.log(`[ClientCheck] Version not in DB, checking local client.jar at: ${clientJarPath}`);
          const exists = await window.electronAPI.fileExists(clientJarPath);
          if (exists) {
            console.log(`[ClientCheck] ✅ Version ${version} not in DB, but found local client.jar in ${clientDir}`);
            // Если client.jar найден, считаем клиент готовым (для обратной совместимости)
            return true;
          }
          console.log(`[ClientCheck] ❌ client.jar not found at: ${clientJarPath}`);
          return false;
        } catch (err) {
          console.error('[ClientCheck] Error in fallback check:', err);
          return false;
        }
      }
      // Only log unexpected errors
      console.error('[ClientCheck] ❌ Unexpected error checking client files:', error);
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

      // Получить путь к updates директории (используем ту же логику, что и при проверке)
      const updatesDirBase = await window.electronAPI.getUpdatesDir();
      const updatesDir = `${updatesDirBase}/${version}`;

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
        // Get base URL without /api suffix
        const baseUrl = API_CONFIG.baseUrlWithoutApi;
        const fileUrl = `${baseUrl}/api/client-versions/${versionId}/file/${file.filePath}`;

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
        }, accessToken || undefined);

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
      <div className="space-y-xl">
        {/* Header Skeleton */}
        <div className="space-y-sm">
          <div className="h-10 w-64 bg-gray-700/50 rounded-lg animate-pulse" />
          <div className="h-6 w-96 bg-gray-700/30 rounded-lg animate-pulse" />
        </div>

        {/* Server Cards Skeleton */}
        <section aria-label="Loading servers">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-base lg:gap-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                transition={getAnimationProps({ duration: 0.3, delay: shouldAnimate ? i * 0.05 : 0 })}
              >
                <div className="bg-surface-elevated/90 border border-white/15 rounded-2xl p-lg space-y-base">
                  <div className="flex items-start justify-between pb-lg border-b border-white/10">
                    <div className="space-y-sm flex-1">
                      <div className="h-6 w-3/4 bg-gray-700/50 rounded-lg animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-700/30 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-6 w-16 bg-gray-700/50 rounded-lg animate-pulse" />
                  </div>
                  <div className="flex gap-sm pb-lg border-b border-white/10">
                    <div className="h-6 w-16 bg-gray-700/50 rounded-lg animate-pulse" />
                    <div className="h-6 w-16 bg-gray-700/50 rounded-lg animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
                    <div className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between pt-sm">
                    <div className="h-4 w-20 bg-gray-700/30 rounded-lg animate-pulse" />
                    <div className="h-4 w-16 bg-gray-700/30 rounded-lg animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-heading leading-tight mb-2">{t('server.noProfilesAvailable')}</h2>
          <p className="text-body-muted leading-relaxed">{t('server.contactAdmin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      {/* Header Section - Premium Design */}
      <motion.section
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.3 })}
        className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-8 lg:p-10 border border-white/10 shadow-lg backdrop-blur-sm"
        style={{ marginBottom: '48px' }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
        
        <div className="relative z-10 flex items-start gap-6 lg:gap-8">
          {/* Icon */}
          <motion.div
            initial={shouldAnimate ? { scale: 0, rotate: -180 } : false}
            animate={shouldAnimate ? { scale: 1, rotate: 0 } : false}
            transition={getAnimationProps({ duration: 0.5, delay: 0.1 })}
            className="flex-shrink-0 p-4 lg:p-5 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-2xl border border-primary-500/30 shadow-lg shadow-primary-500/10"
            whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
          >
            <Play size={32} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3 lg:space-y-4">
            <motion.h1
              initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
              transition={getAnimationProps({ duration: 0.4, delay: 0.2 })}
              className="text-4xl lg:text-5xl font-black text-heading leading-tight tracking-tight bg-gradient-to-r from-white via-white to-white/90 bg-clip-text"
            >
              {t('server.title')}
            </motion.h1>
            <motion.p
              initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
              transition={getAnimationProps({ duration: 0.4, delay: 0.3 })}
              className="text-body-muted text-lg lg:text-xl leading-relaxed max-w-2xl"
            >
              {t('server.selectProfile')}
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Servers Grid Section */}
      <section aria-label="Available servers">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-base lg:gap-lg">
        {profiles.map((item) => {
          const profile = item.profile;
          const serverKey = `${profile.serverAddress}:${profile.serverPort}`;
          const serverStatus = serverStatuses[serverKey];

          const tags = (profile.tags as string[]) || [];
          const isClientReady = clientReady[profile.version];
          const playerCount = serverStatus?.players?.online ?? 0;
          const maxPlayers = serverStatus?.players?.max ?? 0;
          const pingValue = serverStatus?.ping && serverStatus.ping > 0 ? `${serverStatus.ping}ms` : '--';

          return (
            <motion.article
              key={profile.id}
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              whileHover={shouldAnimate ? { y: -6, scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              transition={getAnimationProps({ duration: 0.3 })}
              onClick={() => navigate(`/server/${profile.id}`)}
              className="relative overflow-hidden rounded-2xl border border-white/15 bg-surface-elevated/90 p-6 cursor-pointer transition-all duration-300 group hover:border-primary-500/60 hover:shadow-xl hover:shadow-primary-500/20 backdrop-blur-sm"
            >
              {/* Premium Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Animated Border Glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/20 via-primary-400/20 to-primary-500/20 blur-xl" />
              </div>
              
              {/* Header Section */}
              <header className="relative z-10 mb-5 pb-5 border-b border-white/10">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-heading leading-tight group-hover:text-primary-400 transition-colors duration-300 mb-1.5">
                      {profile.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-body-muted">
                      <Server size={14} className="text-body-subtle" />
                      <span className="leading-normal truncate">
                        {profile.serverAddress}:{profile.serverPort}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    whileHover={shouldAnimate ? { x: 4 } : undefined}
                    transition={getAnimationProps({ duration: 0.2 })}
                  >
                    <ArrowRight 
                      size={20} 
                      className="text-body-subtle group-hover:text-primary-400 transition-colors duration-300 flex-shrink-0 mt-1" 
                    />
                  </motion.div>
                </div>

                {/* Tags and Version */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <ServerBadge key={tag} type={tag} />
                      ))}
                    </div>
                  )}
                </div>
              </header>

              {/* Status Section */}
              <div className="relative z-10 mb-5 pb-5 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="px-2.5 py-1.5 rounded-lg bg-surface-base/50 border border-white/5 text-body-muted hover:bg-surface-base/70 hover:border-white/10 transition-all duration-200 text-sm font-semibold">
                    {isClientReady ? t('server.clientDownloaded') : t('server.clientNotDownloaded')}
                  </div>
                  <motion.div 
                    className="flex items-center gap-2 text-sm"
                    whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                  >
                    {serverStatus ? (
                      serverStatus.online ? (
                        <Wifi className="text-success-400" size={16} />
                      ) : (
                        <WifiOff className="text-error-400" size={16} />
                      )
                    ) : (
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span className={`font-semibold ${serverStatus?.online ? 'text-success-400' : serverStatus ? 'text-error-400' : 'text-body-muted'}`}>
                      {serverStatus
                        ? serverStatus.online
                          ? t('server.online')
                          : t('server.offline')
                        : t('common.loading')}
                    </span>
                  </motion.div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.div 
                    className="bg-gradient-to-br from-surface-base/80 to-surface-elevated/60 border border-white/10 rounded-xl p-4 hover:border-primary-500/30 transition-all duration-300 group/stat"
                    whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30 group-hover/stat:bg-primary-500/30 transition-colors">
                        <Users size={14} className="text-primary-400" />
                      </div>
                      <p className="text-xs text-body-subtle uppercase tracking-wide font-semibold">{t('server.players')}</p>
                    </div>
                    <p className="text-lg font-bold text-heading leading-tight">
                      {serverStatus ? `${playerCount}/${maxPlayers || '∞'}` : '--'}
                    </p>
                  </motion.div>

                  <motion.div 
                    className="bg-gradient-to-br from-surface-base/80 to-surface-elevated/60 border border-white/10 rounded-xl p-4 hover:border-primary-500/30 transition-all duration-300 group/stat"
                    whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30 group-hover/stat:bg-primary-500/30 transition-colors">
                        <Gauge size={14} className="text-primary-400" />
                      </div>
                      <p className="text-xs text-body-subtle uppercase tracking-wide font-semibold">{t('server.ping')}</p>
                    </div>
                    <p className="text-lg font-bold text-heading leading-tight">{pingValue}</p>
                  </motion.div>
                </div>
              </div>

              {/* Footer Section */}
              <footer className="relative z-10 flex items-center justify-between text-sm pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-base/50 border border-white/5 text-body-muted hover:bg-surface-base/70 hover:border-white/10 transition-all duration-200">
                    <HardDrive size={14} className="text-body-subtle" />
                    <span className="font-medium">Java {profile.jvmVersion || '8'}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-base/50 border border-white/5 text-body-muted hover:bg-surface-base/70 hover:border-white/10 transition-all duration-200">
                    <span className="font-medium">{profile.version}</span>
                  </div>
                </div>
                <motion.div 
                  className="flex items-center gap-1.5 text-primary-400 font-semibold group-hover:gap-2 transition-all duration-300"
                  whileHover={shouldAnimate ? { x: 2 } : undefined}
                >
                  <span>{t('common.details')}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </motion.div>
              </footer>
            </motion.article>
          );
        })}
        </div>
      </section>

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

