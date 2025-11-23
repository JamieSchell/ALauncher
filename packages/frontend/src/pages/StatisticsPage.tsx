/**
 * Statistics Page - Полная статистика использования для пользователей
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
  Zap
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { statisticsAPI } from '../api/statistics';
import { profilesAPI } from '../api/profiles';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function StatisticsPage() {
  const [days, setDays] = useState(30);

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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Получить название профиля по ID
  const getProfileName = (profileId: string | null) => {
    if (!profileId) return 'Unknown';
    const profile = profiles.find(p => p.profile.id === profileId);
    return profile?.profile.title || profileId;
  };

  // Данные для графика времени игры по дням
  const playTimeChartData = stats?.dailyStats.map(stat => ({
    date: formatDate(stat.date),
    playTime: Math.floor(stat.playTime / 60), // в минутах
    launches: stat.launches,
  })) || [];

  // Данные для графика запусков по дням
  const launchesChartData = stats?.dailyStats.map(stat => ({
    date: formatDate(stat.date),
    launches: stat.launches,
  })) || [];

  // Данные для круговой диаграммы времени по профилям
  const playTimeByProfileData = stats?.playTimeByProfile
    .filter(p => p.duration > 0)
    .map(p => ({
      name: getProfileName(p.profileId),
      value: Math.floor(p.duration / 60), // в минутах
      duration: p.duration,
      sessions: p.sessions,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6) || [];

  // Данные для столбчатой диаграммы популярных профилей
  const popularProfilesData = stats?.popularProfiles
    .map(p => ({
      name: getProfileName(p.profileId),
      launches: p.launches,
    }))
    .slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Statistics</h1>
          <p className="text-gray-400">Your game usage statistics and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
          >
            <option value={7} className="bg-gray-800">Last 7 days</option>
            <option value={30} className="bg-gray-800">Last 30 days</option>
            <option value={90} className="bg-gray-800">Last 90 days</option>
            <option value={365} className="bg-gray-800">Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-primary-400" />
            </div>
            <span className="text-3xl font-bold text-white">
              {stats ? formatTime(stats.totalPlayTime) : '0m'}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Play Time</p>
          <p className="text-gray-500 text-xs mt-1">
            {stats?.totalSessions || 0} completed sessions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Play className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-3xl font-bold text-white">
              {stats?.totalLaunches || 0}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Launches</p>
          <p className="text-gray-500 text-xs mt-1">
            {stats?.totalSessions || 0} sessions completed
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-3xl font-bold text-white">
              {stats?.totalSessions || 0}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Completed Sessions</p>
          <p className="text-gray-500 text-xs mt-1">
            Average: {stats && stats.totalSessions > 0 
              ? formatTime(Math.floor(stats.totalPlayTime / stats.totalSessions))
              : '0m'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-3xl font-bold text-white">
              {stats?.popularProfiles.length || 0}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Active Profiles</p>
          <p className="text-gray-500 text-xs mt-1">
            {stats?.popularProfiles[0]?.launches || 0} most launches
          </p>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Play Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              Play Time Over Time
            </h2>
          </div>
          {playTimeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={playTimeChartData}>
                <defs>
                  <linearGradient id="colorPlayTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="playTime" 
                  stroke="#8b5cf6" 
                  fillOpacity={1}
                  fill="url(#colorPlayTime)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No data available
            </div>
          )}
        </motion.div>

        {/* Launches Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Launches Over Time
            </h2>
          </div>
          {launchesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={launchesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="launches" 
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Play Time by Profile Pie Chart */}
        {playTimeByProfileData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                Play Time by Profile
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={playTimeByProfileData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {playTimeByProfileData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatTime(value * 60)}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Popular Profiles Bar Chart */}
        {popularProfilesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Popular Profiles
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularProfilesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="launches" 
                  fill="#10b981"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Play Time by Profile Table */}
      {stats && stats.playTimeByProfile.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Play Time by Profile
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Profile</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Play Time</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Sessions</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Avg. Session</th>
                </tr>
              </thead>
              <tbody>
                {stats.playTimeByProfile
                  .sort((a, b) => b.duration - a.duration)
                  .map((profile, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        {getProfileName(profile.profileId)}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {formatTime(profile.duration)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {profile.sessions}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {profile.sessions > 0 
                          ? formatTime(Math.floor(profile.duration / profile.sessions))
                          : '0m'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Recent Launches */}
      {stats && stats.launchHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Launches
          </h2>
          <div className="space-y-2">
            {stats.launchHistory.slice(0, 20).map((launch) => (
              <div 
                key={launch.id} 
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-medium">
                      {getProfileName(launch.profileId)}
                    </p>
                    {launch.profileVersion && (
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                        {launch.profileVersion}
                      </span>
                    )}
                    {launch.crashed && (
                      <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
                        Crashed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {launch.serverAddress 
                      ? `${launch.serverAddress}:${launch.serverPort || 25565}`
                      : 'Singleplayer'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(launch.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="text-right">
                  {launch.duration !== null && (
                    <p className="text-white font-semibold">{formatTime(launch.duration)}</p>
                  )}
                  {launch.exitCode !== null && launch.exitCode !== 0 && (
                    <p className="text-red-400 text-sm">Exit code: {launch.exitCode}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {(!stats || (stats.totalLaunches === 0 && stats.totalPlayTime === 0)) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl p-12 text-center"
        >
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No statistics available</p>
          <p className="text-gray-500 text-sm mt-2">
            Start playing to see your statistics here
          </p>
        </motion.div>
      )}
    </div>
  );
}
