/**
 * Statistics Page - Premium Design 2025
 * Senior UX/UI Designer Implementation
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Play,
  TrendingUp,
  BarChart3,
  Loader2,
  Calendar,
  Server,
  Award,
  Activity,
  Zap,
  Layers,
  Flame,
  ChevronDown,
  Users,
  Globe
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useTranslation } from '../hooks/useTranslation';
import { useFormatDate } from '../hooks/useFormatDate';
import { useUserStatistics, useProfiles, useAdminAnalytics } from '../hooks/api';
import { Card, Button } from '../components/ui';
import { useAuthStore } from '../stores/authStore';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const StatsCard = ({ icon: Icon, label, value, trend, color }: { icon: any, label: string, value: string, trend: string, color: string }) => {
  const colorClasses: Record<string, string> = {
    cyan: 'text-techno-cyan border-techno-cyan/20 bg-techno-cyan/5',
    purple: 'text-magic-purple border-magic-purple/20 bg-magic-purple/5',
    blue: 'text-techno-blue border-techno-blue/20 bg-techno-blue/5',
    green: 'text-status-success border-status-success/20 bg-status-success/5',
  };

  return (
    <div className={`p-6 rounded-xl border ${colorClasses[color] || colorClasses.cyan} relative group overflow-hidden transition-all hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg bg-black/20`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-black/20">{trend}</span>
      </div>
      <div className="text-base font-bold text-white mb-1 font-display">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
      
      {/* Bg Decor */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-current opacity-5 blur-2xl" />
    </div>
  );
};

const TIME_RANGE_OPTIONS = [
  { value: 7, labelKey: 'statistics.range.last7' },
  { value: 30, labelKey: 'statistics.range.last30' },
  { value: 90, labelKey: 'statistics.range.last90' },
  { value: 365, labelKey: 'statistics.range.last365' },
];

