/**
 * Home Page - Main launcher interface
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
        console.warn('[Statistics] ⚠️ No session ID available to end session');
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
      // Найти профиль по версии, чтобы получить clientDirectory и assetIndex
      const profile = profiles?.find(p => p.profile.version === version);
      if (!profile) {
        console.warn(`[ClientCheck] Profile not found for version ${version}`);
        return false;
      }
      
      const clientDir = profile.profile.clientDirectory || version;
      const assetIndex = profile.profile.assetIndex;
      
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
          const updatesDir = `${updatesDirBase}/${version}`;
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
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-300">{t('server.loadingProfiles')}</div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#6b8e23] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t('server.noProfilesAvailable')}</h2>
          <p className="text-gray-400">{t('server.contactAdmin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">{t('server.title')}</h1>
        <p className="text-gray-400">{t('server.selectProfile')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ 
                scale: 1.02,
                y: -2,
              }}
              onClick={() => navigate(`/server/${profile.id}`)}
              className="relative overflow-hidden rounded-2xl border border-[#3d3d3d]/40 bg-[#1b1b1b]/80 p-6 cursor-pointer transition-all group hover:border-[#6b8e23]/50 hover:bg-[#1f1f1f]/90 backdrop-blur-sm"
              style={{ willChange: 'transform' }}
            >
              {/* Background accents */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6b8e23]/5 via-transparent to-[#3d3d3d]/20 opacity-60" />
              <div className="absolute -right-16 -top-16 w-40 h-40 bg-[#6b8e23]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Arrow icon - appears on hover */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="absolute top-4 right-4 z-10"
              >
                <ArrowRight 
                  size={24} 
                  className="text-[#6b8e23] group-hover:text-[#7a9f35] transition-colors" 
                />
              </motion.div>

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white leading-tight group-hover:text-[#7a9f35] transition-colors">
                      {profile.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {profile.serverAddress}:{profile.serverPort}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg bg-[#6b8e23]/15 border border-[#6b8e23]/30 text-[#9ec75b]">
                      Minecraft {profile.version}
                    </span>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium ${
                        isClientReady
                          ? 'border-[#6b8e23]/40 bg-[#6b8e23]/10 text-[#9ec75b]'
                          : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isClientReady ? 'bg-[#6b8e23] animate-pulse' : 'bg-yellow-500'
                        }`}
                      />
                      <span>{isClientReady ? t('server.clientReady') : t('server.clientNotDownloaded')}</span>
                    </div>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <ServerBadge key={tag} type={tag} />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#141414]/80 border border-[#2f2f2f] rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#6b8e23]/15 text-[#9ec75b]">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('server.players')}</p>
                      <p className="text-sm font-semibold text-white">
                        {serverStatus ? `${playerCount}/${maxPlayers || '∞'}` : '--'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#141414]/80 border border-[#2f2f2f] rounded-xl p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${serverStatus?.online ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                      <Server size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('server.serverStatus')}</p>
                      <p className={`text-sm font-semibold ${serverStatus?.online ? 'text-green-300' : 'text-red-300'}`}>
                        {serverStatus
                          ? serverStatus.online
                            ? t('server.online')
                            : t('server.offline')
                          : '...'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#141414]/80 border border-[#2f2f2f] rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/15 text-blue-300">
                      <Gauge size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('server.ping')}</p>
                      <p className="text-sm font-semibold text-white">{pingValue}</p>
                    </div>
                  </div>

                  <div className="bg-[#141414]/80 border border-[#2f2f2f] rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-300">
                      <HardDrive size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('server.javaRequirement')}</p>
                      <p className="text-sm font-semibold text-white">Java {profile.jvmVersion || '8'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    {serverStatus ? (
                      serverStatus.online ? (
                        <Wifi className="text-green-400" size={16} />
                      ) : (
                        <WifiOff className="text-red-400" size={16} />
                      )
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>
                      {serverStatus
                        ? serverStatus.online
                          ? `${t('server.online')} ${playerCount}`
                          : t('server.serverOffline')
                        : t('common.loading')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#7a9f35] font-medium">
                    <span>{t('common.details')}</span>
                    <ArrowRight size={18} />
                  </div>
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
