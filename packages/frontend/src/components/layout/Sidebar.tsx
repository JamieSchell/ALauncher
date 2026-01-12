/**
 * Cyberpunk Sidebar Navigation
 * Techno-Magic Design System
 */

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Settings, User, LogOut, Shield, AlertTriangle, Users, BarChart2, LayoutDashboard, Hexagon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { authAPI } from '../../api/auth';
import { useUserProfile } from '../../hooks/api';
import PlayerHead from '../PlayerHead';
import { useTranslation } from '../../hooks/useTranslation';

export default function Sidebar() {
  const location = useLocation();
  const { playerProfile, clearAuth, isAdmin } = useAuthStore();
  const { t } = useTranslation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { data: userProfile } = useUserProfile({
    enabled: !!playerProfile,
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

  const handleLogoutKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLogout();
    }
  };

  const NavItem = ({ path, icon: Icon, label, isActiveOverride }: { path: string, icon: any, label: string, isActiveOverride?: boolean }) => {
    const isActive = isActiveOverride !== undefined ? isActiveOverride : location.pathname === path;
    return (
      <Link
        to={path}
        className={`w-full flex items-center gap-3 px-4 py-3 mb-2 transition-all duration-200 group relative overflow-hidden
          ${isActive ? 'text-dark-primary' : 'text-gray-400 hover:text-white'}
        `}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Active Background Shape */}
        <div className={`absolute inset-0 clip-cyber-diag transition-all duration-300 ${isActive ? 'bg-techno-cyan' : 'bg-transparent hover:bg-white/5'}`} />

        <div className="relative z-10 flex items-center gap-3">
          <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
          {!isSidebarCollapsed && <span className="font-bold tracking-widest uppercase text-xs">{label}</span>}
        </div>

        {/* Active Glow Indicator */}
        {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]" />}
      </Link>
    );
  };

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/statistics', icon: BarChart2, label: t('nav.statistics') },
    { path: '/profile', icon: User, label: t('nav.profile') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  const adminItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') || 'Панель управления' },
  ];

  return (
    <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-80'} flex-shrink-0 bg-dark-secondary border-r border-white/5 flex flex-col transition-all duration-500 relative z-30`}>
      {/* Tech Spine Pattern */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-techno-cyan/50 to-transparent" />

      {/* User Profile Area */}
      <div className="h-32 relative flex items-center justify-center border-b border-white/5 overflow-hidden group">
        <div className="absolute inset-0 bg-rune-pattern opacity-20" />
        <div className={`relative z-10 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-4 px-6 w-full'}`}>
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 border-2 border-techno-cyan rounded-full animate-spin-slow border-dashed" />
            <Link to="/profile" className="block w-full h-full">
              <PlayerHead
                skinUrl={userProfile?.skinUrl}
                username={playerProfile?.username}
                uuid={userProfile?.uuid || playerProfile?.uuid}
                size={56}
              />
            </Link>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-dark-secondary flex items-center justify-center">
              <div className="w-2 h-2 bg-status-success rounded-full animate-pulse shadow-[0_0_5px_#00FFB3]" />
            </div>
          </div>

          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in-up">
              <Link to="/profile" className="block">
                <h3 className="text-white font-display font-bold tracking-wider truncate">{playerProfile?.username || 'Player'}</h3>
                <div className="flex items-center gap-2 text-xs text-techno-cyan font-mono mt-1">
                   <Hexagon className="w-3 h-3" />
                   <span>Lvl.{userProfile?.level || 1}</span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-2 overflow-y-auto custom-scrollbar space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        {isAdmin() && (
          <>
            <div className="my-6 border-t border-white/5 mx-4 relative">
              {!isSidebarCollapsed && (
                <span className="absolute -top-3 left-0 bg-dark-secondary px-2 text-[10px] text-status-warning font-mono tracking-widest">
                  ADMIN NEXUS
                </span>
              )}
            </div>
            {adminItems.map((item) => (
              <NavItem
                key={item.path}
                {...item}
                isActiveOverride={location.pathname.startsWith('/admin')}
              />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 bg-dark-panel/50 backdrop-blur-sm">
         <button
          onClick={handleLogout}
          onKeyDown={handleLogoutKeyDown}
          className={`w-full flex items-center justify-center p-3 text-status-error hover:bg-status-error/10 border border-status-error/20 hover:border-status-error rounded transition-all duration-300 group`}
          type="button"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {!isSidebarCollapsed && <span className="ml-2 font-bold uppercase tracking-widest text-xs">{t('auth.logout')}</span>}
        </button>
      </div>

      {/* Collapse Toggle - Floating */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-12 bg-dark-card border border-techno-cyan/50 clip-hex-button flex items-center justify-center text-techno-cyan hover:bg-techno-cyan hover:text-dark-primary transition-colors z-50 shadow-neon-cyan"
        aria-label="Toggle sidebar"
      >
        <div className="w-0.5 h-4 bg-current" />
      </button>
    </aside>
  );
}
