/**
 * Hook for launcher update management
 */

import { useState, useEffect, useCallback } from 'react';

// Extend Window interface for Tauri
declare global {
  interface Window {
    __TAURI__?: any;
    electronAPI?: any;
  }
}

import { API_CONFIG } from '../config/api';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { isElectron, isTauri } from '../api/platformSimple';
import { tauriApi } from '../api/tauri';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  fileHash?: string;
  fileSize?: bigint;
  releaseNotes?: string;
  isRequired: boolean;
}

interface UpdateCheckResult {
  hasUpdate: boolean;
  updateInfo?: UpdateInfo;
  isRequired?: boolean;
  error?: string;
}

export function useLauncherUpdate() {
  const [updateCheckResult, setUpdateCheckResult] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const { accessToken } = useAuthStore();
  const { t } = useTranslation();

  // Get current version
  useEffect(() => {
    const getVersion = async () => {
      try {
        // Check if running in Tauri
        if (isTauri) {
          const version = await tauriApi.getAppVersion();
          console.log('[LauncherUpdate] Current Tauri version:', version);
          setCurrentVersion(String(version));
          return;
        }

        // Check if running in Electron (legacy)
        if (isElectron) {
          const version = await (window as any).electronAPI.getAppVersion();
          console.log('[LauncherUpdate] Current Electron version:', version);
          setCurrentVersion(String(version));
          return;
        }

        // In browser mode, use package.json version or default
        console.log('[LauncherUpdate] Running in browser mode, using default version');
        setCurrentVersion('1.0.143'); // Default version for browser
      } catch (error) {
        console.error('[LauncherUpdate] Failed to get app version:', error);
        // Fallback to default version
        setCurrentVersion('1.0.143');
      }
    };
    getVersion();
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async (silent = false) => {
    if (!currentVersion) {
      console.warn('[LauncherUpdate] Current version not available yet');
      return;
    }

    if (!silent) {
      setIsChecking(true);
    }

    console.log(`[LauncherUpdate] Checking for updates... (current: ${currentVersion}, API: ${API_CONFIG.baseUrl})`);

    try {
      // Check if running in Tauri
      if (isTauri) {
        // For Tauri, updates are handled differently - use Tauri's built-in updater
        // For now, disable update checks in Tauri mode
        console.log('[LauncherUpdate] Running in Tauri mode, update check not yet implemented');
        setUpdateCheckResult({
          hasUpdate: false,
          error: undefined,
        });
        if (!silent) {
          setIsChecking(false);
        }
        return;
      }

      // Check if running in Electron (legacy)
      if (isElectron) {
        const result = await (window as any).electronAPI.checkLauncherUpdate(currentVersion, API_CONFIG.baseUrl, accessToken || undefined);

        console.log('[LauncherUpdate] Update check result:', result);

        if (result.success) {
          if (result.hasUpdate) {
            console.log(`[LauncherUpdate] Update available! New version: ${result.updateInfo?.version}`);
          } else {
            console.log('[LauncherUpdate] No updates available');
          }

          setUpdateCheckResult({
            hasUpdate: result.hasUpdate || false,
            updateInfo: result.updateInfo,
            isRequired: result.isRequired,
          });
        } else {
          console.error('[LauncherUpdate] Update check failed:', result.error);
          setUpdateCheckResult({
            hasUpdate: false,
            error: result.error,
          });
        }
      } else {
        // In browser mode, skip update check
        console.log('[LauncherUpdate] Running in browser mode, skipping update check');
        setUpdateCheckResult({
          hasUpdate: false,
          error: t('settings.updateCheckDesktopOnly'),
        });
      }
    } catch (error) {
      console.error('[LauncherUpdate] Error checking for updates:', error);
      setUpdateCheckResult({
        hasUpdate: false,
        error: (error as Error).message,
      });
    } finally {
      if (!silent) {
        setIsChecking(false);
      }
    }
  }, [currentVersion, t, accessToken]);

  // Auto-check on mount (silent) - only run once
  useEffect(() => {
    if (currentVersion) {
      // Wait a bit before checking to avoid blocking initial load
      const timer = setTimeout(() => {
        checkForUpdates(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVersion]); // Only run when currentVersion changes, not on checkForUpdates changes

  return {
    updateCheckResult,
    isChecking,
    currentVersion,
    checkForUpdates,
  };
}

