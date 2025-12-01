/**
 * Hook for launcher update management
 */

import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../config/api';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../hooks/useTranslation';

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
      // Check if running in Electron
      if (!window.electronAPI) {
        console.log('[LauncherUpdate] Running in browser mode, skipping version check');
        // In browser mode, use package.json version or default
        setCurrentVersion('1.0.143'); // Default version for browser
        return;
      }
      
      try {
        const version = await window.electronAPI.getAppVersion();
        console.log('[LauncherUpdate] Current version:', version);
        setCurrentVersion(version);
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

    // In browser mode, skip update check (updates only work in Electron)
    if (!window.electronAPI) {
      console.log('[LauncherUpdate] Running in browser mode, skipping update check');
      setUpdateCheckResult({
        hasUpdate: false,
        error: t('settings.updateCheckElectronOnly'),
      });
      if (!silent) {
        setIsChecking(false);
      }
      return;
    }

    try {
      const result = await window.electronAPI.checkLauncherUpdate(currentVersion, API_CONFIG.baseUrl, accessToken || undefined);
      
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
  }, [currentVersion]);

  // Auto-check on mount (silent)
  useEffect(() => {
    if (currentVersion) {
      // Wait a bit before checking to avoid blocking initial load
      const timer = setTimeout(() => {
        checkForUpdates(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentVersion, checkForUpdates]);

  return {
    updateCheckResult,
    isChecking,
    currentVersion,
    checkForUpdates,
  };
}

