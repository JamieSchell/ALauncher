/**
 * Home Page - Cyberpunk Design
 * Techno-Magic Design System
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Signal } from 'lucide-react';
import { useProfiles } from '../hooks/api';
import { serversAPI } from '../api/servers';
import { ServerStatus } from '@modern-launcher/shared';
import { useTranslation } from '../hooks/useTranslation';
import { Card, Badge } from '../components/ui';
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
  const { t } = useTranslation();
  const [serverStatuses, setServerStatuses] = useState<Record<string, ServerStatus>>({});

  const { data: profiles, isLoading } = useProfiles({
    refetchOnWindowFocus: true,
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-techno-cyan/30 border-t-techno-cyan rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-white font-mono">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-primary">
        <Card className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((item, idx) => {
          const profile = item.profile;
          const serverKey = `${profile.serverAddress}:${profile.serverPort}`;
          const serverStatus = serverStatuses[serverKey];
          const tags = (profile.tags as string[]) || [];
          const playerCount = serverStatus?.players?.online ?? 0;
          const maxPlayers = serverStatus?.players?.max ?? 0;
          const isOnline = serverStatus?.online ?? false;
          const ping = serverStatus?.latency ?? 0;

          // Get server image URL based on server name
          const serverImageUrl = profile.title ? getServerImageUrl(profile.title) : getDefaultServerImageUrl();
          const defaultImageUrl = getDefaultServerImageUrl();

          return (
            <div
              key={profile.id}
              className="group relative"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <Card
                hoverEffect
                className="h-full overflow-hidden cursor-pointer"
                onClick={() => {
                  if (profile.id) {
                    navigate(`/server/${profile.id}`);
                  }
                }}
              >
                {/* Server Image - Top area */}
                <div className="relative h-48 -mx-5 -mt-5 overflow-hidden bg-gradient-to-br from-dark-void to-dark-secondary">
                  <img
                    src={serverImageUrl}
                    alt={profile.title || 'Server'}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    onError={(e) => {
                      e.stopPropagation();
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;

                      if (target.src !== defaultImageUrl && !target.dataset.fallbackTried) {
                        target.dataset.fallbackTried = 'true';
                        target.src = defaultImageUrl;
                        return;
                      }

                      if (parent && !parent.querySelector('.fallback-gradient')) {
                        target.style.display = 'none';
                        const gradient = document.createElement('div');
                        gradient.className = 'absolute inset-0 bg-gradient-to-br from-techno-cyan/20 to-magic-purple/20 fallback-gradient';
                        parent.appendChild(gradient);
                      }
                    }}
                  />

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-panel via-dark-panel/50 to-transparent" />

                  {/* Status badge - top right */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      status={isOnline ? 'online' : serverStatus?.maintenance ? 'warning' : 'offline'}
                      size="sm"
                      animated={isOnline}
                    />
                  </div>

                  {/* Version badge - top left */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 text-[10px] font-mono font-bold text-white bg-black/50 backdrop-blur-sm border border-white/20 rounded">
                      {profile.version}
                    </span>
                  </div>
                </div>

                {/* Content - Main info */}
                <div className="p-5 space-y-4">
                  {/* Title and description */}
                  <div>
                    <h3 className="text-base font-bold font-display text-white group-hover:text-techno-cyan transition-colors mb-2">
                      {profile.title}
                    </h3>
                    {profile.description && (
                      <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {profile.description}
                      </p>
                    )}
                  </div>

                  {/* Stats - Grid layout */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-white/5">
                    {/* Players */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-bold text-white">
                        {playerCount}
                      </div>
                      <div className="text-[10px] text-gray-600 font-mono">
                        {maxPlayers ? `/ ${maxPlayers}` : 'игроков'}
                      </div>
                    </div>

                    {/* Ping */}
                    <div className="text-center border-l border-r border-white/5">
                      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Signal className={`w-3.5 h-3.5 ${
                          ping < 80 ? 'text-status-success' :
                          ping < 150 ? 'text-status-warning' :
                          'text-status-error'
                        }`} />
                      </div>
                      <div className="text-lg font-bold text-white">
                        {ping}
                      </div>
                      <div className="text-[10px] text-gray-600 font-mono">MS</div>
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      <div className="text-[10px] text-gray-600 font-mono mb-1">СТАТУС</div>
                      <div className={`text-sm font-bold ${isOnline ? 'text-status-success' : 'text-status-error'}`}>
                        {isOnline ? 'ОНЛАЙН' : 'ОФФЛАЙН'}
                      </div>
                    </div>
                  </div>

                  {/* Tags - Bottom */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-[10px] uppercase font-semibold text-techno-cyan bg-techno-cyan/5 border border-techno-cyan/20 rounded hover:bg-techno-cyan/10 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 4 && (
                        <span className="px-2.5 py-1 text-[10px] text-gray-500 font-mono">
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
