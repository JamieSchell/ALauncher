/**
 * Notification Center Component
 * Отображает уведомления пользователя с возможностью управления
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { notificationsAPI, Notification, NotificationType } from '../api/notifications';
import { useAuthStore } from '../stores/authStore';

interface NotificationCenterProps {
  className?: string;
}

const notificationTypeIcons: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  CLIENT_UPDATE_AVAILABLE: Download,
  SERVER_STATUS_CHANGE: Wifi,
  GAME_CRASH: AlertTriangle,
  CONNECTION_ISSUE: WifiOff,
  LAUNCHER_ERROR: AlertCircle,
  SYSTEM_MESSAGE: Info,
  ADMIN_ALERT: AlertTriangle,
};

const notificationTypeColors: Record<NotificationType, string> = {
  CLIENT_UPDATE_AVAILABLE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  SERVER_STATUS_CHANGE: 'bg-green-500/20 text-green-300 border-green-500/30',
  GAME_CRASH: 'bg-red-500/20 text-red-300 border-red-500/30',
  CONNECTION_ISSUE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  LAUNCHER_ERROR: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  SYSTEM_MESSAGE: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  ADMIN_ALERT: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: () => notificationsAPI.getNotifications({ 
      limit: 50, 
      unreadOnly: showUnreadOnly 
    }),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete all mutation
  const deleteAllMutation = useMutation({
    mutationFn: () => notificationsAPI.deleteAllNotifications({ readOnly: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 glass rounded-xl shadow-2xl border border-white/10 z-50 max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-400" />
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
                    showUnreadOnly ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400'
                  }`}
                  title="Show unread only"
                >
                  <Filter className="w-4 h-4" />
                </button>
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsReadMutation.mutate()}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        title="Mark all as read"
                        disabled={markAllAsReadMutation.isPending}
                      >
                        {markAllAsReadMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => deleteAllMutation.mutate()}
                      className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-red-400"
                      title="Delete all"
                      disabled={deleteAllMutation.isPending}
                    >
                      {deleteAllMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
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
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-white/5 transition-colors ${
                          !notification.read ? 'bg-primary-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-white">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mb-2 whitespace-pre-wrap">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatDate(notification.createdAt)}
                              </span>
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-green-400"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(notification.id)}
                                  className="p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
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
              <div className="p-3 border-t border-white/10">
                <button
                  onClick={() => {
                    // Navigate to notifications settings page
                    window.location.href = '/settings?tab=notifications';
                  }}
                  className="w-full px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Notification Settings</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

