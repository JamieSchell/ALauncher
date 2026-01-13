/**
 * Server Details Page - Functionality Only
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Crown,
  Share2,
  Trophy
} from 'lucide-react';
import { useProfile, useEconomyLeaderboard, useServerStatus } from '../hooks/api';
import { downloadsAPI } from '../api/downloads';
import { crashesAPI } from '../api/crashes';
import { platformAPI } from '../api/platformSimple';
import { statisticsAPI } from '../api/statistics';
import GameLauncherService from '../services/gameLauncher';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import ServerBadge from '../components/ServerBadge';
import DownloadProgressModal from '../components/DownloadProgressModal';
import ServerStatusChart from '../components/ServerStatusChart';
import { ServerStatus, UpdateProgress } from '@modern-launcher/shared';
import { useTranslation } from '../hooks/useTranslation';
import { API_CONFIG } from '../config/api';
import { useFormatDate } from '../hooks/useFormatDate';
import { Card, Badge, Button } from '../components/ui';

// Helper function to get server image URL
const getServerImageUrl = (serverName: string): string => {
  const baseUrl = API_CONFIG.baseUrlWithoutApi;
  // Sanitize server name for filename (remove special characters, keep alphanumeric and hyphens)
  const sanitizedName = serverName.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
  return `${baseUrl}/uploads/server/${sanitizedName}.png`;
};

// Helper function to get default server image URL
const getDefaultServerImageUrl = (): string => {
  const baseUrl = API_CONFIG.baseUrlWithoutApi;
  return `${baseUrl}/uploads/server/Default.png`;
};

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
  const { formatTime } = useFormatDate();
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
      refetchInterval: 5000,
    }
  );

  React.useEffect(() => {
    if (serverStatus) {
      setLastStatusUpdate(Date.now());
    }
  }, [serverStatus]);

  // Economy leaderboard query
  const {
    data: economyLeaderboard,
    isLoading: isEconomyLoading,
    isError: isEconomyError,
    refetch: refetchEconomy,
  } = useEconomyLeaderboard(profileId, {
    enabled: !!profileId && economyEnabled,
  });

  // formatBalance hook
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
      if (!profileData?.profile) {
        console.warn(`[ClientCheck] Profile not found for version ${version}`);
        return false;
      }

      const profile = profileData.profile;
      const clientDir = profile.clientDirectory || version;
      const assetIndex = profile.assetIndex;

      let updatesDirBase: string;
      try {
        updatesDirBase = await platformAPI.getUpdatesDir();
        console.log(`[ClientCheck] Got updates dir: ${updatesDirBase}`);
      } catch (error) {
        console.error(`[ClientCheck] Failed to get updates dir:`, error);
        return false;
      }

      const clientFilesDir = `${updatesDirBase}/${clientDir}`;
      const assetsRoot = `${updatesDirBase}/assets`;

      const clientJarPath = `${clientFilesDir}/client.jar`;
      console.log(`[ClientCheck] Checking client.jar at: ${clientJarPath}`);

      let clientJarExists: boolean;
      try {
        clientJarExists = await platformAPI.fileExists(clientJarPath);
        console.log(`[ClientCheck] client.jar exists: ${clientJarExists}`);
      } catch (error) {
        console.error(`[ClientCheck] Error checking client.jar:`, error);
        return false;
      }

      if (!clientJarExists) {
        console.log(`[ClientCheck] client.jar not found for version ${version} at ${clientJarPath}`);
        return false;
      }
      console.log(`[ClientCheck] client.jar found`);

      if (assetIndex) {
        console.log(`[ClientCheck] Checking assets with index: ${assetIndex}`);
        const assetIndexFile = `${assetsRoot}/indexes/${assetIndex}.json`;
        let assetsReady = false;

        console.log(`[ClientCheck] Checking for asset index file: ${assetIndexFile}`);
        const assetIndexExists = await platformAPI.fileExists(assetIndexFile);

        if (!assetIndexExists) {
          console.log(`[ClientCheck] Asset index file NOT found: ${assetIndexFile}`);
          return false;
        }

        console.log(`[ClientCheck] Asset index file found, checking assets...`);

        try {
          const assetIndexContent = await platformAPI.readFile(assetIndexFile);
          const assetIndexData = JSON.parse(assetIndexContent);

          if (!assetIndexData.objects || Object.keys(assetIndexData.objects).length === 0) {
            console.warn(`[ClientCheck] Asset index has no objects`);
            assetsReady = false;
          } else {
            const assetEntries = Object.entries(assetIndexData.objects);
            console.log(`[ClientCheck] Found ${assetEntries.length} assets in index`);

            let foundAssets = 0;
            const checkCount = Math.min(20, assetEntries.length);
            let checkedAssets = 0;

            for (let i = 0; i < checkCount; i++) {
              const [assetPath, assetInfo]: [string, any] = assetEntries[i] as [string, any];
              const hash = assetInfo.hash;
              const hashPrefix = hash.substring(0, 2);
              const assetFilePath = `${assetsRoot}/objects/${hashPrefix}/${hash}`;

              try {
                const exists = await platformAPI.fileExists(assetFilePath);
                checkedAssets++;
                if (exists) {
                  foundAssets++;
                }
              } catch (error) {
                console.warn(`[ClientCheck] Error checking asset ${assetPath}:`, error);
              }
            }

            console.log(`[ClientCheck] Checked ${checkedAssets} assets, found ${foundAssets}`);

            const requiredAssets = Math.ceil(checkCount * 0.8);
            assetsReady = foundAssets >= requiredAssets;

            if (!assetsReady) {
              console.log(`[ClientCheck] Assets NOT ready: found ${foundAssets}/${checkedAssets}, need at least ${requiredAssets}`);
            } else {
              console.log(`[ClientCheck] Assets ready: ${foundAssets}/${checkedAssets} found`);
            }
          }
        } catch (e) {
          console.error('[ClientCheck] Failed to parse asset index:', e);
          assetsReady = false;
        }

        if (!assetsReady) {
          console.log(`[ClientCheck] Client NOT ready - assets need to be downloaded`);
          return false;
        }
      } else {
        console.log(`[ClientCheck] No assetIndex specified, skipping assets check`);
      }

      let versionInfo;
      try {
        versionInfo = await downloadsAPI.getClientVersionByVersion(version, profileData?.profile?.clientDirectory || undefined);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log(`[ClientCheck] Version ${version} not in DB, but client.jar exists - considering ready`);
          return true;
        }
        throw error;
      }

      if (versionInfo.data && versionInfo.data.files && versionInfo.data.files.length > 0) {
        const files = versionInfo.data.files;
        console.log(`[ClientCheck] Found ${files.length} files in DB to check`);

        let checkedFiles = 0;
        let missingFiles: string[] = [];

        for (const file of files) {
          if (file.fileType === 'asset') continue;

          const destPath = `${clientFilesDir}/${file.filePath}`;

          try {
            const exists = await platformAPI.fileExists(destPath);
            if (!exists) {
              console.log(`[ClientCheck] File not found: ${file.filePath}`);
              missingFiles.push(file.filePath);
            } else {
              checkedFiles++;
            }
          } catch (error) {
            console.warn(`[ClientCheck] Error checking file ${file.filePath}:`, error);
            missingFiles.push(file.filePath);
          }
        }

        if (missingFiles.length > 0) {
          console.log(`[ClientCheck] Missing ${missingFiles.length} files (showing first 5):`, missingFiles.slice(0, 5));
          console.log(`[ClientCheck] Some files missing, client is NOT ready - download required`);
          return false;
        }

        console.log(`[ClientCheck] All ${checkedFiles} files checked and found`);
      } else {
        console.log(`[ClientCheck] No files list in DB, but client.jar exists - considering ready`);
      }

      console.log(`[ClientCheck] All files ready for version ${version}`);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`[ClientCheck] Version ${version} not in DB, checking local files...`);
        try {
          const updatesDirBase = await platformAPI.getUpdatesDir();
          const clientDir = profileData?.profile?.clientDirectory || version;
          const updatesDir = `${updatesDirBase}/${clientDir}`;
          const clientJarPath = `${updatesDir}/client.jar`;

          const clientExists = await platformAPI.fileExists(clientJarPath);
          if (!clientExists) {
            console.log(`[ClientCheck] Version ${version} not in DB and client.jar not found locally`);
            return false;
          }

          console.log(`[ClientCheck] Version ${version} not in DB but client.jar exists locally`);

          const profile = profileData?.profile;
          if (profile?.assetIndex) {
            console.log(`[ClientCheck] Checking assets for version ${version} (not in DB)`);
            const assetsRoot = `${updatesDirBase}/assets`;
            const assetIndexFile = `${assetsRoot}/indexes/${profile.assetIndex}.json`;

            const assetIndexExists = await platformAPI.fileExists(assetIndexFile);
            if (!assetIndexExists) {
              console.log(`[ClientCheck] Asset index not found for version ${version} (not in DB)`);
              return false;
            }

            try {
              const assetIndexContent = await platformAPI.readFile(assetIndexFile);
              const assetIndexData = JSON.parse(assetIndexContent);

              if (assetIndexData.objects && Object.keys(assetIndexData.objects).length > 0) {
                const assetEntries = Object.entries(assetIndexData.objects);
                let foundAssets = 0;
                const checkCount = Math.min(20, assetEntries.length);

                for (let i = 0; i < checkCount; i++) {
                  const [assetPath, assetInfo]: [string, any] = assetEntries[i] as [string, any];
                  const hash = assetInfo.hash;
                  const hashPrefix = hash.substring(0, 2);
                  const assetFilePath = `${assetsRoot}/objects/${hashPrefix}/${hash}`;

                  if (await platformAPI.fileExists(assetFilePath)) {
                    foundAssets++;
                  }
                }

                const requiredAssets = Math.ceil(checkCount * 0.8);
                if (foundAssets < requiredAssets) {
                  console.log(`[ClientCheck] Assets not ready for version ${version} (not in DB): ${foundAssets}/${checkCount} found`);
                  return false;
                }

                console.log(`[ClientCheck] Assets ready for version ${version} (not in DB): ${foundAssets}/${checkCount} found`);
              }
            } catch (e) {
              console.error('[ClientCheck] Failed to check assets:', e);
              return false;
            }
          }

          console.log(`[ClientCheck] Version ${version} not in DB but all local files ready`);
          return true;
        } catch (e) {
          console.error('[ClientCheck] Error checking local files:', e);
          return false;
        }
      }
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
    const handleExit = async (code: number) => {
      console.log('Game exited with code:', code);
      setLaunching(false);

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
            console.log('[Statistics] Game session ended successfully');
          } else {
            console.warn('[Statistics] Failed to end game session:', result);
          }

          setCurrentSessionId(null);
        } catch (error: any) {
          console.error('[Statistics] Error ending game session:', error);
        }
      }

      if (code !== 0 && code !== null) {
        setLaunchError(`Game exited with code ${code}. Check logs for details.`);
      } else {
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

    // Only register game event listeners in desktop environment (Tauri)
    if (platformAPI.onGameExit && typeof platformAPI.onGameExit === 'function') {
      platformAPI.onGameExit(handleExit);
    }
    if (platformAPI.onGameError && typeof platformAPI.onGameError === 'function') {
      platformAPI.onGameError(handleError);
    }
    if (platformAPI.onGameLog && typeof platformAPI.onGameLog === 'function') {
      platformAPI.onGameLog((log: string) => console.log('Game log:', log));
    }

    return () => {};
  }, [currentSessionId, playerProfile?.username, profileData?.profile]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <div className="h-10 w-64 bg-gray-500/50 rounded-lg animate-pulse" />
          <div className="h-6 w-96 bg-gray-500/30 rounded-lg mt-2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-status-error/15 border border-status-error/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h2 className="text-2xl font-bold mb-4">{t('errors.serverError')}</h2>
          <p className="text-xs mb-6">
            {t('server.failedToLoadDetails') || 'Не удалось загрузить детали сервера. Попробуйте обновить страницу или выбрать другой профиль.'}
          </p>
          <p className="text-xs break-all mb-6">
            {(error as Error)?.message || String(error)}
          </p>
          <Button onClick={() => window.location.reload()}>
            {t('common.retry') || 'Повторить'}
          </Button>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="text-center">
          <AlertCircle className="w-16 h-16 text-status-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('errors.notFound')}</h2>
          <p className="mb-4">{t('server.notFound')}</p>
          <Button onClick={() => navigate('/')}>
            {t('common.back')}
          </Button>
        </Card>
      </div>
    );
  }

  if (!profileData.profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-status-error/15 border border-status-error/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>
          <h2 className="text-2xl font-bold mb-4">{t('errors.serverError')}</h2>
          <p className="text-xs mb-6">
            {t('server.failedToLoadDetails') || 'Не удалось загрузить детали сервера. Профиль не найден в ответе сервера.'}
          </p>
          <Button onClick={() => navigate('/')}>
            {t('common.back')}
          </Button>
        </Card>
      </div>
    );
  }

  const tags = (profile?.tags as string[]) || [];
  const onlinePlayers = serverStatus?.players?.online ?? 0;
  const maxPlayers = serverStatus?.players?.max ?? 0;
  const ping = serverStatus?.ping ?? 0;
  const javaRequirement = profile?.jvmVersion || '8';
  const StatusIcon = (serverStatus?.online ?? false) ? Wifi : WifiOff;
  const statusLabel = (serverStatus?.online ?? false) ? t('server.serverOnline') : t('server.serverOffline');
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
    if (!profileData || !playerProfile) {
      setLaunchError('Profile data or player profile not available');
      return;
    }

    if (!platformAPI.getPlatformInfo().isTauri) {
      setLaunchError('Game launch is only available in desktop mode. Please use the desktop app instead of web browser.');
      return;
    }

    const profile = profileData.profile;

    setCheckingFiles(true);
    setLaunchError(null);

    const filesReady = await checkClientFiles(profile.version);
    setCheckingFiles(false);

    if (!filesReady) {
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

        const MAX_CONCURRENT_DOWNLOADS = 2;
        const baseUrl = API_CONFIG.baseUrlWithoutApi;
        const clientDirForDownload = profile.clientDirectory || undefined;
        const updatesDirBase = await platformAPI.getUpdatesDir();
        const clientDirOnDisk = profile.clientDirectory || profile.version;
        const updatesDir = `${updatesDirBase}/${clientDirOnDisk}`;

        const downloadSingleFile = async (file: any, index: number): Promise<void> => {
          const destPath = `${updatesDir}/${file.filePath}`;
          const fileDir = destPath.substring(0, Math.max(destPath.lastIndexOf('/'), destPath.lastIndexOf('\\')));

          if (fileDir) {
            try {
              await platformAPI.ensureDir(fileDir);
            } catch {
              // Ignore errors
            }
          }

          try {
            const exists = await platformAPI.fileExists(destPath);
            if (exists) {
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

          await platformAPI.downloadFile(fileUrl, destPath, (progress) => {
            const fileProgress = ((index + progress / 100) / files.length) * 100;
            setDownloadProgress(prev => prev ? {
              ...prev,
              progress: fileProgress,
              downloadedFiles: index + (progress === 100 ? 1 : 0),
            } : null);
          }, accessToken || undefined);

          await new Promise(resolve => setTimeout(resolve, 200));

          let fileExists = false;
          let attempts = 0;
          const maxAttempts = 5;

          while (attempts < maxAttempts && !fileExists) {
            try {
              fileExists = await platformAPI.fileExists(destPath);
              if (fileExists) {
                break;
              }
            } catch (error: any) {
              // Ignore errors
            }
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }

          if (!fileExists) {
            throw new Error(`File was not created after download: ${file.filePath}`);
          }

          console.log(`[Download] File ${file.filePath} downloaded successfully.`);
        };

        const downloadPromises: Array<{ promise: Promise<void>; index: number }> = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          if (downloadPromises.length >= MAX_CONCURRENT_DOWNLOADS) {
            const completed = await Promise.race(
              downloadPromises.map(item => item.promise.then(() => item.index).catch(() => item.index))
            );
            const index = downloadPromises.findIndex(item => item.index === completed);
            if (index !== -1) {
              downloadPromises.splice(index, 1);
            }
          }

          const downloadPromise = downloadSingleFile(file, i)
            .catch((error) => {
              console.error(`[Download] Failed to download ${file.filePath}:`, error);
              return { error: error.message || String(error), filePath: file.filePath };
            });

          downloadPromises.push({ promise: downloadPromise as Promise<void>, index: i });
        }

        const results = await Promise.allSettled(downloadPromises.map(item => item.promise));

        const errors: Array<{ filePath: string; error: string }> = [];
        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            errors.push({ filePath: files[idx]?.filePath || 'unknown', error: result.reason?.message || String(result.reason) });
          }
        });

        if (errors.length > 0) {
          console.error(`[Download] ${errors.length} file(s) failed to download:`, errors);
          setDownloadProgress(prev => prev ? {
            ...prev,
            currentFile: `Warning: ${errors.length} file(s) failed. Check console for details.`,
          } : null);

          const criticalErrors = errors.filter(e => e.filePath === 'client.jar');
          if (criticalErrors.length > 0) {
            throw new Error(`Critical file client.jar failed to download: ${criticalErrors[0].error}`);
          }
        }

        if (profile.assetIndex) {
          setDownloadProgress(prev => prev ? {
            ...prev,
            currentFile: 'Downloading assets...',
          } : null);

          try {
            const assetsRoot = `${updatesDirBase}/assets`;
            const assetsIndexPath = `${assetsRoot}/indexes/${profile.assetIndex}.json`;

            const assetsExist = await platformAPI.fileExists(assetsIndexPath);

            if (!assetsExist) {
              const baseUrl = API_CONFIG.baseUrlWithoutApi;
              const assetsUrl = `${baseUrl}/api/updates/${profile.id}/asset/file?path=index.json`;

              const indexesDir = `${assetsRoot}/indexes`;
              await platformAPI.ensureDir(indexesDir).catch(() => {});

              await platformAPI.downloadFile(assetsUrl, assetsIndexPath, () => {}, accessToken);

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
                const assetFilePath = `${assetsRoot}/objects/${hashPrefix}/${hash}`;

                const assetExists = await platformAPI.fileExists(assetFilePath);
                if (!assetExists) {
                  const assetFileUrl = `${baseUrl}/api/updates/${profile.id}/asset/file?path=objects/${hashPrefix}/${hash}`;
                  const assetDir = assetFilePath.substring(0, Math.max(assetFilePath.lastIndexOf('/'), assetFilePath.lastIndexOf('\\')));
                  await platformAPI.ensureDir(assetDir).catch(() => {});
                  await platformAPI.downloadFile(assetFileUrl, assetFilePath, () => {}, accessToken);
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
          }
        }

        setDownloadProgress(prev => prev ? {
          ...prev,
          stage: 'verifying',
          progress: 95,
          currentFile: 'Verifying downloaded files...',
        } : null);

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

    setClientReady(true);
    await launchGame();
  };

  // Launch game function
  const launchGame = async () => {
    if (!profileData || !playerProfile) return;

    setLaunching(true);
    setLaunchError(null);

    try {
      const profile = profileData.profile;

      let jvmVersion = profile.jvmVersion || '8';

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

      if (profile.mainClass === 'net.minecraft.launchwrapper.Launch') {
        jvmVersion = '8';
        console.log('[Launch] LaunchWrapper detected - forcing Java 8 (LaunchWrapper does not work with Java 9+)');
        if (profile.jvmVersion && profile.jvmVersion !== '8') {
          console.warn(`[Launch] WARNING: Profile has jvmVersion=${profile.jvmVersion}, but LaunchWrapper requires Java 8. Using Java 8.`);
        }
      } else if (!profile.jvmVersion && profile.version.startsWith('1.12') && profile.tags?.includes('FORGE')) {
        jvmVersion = '8';
        console.log('[Launch] Defaulting to Java 8 for Minecraft 1.12.2 with Forge (no jvmVersion in profile)');
      }

      const result = await GameLauncherService.launchGame({
        profile,
        username: playerProfile?.username || 'Player',
        session: accessToken || undefined,
        serverAddress: profile.serverAddress,
        serverPort: profile.serverPort,
      });

      if (result.success) {
        console.log('Game launched successfully, ProcessID:', result.processId);
        setLaunchError(null);

        try {
          let osPlatform: string | null = null;
          const userAgent = navigator.userAgent.toLowerCase();
          if (userAgent.includes('win')) osPlatform = 'win32';
          else if (userAgent.includes('mac')) osPlatform = 'darwin';
          else if (userAgent.includes('linux')) osPlatform = 'linux';

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
            console.log('[Statistics] Game launch logged successfully:', launchResult.data);
          } else {
            console.warn('[Statistics] Failed to log game launch:', launchResult);
          }
        } catch (error: any) {
          console.error('[Statistics] Error logging game launch:', error);
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
    <div className="space-y-8 animate-fade-in-up max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-gray-400 hover:text-techno-cyan transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Browser</span>
        </button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="px-3">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Configs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-64 rounded-2xl overflow-hidden border border-techno-cyan/30 shadow-neon-cyan group">
            {/* Server Image with fallback */}
            {(() => {
              const serverImageUrl = profile.title ? getServerImageUrl(profile.title) : getDefaultServerImageUrl();
              const defaultImageUrl = getDefaultServerImageUrl();
              
              return (
                <img 
                  src={serverImageUrl}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                  alt={profile.title || 'Server'} 
                  onError={(e) => {
                    // Prevent error from bubbling to global error handler
                    e.stopPropagation();
                    
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    
                    // If server-specific image fails, try default
                    if (target.src !== defaultImageUrl && !target.dataset.fallbackTried) {
                      target.dataset.fallbackTried = 'true';
                      target.src = defaultImageUrl;
                      return;
                    }
                    
                    // If default also fails or already tried, show gradient
                    if (parent && !parent.querySelector('.fallback-gradient')) {
                      target.style.display = 'none';
                      const gradient = document.createElement('div');
                      gradient.className = 'absolute inset-0 bg-gradient-to-br from-techno-cyan/20 to-magic-purple/20 fallback-gradient';
                      parent.appendChild(gradient);
                    }
                  }}
                />
              );
            })()}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-primary via-dark-primary/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-base font-display font-bold text-white tracking-wide">{profile.title}</h1>
                <Badge status={serverStatus?.online ? 'ONLINE' : 'OFFLINE'} className="text-xs px-3 py-1" />
              </div>
              {profile.description && (
                <p className="text-xs text-gray-300 max-w-xl">{profile.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-techno-cyan font-bold uppercase tracking-wider text-xs mb-4">{t('serverDetails.playerActivity')}</h3>
              <div className="h-48 w-full">
                <ServerStatusChart
                  status={serverStatus}
                  isLoading={!serverStatus}
                  serverAddress={profile?.serverAddress}
                  serverPort={profile?.serverPort}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-magic-purple font-bold uppercase tracking-wider text-xs mb-4">{t('serverDetails.topContributors')}</h3>
              {isEconomyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-techno-cyan" />
                </div>
              ) : leaderboardPlayers.length > 0 ? (
                <div className="space-y-3">
                  {leaderboardPlayers.slice(0, 3).map((player, i) => (
                    <div key={`${player.rank}-${player.username}`} className="flex items-center justify-between p-2 rounded bg-dark-panel border border-white/5 hover:border-magic-purple/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-magic-purple to-pink-600 p-[1px]">
                          <div className="w-full h-full rounded bg-black flex items-center justify-center text-white text-xs font-bold">
                            {player.rank}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-white">{player.username}</span>
                          {economyEnabled && player.balance !== undefined && (
                            <span className="text-[10px] text-gray-400 font-mono">{formatBalance(player.balance)}</span>
                          )}
                        </div>
                      </div>
                      <Trophy className={`w-4 h-4 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : 'text-orange-600'}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">
                  {economyEnabled ? t('serverDetails.noLeaderboardData') : t('serverDetails.economyDisabled')}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card className="text-center p-8 bg-gradient-to-b from-dark-card to-dark-panel">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-white mb-2">{t('serverDetails.readyToDive')}</h2>
              <p className="text-xs text-gray-400">Version: <span className="text-techno-cyan">{profile.version}</span></p>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={handleLaunch}
              disabled={launching || checkingFiles || !playerProfile || downloadingVersion === profile.version}
              isLoading={launching || checkingFiles}
              leftIcon={!launching && !checkingFiles ? <Play className="w-4 h-4" /> : undefined}
            >
              {checkingFiles ? t('home.processing') : launching ? t('serverDetails.launching') : clientReady ? t('home.initializeLink') : t('serverDetails.downloadAndLaunch')}
            </Button>
            {launchError && (
              <div className="mt-4 p-4 bg-status-error/10 border border-status-error/30 rounded-lg text-status-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{launchError}</span>
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 gap-4 text-center text-xs text-gray-500">
              <div>
                <div className="text-white font-bold text-sm">{ram || '2048M'}</div>
                <div>{t('serverDetails.allocatedRAM')}</div>
              </div>
              <div>
                <div className="text-white font-bold text-sm">{profile.modLoader || 'Vanilla'}</div>
                <div>{t('serverDetails.modloader')}</div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-4">{t('serverDetails.modpackInfo')}</h3>
            <ul className="space-y-3 text-xs text-gray-300">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>{t('serverDetails.modsLoaded')}</span>
                <span className="font-mono text-techno-cyan">{profile.modCount || '0'}</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>{t('serverDetails.lastUpdated')}</span>
                <span className="font-mono">{profile.updatedAt ? formatTime(new Date(profile.updatedAt)) : 'N/A'}</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>{t('serverDetails.size')}</span>
                <span className="font-mono">{profile.size || 'N/A'}</span>
              </li>
            </ul>
          </Card>

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
