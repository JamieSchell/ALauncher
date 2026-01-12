/**
 * Notification Center Component
 * Cyberpunk Design System
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isElectron } from '../api/platformSimple';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Info,
  XCircle
} from 'lucide-react';
import { Notification, NotificationType, notificationsAPI } from '../api/notifications';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { useFormatDate } from '../hooks/useFormatDate';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../hooks/api';

interface NotificationCenterProps {
  className?: string;
}

// Map notification types to display types
const getNotificationDisplayType = (type: NotificationType): 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' => {
  if (type === 'SERVER_STATUS_CHANGE') return 'SUCCESS';
  if (type === 'GAME_CRASH' || type === 'LAUNCHER_ERROR' || type === 'ADMIN_ALERT') return 'ERROR';
  if (type === 'CONNECTION_ISSUE') return 'WARNING';
  return 'INFO';
};

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { formatRelativeTime } = useFormatDate();

  // Fetch notifications (максимум 10)
  const { data: notificationsData, isLoading } = useNotifications(
    { limit: 10 },
    { refetchInterval: 10000 } // Poll every 10 seconds
  );

  // Fetch unread count separately
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    refetchInterval: 10000
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData || 0;

  // Mutations
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

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
    if (notifications.length > 0 && unreadCount > 0 && isElectron) {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        const latest = unreadNotifications[0];
        // Only show desktop notification if window is not focused
        if (!document.hasFocus()) {
          (window as any).electronAPI.showNotification(latest.title, latest.message).catch(console.error);
        }
      }
    }
  }, [notifications, unreadCount]);

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-8 h-8 flex items-center justify-center hover:bg-white/5 transition-colors rounded-full ${
          isOpen ? 'text-techno-cyan bg-white/5' : 'text-gray-400 hover:text-white'
        }`}
        aria-label={t('notifications.title')}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-techno-cyan rounded-full animate-pulse shadow-[0_0_5px_#00F5FF]" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-16 right-4 w-96 z-50 animate-fade-in-up origin-top-right">
          {/* Container with Glassmorphism and Neon Glow */}
          <div className="relative bg-dark-secondary/95 backdrop-blur-xl border border-techno-cyan/30 clip-cyber-corner shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            {/* Glow effect behind */}
            <div className="absolute -inset-1 bg-gradient-to-b from-techno-cyan/20 to-magic-purple/20 blur-xl -z-10 rounded-xl" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-dark-panel/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-techno-cyan animate-pulse" />
                <span className="font-display font-bold tracking-widest text-xs text-white">SYSTEM ALERTS</span>
                {unreadCount > 0 && (
                  <span className="bg-techno-cyan text-dark-primary text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500 font-mono text-xs">
                  LOADING...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-mono text-xs">
                  NO ACTIVE ALERTS
                </div>
              ) : (
                notifications.map((notification) => {
                  const displayType = getNotificationDisplayType(notification.type);
                  
                  return (
                    <div 
                      key={notification.id} 
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                      className={`group relative p-3 rounded bg-dark-panel border transition-all duration-200 cursor-pointer
                        ${notification.read ? 'border-white/5 opacity-60 hover:opacity-100' : 'border-techno-cyan/30 bg-techno-cyan/5'}
                        hover:border-techno-cyan/60
                      `}
                    >
                      {!notification.read && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-techno-cyan shadow-[0_0_5px_#00F5FF]" />
                      )}
                      
                      <div className="flex gap-3">
                        <div className="mt-1">
                          {displayType === 'INFO' && <Info className="w-4 h-4 text-techno-blue" />}
                          {displayType === 'SUCCESS' && <CheckCircle className="w-4 h-4 text-status-success" />}
                          {displayType === 'WARNING' && <AlertTriangle className="w-4 h-4 text-status-warning" />}
                          {displayType === 'ERROR' && <XCircle className="w-4 h-4 text-status-error" />}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-xs font-bold tracking-wide ${displayType === 'ERROR' ? 'text-status-error' : 'text-white'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="mt-2 text-[10px] font-mono text-gray-600 group-hover:text-techno-cyan/70 transition-colors">
                            {formatRelativeTime(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="p-2 border-t border-white/10 bg-dark-panel/30 text-center">
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest transition-colors w-full py-2"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

