/**
 * Statistics Page - Premium Design 2025
 * Senior UX/UI Designer Implementation
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown
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
import { statisticsAPI } from '../api/statistics';
import { profilesAPI } from '../api/profiles';
import { useTranslation } from '../hooks/useTranslation';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

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
  const { getAnimationProps, shouldAnimate } = useOptimizedAnimation();

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

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['user-statistics', days],
    queryFn: () => statisticsAPI.getUserStatistics(days),
  });

  const { data: profilesData } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.getProfiles,
  });

  const stats = statsData?.data;
  const profiles = profilesData?.data || [];
  const hasStats = Boolean(stats && (stats.totalPlayTime > 0 || stats.totalLaunches > 0));

  const formatTime = (seconds: number) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const getProfileName = (profileId: string | null) => {
    if (!profileId) return t('statistics.unknownProfile');
    const profile = profiles.find((p) => p.profile.id === profileId);
    return profile?.profile.title || profileId || t('statistics.unknownProfile');
  };

  const playTimeChartData = stats?.dailyStats.map((stat) => ({
    date: formatDate(stat.date),
    playTime: Math.floor(stat.playTime / 60),
  })) || [];

  const launchesChartData = stats?.dailyStats.map((stat) => ({
    date: formatDate(stat.date),
    launches: stat.launches,
  })) || [];

  const playTimeByProfileData = stats?.playTimeByProfile
    .filter((p) => p.duration > 0)
    .map((p) => ({
      name: getProfileName(p.profileId),
      value: Math.floor(p.duration / 60),
      duration: p.duration,
      sessions: p.sessions,
    })) || [];

  const popularProfilesData = stats?.popularProfiles.map((p) => ({
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
      value: `${stats?.popularProfiles.length || 0}`,
      hint: `${stats?.popularProfiles[0]?.launches || 0} ${t('statistics.topProfileLaunches')}`,
      icon: Activity,
      color: 'warning',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-xl" style={{ paddingBottom: '32px' }}>
        {/* Header Skeleton */}
        <motion.section
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
          transition={getAnimationProps({ duration: 0.3 })}
          className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-8 lg:p-10 border border-white/10 shadow-lg backdrop-blur-sm"
          style={{ marginBottom: '48px' }}
        >
          <div className="space-y-sm">
            <div className="h-10 w-64 bg-surface-base/50 rounded-lg animate-pulse" />
            <div className="h-6 w-96 bg-surface-base/30 rounded-lg animate-pulse" />
          </div>
        </motion.section>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '24px', rowGap: '24px', columnGap: '24px', marginBottom: '48px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 border border-white/10 rounded-2xl p-lg">
              <div className="h-5 w-24 bg-surface-base/50 rounded-lg animate-pulse mb-base" />
              <div className="h-10 w-32 bg-surface-base/50 rounded-lg animate-pulse mb-sm" />
              <div className="h-4 w-20 bg-surface-base/30 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '32px', rowGap: '32px', columnGap: '32px' }}>
          <div className="bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 border border-white/10 rounded-3xl p-lg">
            <div className="h-6 w-40 bg-surface-base/50 rounded-lg animate-pulse mb-lg" />
            <div className="h-64 bg-surface-base/30 rounded-lg animate-pulse" />
          </div>
          <div className="bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 border border-white/10 rounded-3xl p-lg">
            <div className="h-6 w-40 bg-surface-base/50 rounded-lg animate-pulse mb-lg" />
            <div className="h-64 bg-surface-base/30 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl" style={{ paddingBottom: '32px' }}>
      {/* Hero Section - Premium Design */}
      <motion.section
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.3 })}
        className="relative overflow-visible bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-8 lg:p-10 border border-white/10 shadow-lg backdrop-blur-sm"
        style={{ marginBottom: '48px' }}
      >
        {/* Background Pattern - Contained within rounded corners */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] rounded-3xl overflow-hidden" />
        
        {/* Gradient Overlay - Contained within rounded corners */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-3xl overflow-hidden" />
        
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <motion.span
              initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
              transition={getAnimationProps({ duration: 0.3, delay: 0.1 })}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs uppercase tracking-[0.3em] text-body-subtle border border-white/20 bg-surface-base/50"
            >
              <Layers size={14} className="text-primary-400" />
              {t('statistics.heroTag')}
            </motion.span>
            <div>
              <motion.h1
                initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                transition={getAnimationProps({ duration: 0.4, delay: 0.2 })}
                className="text-4xl lg:text-5xl font-black text-heading leading-tight tracking-tight"
              >
                {t('statistics.title')}
              </motion.h1>
              <motion.p
                initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                transition={getAnimationProps({ duration: 0.4, delay: 0.3 })}
                className="text-body-muted text-lg lg:text-xl leading-relaxed mt-2 max-w-2xl"
              >
                {t('statistics.subtitle')}
              </motion.p>
            </div>
          </div>
          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
            transition={getAnimationProps({ duration: 0.3, delay: 0.4 })}
            className="space-y-3 w-full max-w-xs relative"
          >
            <label className="text-sm font-semibold uppercase tracking-[0.15em] text-body-subtle leading-normal">{t('statistics.rangeLabel')}</label>
            <div className="relative">
              <motion.button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-br from-surface-base/80 to-surface-elevated/60 border border-white/10 rounded-xl text-heading focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200 flex items-center justify-between group hover:border-primary-500/30 shadow-sm"
              >
                <span className="font-semibold">{t(TIME_RANGE_OPTIONS.find(opt => opt.value === days)?.labelKey || TIME_RANGE_OPTIONS[1].labelKey)}</span>
                <motion.div
                  animate={shouldAnimate && isDropdownOpen ? { rotate: 180 } : { rotate: 0 }}
                  transition={getAnimationProps({ duration: 0.2 })}
                >
                  <ChevronDown size={18} className="text-body-muted group-hover:text-primary-400 transition-colors" strokeWidth={2.5} />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>

          {/* Dropdown rendered via Portal */}
          {typeof window !== 'undefined' && createPortal(
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  ref={dropdownRef}
                  initial={shouldAnimate ? { opacity: 0, y: -10, scale: 0.95 } : false}
                  animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : false}
                  exit={shouldAnimate ? { opacity: 0, y: -10, scale: 0.95 } : false}
                  transition={getAnimationProps({ duration: 0.2 })}
                  className="fixed bg-gradient-to-br from-surface-elevated/95 to-surface-base/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden z-[9999] pointer-events-auto"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                    width: `${dropdownPosition.width}px`,
                  }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
                  
                  <div className="relative z-10 py-1.5">
                    {TIME_RANGE_OPTIONS.map((option) => {
                      const isSelected = days === option.value;
                      return (
                        <motion.button
                          key={option.value}
                          onClick={() => {
                            setDays(option.value);
                            setIsDropdownOpen(false);
                          }}
                          whileHover={shouldAnimate ? { x: 2 } : undefined}
                          whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                          className={`relative w-full h-11 px-4 lg:px-5 flex items-center gap-3 transition-all duration-200 group ${
                            isSelected 
                              ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 text-heading border-l-2 border-primary-500' 
                              : 'text-body-muted hover:bg-interactive-hover-secondary hover:text-heading'
                          }`}
                        >
                          {/* Selected indicator background */}
                          {isSelected && (
                            <motion.div
                              layoutId="selectedRange"
                              className="absolute inset-0 bg-gradient-to-r from-primary-500/15 to-primary-600/8 rounded-r-lg"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10 font-semibold text-sm">{t(option.labelKey)}</span>
                          {isSelected && (
                            <motion.div
                              initial={shouldAnimate ? { scale: 0 } : false}
                              animate={shouldAnimate ? { scale: 1 } : false}
                              className="relative z-10 ml-auto"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>
      </motion.section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '24px', rowGap: '24px', columnGap: '24px', marginBottom: '48px' }}>
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            primary: 'from-primary-500/20 to-primary-600/15 border-primary-500/30 text-primary-400',
            info: 'from-info-500/20 to-info-600/15 border-info-500/30 text-info-400',
            success: 'from-success-500/20 to-success-600/15 border-success-500/30 text-success-400',
            warning: 'from-warning-500/20 to-warning-600/15 border-warning-500/30 text-warning-400',
          };
          const colorClass = colorClasses[card.color as keyof typeof colorClasses] || colorClasses.primary;
          
          return (
            <motion.div
              key={card.label}
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={getAnimationProps({ duration: 0.3, delay: 0.1 + index * 0.05 })}
              whileHover={shouldAnimate ? { y: -4, scale: 1.02 } : undefined}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 p-6 backdrop-blur hover:border-primary-500/30 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-body-subtle font-semibold mb-2">{card.label}</p>
                    <p className="text-3xl font-bold text-heading">{card.value}</p>
                  </div>
                  <motion.div
                    className={`p-3 bg-gradient-to-br ${colorClass} rounded-xl shadow-sm`}
                    whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
                  >
                    <Icon size={22} strokeWidth={2.5} />
                  </motion.div>
                </div>
                <p className="text-body-muted text-xs font-medium">{card.hint}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: '32px', rowGap: '32px', columnGap: '32px', marginBottom: '48px' }}>
        <StatisticsChartCard
          icon={Clock}
          title={t('statistics.chart.playTimeTitle')}
          data={playTimeChartData}
          type="area"
          dataKey="playTime"
          valueFormatter={(value) => `${value} ${t('statistics.minutesLabel')}`}
          shouldAnimate={shouldAnimate}
          getAnimationProps={getAnimationProps}
        />
        <StatisticsChartCard
          icon={Zap}
          title={t('statistics.chart.launchTitle')}
          data={launchesChartData}
          type="bar"
          dataKey="launches"
          valueFormatter={(value) => `${value}`}
          shouldAnimate={shouldAnimate}
          getAnimationProps={getAnimationProps}
        />
      </div>

      {/* Pie & Bar Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: '32px', rowGap: '32px', columnGap: '32px', marginBottom: '48px' }}>
        {playTimeByProfileData.length > 0 && (
          <StatisticsPieCard
            title={t('statistics.playtimeByProfile')}
            icon={Award}
            data={playTimeByProfileData}
            formatter={(value) => formatTime(value * 60)}
            shouldAnimate={shouldAnimate}
            getAnimationProps={getAnimationProps}
          />
        )}
        {popularProfilesData.length > 0 && (
          <StatisticsBarCard
            title={t('statistics.popularProfiles')}
            icon={BarChart3}
            data={popularProfilesData}
            shouldAnimate={shouldAnimate}
            getAnimationProps={getAnimationProps}
          />
        )}
      </div>

      {/* Playtime Table */}
      {stats && stats.playTimeByProfile.length > 0 && (
        <motion.section
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
          transition={getAnimationProps({ duration: 0.3, delay: 0.2 })}
          className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-6 lg:p-8 border border-white/10 shadow-lg backdrop-blur-sm"
          style={{ marginBottom: '48px' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
              >
                <Server size={22} className="text-primary-400" strokeWidth={2.5} />
              </motion.div>
              <h2 className="text-2xl font-bold text-heading">{t('statistics.playtimeTableTitle')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-body-subtle border-b border-white/10">
                    <th className="text-left py-4 px-4 font-semibold">{t('statistics.tableProfile')}</th>
                    <th className="text-right py-4 px-4 font-semibold">{t('statistics.tablePlaytime')}</th>
                    <th className="text-right py-4 px-4 font-semibold">{t('statistics.tableSessions')}</th>
                    <th className="text-right py-4 px-4 font-semibold">{t('statistics.tableAverage')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.playTimeByProfile
                    .sort((a, b) => b.duration - a.duration)
                    .map((profile, index) => (
                      <motion.tr
                        key={profile.profileId}
                        initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                        animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                        transition={getAnimationProps({ duration: 0.2, delay: 0.1 + index * 0.03 })}
                        className="border-b border-white/5 text-heading hover:bg-surface-hover/30 transition-colors"
                      >
                        <td className="py-4 px-4 font-semibold">{getProfileName(profile.profileId)}</td>
                        <td className="py-4 px-4 text-right font-semibold">{formatTime(profile.duration)}</td>
                        <td className="py-4 px-4 text-right text-body-muted">{profile.sessions}</td>
                        <td className="py-4 px-4 text-right text-body-muted">
                          {profile.sessions > 0 ? formatTime(Math.floor(profile.duration / profile.sessions)) : '0m'}
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      )}

      {/* Recent Launches */}
      {stats && stats.launchHistory.length > 0 && (
        <motion.section
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
          transition={getAnimationProps({ duration: 0.3, delay: 0.3 })}
          className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-6 lg:p-8 border border-white/10 shadow-lg backdrop-blur-sm"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
          
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
              >
                <Calendar size={22} className="text-primary-400" strokeWidth={2.5} />
              </motion.div>
              <h2 className="text-2xl font-bold text-heading">{t('statistics.recentLaunches')}</h2>
            </div>
            <div className="space-y-3">
              {stats.launchHistory.slice(0, 20).map((launch, index) => (
                <motion.div
                  key={launch.id}
                  initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                  animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                  transition={getAnimationProps({ duration: 0.2, delay: 0.1 + index * 0.02 })}
                  whileHover={shouldAnimate ? { x: 4 } : undefined}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-surface-base/90 to-surface-elevated/70 p-4 lg:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-primary-500/30 transition-all duration-200"
                >
                  <div>
                    <p className="text-heading font-semibold">{getProfileName(launch.profileId)}</p>
                    <p className="text-body-muted text-sm mt-1">
                      {launch.serverAddress ? `${launch.serverAddress}:${launch.serverPort || 25565}` : t('statistics.singleplayer')}
                    </p>
                    <p className="text-body-dim text-xs mt-2">
                      {new Date(launch.createdAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    {launch.duration !== null && (
                      <p className="text-heading font-bold">{formatTime(launch.duration)}</p>
                    )}
                    {launch.exitCode !== null && launch.exitCode !== 0 && (
                      <p className="text-error-400 text-sm font-medium">
                        {t('statistics.exitCode')} {launch.exitCode}
                      </p>
                    )}
                    {launch.crashed && (
                      <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-error-bg text-error-400 border border-error-border font-semibold">
                        <Flame size={12} strokeWidth={2.5} /> {t('statistics.crashedBadge')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Empty State */}
      {!hasStats && (
        <motion.section
          initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : false}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
          transition={getAnimationProps({ duration: 0.4 })}
          className="relative overflow-hidden rounded-3xl border border-dashed border-white/15 bg-gradient-to-br from-surface-base/90 to-surface-elevated/70 p-12 lg:p-16 text-center"
        >
          <motion.div
            initial={shouldAnimate ? { scale: 0, rotate: -180 } : false}
            animate={shouldAnimate ? { scale: 1, rotate: 0 } : false}
            transition={getAnimationProps({ duration: 0.5, delay: 0.2 })}
            className="w-20 h-20 mx-auto mb-6 p-5 bg-surface-base/50 rounded-2xl border border-white/10"
          >
            <BarChart3 className="w-10 h-10 text-body-dim mx-auto" strokeWidth={1.5} />
          </motion.div>
          <p className="text-heading text-lg lg:text-xl font-bold mb-2">{t('statistics.noStatsTitle')}</p>
          <p className="text-body-muted text-sm lg:text-base">{t('statistics.noStatsSubtitle')}</p>
        </motion.section>
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
  shouldAnimate: boolean;
  getAnimationProps: (config?: any) => any;
}

function StatisticsChartCard({ icon: Icon, title, data, type, dataKey, valueFormatter, shouldAnimate, getAnimationProps }: ChartCardProps) {
  const { t } = useTranslation();
  const hasData = data.length > 0;

  return (
    <motion.section
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={getAnimationProps({ duration: 0.3 })}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 p-6 lg:p-8 shadow-lg backdrop-blur-sm"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
            whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
          >
            <Icon size={22} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-xl lg:text-2xl font-bold text-heading">{title}</h2>
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
          <div className="flex items-center justify-center h-[300px] text-body-muted font-medium">{t('statistics.chart.noData')}</div>
        )}
      </div>
    </motion.section>
  );
}

interface PieCardProps {
  title: string;
  icon: React.ComponentType<any>;
  data: Array<{ name: string; value: number; duration?: number; sessions?: number }>;
  formatter: (value: number) => string;
  shouldAnimate: boolean;
  getAnimationProps: (config?: any) => any;
}

function StatisticsPieCard({ title, icon: Icon, data, formatter, shouldAnimate, getAnimationProps }: PieCardProps) {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={getAnimationProps({ duration: 0.3 })}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 p-6 lg:p-8 shadow-lg backdrop-blur-sm"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
            whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
          >
            <Icon size={22} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-xl lg:text-2xl font-bold text-heading">{title}</h2>
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
    </motion.section>
  );
}

interface BarCardProps {
  title: string;
  icon: React.ComponentType<any>;
  data: Array<{ name: string; launches: number }>;
  shouldAnimate: boolean;
  getAnimationProps: (config?: any) => any;
}

function StatisticsBarCard({ title, icon: Icon, data, shouldAnimate, getAnimationProps }: BarCardProps) {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={getAnimationProps({ duration: 0.3 })}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 p-6 lg:p-8 shadow-lg backdrop-blur-sm"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
            whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
          >
            <Icon size={22} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-xl lg:text-2xl font-bold text-heading">{title}</h2>
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
    </motion.section>
  );
}
