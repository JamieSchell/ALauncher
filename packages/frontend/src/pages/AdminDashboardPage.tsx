/**
 * Admin Dashboard Page - Полный Dashboard с метриками для администраторов
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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
import { Card, Button } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, FileWarning, Box, ArrowRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const COLORS = ['#B026FF', '#00F5FF', '#4A9EFF', '#00FFB3', '#FF9500', '#FF3B3B', '#FF2D95', '#6366f1'];

const DashboardAction = ({ title, description, icon: Icon, color, onClick }: { title: string, description: string, icon: any, color: 'cyan' | 'red' | 'purple', onClick: () => void }) => {
  const colors = {
    cyan: 'group-hover:text-techno-cyan group-hover:border-techno-cyan',
    red: 'group-hover:text-status-error group-hover:border-status-error',
    purple: 'group-hover:text-magic-purple group-hover:border-magic-purple',
  };

  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer bg-dark-card border border-white/5 p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg clip-cyber-corner ${colors[color]}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 rounded bg-dark-panel flex items-center justify-center mb-4 border border-white/10 group-hover:border-current transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xs font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-xs mb-4">{description}</p>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
          Access Terminal <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

const HealthBar = ({ label, value, max, unit, color = 'bg-techno-cyan' }: { label: string, value: number, max: number, unit: string, color?: string }) => {
  const width = (value / max) * 100;
  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="w-32 text-gray-400 font-mono">{label}</div>
      <div className="flex-1 h-2 bg-dark-primary rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <div className="w-16 text-right font-bold text-white">{value}{unit}</div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        <Loader2 className="w-8 h-8 text-techno-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="border-b border-status-warning/20 pb-6">
        <h1 className="text-base font-display font-bold text-white mb-1 flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-status-warning" />
          {t('admin.commandCenter')}
        </h1>
        <p className="text-status-warning/70 font-mono text-xs tracking-widest">AUTHORIZED PERSONNEL ONLY // LEVEL 5 CLEARANCE</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardAction 
          title={t('admin.userManagement')} 
          description="Manage accounts, roles, and bans."
          icon={Users}
          color="cyan"
          onClick={() => navigate('/admin/users')}
        />
        <DashboardAction 
          title={t('admin.crashReports')} 
          description="Analyze stack traces and resolve tickets."
          icon={FileWarning}
          color="red"
          onClick={() => navigate('/admin/crashes')}
        />
        <DashboardAction 
          title={t('admin.manageProfiles')} 
          description="Edit modpacks and launcher profiles."
          icon={Box}
          color="purple"
          onClick={() => navigate('/admin/profiles')}
        />
      </div>

      {/* Live System Health */}
      <Card className="border border-status-warning/20">
        <div className="flex items-center gap-2 mb-6">
           <Activity className="w-5 h-5 text-status-warning animate-pulse" />
           <h3 className="text-status-warning font-bold uppercase tracking-wider text-xs">{t('admin.systemHealth')}</h3>
        </div>
        
        <div className="space-y-4">
          <HealthBar label={t('admin.databaseLatency')} value={12} max={100} unit="ms" />
          <HealthBar label={t('admin.authServerLoad')} value={45} max={100} unit="%" />
          <HealthBar label={t('admin.cdnThroughput')} value={78} max={100} unit="%" color="bg-magic-purple" />
          <HealthBar label="Error Rate" value={2} max={100} unit="%" color="bg-status-success" />
        </div>
      </Card>

      {/* Old Summary Cards - Keeping for compatibility */}
      <div style={{ display: 'none' }}>
        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          
        >
          <div >
            <div >
              <Users  />
            </div>
            <span >
              {analytics?.activeUsers.length || 0}
            </span>
          </div>
          <p >Active Users</p>
          <p >
            {analytics?.totalSessions || 0} total sessions
          </p>
        </div>

        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          
        >
          <div >
            <div >
              <Play  />
            </div>
            <span >
              {analytics?.totalLaunches || 0}
            </span>
          </div>
          <p >Total Launches</p>
          <p >
            {analytics?.totalSessions || 0} sessions completed
          </p>
        </div>

        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          
        >
          <div >
            <div >
              <Clock  />
            </div>
            <span >
              {analytics ? formatTime(analytics.totalPlayTime) : '0m'}
            </span>
          </div>
          <p >Total Play Time</p>
          <p >
            {analytics && analytics.totalSessions > 0
              ? formatTime(Math.floor(analytics.totalPlayTime / analytics.totalSessions))
              : '0m'} avg session
          </p>
        </div>

        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          
        >
          <div >
            <div >
              <AlertTriangle  />
            </div>
            <span >
              {(analytics?.totalCrashes || 0) + (analytics?.totalConnectionIssues || 0)}
            </span>
          </div>
          <p >Total Issues</p>
          <p >
            {analytics?.totalCrashes || 0} crashes, {analytics?.totalConnectionIssues || 0} connection issues
          </p>
        </div>
      </div>

      {/* Activity Chart */}
      <div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        
      >
        <div >
          <h2 >
            <Activity  />
            Activity Overview
          </h2>
        </div>
        {activityChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={activityChartData}>
              <defs>
                <linearGradient id="colorLaunches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4A9EFF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4A9EFF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFB3" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00FFB3" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPlayTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B026FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#B026FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6B7280' }}
                label={{ value: 'Minutes', angle: 90, position: 'insideRight', style: { fill: '#6B7280', fontSize: '10px' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A2332',
                  border: '1px solid rgba(0,245,255,0.3)',
                  borderRadius: '4px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#00F5FF' }}
              />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="launches" 
                stroke="#4A9EFF" 
                fillOpacity={1}
                fill="url(#colorLaunches)"
                strokeWidth={2}
                name="Launches"
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="sessions" 
                stroke="#00FFB3" 
                fillOpacity={1}
                fill="url(#colorSessions)"
                strokeWidth={2}
                name="Sessions"
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="playTime" 
                stroke="#B026FF" 
                fillOpacity={1}
                fill="url(#colorPlayTime)"
                strokeWidth={2}
                name="Play Time (min)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div >
            No data available
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div >
        {/* Issues Chart */}
        {activityChartData.length > 0 && (
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            
          >
            <div >
              <h2 >
                <XCircle  />
                Issues Over Time
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A2332',
                    border: '1px solid rgba(0,245,255,0.3)',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#00F5FF' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="crashes" 
                  stroke="#FF3B3B" 
                  strokeWidth={2}
                  name="Crashes"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="connectionIssues" 
                  stroke="#FF9500" 
                  strokeWidth={2}
                  name="Connection Issues"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Popular Servers Pie Chart */}
        {popularServersData.length > 0 && (
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            
          >
            <div >
              <h2 >
                <Server  />
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
                  fill="#B026FF"
                  dataKey="value"
                >
                  {popularServersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A2332',
                    border: '1px solid rgba(176,38,255,0.3)',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#B026FF' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div >
        {/* Popular Profiles */}
        {popularProfilesChartData.length > 0 && (
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            
          >
            <div >
              <h2 >
                <BarChart3  />
                Popular Profiles
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularProfilesChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6B7280' }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A2332',
                    border: '1px solid rgba(0,245,255,0.3)',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#00F5FF' }}
                />
                <Bar 
                  dataKey="launches" 
                  fill="#4A9EFF"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Active Users */}
        {activeUsersChartData.length > 0 && (
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            
          >
            <div >
              <h2 >
                <Users  />
                Most Active Users
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activeUsersChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6B7280' }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A2332',
                    border: '1px solid rgba(0,245,255,0.3)',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#00F5FF' }}
                />
                <Bar 
                  dataKey="launches" 
                  fill="#B026FF"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tables Row */}
      <div >
        {/* Popular Servers Table */}
        {analytics && analytics.popularServers.length > 0 && (
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            
          >
            <h2 >
              <Server  />
              Popular Servers
            </h2>
            <div >
              <table style={{ width: "100%" }}>
                <thead>
                  <tr >
                    <th >Server</th>
                    <th >Launches</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.popularServers.slice(0, 10).map((server, index) => (
                    <tr key={index} >
                      <td >
                        {server.serverAddress || 'Unknown'}:{server.serverPort || 25565}
                      </td>
                      <td >
                        {server.launches}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Active Users Table */}
        {analytics && analytics.activeUsers.length > 0 && (
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            
          >
            <h2 >
              <Users  />
              Active Users
            </h2>
            <div >
              <table style={{ width: "100%" }}>
                <thead>
                  <tr >
                    <th >User</th>
                    <th >Launches</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.activeUsers.slice(0, 10).map((user, index) => (
                    <tr key={index} >
                      <td >
                        {getUserName(user.userId)}
                      </td>
                      <td >
                        {user.launches}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Popular Profiles Table */}
      {analytics && analytics.popularProfiles.length > 0 && (
        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          
        >
          <h2 >
            <Shield  />
            Popular Profiles
          </h2>
          <div >
            <table style={{ width: "100%" }}>
              <thead>
                <tr >
                  <th >Profile</th>
                  <th >Launches</th>
                </tr>
              </thead>
              <tbody>
                {analytics.popularProfiles.slice(0, 15).map((profile, index) => (
                  <tr key={index} >
                    <td >
                      {getProfileName(profile.profileId)}
                    </td>
                    <td >
                      {profile.launches}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!analytics || analytics.totalLaunches === 0) && (
        <div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          
        >
          <BarChart3  />
          <p >No analytics data available</p>
          <p >
            Analytics will appear here once users start playing
          </p>
        </div>
      )}
    </div>
  );
}
