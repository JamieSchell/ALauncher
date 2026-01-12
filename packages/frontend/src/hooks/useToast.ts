/**
 * Toast Hook for managing toast notifications
 * Uses Tauri dialogs for beautiful native alerts
 */

import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/Toast';
import { tauriApi, isTauri } from '../api/tauri';

let toastIdCounter = 0;

export function useToast() {
  const showToast = useCallback(async (message: string, type: ToastType = 'info', duration?: number) => {
    try {
      if (isTauri) {
        // Use Tauri native dialogs
        const title = type === 'success' ? '✓ Success' 
                   : type === 'error' ? '✗ Error'
                   : type === 'warning' ? '⚠ Warning'
                   : 'ℹ Info';
        
        await tauriApi.showMessageBox({
          title: `ALauncher - ${title}`,
          message: message,
          type: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info',
        });
      } else {
        // Fallback to browser alert in web mode
        alert(`[${type.toUpperCase()}] ${message}`);
      }
    } catch (error) {
      console.error('Failed to show toast:', error);
      // Fallback to browser alert
      alert(`[${type.toUpperCase()}] ${message}`);
    }
    
    const id = `toast-${++toastIdCounter}`;
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    // No-op for dialogs
  }, []);

  const showSuccess = useCallback(async (message: string, duration?: number) => {
    return await showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback(async (message: string, duration?: number) => {
    return await showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback(async (message: string, duration?: number) => {
    return await showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback(async (message: string, duration?: number) => {
    return await showToast(message, 'info', duration);
  }, [showToast]);

  return {
    toasts: [], // Always empty for dialogs
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
  };
}

