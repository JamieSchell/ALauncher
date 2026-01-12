/**
 * Launcher Errors Components for CrashesManagementPage - Functionality Only
 */

import React from 'react';
import { Code, Loader2, User, Calendar, Eye, X } from 'lucide-react';
import { LauncherError } from '../api/crashes';

// Launcher Errors List Component
export const LauncherErrorsList = React.forwardRef<HTMLDivElement, {
  errors: LauncherError[];
  isLoading: boolean;
  isFetchingNext?: boolean;
  hasNext?: boolean;
  selectedError: LauncherError | null;
  onSelectError: (error: LauncherError) => void;
  formatDate: (date: string) => string;
}>(({ errors, isLoading, isFetchingNext, hasNext, selectedError, onSelectError, formatDate }, ref) => {
  const errorTypeLabels: Record<string, string> = {
    PROFILE_LOAD_ERROR: 'Profile Load',
    FILE_DOWNLOAD_ERROR: 'File Download',
    API_ERROR: 'API',
    AUTHENTICATION_ERROR: 'Auth',
    VALIDATION_ERROR: 'Validation',
    FILE_SYSTEM_ERROR: 'File System',
    NETWORK_ERROR: 'Network',
    ELECTRON_ERROR: 'Electron',
    JAVA_DETECTION_ERROR: 'Java Detection',
    CLIENT_LAUNCH_ERROR: 'Client Launch',
    UNKNOWN_ERROR: 'Unknown',
  };

  const errorTypeColors: Record<string, { bg: string; text: string }> = {
    PROFILE_LOAD_ERROR: { bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd' },
    FILE_DOWNLOAD_ERROR: { bg: 'rgba(234, 179, 8, 0.2)', text: '#fde047' },
    API_ERROR: { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' },
    AUTHENTICATION_ERROR: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fdba74' },
    VALIDATION_ERROR: { bg: 'rgba(168, 85, 247, 0.2)', text: '#d8b4fe' },
    FILE_SYSTEM_ERROR: { bg: 'rgba(236, 72, 153, 0.2)', text: '#f9a8d4' },
    NETWORK_ERROR: { bg: 'rgba(6, 182, 212, 0.2)', text: '#67e8f9' },
    ELECTRON_ERROR: { bg: 'rgba(99, 102, 241, 0.2)', text: '#a5b4fc' },
    JAVA_DETECTION_ERROR: { bg: 'rgba(20, 184, 166, 0.2)', text: '#5eead4' },
    CLIENT_LAUNCH_ERROR: { bg: 'rgba(244, 63, 94, 0.2)', text: '#fda4af' },
    UNKNOWN_ERROR: { bg: 'rgba(107, 114, 128, 0.2)', text: '#d1d5db' },
  };

  if (isLoading && errors.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <Loader2 style={{ width: '32px', height: '32px', color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Code style={{ width: '64px', height: '64px', color: '#6b7280', margin: '0 auto 16px' }} />
        <p style={{ color: '#9ca3af' }}>No launcher errors found</p>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
      {errors.map((error) => (
        <div
          key={error.id}
          onClick={() => onSelectError(error)}
          style={{
            padding: '16px',
            cursor: 'pointer',
            border: selectedError?.id === error.id ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            backgroundColor: 'rgba(17, 24, 39, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: errorTypeColors[error.errorType]?.bg || errorTypeColors.UNKNOWN_ERROR.bg,
                  color: errorTypeColors[error.errorType]?.text || errorTypeColors.UNKNOWN_ERROR.text
                }}>
                  {errorTypeLabels[error.errorType] || error.errorType}
                </span>
                {error.component && (
                  <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                    {error.component}
                  </span>
                )}
                {error.statusCode && (
                  <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                    HTTP {error.statusCode}
                  </span>
                )}
              </div>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {error.errorMessage.substring(0, 100)}{error.errorMessage.length > 100 ? '...' : ''}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#9ca3af' }}>
                {error.username && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} />
                    {error.username}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {formatDate(error.createdAt)}
                </span>
              </div>
            </div>
            <Eye style={{ width: '20px', height: '20px', color: '#9ca3af', flexShrink: 0 }} />
          </div>
        </div>
      ))}
      {isFetchingNext && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <Loader2 style={{ width: '24px', height: '24px', color: '#6366f1', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    </div>
  );
});

LauncherErrorsList.displayName = 'LauncherErrorsList';

// Launcher Error Detail Modal
export const LauncherErrorDetailModal = ({ error, onClose, formatDate }: { error: LauncherError; onClose: () => void; formatDate: (date: string) => string }) => {
  const errorTypeLabels: Record<string, string> = {
    PROFILE_LOAD_ERROR: 'Profile Load Error',
    FILE_DOWNLOAD_ERROR: 'File Download Error',
    API_ERROR: 'API Error',
    AUTHENTICATION_ERROR: 'Authentication Error',
    VALIDATION_ERROR: 'Validation Error',
    FILE_SYSTEM_ERROR: 'File System Error',
    NETWORK_ERROR: 'Network Error',
    ELECTRON_ERROR: 'Electron Error',
    JAVA_DETECTION_ERROR: 'Java Detection Error',
    CLIENT_LAUNCH_ERROR: 'Client Launch Error',
    UNKNOWN_ERROR: 'Unknown Error',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.6)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '896px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code style={{ width: '24px', height: '24px', color: '#a855f7' }} />
            Launcher Error Details
          </h2>
          <button
            onClick={onClose}
            style={{ padding: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '8px' }}
          >
            <X size={20} style={{ color: '#9ca3af' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af' }}>Error Type</label>
              <p style={{ color: '#fff', fontWeight: '500' }}>{errorTypeLabels[error.errorType] || error.errorType}</p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af' }}>Date</label>
              <p style={{ color: '#fff' }}>{formatDate(error.createdAt)}</p>
            </div>
            {error.username && (
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>User</label>
                <p style={{ color: '#fff' }}>{error.username}</p>
              </div>
            )}
            {error.component && (
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>Component</label>
                <p style={{ color: '#fff' }}>{error.component}</p>
              </div>
            )}
            {error.action && (
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>Action</label>
                <p style={{ color: '#fff' }}>{error.action}</p>
              </div>
            )}
            {error.url && (
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>URL</label>
                <p style={{ color: '#fff', wordBreak: 'break-all' }}>{error.url}</p>
              </div>
            )}
            {error.statusCode && (
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>HTTP Status</label>
                <p style={{ color: '#fff' }}>{error.statusCode}</p>
              </div>
            )}
            {error.os && (
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>OS</label>
                <p style={{ color: '#fff' }}>{error.os}{error.osVersion ? ` ${error.osVersion}` : ''}</p>
              </div>
            )}
            {error.launcherVersion && (
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af' }}>Launcher Version</label>
                <p style={{ color: '#fff' }}>{error.launcherVersion}</p>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', display: 'block' }}>Error Message</label>
            <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontSize: '14px', color: '#fca5a5', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {error.errorMessage}
            </pre>
          </div>

          {error.stackTrace && (
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', display: 'block' }}>Stack Trace</label>
              <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontSize: '14px', color: '#d1d5db', overflowX: 'auto', maxHeight: '256px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {error.stackTrace}
              </pre>
            </div>
          )}

          {error.userAgent && (
            <div>
              <label style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', display: 'block' }}>User Agent</label>
              <p style={{ color: '#d1d5db', fontSize: '14px', wordBreak: 'break-all' }}>{error.userAgent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
