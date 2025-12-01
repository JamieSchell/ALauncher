/**
 * Notification Center Component
 * Отображает уведомления пользователя с возможностью управления
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  AlertCircle, 
  Download, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Info,
  Settings,
  Filter,
  Loader2
} from 'lucide-react';
import { Notification, NotificationType } from '../api/notifications';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { useFormatDate } from '../hooks/useFormatDate';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '../hooks/api';

interface NotificationCenterProps {
  className?: string;
}

const notificationTypeIcons: Record<NotificationType, React.ComponentType<any>> = {
  CLIENT_UPDATE_AVAILABLE: Download,
  SERVER_STATUS_CHANGE: Wifi,
  LAUNCHER_UPDATE_AVAILABLE: Download,
  GAME_CRASH: AlertTriangle,
  CONNECTION_ISSUE: WifiOff,
  LAUNCHER_ERROR: AlertCircle,
  SYSTEM_MESSAGE: Info,
  ADMIN_ALERT: AlertTriangle,
};

const notificationTypeColors: Record<NotificationType, string> = {
  CLIENT_UPDATE_AVAILABLE: 'bg-info-bg text-info-400 border-info-border',
  SERVER_STATUS_CHANGE: 'bg-success-bg text-success-400 border-success-border',
  LAUNCHER_UPDATE_AVAILABLE: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
  GAME_CRASH: 'bg-error-bg text-error-400 border-error-border',
  CONNECTION_ISSUE: 'bg-warning-bg text-warning-400 border-warning-border',
  LAUNCHER_ERROR: 'bg-error-bg text-error-400 border-error-border',
  SYSTEM_MESSAGE: 'bg-surface-base text-body border-white/10',
  ADMIN_ALERT: 'bg-error-bg text-error-400 border-error-border',
};

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuthStore();
  const { shouldAnimate, getAnimationProps } = useOptimizedAnimation();

  // Fetch notifications (максимум 10)
  const { data: notificationsData, isLoading } = useNotifications(
    { limit: 10, unreadOnly: showUnreadOnly },
    { refetchInterval: 10000 } // Poll every 10 seconds
  );

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  // Mutations
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Show desktop notification for new unread notifications
  useEffect(() => {
    if (notifications.length > 0 && unreadCount > 0 && window.electronAPI) {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        const latest = unreadNotifications[0];
        // Only show desktop notification if window is not focused
        if (!document.hasFocus()) {
          window.electronAPI.showNotification(latest.title, latest.message).catch(console.error);
        }
      }
    }
  }, [notifications, unreadCount]);

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const { formatRelativeTime, formatDate: formatDateLocalized } = useFormatDate();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button - Premium Design */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
        transition={getAnimationProps({ duration: 0.2 })}
        whileHover={shouldAnimate ? { 
          scale: 1.1, 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
        } : undefined}
        whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
        className="relative p-2 rounded-lg bg-gradient-to-br from-surface-elevated/95 to-surface-base/90 backdrop-blur-xl border border-white/15 hover:border-primary-500/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-primary-500/20 group"
        aria-label={t('notifications.title')}
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="relative">
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Bell className="w-5 h-5 text-white/80 group-hover:text-primary-400 transition-colors duration-300 relative z-10" strokeWidth={2.5} />
        </div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={shouldAnimate ? { scale: [0, 1.2, 1] } : { scale: 1 }}
            transition={shouldAnimate ? { duration: 0.3, ease: "easeOut" } : {}}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-error-500 to-error-600 rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg shadow-error-500/50 border border-error-400/30"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: -10, scale: 0.95 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : false}
            exit={shouldAnimate ? { opacity: 0, y: -10, scale: 0.95 } : false}
            transition={getAnimationProps({ duration: 0.2 })}
            className="absolute right-0 top-full mt-2 w-96 bg-gradient-to-br from-surface-elevated to-surface-base border border-white/15 rounded-2xl shadow-2xl shadow-black/40 z-50 max-h-[600px] flex flex-col overflow-hidden"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
            
            <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 lg:p-5 border-b border-white/10 flex items-center justify-between bg-surface-base">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                  whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
                >
                  <Bell className="w-5 h-5 text-primary-400" strokeWidth={2.5} />
                </motion.div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-heading">{t('notifications.title')}</h3>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={shouldAnimate ? { scale: 0 } : false}
                      animate={shouldAnimate ? { scale: 1 } : false}
                      className="px-2 py-0.5 bg-gradient-to-r from-error-500/20 to-error-600/20 text-error-400 border border-error-500/30 rounded-lg text-xs font-semibold shadow-sm shadow-error-500/20"
                    >
                      {unreadCount} {t('notifications.new')}
                    </motion.span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    showUnreadOnly 
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-sm shadow-primary-500/10' 
                      : 'text-body-muted hover:bg-white/10 hover:text-heading border border-transparent'
                  }`}
                  title={t('notifications.showUnreadOnly')}
                >
                  <Filter className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <motion.button
                        onClick={() => markAllAsReadMutation.mutate()}
                        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                        whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                        className="p-2 rounded-lg hover:bg-success-500/20 hover:text-success-400 transition-all duration-200 text-body-muted border border-transparent hover:border-success-500/30"
                        title={t('notifications.markAllAsRead')}
                        disabled={markAllAsReadMutation.isPending}
                      >
                        {markAllAsReadMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                        )}
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => deleteAllMutation.mutate()}
                      whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                      whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                      className="p-2 rounded-lg hover:bg-error-500/20 hover:text-error-400 transition-all duration-200 text-body-muted border border-transparent hover:border-error-500/30"
                      title={t('notifications.deleteAll')}
                      disabled={deleteAllMutation.isPending}
                    >
                      {deleteAllMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </motion.button>
                  </>
                )}
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                  className="p-2 rounded-lg hover:bg-white/10 hover:text-heading transition-all duration-200 text-body-muted border border-transparent"
                  title={t('common.close')}
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-surface-base border border-white/10 rounded-xl">
                      <div className="w-10 h-10 bg-surface-elevated rounded-xl animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-surface-elevated rounded-lg animate-pulse" />
                        <div className="h-3 w-1/2 bg-surface-elevated rounded-lg animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={shouldAnimate ? { scale: 0, rotate: -180 } : false}
                    animate={shouldAnimate ? { scale: 1, rotate: 0 } : false}
                    transition={getAnimationProps({ duration: 0.5 })}
                    className="w-16 h-16 mx-auto mb-4 p-4 bg-surface-base rounded-2xl border border-white/10"
                  >
                    <Bell className="w-8 h-8 text-body-dim mx-auto" strokeWidth={2} />
                  </motion.div>
                  <p className="text-body-muted text-sm font-medium">
                    {showUnreadOnly ? t('notifications.noUnread') : t('notifications.noNotifications')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => {
                    const Icon = notificationTypeIcons[notification.type];
                    const colorClass = notificationTypeColors[notification.type];

                    return (
                      <motion.div
                        key={notification.id}
                        initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                        animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                        transition={getAnimationProps({ duration: 0.3 })}
                        whileHover={shouldAnimate ? { x: 4 } : undefined}
                        className={`p-4 lg:p-5 hover:bg-surface-hover transition-all duration-200 rounded-xl border border-transparent hover:border-white/10 ${
                          !notification.read ? 'bg-primary-500/10 border-primary-500/20' : 'bg-surface-base'
                        }`}
                      >
                        <div className="flex items-start gap-3 lg:gap-4">
                          <motion.div 
                            className={`p-2.5 lg:p-3 rounded-xl ${colorClass} flex-shrink-0 shadow-sm`}
                            whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
                          >
                            <Icon size={18} strokeWidth={2.5} />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-bold text-heading leading-tight">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <motion.div 
                                  initial={shouldAnimate ? { scale: 0 } : false}
                                  animate={shouldAnimate ? { scale: 1 } : false}
                                  className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm shadow-primary-500/50"
                                />
                              )}
                            </div>
                            <p className="text-xs text-body-muted mb-3 leading-relaxed whitespace-pre-wrap">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-body-dim font-medium">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <motion.button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                                    whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                                    className="p-1.5 rounded-lg hover:bg-success-500/20 hover:text-success-400 transition-all duration-200 text-body-muted border border-transparent hover:border-success-500/30"
                                    title={t('notifications.markAsRead')}
                                  >
                                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                  </motion.button>
                                )}
                                <motion.button
                                  onClick={() => handleDelete(notification.id)}
                                  whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                                  whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                                  className="p-1.5 rounded-lg hover:bg-error-500/20 hover:text-error-400 transition-all duration-200 text-body-muted border border-transparent hover:border-error-500/30"
                                  title={t('notifications.delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 lg:p-4 border-t border-white/10 bg-surface-base">
                <motion.button
                  onClick={() => {
                    // Navigate to notifications settings page
                    window.location.href = '/settings?tab=notifications';
                  }}
                  whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-body-muted hover:text-heading hover:bg-surface-hover rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-transparent hover:border-white/10"
                >
                  <Settings className="w-4 h-4" strokeWidth={2.5} />
                  <span>{t('notifications.settings')}</span>
                </motion.button>
              </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

