/**
 * Toast Notification Component
 * Displays temporary notifications in the bottom-right corner
 */

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 10000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const colors = {
    success: { background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', color: 'rgb(74, 222, 128)' },
    error: { background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', color: 'rgb(248, 113, 113)' },
    warning: { background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.3)', color: 'rgb(250, 204, 21)' },
    info: { background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', color: 'rgb(96, 165, 250)' },
  };

  const iconPaths = {
    success: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>,
    error: <circle cx="12" cy="12" r="10"></circle>,
    warning: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>,
    info: <circle cx="12" cy="12" r="10"></circle>,
  };

  const extraIcons = {
    success: <polyline points="22 4 12 14.01 9 11.01"></polyline>,
    error: <><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></>,
    warning: <line x1="12" y1="9" x2="12" y2="13"></line>,
    info: <line x1="12" y1="16" x2="12" y2="12"></line>,
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px',
      borderRadius: '12px',
      border: colors[toast.type].border,
      background: colors[toast.type].background,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      minWidth: '300px',
      maxWidth: '400px',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors[toast.type].color} strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
        {iconPaths[toast.type]}
        {extraIcons[toast.type]}
      </svg>
      <p style={{ fontSize: '14px', flex: 1, margin: 0 }}>{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.7 }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