export default function StatisticsPage() {
  const [days, setDays] = useState(30);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t, language } = useTranslation();
  const { formatDate, formatDateTime } = useFormatDate();

  // Calculate dropdown position and close when clicking outside
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8, // mt-2 = 8px, fixed positioning uses viewport coordinates
          right: window.innerWidth - rect.right,
          width: rect.width,
        });
      }
    };

    if (isDropdownOpen) {
      // Update position immediately
      updatePosition();

      // Update on scroll and resize
      const handleUpdate = () => {
        requestAnimationFrame(updatePosition);
      };

      window.addEventListener('resize', handleUpdate);
      window.addEventListener('scroll', handleUpdate, true);

      // Also update when dropdown opens (next frame to ensure button is rendered)
      requestAnimationFrame(updatePosition);

      return () => {
        window.removeEventListener('resize', handleUpdate);
        window.removeEventListener('scroll', handleUpdate, true);
      };
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const { isAdmin } = useAuthStore();
  const { data: statsData, isLoading: userStatsLoading } = useUserStatistics(days, { enabled: !isAdmin });
  const { data: adminStatsData, isLoading: adminStatsLoading } = useAdminAnalytics(days, { enabled: isAdmin });

  const { data: profilesData } = useProfiles();

  // Use admin stats if admin, otherwise user stats
  const stats = isAdmin ? adminStatsData?.data : statsData?.data;
  const profiles = profilesData?.data || [];
  const isLoading = isAdmin ? adminStatsLoading : userStatsLoading;
  const hasStats = Boolean(stats && (stats.totalPlayTime > 0 || stats.totalLaunches > 0));
  
  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(1)} KB`;
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const getProfileName = (profileId: string | null) => {
    if (!profileId) return t('statistics.unknownProfile');
    const profile = profiles.find((p) => p.profile.id === profileId);
    return profile?.profile.title || profileId || t('statistics.unknownProfile');
  };

  const playTimeChartData = stats?.dailyStats?.map((stat) => ({
    date: formatDate(stat.date),
    playTime: Math.floor(stat.playTime / 60),
  })) || [];

  const launchesChartData = stats?.dailyStats?.map((stat) => ({
    date: formatDate(stat.date),
    launches: stat.launches,
  })) || [];

  const playTimeByProfileData = stats?.playTimeByProfile
    ?.filter((p) => p.duration > 0)
    .map((p) => ({
      name: getProfileName(p.profileId),
      value: Math.floor(p.duration / 60),
      duration: p.duration,
      sessions: p.sessions,
    })) || [];

  const popularProfilesData = stats?.popularProfiles?.map((p) => ({
    name: getProfileName(p.profileId),
    launches: p.launches,
  })) || [];

  const summaryCards = [
    {
      label: t('statistics.totalPlayTime'),
      value: stats ? formatTime(stats.totalPlayTime) : '0m',
      hint: `${stats?.totalSessions || 0} ${t('statistics.sessionsLabel')}`,
      icon: Clock,
      color: 'primary',
    },
    {
      label: t('statistics.totalLaunches'),
      value: `${stats?.totalLaunches || 0}`,
      hint: t('statistics.launchesHint'),
      icon: Play,
      color: 'info',
    },
    {
      label: t('statistics.completedSessions'),
      value: `${stats?.totalSessions || 0}`,
      hint: stats && stats.totalSessions > 0 ? formatTime(Math.floor(stats.totalPlayTime / stats.totalSessions)) : '0m',
      icon: TrendingUp,
      color: 'success',
    },
    {
      label: t('statistics.activeProfiles'),
          value: `${stats?.popularProfiles?.length || 0}`,
      hint: `${stats?.popularProfiles[0]?.launches || 0} ${t('statistics.topProfileLaunches')}`,
      icon: Activity,
      color: 'warning',
    },
  ];

  if (isLoading) {
    return (
      <div style={{ paddingBottom: '32px' }}>
        {/* Header Skeleton */}
        <div
            style={{
              marginBottom: '48px',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '24px',
              padding: '32px 40px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ height: '40px', width: '256px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <div style={{ height: '24px', width: '384px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ height: '20px', width: '96px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', marginBottom: '16px' }} />
              <div style={{ height: '40px', width: '128px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', marginBottom: '8px' }} />
              <div style={{ height: '16px', width: '80px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div style={{ background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '24px' }}>
            <div style={{ height: '24px', width: '160px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', marginBottom: '24px' }} />
            <div style={{ height: '256px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
          <div style={{ background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '24px' }}>
            <div style={{ height: '24px', width: '160px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', marginBottom: '24px' }} />
            <div style={{ height: '256px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-8">
      <div>
        <h1 className="text-base font-display font-bold text-white mb-1">{t('statisticsLabels.networkStatistics')}</h1>
        <p className="text-techno-cyan font-mono text-[10px] tracking-widest">{t('statisticsLabels.globalInfrastructure')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          icon={Users} 
          label="Total Unique Users" 
          value={isAdmin && stats ? formatNumber(stats.activeUsers?.length || 0) : (stats ? formatNumber(stats.totalSessions || 0) : '0')} 
          trend={isAdmin ? "+5%" : ""} 
          color="cyan" 
        />
        <StatsCard 
          icon={Server} 
          label="Active Sessions" 
          value={stats ? formatNumber(stats.totalSessions || 0) : '0'} 
          trend="+5%" 
          color="purple" 
        />
        <StatsCard 
          icon={Globe} 
          label="Total Launches" 
          value={stats ? formatNumber(stats.totalLaunches || 0) : '0'} 
          trend="+8%" 
          color="blue" 
        />
        <StatsCard 
          icon={Zap} 
          label="System Health" 
          value={stats && stats.totalCrashes !== undefined ? `${100 - Math.min(100, Math.round((stats.totalCrashes / Math.max(1, stats.totalSessions)) * 100))}%` : '100%'} 
          trend="STABLE" 
          color="green" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-techno-cyan font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3" /> {t('statisticsLabels.trafficAnalysis')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={playTimeChartData.length > 0 ? playTimeChartData : [{ date: 'No Data', playTime: 0 }]}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A2332', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '4px', color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#00F5FF' }}
                />
                <Area type="monotone" dataKey="playTime" stroke="#00F5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-magic-purple font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
            <Server className="w-3 h-3" /> Server Load Distribution
          </h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={
                 isAdmin && stats?.popularServers 
                   ? stats.popularServers.map(s => ({ name: `${s.serverAddress || 'Unknown'}:${s.serverPort || ''}`, launches: s.launches }))
                   : (popularProfilesData.length > 0 ? popularProfilesData : [{ name: 'No Data', launches: 0 }])
               } layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                 <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                 <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} width={100} tick={{ fill: '#6B7280' }} />
                 <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.05)'}}
                   contentStyle={{ backgroundColor: '#1A2332', border: '1px solid rgba(176,38,255,0.3)', borderRadius: '4px', color: '#fff' }}
                   labelStyle={{ color: '#fff' }}
                   itemStyle={{ color: '#B026FF' }}
                 />
                 <Bar dataKey="launches" fill="#B026FF" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-dark-card to-dark-panel">
         <div className="flex items-center justify-between">
           <div>
             <h3 className="text-white font-bold text-xs">{t('statisticsLabels.downloadReport')}</h3>
             <p className="text-gray-400 text-xs">{t('statisticsLabels.getDetailedAnalytics')}</p>
           </div>
           <Button variant="secondary">Export Data</Button>
         </div>
      </Card>

      {/* Old Hero Section - Keeping for compatibility */}
      <div
        style={{
          marginBottom: '48px',
          position: 'relative',
          overflow: 'visible',
          borderRadius: '24px',
          padding: '32px 40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(12px)',
          display: 'none'
        }}
      >
        {/* Background Pattern - Contained within rounded corners */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")',
          borderRadius: '24px',
          overflow: 'hidden'
        }} />

        {/* Gradient Overlay - Contained within rounded corners */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)',
          borderRadius: '24px',
          overflow: 'hidden'
        }} />

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <Layers size={14} style={{ color: 'rgba(167, 139, 250, 1)' }} />
              {t('statistics.heroTag')}
            </div>
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 900,
                lineHeight: '1.2',
                letterSpacing: '-0.025em'
              }}>
                {t('statistics.title')}
              </h1>
              <p style={{
                fontSize: '18px',
                lineHeight: '1.6',
                marginTop: '8px',
                maxWidth: '640px'
              }}>
                {t('statistics.subtitle')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px', position: 'relative' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', lineHeight: '1.5' }}>{t('statistics.rangeLabel')}</label>
            <div style={{ position: 'relative' }}>
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
              >
                <span style={{ fontWeight: 600 }}>{t(TIME_RANGE_OPTIONS.find(opt => opt.value === days)?.labelKey || TIME_RANGE_OPTIONS[1].labelKey)}</span>
                <ChevronDown size={18} style={{ strokeWidth: 2.5 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown rendered via Portal */}
        {typeof window !== 'undefined' && createPortal(
          isDropdownOpen && (
            <div
              ref={dropdownRef}
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                width: `${dropdownPosition.width}px`,
                background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                zIndex: 9999,
                pointerEvents: 'auto'
              }}
            >
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.03,
                backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)'
              }} />

              <div style={{ position: 'relative', zIndex: 10, padding: '6px' }}>
                {TIME_RANGE_OPTIONS.map((option) => {
                  const isSelected = days === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDays(option.value);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '44px',
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 200ms',
                        background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        borderLeft: isSelected ? '2px solid rgba(99, 102, 241, 1)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Selected indicator background */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to right, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.08))',
                          borderRadius: '0 8px 8px 0'
                        }} />
                      )}
                      <span style={{ position: 'relative', zIndex: 10, fontWeight: 600, fontSize: '14px' }}>{t(option.labelKey)}</span>
                      {isSelected && (
                        <div style={{ position: 'relative', zIndex: 10, marginLeft: 'auto' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(167, 139, 250, 1)' }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ),
          document.body
        )}
      </div>

      {/* Summary Cards - Using StatsCard component */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const colorMap: Record<string, string> = {
            primary: 'cyan',
            info: 'blue',
            success: 'green',
            warning: 'purple'
          };
          return (
            <StatsCard 
              key={card.label}
              icon={Icon} 
              label={card.label} 
              value={card.value} 
              trend={card.hint} 
              color={colorMap[card.color] || 'cyan'} 
            />
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
        <StatisticsChartCard
          icon={Clock}
          title={t('statistics.chart.playTimeTitle')}
          data={playTimeChartData}
          type="area"
          dataKey="playTime"
          valueFormatter={(value) => `${value} ${t('statistics.minutesLabel')}`}
        />
        <StatisticsChartCard
          icon={Zap}
          title={t('statistics.chart.launchTitle')}
          data={launchesChartData}
          type="bar"
          dataKey="launches"
          valueFormatter={(value) => `${value}`}
        />
      </div>

      {/* Pie & Bar Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
        {playTimeByProfileData.length > 0 && (
          <StatisticsPieCard
            title={t('statistics.playtimeByProfile')}
            icon={Award}
            data={playTimeByProfileData}
            formatter={(value) => formatTime(value * 60)}
          />
        )}
        {popularProfilesData.length > 0 && (
          <StatisticsBarCard
            title={t('statistics.popularProfiles')}
            icon={BarChart3}
            data={popularProfilesData}
          />
        )}
      </div>

      {/* Playtime Table */}
      {stats && stats.playTimeByProfile && stats.playTimeByProfile.length > 0 && (
        <section
          style={{
            marginBottom: '48px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px',
            padding: '24px 32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")'
          }} />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)'
          }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                padding: '12px',
                background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.15))',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.1)'
              }}>
                <Server size={22} style={{ color: 'rgba(167, 139, 250, 1)' }} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{t('statistics.playtimeTableTitle')}</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600 }}>{t('statistics.tableProfile')}</th>
                    <th style={{ textAlign: 'right', padding: '16px', fontWeight: 600 }}>{t('statistics.tablePlaytime')}</th>
                    <th style={{ textAlign: 'right', padding: '16px', fontWeight: 600 }}>{t('statistics.tableSessions')}</th>
                    <th style={{ textAlign: 'right', padding: '16px', fontWeight: 600 }}>{t('statistics.tableAverage')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.playTimeByProfile
                    .sort((a, b) => b.duration - a.duration)
                    .map((profile) => (
                      <tr
                        key={profile.profileId}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                      >
                        <td style={{ padding: '16px', fontWeight: 600 }}>{getProfileName(profile.profileId)}</td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>{formatTime(profile.duration)}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>{profile.sessions}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          {profile.sessions > 0 ? formatTime(Math.floor(profile.duration / profile.sessions)) : '0m'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Recent Launches */}
      {stats && stats.launchHistory && stats.launchHistory.length > 0 && (
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px',
            padding: '24px 32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")'
          }} />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)'
          }} />

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.15))',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.1)'
              }}>
                <Calendar size={22} style={{ color: 'rgba(167, 139, 250, 1)' }} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{t('statistics.recentLaunches')}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.launchHistory.slice(0, 20).map((launch) => (
                <div
                  key={launch.id}
                  style={{
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600 }}>{getProfileName(launch.profileId)}</p>
                    <p style={{ fontSize: '14px', marginTop: '4px' }}>
                      {launch.serverAddress ? `${launch.serverAddress}:${launch.serverPort || 25565}` : t('statistics.singleplayer')}
                    </p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                      {formatDateTime(launch.createdAt)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {launch.duration !== null && (
                      <p style={{ fontWeight: 700 }}>{formatTime(launch.duration)}</p>
                    )}
                    {launch.exitCode !== null && launch.exitCode !== 0 && (
                      <p style={{ color: 'rgba(248, 113, 113, 1)', fontSize: '14px', fontWeight: 500 }}>
                        {t('statistics.exitCode')} {launch.exitCode}
                      </p>
                    )}
                    {launch.crashed && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: 'rgba(248, 113, 113, 1)',
                        fontWeight: 600
                      }}>
                        <Flame size={12} strokeWidth={2.5} /> {t('statistics.crashedBadge')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!hasStats && (
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
            padding: '48px 64px',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <BarChart3 style={{ width: '40px', height: '40px', margin: '0 auto' }} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('statistics.noStatsTitle')}</p>
          <p style={{ fontSize: '14px' }}>{t('statistics.noStatsSubtitle')}</p>
        </section>
      )}
    </div>
  );
}

interface ChartCardProps {
  icon: React.ComponentType<any>;
  title: string;
  data: Array<Record<string, any>>;
  type: 'area' | 'bar';
  dataKey: string;
  valueFormatter: (value: number) => string;
}

function StatisticsChartCard({ icon: Icon, title, data, type, dataKey, valueFormatter }: ChartCardProps) {
  const { t } = useTranslation();
  const hasData = data && data.length > 0;

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        padding: '24px 32px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")'
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)'
      }} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            padding: '12px',
            background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.15))',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.1)'
          }}>
            <Icon size={22} style={{ color: 'rgba(167, 139, 250, 1)' }} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{title}</h2>
        </div>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            {type === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                  labelStyle={{ color: '#fff', fontWeight: 600 }}
                  formatter={(value: number) => valueFormatter(value)}
                />
                <Area type="monotone" dataKey={dataKey} stroke="#6366f1" fill={`url(#color-${dataKey})`} strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                  labelStyle={{ color: '#fff', fontWeight: 600 }}
                  formatter={(value: number) => valueFormatter(value)}
                />
                <Bar dataKey={dataKey} fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>{t('statistics.chart.noData')}</div>
        )}
      </div>
    </section>
  );
}

interface PieCardProps {
  title: string;
  icon: React.ComponentType<any>;
  data: Array<{ name: string; value: number; duration?: number; sessions?: number }>;
  formatter: (value: number) => string;
}

function StatisticsPieCard({ title, icon: Icon, data, formatter }: PieCardProps) {
  const { t } = useTranslation();

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        padding: '24px 32px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")'
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)'
      }} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            padding: '12px',
            background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.15))',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.1)'
          }}>
            <Icon size={22} style={{ color: 'rgba(167, 139, 250, 1)' }} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{title}</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={110} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
              formatter={(value: number) => formatter(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

interface BarCardProps {
  title: string;
  icon: React.ComponentType<any>;
  data: Array<{ name: string; launches: number }>;
}

function StatisticsBarCard({ title, icon: Icon, data }: BarCardProps) {
  const { t } = useTranslation();

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        padding: '24px 32px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTSAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+")'
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)'
      }} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            padding: '12px',
            background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.15))',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.1)'
          }}>
            <Icon size={22} style={{ color: 'rgba(167, 139, 250, 1)' }} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{title}</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis type="category" dataKey="name" width={140} stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(value: number) => `${value}`}
            />
            <Bar dataKey="launches" fill="#6366f1" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
