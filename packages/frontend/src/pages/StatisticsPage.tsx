/**
 * Statistics Page - redesigned Minecraft analytics dashboard
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
  Flame
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

const COLORS = ['#7fb640', '#3b82f6', '#f97316', '#a855f7', '#14b8a6', '#ef4444'];

const TIME_RANGE_OPTIONS = [
  { value: 7, labelKey: 'statistics.range.last7' },
  { value: 30, labelKey: 'statistics.range.last30' },
  { value: 90, labelKey: 'statistics.range.last90' },
  { value: 365, labelKey: 'statistics.range.last365' },
];

export default function StatisticsPage() {
  const [days, setDays] = useState(30);
  const { t, language } = useTranslation();

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
      accent: 'from-[#7fb640]/25',
    },
    {
      label: t('statistics.totalLaunches'),
      value: `${stats?.totalLaunches || 0}`,
      hint: t('statistics.launchesHint'),
      icon: Play,
      accent: 'from-[#3b82f6]/25',
    },
    {
      label: t('statistics.completedSessions'),
      value: `${stats?.totalSessions || 0}`,
      hint: stats && stats.totalSessions > 0 ? formatTime(Math.floor(stats.totalPlayTime / stats.totalSessions)) : '0m',
      icon: TrendingUp,
      accent: 'from-[#f97316]/25',
    },
    {
      label: t('statistics.activeProfiles'),
      value: `${stats?.popularProfiles.length || 0}`,
      hint: `${stats?.popularProfiles[0]?.launches || 0} ${t('statistics.topProfileLaunches')}`,
      icon: Activity,
      accent: 'from-[#a855f7]/25',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#7fb640] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('statistics.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[#2f2f2f] bg-gradient-to-br from-[#1f1f1f] via-[#141414] to-[#090909] p-8"
      >
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] text-white/80 border border-white/15 bg-white/5">
              <Layers size={14} className="text-[#7fb640]" />
              {t('statistics.heroTag')}
            </span>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                {t('statistics.title')}
              </h1>
              <p className="text-gray-400 mt-2 max-w-2xl">{t('statistics.subtitle')}</p>
            </div>
          </div>
          <div className="space-y-2 w-full max-w-xs">
            <label className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-400">{t('statistics.rangeLabel')}</label>
            <div className="relative">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#111111] border border-[#333] rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#7fb640] appearance-none"
              >
                {TIME_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#111]">
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">▼</div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-[#2f2f2f] bg-[#111]/80 p-5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-40 pointer-events-none`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.15em] text-gray-400 font-semibold">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-[#7fb640]">
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-3">{card.hint}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <StatisticsChartCard
          icon={Clock}
          title={t('statistics.chart.playTimeTitle')}
          gradient="from-[#7fb640]/20"
          data={playTimeChartData}
          type="area"
          dataKey="playTime"
          valueFormatter={(value) => `${value} ${t('statistics.minutesLabel')}`}
        />
        <StatisticsChartCard
          icon={Zap}
          title={t('statistics.chart.launchTitle')}
          gradient="from-[#3b82f6]/20"
          data={launchesChartData}
          type="bar"
          dataKey="launches"
          valueFormatter={(value) => `${value}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

      {stats && stats.playTimeByProfile.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#2f2f2f] bg-[#111]/80 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Server size={20} className="text-[#7fb640]" />
            <h2 className="text-2xl font-bold text-white">{t('statistics.playtimeTableTitle')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-3 px-4">{t('statistics.tableProfile')}</th>
                  <th className="text-right py-3 px-4">{t('statistics.tablePlaytime')}</th>
                  <th className="text-right py-3 px-4">{t('statistics.tableSessions')}</th>
                  <th className="text-right py-3 px-4">{t('statistics.tableAverage')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.playTimeByProfile
                  .sort((a, b) => b.duration - a.duration)
                  .map((profile) => (
                    <tr key={profile.profileId} className="border-b border-white/5 text-white">
                      <td className="py-3 px-4 font-medium">{getProfileName(profile.profileId)}</td>
                      <td className="py-3 px-4 text-right">{formatTime(profile.duration)}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{profile.sessions}</td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {profile.sessions > 0 ? formatTime(Math.floor(profile.duration / profile.sessions)) : '0m'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}

      {stats && stats.launchHistory.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#2f2f2f] bg-[#111]/80 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={20} className="text-[#7fb640]" />
            <h2 className="text-2xl font-bold text-white">{t('statistics.recentLaunches')}</h2>
          </div>
          <div className="space-y-3">
            {stats.launchHistory.slice(0, 20).map((launch) => (
              <div
                key={launch.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="text-white font-semibold">{getProfileName(launch.profileId)}</p>
                  <p className="text-gray-400 text-sm">
                    {launch.serverAddress ? `${launch.serverAddress}:${launch.serverPort || 25565}` : t('statistics.singleplayer')}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(launch.createdAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  {launch.duration !== null && (
                    <p className="text-white font-semibold">{formatTime(launch.duration)}</p>
                  )}
                  {launch.exitCode !== null && launch.exitCode !== 0 && (
                    <p className="text-red-400 text-sm">
                      {t('statistics.exitCode')} {launch.exitCode}
                    </p>
                  )}
                  {launch.crashed && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-300">
                      <Flame size={12} /> {t('statistics.crashedBadge')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {!hasStats && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-10 text-center"
        >
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300 text-lg font-semibold">{t('statistics.noStatsTitle')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('statistics.noStatsSubtitle')}</p>
        </motion.section>
      )}
    </div>
  );
}

interface ChartCardProps {
  icon: React.ComponentType<any>;
  title: string;
  gradient: string;
  data: Array<Record<string, any>>;
  type: 'area' | 'bar';
  dataKey: string;
  valueFormatter: (value: number) => string;
}

function StatisticsChartCard({ icon: Icon, title, gradient, data, type, dataKey, valueFormatter }: ChartCardProps) {
  const { t } = useTranslation();
  const hasData = data.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-[#2f2f2f] bg-[#111]/80 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Icon size={20} className="text-[#7fb640]" />
          {title}
        </h2>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7fb640" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#7fb640" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => valueFormatter(value)}
              />
              <Area type="monotone" dataKey={dataKey} stroke="#7fb640" fill={`url(#color-${dataKey})`} strokeWidth={2} />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => valueFormatter(value)}
              />
              <Bar dataKey={dataKey} fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-400">{t('statistics.chart.noData')}</div>
      )}
    </motion.section>
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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-[#2f2f2f] bg-[#111]/80 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Icon size={20} className="text-[#7fb640]" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={110} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
            formatter={(value: number) => formatter(Number(value))}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.section>
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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-[#2f2f2f] bg-[#111]/80 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Icon size={20} className="text-[#7fb640]" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis type="category" dataKey="name" width={140} stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
            labelStyle={{ color: '#fff' }}
            formatter={(value: number) => `${value}`}
          />
          <Bar dataKey="launches" fill="#10b981" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.section>
  );
}
