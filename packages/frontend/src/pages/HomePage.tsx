/**
 * Home Page - Cyberpunk Design
 * Techno-Magic Design System
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Download, AlertCircle, Users, Loader2, CheckCircle, XCircle, Signal, Globe, PlayCircle } from 'lucide-react';
import { useProfiles } from '../hooks/api';
import { serversAPI } from '../api/servers';
import { downloadsAPI } from '../api/downloads';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import GameLogsModal from '../components/GameLogsModal';
import DownloadProgressModal from '../components/DownloadProgressModal';
import { ServerStatus, UpdateProgress } from '@modern-launcher/shared';
import { useTranslation } from '../hooks/useTranslation';
import { tauriApi } from '../api/tauri';
import { platformAPI } from '../api/platformSimple';
import GameLauncherService from '../services/gameLauncher';
import { Card, Badge, Button } from '../components/ui';
import { API_CONFIG } from '../config/api';

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

export default function HomePage() {
  const navigate = useNavigate();
  const { playerProfile, accessToken } = useAuthStore();
  const { selectedProfile, ram, width, height, fullScreen, autoEnter, javaPath, workingDir, updateSettings } = useSettingsStore();
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
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);

  const { data: profiles, isLoading } = useProfiles({

  const { data: profiles, isLoading } = useProfiles({
    refetchOnWindowFocus: true,
  });

  const selectedProfileData = profiles?.find(p => p.profile.id === selectedProfile);

  React.useEffect(() => {
    if (!profiles || profiles.length === 0) return;

    const fetchStatuses = async () => {
      const statusPromises = profiles.map(async (item) => {
        const serverKey = `${item.profile.serverAddress}:${item.profile.serverPort}`;
        try {
          const status = await serversAPI.getServerStatus(item.profile.serverAddress, item.profile.serverPort);
          return { serverKey, status };
        } catch (error) {
          console.error(`Failed to fetch status for ${serverKey}:`, error);
          return { serverKey, status: null };
        }
      });

      const results = await Promise.all(statusPromises);
      const newStatuses: Record<string, ServerStatus> = {};
      results.forEach(({ serverKey, status }) => {
        if (status) {
          newStatuses[serverKey] = status;
        }
      });
      setServerStatuses(newStatuses);
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, [profiles]);

  React.useEffect(() => {
    if (selectedProfileData && clientReady[selectedProfileData.profile.version] === undefined) {
      const version = selectedProfileData.profile.version;
      checkClientFiles(version).then((ready) => {
        setClientReady(prev => ({ ...prev, [version]: ready }));
      });
    }
  }, [selectedProfileData?.profile.version]);

  const checkClientFiles = async (version: string): Promise<boolean> => {
    try {
      const response = await downloadsAPI.getClientVersionByVersion(version);
      return response.success && response.data && response.data.files.length > 0;
    } catch (error) {
      console.error('Error checking client files:', error);
      return false;
    }
  };

  const handleLaunch = async () => {
    const profileToLaunch = selectedServerId
      ? profiles?.find(p => p.profile.id === selectedServerId)?.profile
      : selectedProfileData?.profile;

    if (!profileToLaunch || !playerProfile) return;

    if (selectedServerId) {
      updateSettings({ selectedProfile: selectedServerId });
    }

    if (!platformAPI.getPlatformInfo().isTauri) {
      setLaunchError('Game launch is only available in desktop mode.');
      return;
    }

    const profile = profileToLaunch;

    setCheckingFiles(true);
    setLaunchError(null);

    try {
      const response = await downloadsAPI.getClientVersionByVersion(profile.version);
      const files = response.data?.files || [];

      if (files.length === 0) {
        setShowDownloadModal(true);
        setDownloadingVersion(profile.version);
        return;
      }

      setClientReady(prev => ({ ...prev, [profile.version]: true }));
      setCheckingFiles(false);
      setLaunching(true);

      const result = await GameLauncherService.launchGame({
        profileId: profile.id,
        profileVersion: profile.version,
        serverAddress: profile.serverAddress,
        serverPort: profile.serverPort,
        username: playerProfile.username,
        accessToken: accessToken || '',
        ram: ram || '2048M',
        width: width || 854,
        height: height || 480,
        fullScreen: fullScreen || false,
        autoEnter: autoEnter || false,
        javaPath: javaPath || '',
        workingDir: workingDir || '',
      });

      if (result.success) {
        setCurrentSessionId(result.processId || null);
        setActiveProcessId(result.processId || null);
        // Keep launching=true while game is running
      } else {
        setLaunchError(result.error || 'Failed to launch game');
        setLaunching(false);
      }
    } catch (error: any) {
      console.error('Launch error:', error);
      setLaunchError(error.message || 'An unexpected error occurred');
      setLaunching(false);
      setCheckingFiles(false);
    }
  };

  React.useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfile) {
      updateSettings({ selectedProfile: profiles[0].profile.id });
    }
  }, [profiles, selectedProfile, updateSettings]);

  // Monitor game process status and reset launching state when game exits
  React.useEffect(() => {
    if (!activeProcessId) return;

    const checkInterval = setInterval(() => {
      const isRunning = GameLauncherService.isGameRunning();
      if (!isRunning) {
        // Game has exited, reset launching state
        setLaunching(false);
        setActiveProcessId(null);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [activeProcessId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-primary">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-techno-cyan mx-auto mb-4" />
          <p className="text-lg text-white font-mono">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-primary">
        <Card className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">{t('server.noProfilesAvailable')}</h2>
          <p className="text-gray-400 font-mono">{t('server.contactAdmin')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-base font-display font-bold text-white mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">
            {t('home.dimensionBrowser')}
          </h1>
          <p className="text-techno-cyan font-mono text-[10px] tracking-widest">{t('home.selectDestination')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
        {profiles.map((item, idx) => {
          const profile = item.profile;
          const serverKey = `${profile.serverAddress}:${profile.serverPort}`;
          const serverStatus = serverStatuses[serverKey];
          const isSelected = selectedServerId === profile.id || (!selectedServerId && selectedProfile === profile.id);
          const tags = (profile.tags as string[]) || [];
          const isClientReady = clientReady[profile.version];
          const playerCount = serverStatus?.players?.online ?? 0;
          const maxPlayers = serverStatus?.players?.max ?? 0;
          const isOnline = serverStatus?.online ?? false;
          const ping = serverStatus?.latency ?? 0;

          // Determine server status text and color
          let statusText = '• OFFLINE';
          let statusColor = 'text-status-error';
          if (isOnline) {
            statusText = '• ONLINE';
            statusColor = 'text-status-success';
          } else if (serverStatus?.maintenance) {
            statusText = '• MAINTENANCE';
            statusColor = 'text-status-warning';
          }

          // Get server image URL based on server name
          const serverImageUrl = profile.title ? getServerImageUrl(profile.title) : getDefaultServerImageUrl();
          const defaultImageUrl = getDefaultServerImageUrl();

          return (
            <div
              key={profile.id}
              className="group relative transition-all duration-500 hover:z-20 hover:scale-[1.02]"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <Card 
                hoverEffect 
                className="h-full flex flex-col cursor-pointer overflow-hidden"
                onClick={() => {
                  if (profile.id) {
                    navigate(`/server/${profile.id}`);
                  }
                }}
              >
                {/* Server Image Area - Full width, top of card */}
                <div className="relative h-56 -mx-5 -mt-5 mb-0 overflow-hidden bg-dark-void">
                  {/* Server Image with fallback */}
                  <img 
                    src={serverImageUrl}
                    alt={profile.title || 'Server'} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" 
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
                  
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-panel/90 via-dark-panel/50 to-transparent" />
                  
                  {/* Status indicator - top right */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`${statusColor} text-xs font-bold font-mono tracking-wider`}>
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col space-y-3 p-5">
                  {/* Title */}
                  <div>
                    <h3 className="text-sm font-bold font-display text-white group-hover:text-techno-cyan transition-colors tracking-wide mb-2">
                      {profile.title}
                    </h3>
                    {profile.description && (
                      <p className="text-xs text-gray-400 font-mono line-clamp-2 leading-relaxed">
                        {profile.description}
                      </p>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-white font-semibold">{playerCount}</span>
                      <span className="text-gray-600">/ {maxPlayers || '∞'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Signal className={`w-3.5 h-3.5 ${ping < 100 ? 'text-status-success' : ping < 200 ? 'text-status-warning' : 'text-status-error'}`} />
                      <span className="text-white font-semibold">{ping} MS</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 text-[10px] uppercase font-bold text-techno-cyan bg-techno-cyan/10 border border-techno-cyan/30 rounded-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-auto pt-2">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (profile.id) {
                          updateSettings({ selectedProfile: profile.id });
                          setSelectedServerId(profile.id);
                        }
                        if (isClientReady) {
                          handleLaunch();
                        } else {
                          navigate(`/server/${profile.id}`);
                        }
                      }}
                      isLoading={launching || checkingFiles}
                      leftIcon={launching || checkingFiles ? undefined : <PlayCircle className="w-3.5 h-3.5" />}
                    >
                      {launching || checkingFiles ? t('home.processing') : t('home.initializeLink')}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <GameLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        logs={gameLogs}
      />

      <DownloadProgressModal
        isOpen={showDownloadModal}
        onClose={() => {
          if (downloadingVersion) {
            setClientReady(prev => {
              const newState = { ...prev };
              delete newState[downloadingVersion];
              return newState;
            });
          }
          setShowDownloadModal(false);
          setDownloadProgress(null);
          setDownloadingVersion(null);
        }}
        progress={downloadProgress}
      />
    </div>
  );
}
