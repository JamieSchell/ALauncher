/**
 * Sidebar navigation
 */

import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, User, LogOut, Shield, AlertTriangle, Users, BarChart3, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../api/auth';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../api/users';
import PlayerHead from './PlayerHead';
import { useTranslation } from '../hooks/useTranslation';

export default function Sidebar() {
  const location = useLocation();
  const { playerProfile, clearAuth, isAdmin } = useAuthStore();
  const { t } = useTranslation();
  
  // Get user profile to access skinUrl
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: usersAPI.getProfile,
    enabled: !!playerProfile, // Only fetch if playerProfile exists
  });

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuth();
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/profile', icon: User, label: t('nav.profile') },
    { path: '/statistics', icon: BarChart3, label: t('nav.statistics') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
    ...(isAdmin() ? [
      { path: '/admin/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      { path: '/admin/profiles', icon: Shield, label: t('nav.manageProfiles') },
      { path: '/admin/users', icon: Users, label: t('nav.manageUsers') },
      { path: '/admin/crashes', icon: AlertTriangle, label: t('nav.crashes') },
    ] : []),
  ];

  return (
    <aside className="w-64 bg-[#2a2a2a]/80 backdrop-blur-sm border-r border-[#3d3d3d]/50 flex flex-col">
      <div className="p-6">
        <Link
          to="/profile"
          className="flex items-center gap-3 p-3 bg-[#1f1f1f] rounded-lg hover:bg-[#2a2a2a] border border-[#3d3d3d]/50 hover:border-[#6b8e23]/30 transition-all cursor-pointer"
        >
          <PlayerHead
            skinUrl={userProfile?.skinUrl}
            username={playerProfile?.username}
            uuid={userProfile?.uuid || playerProfile?.uuid}
            size={40}
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {playerProfile?.username || 'Player'}
            </p>
            <p className="text-xs text-gray-500">{t('profile.clickToView')}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive
                  ? 'bg-[#6b8e23] text-white border border-[#7a9f35]/30'
                  : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white border border-transparent hover:border-[#3d3d3d]/30'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-[#5a3d3d]/30 hover:text-[#cc6b6b] border border-transparent hover:border-[#8b4a4a]/30 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">{t('auth.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
