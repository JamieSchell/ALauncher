/**
 * Sidebar Navigation Component
 * 
 * Боковая панель навигации приложения.
 * Включает:
 * - Навигационные ссылки (Home, Settings, Profile, Statistics, Admin)
 * - Информацию о пользователе (аватар, имя)
 * - Кнопку выхода
 * - Адаптивное поведение (сворачивание на мобильных устройствах)
 * 
 * @component
 * @example
 * ```tsx
 * import { Sidebar } from '@/components/layout';
 * 
 * function App() {
 *   return (
 *     <>
 *       <Sidebar />
 *       <div>Rest of app content</div>
 *     </>
 *   );
 * }
 * ```
 */

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Settings, User, LogOut, Shield, AlertTriangle, Users, BarChart3, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { authAPI } from '../../api/auth';
import { useUserProfile } from '../../hooks/api';
import PlayerHead from '../PlayerHead';
import { useTranslation } from '../../hooks/useTranslation';
import { useOptimizedAnimation } from '../../hooks/useOptimizedAnimation';

/**
 * Sidebar Navigation Component
 * 
 * @returns Sidebar with navigation links, user info, and logout button
 */
export default function Sidebar() {
  const location = useLocation();
  const { playerProfile, clearAuth, isAdmin } = useAuthStore();
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { shouldAnimate, getAnimationProps } = useOptimizedAnimation();
  
  // Get user profile to access skinUrl
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

  // Check screen size and handle mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth < 1024) {
        setIsCollapsed(true); // Auto-collapse on mobile
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="fixed top-16 left-4 z-50 p-2 bg-surface-elevated/90 backdrop-blur-xl border border-white/10 rounded-lg hover:bg-surface-hover transition-all lg:hidden"
          aria-label={isCollapsed ? 'Open navigation' : 'Close navigation'}
        >
          {isCollapsed ? <Menu size={20} className="text-white" /> : <X size={20} className="text-white" />}
        </motion.button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? (isCollapsed ? 0 : 256) : (isCollapsed ? 80 : 256),
          x: isMobile && isCollapsed ? -256 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed lg:relative h-full bg-surface-base/80 backdrop-blur-xl border-r border-white/10 flex flex-col z-40 overflow-visible"
        role="navigation"
        aria-label="Main navigation"
      >
      {/* User Profile Section */}
      <div className={`p-4 lg:p-6 border-b border-white/10 ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
        <Link
          to="/profile"
          className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3'} p-3 bg-surface-elevated rounded-xl hover:bg-surface-hover border border-white/10 hover:border-primary-500/30 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base`}
          aria-label={`View profile for ${playerProfile?.username || 'Player'}`}
          title={isCollapsed && !isMobile ? playerProfile?.username || 'Player' : undefined}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex-shrink-0"
          >
            <PlayerHead
              skinUrl={userProfile?.skinUrl}
              username={playerProfile?.username}
              uuid={userProfile?.uuid || playerProfile?.uuid}
              size={isCollapsed && !isMobile ? 36 : 44}
              className="rounded-lg border-2 border-white/10 group-hover:border-primary-500/50 transition-colors"
            />
          </motion.div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {playerProfile?.username || 'Player'}
              </p>
              <p className="text-xs text-white/70 font-medium">{t('profile.clickToView')}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed && !isMobile ? 'px-2' : 'px-4'} py-4 overflow-y-auto`} aria-label="Navigation menu">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                onClick={() => isMobile && setIsCollapsed(true)}
                className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3'} ${isCollapsed && !isMobile ? 'px-2' : 'px-4'} py-3 rounded-xl mb-2 transition-all relative group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 text-primary-400 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                    : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/10 rounded-xl border border-primary-500/30"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={20} className="relative z-10 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {(!isCollapsed || isMobile) && (
                  <span className="font-semibold relative z-10">{item.label}</span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className={`${isCollapsed && !isMobile ? 'p-2' : 'p-4'} border-t border-white/10`}>
        <motion.button
          whileHover={{ scale: 1.02, x: isCollapsed && !isMobile ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          onKeyDown={handleLogoutKeyDown}
          className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3'} w-full ${isCollapsed && !isMobile ? 'px-2' : 'px-4'} py-3 rounded-xl text-white/70 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-surface-base`}
          aria-label="Logout"
          type="button"
          title={isCollapsed && !isMobile ? t('auth.logout') : undefined}
        >
          <LogOut size={20} aria-hidden="true" className="flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <span className="font-semibold">{t('auth.logout')}</span>
          )}
        </motion.button>
      </div>

      {/* Desktop Toggle Button - Premium Design */}
      {!isMobile && (
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
          transition={getAnimationProps({ duration: 0.2 })}
          whileHover={shouldAnimate ? { 
            scale: 1.1, 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          } : undefined}
          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-2.5 bg-gradient-to-br from-surface-elevated/95 to-surface-base/90 backdrop-blur-xl border border-white/15 rounded-xl hover:border-primary-500/40 transition-all duration-300 z-50 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-primary-500/20 group"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="relative">
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Icon Container */}
            <motion.div
              animate={shouldAnimate && !isCollapsed ? { 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              } : false}
              transition={shouldAnimate && !isCollapsed ? {
                duration: 0.5,
                ease: "easeInOut"
              } : {}}
              className="relative z-10"
            >
              {isCollapsed ? (
                <Menu size={18} className="text-white group-hover:text-primary-400 transition-colors duration-300" strokeWidth={2.5} />
              ) : (
                <X size={18} className="text-white group-hover:text-primary-400 transition-colors duration-300" strokeWidth={2.5} />
              )}
            </motion.div>
          </div>
        </motion.button>
      )}
    </motion.aside>
    </>
  );
}
