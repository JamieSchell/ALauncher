/**
 * Notification Service
 * Централизованный сервис для создания уведомлений
 */

import { notificationsAPI, NotificationType } from '../api/notifications';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { downloadsAPI } from '../api/downloads';

interface CreateNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  showDesktop?: boolean;
  sound?: boolean;
}

/**
 * Create a notification if user has enabled it in settings
 */
export async function createNotification(options: CreateNotificationOptions): Promise<void> {
  try {
    const { playerProfile } = useAuthStore.getState();
    // PlayerProfile doesn't have 'id', check uuid instead
    if (!playerProfile?.uuid) {
      return; // User not logged in
    }

    const settings = useSettingsStore.getState();
    const notificationSettings = settings.notifications || {};

    // Check if this notification type is enabled
    const typeEnabled = getNotificationTypeEnabled(options.type, notificationSettings);
    if (!typeEnabled) {
      return; // Notification type is disabled
    }

    // Check if desktop notifications are enabled
    const desktopEnabled = notificationSettings.desktop ?? true;
    const soundEnabled = notificationSettings.sound ?? true;

    // Create notification in database
    // PlayerProfile doesn't have 'id', use uuid as identifier
    await notificationsAPI.createNotification({
      type: options.type,
      title: options.title,
      message: options.message,
      userId: (playerProfile as any)?.id || playerProfile.uuid,
      data: options.data,
    });

    // Show desktop notification if enabled
    if (desktopEnabled && (options.showDesktop !== false) && window.electronAPI) {
      try {
        await window.electronAPI.showNotification(
          options.title,
          options.message,
          {
            sound: soundEnabled && (options.sound !== false),
          }
        );
      } catch (error) {
        console.error('Failed to show desktop notification:', error);
      }
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Get whether a notification type is enabled in settings
 */
function getNotificationTypeEnabled(type: NotificationType, settings: any): boolean {
  switch (type) {
    case 'CLIENT_UPDATE_AVAILABLE':
      return settings.clientUpdates !== false;
    case 'SERVER_STATUS_CHANGE':
      return settings.serverStatus !== false;
    case 'GAME_CRASH':
      return settings.gameCrashes !== false;
    case 'CONNECTION_ISSUE':
      return settings.connectionIssues !== false;
    case 'LAUNCHER_ERROR':
      return settings.launcherErrors !== false;
    case 'SYSTEM_MESSAGE':
      return settings.systemMessages !== false;
    case 'ADMIN_ALERT':
      return true; // Always enabled for admins
    default:
      return true;
  }
}

/**
 * Check for client updates and create notification
 */
export async function checkClientUpdates(currentVersion: string): Promise<void> {
  try {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;
    
    // Get all available client versions using downloadsAPI
    const versionsData = await downloadsAPI.getClientVersions();
    if (!versionsData.success || !versionsData.data) return;
    
    const versions = versionsData.data as Array<{ version: string; title: string }>;
    
    // Check if there's a newer version
    const currentVersionParts = currentVersion.split('.').map(Number);
    const newerVersions = versions.filter(v => {
      const vParts = v.version.split('.').map(Number);
      // Simple version comparison
      for (let i = 0; i < Math.max(currentVersionParts.length, vParts.length); i++) {
        const current = currentVersionParts[i] || 0;
        const other = vParts[i] || 0;
        if (other > current) return true;
        if (other < current) return false;
      }
      return false;
    });
    
    if (newerVersions.length > 0) {
      const latest = newerVersions[0];
      await createNotification({
        type: 'CLIENT_UPDATE_AVAILABLE',
        title: 'New Client Version Available',
        message: `A new version of Minecraft client is available: ${latest.title} (${latest.version})`,
        data: { version: latest.version, title: latest.title },
      });
    }
  } catch (error) {
    console.error('Failed to check for client updates:', error);
  }
}


