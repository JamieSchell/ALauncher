/**
 * Launcher Errors Components for CrashesManagementPage
 */

import React from 'react';
import { motion } from 'framer-motion';
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

  const errorTypeColors: Record<string, string> = {
    PROFILE_LOAD_ERROR: 'bg-blue-500/20 text-blue-300',
    FILE_DOWNLOAD_ERROR: 'bg-yellow-500/20 text-yellow-300',
    API_ERROR: 'bg-red-500/20 text-red-300',
    AUTHENTICATION_ERROR: 'bg-orange-500/20 text-orange-300',
    VALIDATION_ERROR: 'bg-purple-500/20 text-purple-300',
    FILE_SYSTEM_ERROR: 'bg-pink-500/20 text-pink-300',
    NETWORK_ERROR: 'bg-cyan-500/20 text-cyan-300',
    ELECTRON_ERROR: 'bg-indigo-500/20 text-indigo-300',
    JAVA_DETECTION_ERROR: 'bg-teal-500/20 text-teal-300',
    CLIENT_LAUNCH_ERROR: 'bg-rose-500/20 text-rose-300',
    UNKNOWN_ERROR: 'bg-gray-500/20 text-gray-300',
  };

  if (isLoading && errors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <div className="text-center py-12">
        <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No launcher errors found</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-2 max-h-[600px] overflow-y-auto">
      {errors.map((error) => (
        <motion.div
          key={error.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-lg p-4 cursor-pointer hover:bg-white/5 transition-colors shadow-lg ${
            selectedError?.id === error.id ? 'ring-2 ring-primary-500' : ''
          }`}
          onClick={() => onSelectError(error)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${errorTypeColors[error.errorType] || errorTypeColors.UNKNOWN_ERROR}`}>
                  {errorTypeLabels[error.errorType] || error.errorType}
                </span>
                {error.component && (
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                    {error.component}
                  </span>
                )}
                {error.statusCode && (
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                    HTTP {error.statusCode}
                  </span>
                )}
              </div>
              <p className="text-white text-sm font-medium truncate mb-1">
                {error.errorMessage.substring(0, 100)}{error.errorMessage.length > 100 ? '...' : ''}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {error.username && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {error.username}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(error.createdAt)}
                </span>
              </div>
            </div>
            <Eye className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </motion.div>
      ))}
      {isFetchingNext && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Code className="w-6 h-6 text-purple-400" />
            Launcher Error Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Error Type</label>
              <p className="text-white font-medium">{errorTypeLabels[error.errorType] || error.errorType}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Date</label>
              <p className="text-white">{formatDate(error.createdAt)}</p>
            </div>
            {error.username && (
              <div>
                <label className="text-xs text-gray-400">User</label>
                <p className="text-white">{error.username}</p>
              </div>
            )}
            {error.component && (
              <div>
                <label className="text-xs text-gray-400">Component</label>
                <p className="text-white">{error.component}</p>
              </div>
            )}
            {error.action && (
              <div>
                <label className="text-xs text-gray-400">Action</label>
                <p className="text-white">{error.action}</p>
              </div>
            )}
            {error.url && (
              <div>
                <label className="text-xs text-gray-400">URL</label>
                <p className="text-white break-all">{error.url}</p>
              </div>
            )}
            {error.statusCode && (
              <div>
                <label className="text-xs text-gray-400">HTTP Status</label>
                <p className="text-white">{error.statusCode}</p>
              </div>
            )}
            {error.os && (
              <div>
                <label className="text-xs text-gray-400">OS</label>
                <p className="text-white">{error.os}{error.osVersion ? ` ${error.osVersion}` : ''}</p>
              </div>
            )}
            {error.launcherVersion && (
              <div>
                <label className="text-xs text-gray-400">Launcher Version</label>
                <p className="text-white">{error.launcherVersion}</p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Error Message</label>
            <pre className="bg-black/30 p-4 rounded-lg text-sm text-red-300 overflow-x-auto whitespace-pre-wrap">
              {error.errorMessage}
            </pre>
          </div>

          {error.stackTrace && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Stack Trace</label>
              <pre className="bg-black/30 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                {error.stackTrace}
              </pre>
            </div>
          )}

          {error.userAgent && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">User Agent</label>
              <p className="text-gray-300 text-sm break-all">{error.userAgent}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

