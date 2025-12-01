/**
 * Admin Dashboard Page - Полный Dashboard с метриками для администраторов
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, 
  Server, 
  Play, 
  AlertTriangle, 
  TrendingUp, 
  BarChart3, 
  Loader2, 
  Clock,
  Activity,
  Zap,
  Shield,
  XCircle,
  WifiOff
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { statisticsAPI } from '../api/statistics';
import { profilesAPI } from '../api/profiles';
import { usersAPI } from '../api/users';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminDashboardPage() {
  const [days, setDays] = useState(30);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics', days],
    queryFn: () => statisticsAPI.getAdminAnalytics(days),
  });

  const { data: profilesData } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.getProfiles,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getUsers({ limit: 1000 }),
  });

  const analytics = analyticsData?.data;
  const profiles = profilesData?.data || [];
  const users = usersData?.data || [];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  // Получить имя пользователя по ID
  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unknown';
    const user = users.find(u => u.id === userId);
    return user?.username || userId;
  };

  // Данные для графика активности по дням
  const activityChartData = analytics?.dailyStats.map(stat => ({
    date: formatDate(stat.date),
    launches: stat.launches,
    sessions: stat.sessions,
    playTime: Math.floor(stat.playTime / 60), // в минутах
    crashes: stat.crashes,
    connectionIssues: stat.connectionIssues,
  })) || [];

  // Данные для круговой диаграммы популярных серверов
  const popularServersData = analytics?.popularServers
    .map(s => ({
      name: `${s.serverAddress || 'Unknown'}:${s.serverPort || 25565}`,
      value: s.launches,
    }))
    .slice(0, 8) || [];

  // Данные для столбчатой диаграммы популярных профилей
  const popularProfilesChartData = analytics?.popularProfiles
    .map(p => ({
      name: getProfileName(p.profileId),
      launches: p.launches,
    }))
    .slice(0, 10) || [];

  // Данные для столбчатой диаграммы активных пользователей
  const activeUsersChartData = analytics?.activeUsers
    .map(u => ({
      name: getUserName(u.userId),
      launches: u.launches,
    }))
    .slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Analytics and metrics overview</p>
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
          className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 hover:bg-white/5 transition-colors shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-3xl font-bold text-white">
              {analytics?.activeUsers.length || 0}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Active Users</p>
          <p className="text-gray-500 text-xs mt-1">
            {analytics?.totalSessions || 0} total sessions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 hover:bg-white/5 transition-colors shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Play className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-3xl font-bold text-white">
              {analytics?.totalLaunches || 0}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Launches</p>
          <p className="text-gray-500 text-xs mt-1">
            {analytics?.totalSessions || 0} sessions completed
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 hover:bg-white/5 transition-colors shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-3xl font-bold text-white">
              {analytics ? formatTime(analytics.totalPlayTime) : '0m'}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Play Time</p>
          <p className="text-gray-500 text-xs mt-1">
            {analytics && analytics.totalSessions > 0
              ? formatTime(Math.floor(analytics.totalPlayTime / analytics.totalSessions))
              : '0m'} avg session
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 hover:bg-white/5 transition-colors shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-3xl font-bold text-white">
              {(analytics?.totalCrashes || 0) + (analytics?.totalConnectionIssues || 0)}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Issues</p>
          <p className="text-gray-500 text-xs mt-1">
            {analytics?.totalCrashes || 0} crashes, {analytics?.totalConnectionIssues || 0} connection issues
          </p>
        </motion.div>
      </div>

      {/* Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" />
            Activity Overview
          </h2>
        </div>
        {activityChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={activityChartData}>
              <defs>
                <linearGradient id="colorLaunches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
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
                yAxisId="left"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{ value: 'Minutes', angle: 90, position: 'insideRight', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="launches" 
                stroke="#3b82f6" 
                fillOpacity={1}
                fill="url(#colorLaunches)"
                strokeWidth={2}
                name="Launches"
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="sessions" 
                stroke="#10b981" 
                fillOpacity={1}
                fill="url(#colorSessions)"
                strokeWidth={2}
                name="Sessions"
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="playTime" 
                stroke="#8b5cf6" 
                fillOpacity={1}
                fill="url(#colorPlayTime)"
                strokeWidth={2}
                name="Play Time (min)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-gray-400">
            No data available
          </div>
        )}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues Chart */}
        {activityChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Issues Over Time
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityChartData}>
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="crashes" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Crashes"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="connectionIssues" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Connection Issues"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Popular Servers Pie Chart */}
        {popularServersData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-green-400" />
                Popular Servers
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={popularServersData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split(':')[0]}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {popularServersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Profiles */}
        {popularProfilesChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Popular Profiles
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularProfilesChartData} layout="vertical">
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
                  fill="#3b82f6"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Active Users */}
        {activeUsersChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Most Active Users
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activeUsersChartData} layout="vertical">
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
                  fill="#8b5cf6"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Servers Table */}
        {analytics && analytics.popularServers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Popular Servers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Server</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Launches</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.popularServers.slice(0, 10).map((server, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        {server.serverAddress || 'Unknown'}:{server.serverPort || 25565}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {server.launches}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Active Users Table */}
        {analytics && analytics.activeUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Active Users
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">User</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Launches</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.activeUsers.slice(0, 10).map((user, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        {getUserName(user.userId)}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {user.launches}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Popular Profiles Table */}
      {analytics && analytics.popularProfiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Popular Profiles
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Profile</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Launches</th>
                </tr>
              </thead>
              <tbody>
                {analytics.popularProfiles.slice(0, 15).map((profile, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">
                      {getProfileName(profile.profileId)}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {profile.launches}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {(!analytics || analytics.totalLaunches === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-12 text-center shadow-lg"
        >
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No analytics data available</p>
          <p className="text-gray-500 text-sm mt-2">
            Analytics will appear here once users start playing
          </p>
        </motion.div>
      )}
    </div>
  );
}
