/**
 * Crashes Management Page - для администраторов
 * Просмотр крэшей игры и проблем подключения к серверу
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, WifiOff, RefreshCw, Loader2, Filter, X, Eye, Calendar, User, Server, Code, Bell } from 'lucide-react';
import { crashesAPI, GameCrash, ServerConnectionIssue, LauncherError } from '../api/crashes';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { useFormatDate } from '../hooks/useFormatDate';
import { LauncherErrorsList, LauncherErrorDetailModal } from './CrashesManagementPage-LauncherErrors';
import { useAuthStore } from '../stores/authStore';

type TabType = 'crashes' | 'connection-issues' | 'launcher-errors';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const issueTypeLabels: Record<string, string> = {
  CONNECTION_REFUSED: 'Connection Refused',
  CONNECTION_TIMEOUT: 'Connection Timeout',
  AUTHENTICATION_FAILED: 'Authentication Failed',
  SERVER_FULL: 'Server Full',
  VERSION_MISMATCH: 'Version Mismatch',
  NETWORK_ERROR: 'Network Error',
  UNKNOWN: 'Unknown',
};

const issueTypeColors: Record<string, string> = {
  CONNECTION_REFUSED: 'bg-red-500/20 text-red-300',
  CONNECTION_TIMEOUT: 'bg-yellow-500/20 text-yellow-300',
  AUTHENTICATION_FAILED: 'bg-orange-500/20 text-orange-300',
  SERVER_FULL: 'bg-purple-500/20 text-purple-300',
  VERSION_MISMATCH: 'bg-blue-500/20 text-blue-300',
  NETWORK_ERROR: 'bg-pink-500/20 text-pink-300',
  UNKNOWN: 'bg-gray-500/20 text-gray-300',
};

export default function CrashesManagementPage() {
  const { role } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('crashes');
  
  // Initialize page load time and mark all existing items as already notified
  useEffect(() => {
    pageLoadTimeRef.current = Date.now();
    console.log('[CrashesManagementPage] Component mounted, role:', role);
    console.log('[CrashesManagementPage] Is admin:', role === 'ADMIN');
    console.log('[CrashesManagementPage] Page load time:', new Date(pageLoadTimeRef.current).toISOString());
    
    // Clear notification tracking when component mounts (fresh start)
    notifiedCrashesRef.current.clear();
    notifiedIssuesRef.current.clear();
    lastCrashIdRef.current = null;
    lastIssueIdRef.current = null;
  }, [role]);
  const [selectedCrash, setSelectedCrash] = useState<GameCrash | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ServerConnectionIssue | null>(null);
  const [selectedLauncherError, setSelectedLauncherError] = useState<LauncherError | null>(null);
  const [filters, setFilters] = useState({
    profileId: '',
    serverAddress: '',
    issueType: '',
    errorType: '',
    component: '',
    limit: 50,
  });
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'crash' | 'issue' | 'launcher-error'; message: string; timestamp: number }>>([]);
  const lastCrashIdRef = useRef<string | null>(null);
  const lastIssueIdRef = useRef<string | null>(null);
  const lastLauncherErrorIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const notifiedCrashesRef = useRef<Set<string>>(new Set()); // Track crashes that already got notifications
  const notifiedIssuesRef = useRef<Set<string>>(new Set()); // Track issues that already got notifications
  const notifiedLauncherErrorsRef = useRef<Set<string>>(new Set()); // Track launcher errors that already got notifications
  const pageLoadTimeRef = useRef<number>(Date.now()); // Track when page was loaded - don't notify for items created before this

  // Debounce filter inputs to avoid excessive API calls
  const debouncedProfileId = useDebounce(filters.profileId, 500);
  const debouncedServerAddress = useDebounce(filters.serverAddress, 500);
  const debouncedComponent = useDebounce(filters.component, 500);

  const crashesListRef = useRef<HTMLDivElement>(null);
  const issuesListRef = useRef<HTMLDivElement>(null);

  // Infinite query for crashes - always enabled, loads data immediately
  const {
    data: crashesData,
    isLoading: crashesLoading,
    isFetchingNextPage: crashesFetchingNext,
    hasNextPage: crashesHasNext,
    fetchNextPage: fetchNextCrashes,
    refetch: refetchCrashes,
  } = useInfiniteQuery({
    queryKey: ['crashes', debouncedProfileId, filters.limit],
    queryFn: ({ pageParam = 0 }) => crashesAPI.getCrashes({ 
      limit: filters.limit,
      offset: pageParam,
      profileId: debouncedProfileId || undefined,
    }),
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + (page.data?.length || 0), 0);
      const total = lastPage.pagination?.total || 0;
      return totalLoaded < total ? totalLoaded : undefined;
    },
    initialPageParam: 0,
  });

  // Infinite query for connection issues - always enabled, loads data immediately
  const {
    data: issuesData,
    isLoading: issuesLoading,
    isFetchingNextPage: issuesFetchingNext,
    hasNextPage: issuesHasNext,
    fetchNextPage: fetchNextIssues,
    refetch: refetchIssues,
  } = useInfiniteQuery({
    queryKey: ['connection-issues', debouncedProfileId, debouncedServerAddress, filters.issueType, filters.limit],
    queryFn: ({ pageParam = 0 }) => crashesAPI.getConnectionIssues({ 
      limit: filters.limit,
      offset: pageParam,
      profileId: debouncedProfileId || undefined,
      serverAddress: debouncedServerAddress || undefined,
      issueType: filters.issueType || undefined,
    }),
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + (page.data?.length || 0), 0);
      const total = lastPage.pagination?.total || 0;
      return totalLoaded < total ? totalLoaded : undefined;
    },
    initialPageParam: 0,
  });

  // Infinite query for launcher errors - always enabled, loads data immediately
  const {
    data: launcherErrorsData,
    isLoading: launcherErrorsLoading,
    isFetchingNextPage: launcherErrorsFetchingNext,
    hasNextPage: launcherErrorsHasNext,
    fetchNextPage: fetchNextLauncherErrors,
    refetch: refetchLauncherErrors,
  } = useInfiniteQuery({
    queryKey: ['launcher-errors', filters.errorType, debouncedComponent, filters.limit],
    queryFn: ({ pageParam = 0 }) => crashesAPI.getLauncherErrors({ 
      limit: filters.limit,
      offset: pageParam,
      errorType: filters.errorType || undefined,
      component: debouncedComponent || undefined,
    }),
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + (page.data?.length || 0), 0);
      const total = lastPage.pagination?.total || 0;
      return totalLoaded < total ? totalLoaded : undefined;
    },
    initialPageParam: 0,
    enabled: role === 'ADMIN', // Only admins can see launcher errors
  });

  // Flatten pages data
  const crashes = crashesData?.pages.flatMap(page => page.data || []) || [];
  const issues = issuesData?.pages.flatMap(page => page.data || []) || [];
  const launcherErrors = launcherErrorsData?.pages.flatMap(page => page.data || []) || [];

  // Initialize last IDs and mark all existing items as already notified when data is first loaded
  useEffect(() => {
    if (crashes.length > 0 && !lastCrashIdRef.current) {
      lastCrashIdRef.current = crashes[0].id;
      console.log('[CrashesManagementPage] Initialized last crash ID:', lastCrashIdRef.current);
      
      // Mark ALL existing crashes as already notified (they existed before page load)
      crashes.forEach(crash => {
        notifiedCrashesRef.current.add(crash.id);
      });
      console.log('[CrashesManagementPage] Marked', crashes.length, 'existing crashes as already notified');
    }
  }, [crashes.length > 0 ? crashes[0]?.id : null]);

  useEffect(() => {
    if (issues.length > 0 && !lastIssueIdRef.current) {
      lastIssueIdRef.current = issues[0].id;
      console.log('[CrashesManagementPage] Initialized last issue ID:', lastIssueIdRef.current);
      
      // Mark ALL existing issues as already notified (they existed before page load)
      issues.forEach(issue => {
        notifiedIssuesRef.current.add(issue.id);
      });
      console.log('[CrashesManagementPage] Marked', issues.length, 'existing issues as already notified');
    }
  }, [issues.length > 0 ? issues[0]?.id : null]);

  useEffect(() => {
    if (launcherErrors.length > 0 && !lastLauncherErrorIdRef.current) {
      lastLauncherErrorIdRef.current = launcherErrors[0].id;
      console.log('[CrashesManagementPage] Initialized last launcher error ID:', lastLauncherErrorIdRef.current);
      
      // Mark ALL existing launcher errors as already notified (they existed before page load)
      launcherErrors.forEach(error => {
        notifiedLauncherErrorsRef.current.add(error.id);
      });
      console.log('[CrashesManagementPage] Marked', launcherErrors.length, 'existing launcher errors as already notified');
    }
  }, [launcherErrors.length > 0 ? launcherErrors[0]?.id : null]);

  // Polling for new crashes and issues (only for admins)
  useEffect(() => {
    if (role !== 'ADMIN') {
      console.log('[CrashesManagementPage] Polling disabled: not an admin');
      return;
    }

    console.log('[CrashesManagementPage] Starting polling for new items...');
    console.log('[CrashesManagementPage] Last crash ID:', lastCrashIdRef.current);
    console.log('[CrashesManagementPage] Last issue ID:', lastIssueIdRef.current);

    const checkForNewItems = async () => {
      try {
        // Check for new crashes
        const latestCrashes = await crashesAPI.getCrashes({ 
          limit: 10, // Get more to catch multiple new crashes
          profileId: debouncedProfileId || undefined,
        });
        
        if (latestCrashes.data && latestCrashes.data.length > 0) {
          const latestCrash = latestCrashes.data[0];
          const pageLoadTime = pageLoadTimeRef.current;
          
          // Filter out crashes that we've already notified about OR were created before page load
          const newCrashes = latestCrashes.data.filter(crash => {
            // Skip if already notified
            if (notifiedCrashesRef.current.has(crash.id)) {
              return false;
            }
            
            // Skip if created before page load (old crash)
            const crashTime = new Date(crash.createdAt).getTime();
            if (crashTime < pageLoadTime) {
              console.log('[CrashesManagementPage] Skipping old crash (created before page load):', crash.id);
              // Mark as notified to avoid checking again
              notifiedCrashesRef.current.add(crash.id);
              return false;
            }
            
            console.log('[CrashesManagementPage] Found new crash:', crash.id);
            return true;
          });
          
          if (newCrashes.length > 0) {
            console.log('[CrashesManagementPage] New crashes detected:', newCrashes.length);
            
            // Update last ID to the latest crash
            if (!lastCrashIdRef.current || latestCrash.id !== lastCrashIdRef.current) {
              lastCrashIdRef.current = latestCrash.id;
            }
            
            // Show notification for each new crash and mark as notified
            newCrashes.forEach(crash => {
              // Mark as notified BEFORE creating notification to prevent duplicates
              notifiedCrashesRef.current.add(crash.id);
              
              // Limit Set size to prevent memory issues (keep last 1000)
              if (notifiedCrashesRef.current.size > 1000) {
                const firstId = Array.from(notifiedCrashesRef.current)[0];
                notifiedCrashesRef.current.delete(firstId);
              }
              
              console.log('[CrashesManagementPage] Creating notification for crash:', crash.id);
              setNotifications(prev => [...prev, {
                id: `crash-${crash.id}-${Date.now()}`,
                type: 'crash',
                message: `New crash: Exit Code ${crash.exitCode}${crash.username ? ` (${crash.username})` : ''}`,
                timestamp: Date.now(),
              }]);
            });
            
            // Auto-refetch to show new data
            refetchCrashes();
          }
        }

        // Check for new connection issues
        const latestIssues = await crashesAPI.getConnectionIssues({ 
          limit: 10, // Get more to catch multiple new issues
          profileId: debouncedProfileId || undefined,
          serverAddress: debouncedServerAddress || undefined,
          issueType: filters.issueType || undefined,
        });
        
        if (latestIssues.data && latestIssues.data.length > 0) {
          const latestIssue = latestIssues.data[0];
          const pageLoadTime = pageLoadTimeRef.current;
          
          // Filter out issues that we've already notified about OR were created before page load
          const newIssues = latestIssues.data.filter(issue => {
            // Skip if already notified
            if (notifiedIssuesRef.current.has(issue.id)) {
              return false;
            }
            
            // Skip if created before page load (old issue)
            const issueTime = new Date(issue.createdAt).getTime();
            if (issueTime < pageLoadTime) {
              console.log('[CrashesManagementPage] Skipping old issue (created before page load):', issue.id);
              // Mark as notified to avoid checking again
              notifiedIssuesRef.current.add(issue.id);
              return false;
            }
            
            console.log('[CrashesManagementPage] Found new issue:', issue.id);
            return true;
          });
          
          if (newIssues.length > 0) {
            console.log('[CrashesManagementPage] New issues detected:', newIssues.length);
            
            // Update last ID to the latest issue
            if (!lastIssueIdRef.current || latestIssue.id !== lastIssueIdRef.current) {
              lastIssueIdRef.current = latestIssue.id;
            }
            
            // Show notification for each new issue and mark as notified
            newIssues.forEach(issue => {
              // Mark as notified BEFORE creating notification to prevent duplicates
              notifiedIssuesRef.current.add(issue.id);
              
              // Limit Set size to prevent memory issues (keep last 1000)
              if (notifiedIssuesRef.current.size > 1000) {
                const firstId = Array.from(notifiedIssuesRef.current)[0];
                notifiedIssuesRef.current.delete(firstId);
              }
              
              console.log('[CrashesManagementPage] Creating notification for issue:', issue.id);
              setNotifications(prev => [...prev, {
                id: `issue-${issue.id}-${Date.now()}`,
                type: 'issue',
                message: `New connection issue: ${issueTypeLabels[issue.issueType]}${issue.username ? ` (${issue.username})` : ''}`,
                timestamp: Date.now(),
              }]);
            });
            
            // Auto-refetch to show new data
            refetchIssues();
          }
        }

        // Check for new launcher errors
        const latestLauncherErrors = await crashesAPI.getLauncherErrors({ 
          limit: 10,
          errorType: filters.errorType || undefined,
          component: debouncedComponent || undefined,
        });
        
        if (latestLauncherErrors.data && latestLauncherErrors.data.length > 0) {
          const latestLauncherError = latestLauncherErrors.data[0];
          const pageLoadTime = pageLoadTimeRef.current;
          
          // Filter out errors that we've already notified about OR were created before page load
          const newLauncherErrors = latestLauncherErrors.data.filter(error => {
            // Skip if already notified
            if (notifiedLauncherErrorsRef.current.has(error.id)) {
              return false;
            }
            
            // Skip if created before page load (old error)
            const errorTime = new Date(error.createdAt).getTime();
            if (errorTime < pageLoadTime) {
              console.log('[CrashesManagementPage] Skipping old launcher error (created before page load):', error.id);
              // Mark as notified to avoid checking again
              notifiedLauncherErrorsRef.current.add(error.id);
              return false;
            }
            
            console.log('[CrashesManagementPage] Found new launcher error:', error.id);
            return true;
          });
          
          if (newLauncherErrors.length > 0) {
            console.log('[CrashesManagementPage] New launcher errors detected:', newLauncherErrors.length);
            
            // Update last ID to the latest error
            if (!lastLauncherErrorIdRef.current || latestLauncherError.id !== lastLauncherErrorIdRef.current) {
              lastLauncherErrorIdRef.current = latestLauncherError.id;
            }
            
            // Show notification for each new error and mark as notified
            newLauncherErrors.forEach(error => {
              // Mark as notified BEFORE creating notification to prevent duplicates
              notifiedLauncherErrorsRef.current.add(error.id);
              
              // Limit Set size to prevent memory issues (keep last 1000)
              if (notifiedLauncherErrorsRef.current.size > 1000) {
                const firstId = Array.from(notifiedLauncherErrorsRef.current)[0];
                notifiedLauncherErrorsRef.current.delete(firstId);
              }
              
              console.log('[CrashesManagementPage] Creating notification for launcher error:', error.id);
              setNotifications(prev => [...prev, {
                id: `launcher-error-${error.id}-${Date.now()}`,
                type: 'launcher-error',
                message: `New launcher error: ${error.errorType}${error.component ? ` (${error.component})` : ''}${error.username ? ` (${error.username})` : ''}`,
                timestamp: Date.now(),
              }]);
            });
            
            // Auto-refetch to show new data
            refetchLauncherErrors();
          }
        }
      } catch (error) {
        console.error('[CrashesManagementPage] Error checking for new items:', error);
      }
    };

    // Start polling immediately, then every 10 seconds
    checkForNewItems();
    pollingIntervalRef.current = window.setInterval(checkForNewItems, 10000);

    return () => {
      console.log('[CrashesManagementPage] Stopping polling');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [role, debouncedProfileId, debouncedServerAddress, filters.issueType, filters.errorType, debouncedComponent, refetchCrashes, refetchIssues, refetchLauncherErrors]);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => {
        const filtered = prev.filter(n => Date.now() - n.timestamp < 5000);
        if (filtered.length !== prev.length) {
          console.log('[CrashesManagementPage] Removed expired notifications, remaining:', filtered.length);
        }
        return filtered;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Debug: Log notifications changes
  useEffect(() => {
    console.log('[CrashesManagementPage] Notifications updated:', notifications.length);
    notifications.forEach(n => {
      console.log('[CrashesManagementPage] Notification:', n.id, n.type, n.message);
    });
  }, [notifications]);

  const handleClearFilters = () => {
    setFilters({
      profileId: '',
      serverAddress: '',
      issueType: '',
      errorType: '',
      component: '',
      limit: 50,
    });
    // Clear notified sets when filters change
    notifiedCrashesRef.current.clear();
    notifiedIssuesRef.current.clear();
    lastCrashIdRef.current = null;
    lastIssueIdRef.current = null;
  };

  // Clear notified sets and reset page load time when filters change
  useEffect(() => {
    pageLoadTimeRef.current = Date.now();
    notifiedCrashesRef.current.clear();
    notifiedIssuesRef.current.clear();
    lastCrashIdRef.current = null;
    lastIssueIdRef.current = null;
    console.log('[CrashesManagementPage] Filters changed, reset notification tracking and page load time');
  }, [debouncedProfileId, debouncedServerAddress, filters.issueType]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const listRef = activeTab === 'crashes' ? crashesListRef : issuesListRef;
    const element = listRef.current;
    
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // Load when 100px from bottom

    if (isNearBottom) {
      if (activeTab === 'crashes' && crashesHasNext && !crashesFetchingNext) {
        fetchNextCrashes();
      } else if (activeTab === 'connection-issues' && issuesHasNext && !issuesFetchingNext) {
        fetchNextIssues();
      }
    }
  }, [activeTab, crashesHasNext, crashesFetchingNext, issuesHasNext, issuesFetchingNext, fetchNextCrashes, fetchNextIssues]);

  // Attach scroll listener
  useEffect(() => {
    const listRef = activeTab === 'crashes' ? crashesListRef : issuesListRef;
    const element = listRef.current;
    
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [activeTab, handleScroll]);

  const { formatDateTime } = useFormatDate();

  const getExitCodeColor = (code: number) => {
    if (code === 0) return 'text-green-400';
    if (code < 0) return 'text-red-400';
    return 'text-yellow-400';
  };

  const handleNotificationClick = (notification: { type: 'crash' | 'issue' | 'launcher-error' }) => {
    if (notification.type === 'crash') {
      setActiveTab('crashes');
    } else if (notification.type === 'issue') {
      setActiveTab('connection-issues');
    } else if (notification.type === 'launcher-error') {
      setActiveTab('launcher-errors');
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, x: 300 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-4 shadow-lg max-w-md cursor-pointer pointer-events-auto"
              onClick={() => {
                handleNotificationClick(notification);
                removeNotification(notification.id);
              }}
            >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${notification.type === 'crash' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                {notification.type === 'crash' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{notification.message}</p>
                <p className="text-gray-400 text-xs mt-1">Click to view</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Crashes & Issues</h1>
          <p className="text-gray-400">Monitor game crashes and connection issues</p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-primary-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                {notifications.length}
              </span>
            </div>
          )}
          <button
            onClick={() => {
              if (activeTab === 'crashes') {
                refetchCrashes();
              } else if (activeTab === 'connection-issues') {
                refetchIssues();
              } else if (activeTab === 'launcher-errors') {
                refetchLauncherErrors();
              }
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('crashes')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'crashes'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>Game Crashes</span>
            {crashes.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">
                {crashes.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('connection-issues')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'connection-issues'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <WifiOff size={18} />
            <span>Connection Issues</span>
            {issues.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                {issues.length}
              </span>
            )}
          </div>
        </button>
        {role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('launcher-errors')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'launcher-errors'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Code size={18} />
              <span>Launcher Errors</span>
              {launcherErrors.length > 0 && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                  {launcherErrors.length}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-4 space-y-4 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <Filter size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Profile ID</label>
            <input
              type="text"
              value={filters.profileId}
              onChange={(e) => setFilters({ ...filters, profileId: e.target.value })}
              placeholder="Filter by profile..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {activeTab === 'connection-issues' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Server Address</label>
                <input
                  type="text"
                  value={filters.serverAddress}
                  onChange={(e) => setFilters({ ...filters, serverAddress: e.target.value })}
                  placeholder="Filter by server..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Issue Type</label>
                <select
                  value={filters.issueType}
                  onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  {Object.entries(issueTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {activeTab === 'launcher-errors' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Error Type</label>
                <select
                  value={filters.errorType}
                  onChange={(e) => setFilters({ ...filters, errorType: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="PROFILE_LOAD_ERROR">Profile Load Error</option>
                  <option value="FILE_DOWNLOAD_ERROR">File Download Error</option>
                  <option value="API_ERROR">API Error</option>
                  <option value="AUTHENTICATION_ERROR">Authentication Error</option>
                  <option value="VALIDATION_ERROR">Validation Error</option>
                  <option value="FILE_SYSTEM_ERROR">File System Error</option>
                  <option value="NETWORK_ERROR">Network Error</option>
                  <option value="ELECTRON_ERROR">Electron Error</option>
                  <option value="JAVA_DETECTION_ERROR">Java Detection Error</option>
                  <option value="CLIENT_LAUNCH_ERROR">Client Launch Error</option>
                  <option value="UNKNOWN_ERROR">Unknown Error</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Component</label>
                <input
                  type="text"
                  value={filters.component}
                  onChange={(e) => setFilters({ ...filters, component: e.target.value })}
                  placeholder="Filter by component..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Limit</label>
            <input
              type="number"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) || 50 })}
              min="10"
              max="500"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        {(filters.profileId || filters.serverAddress || filters.issueType) && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <X size={14} />
            <span>Clear filters</span>
          </button>
        )}
      </motion.div>

      {/* Content */}
      {activeTab === 'crashes' ? (
        <CrashesList
          ref={crashesListRef}
          crashes={crashes}
          isLoading={crashesLoading}
          isFetchingNext={crashesFetchingNext}
          hasNext={crashesHasNext}
          selectedCrash={selectedCrash}
          onSelectCrash={setSelectedCrash}
          formatDate={formatDateTime}
          getExitCodeColor={getExitCodeColor}
        />
      ) : activeTab === 'connection-issues' ? (
        <ConnectionIssuesList
          ref={issuesListRef}
          issues={issues}
          isLoading={issuesLoading}
          isFetchingNext={issuesFetchingNext}
          hasNext={issuesHasNext}
          selectedIssue={selectedIssue}
          onSelectIssue={setSelectedIssue}
          formatDate={formatDateTime}
        />
      ) : (
        <LauncherErrorsList
          errors={launcherErrors}
          isLoading={launcherErrorsLoading}
          isFetchingNext={launcherErrorsFetchingNext}
          hasNext={launcherErrorsHasNext}
          selectedError={selectedLauncherError}
          onSelectError={setSelectedLauncherError}
          formatDate={formatDateTime}
        />
      )}

      {/* Detail Modals */}
      {selectedCrash && (
        <CrashDetailModal
          crash={selectedCrash}
          onClose={() => setSelectedCrash(null)}
          formatDate={formatDateTime}
          getExitCodeColor={getExitCodeColor}
        />
      )}
      {selectedIssue && (
        <ConnectionIssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          formatDate={formatDateTime}
        />
      )}
      {selectedLauncherError && (
        <LauncherErrorDetailModal
          error={selectedLauncherError}
          onClose={() => setSelectedLauncherError(null)}
          formatDate={formatDateTime}
        />
      )}
    </div>
  );
}

// Crash Item Component - мемоизирован для оптимизации ререндеров
const CrashItem = React.memo<{
  crash: GameCrash;
  isSelected: boolean;
  onSelect: (crash: GameCrash) => void;
  formatDate: (date: string | Date) => string;
  getExitCodeColor: (code: number) => string;
}>(({ crash, isSelected, onSelect, formatDate, getExitCodeColor }) => {
  const { shouldAnimate } = useOptimizedAnimation();

  return (
    <motion.div
      key={crash.id}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      className={`bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer shadow-lg ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      }`}
      onClick={() => onSelect(crash)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Code className={`w-5 h-5 ${getExitCodeColor(crash.exitCode)}`} />
            <span className={`font-mono font-bold ${getExitCodeColor(crash.exitCode)}`}>
              Exit Code: {crash.exitCode}
            </span>
            {crash.profileVersion && (
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 rounded text-xs">
                {crash.profileVersion}
              </span>
            )}
          </div>
          {crash.errorMessage && (
            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
              {crash.errorMessage.substring(0, 200)}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {crash.username && (
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{crash.username}</span>
              </div>
            )}
            {crash.serverAddress && (
              <div className="flex items-center gap-1">
                <Server size={14} />
                <span>{crash.serverAddress}:{crash.serverPort}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(crash.createdAt)}</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Eye size={18} className="text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
});
CrashItem.displayName = 'CrashItem';

// Crashes List Component - оптимизирован с мемоизацией
const CrashesList = React.memo(React.forwardRef<HTMLDivElement, {
  crashes: GameCrash[];
  isLoading: boolean;
  isFetchingNext?: boolean;
  hasNext?: boolean;
  selectedCrash: GameCrash | null;
  onSelectCrash: (crash: GameCrash) => void;
  formatDate: (date: string | Date) => string;
  getExitCodeColor: (code: number) => string;
}>(({
  crashes,
  isLoading,
  isFetchingNext = false,
  hasNext = false,
  selectedCrash,
  onSelectCrash,
  formatDate,
  getExitCodeColor,
}, ref) => {
  const { shouldAnimate } = useOptimizedAnimation();
  if (isLoading && crashes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto"
    >
      {crashes.length === 0 ? (
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-12 text-center shadow-lg">
          <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No crashes found</p>
        </div>
      ) : (
        <>
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={shouldAnimate ? { opacity: 1 } : false}
            className="space-y-2"
          >
            {crashes.map((crash) => (
              <CrashItem
                key={crash.id}
                crash={crash}
                isSelected={selectedCrash?.id === crash.id}
                onSelect={onSelectCrash}
                formatDate={formatDateTime}
                getExitCodeColor={getExitCodeColor}
              />
            ))}
          </motion.div>
          
          {/* Loading indicator for next page */}
          {isFetchingNext && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          )}
          
          {/* End of list indicator */}
          {!hasNext && crashes.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more crashes to load
            </div>
          )}
        </>
      )}
    </div>
  );
}));
CrashesList.displayName = 'CrashesList';

// Connection Issue Item Component - мемоизирован для оптимизации ререндеров
const ConnectionIssueItem = React.memo<{
  issue: ServerConnectionIssue;
  isSelected: boolean;
  onSelect: (issue: ServerConnectionIssue) => void;
  formatDate: (date: string | Date) => string;
}>(({ issue, isSelected, onSelect, formatDate }) => {
  const { shouldAnimate } = useOptimizedAnimation();

  return (
    <motion.div
      key={issue.id}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      className={`bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer shadow-lg ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      }`}
      onClick={() => onSelect(issue)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <WifiOff className="w-5 h-5 text-yellow-400" />
            <span className={`px-3 py-1 rounded text-sm font-medium inline-block ${issueTypeColors[issue.issueType]}`}>
              {issueTypeLabels[issue.issueType]}
            </span>
            {issue.profileVersion && (
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 rounded text-xs">
                {issue.profileVersion}
              </span>
            )}
          </div>
          {issue.errorMessage && (
            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
              {issue.errorMessage.substring(0, 200)}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {issue.username && (
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{issue.username}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Server size={14} />
              <span>{issue.serverAddress}:{issue.serverPort}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(issue.createdAt)}</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Eye size={18} className="text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
});
ConnectionIssueItem.displayName = 'ConnectionIssueItem';

// Connection Issues List Component - оптимизирован с мемоизацией
const ConnectionIssuesList = React.memo(React.forwardRef<HTMLDivElement, {
  issues: ServerConnectionIssue[];
  isLoading: boolean;
  isFetchingNext?: boolean;
  hasNext?: boolean;
  selectedIssue: ServerConnectionIssue | null;
  onSelectIssue: (issue: ServerConnectionIssue) => void;
  formatDate: (date: string | Date) => string;
}>(({
  issues,
  isLoading,
  isFetchingNext = false,
  hasNext = false,
  selectedIssue,
  onSelectIssue,
  formatDate,
}, ref) => {
  const { shouldAnimate } = useOptimizedAnimation();

  if (isLoading && issues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto"
    >
      {issues.length === 0 ? (
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-12 text-center shadow-lg">
          <WifiOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No connection issues found</p>
        </div>
      ) : (
        <>
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={shouldAnimate ? { opacity: 1 } : false}
            className="space-y-2"
          >
            {issues.map((issue) => (
              <ConnectionIssueItem
                key={issue.id}
                issue={issue}
                isSelected={selectedIssue?.id === issue.id}
                onSelect={onSelectIssue}
                formatDate={formatDate}
              />
            ))}
          </motion.div>
          
          {/* Loading indicator for next page */}
          {isFetchingNext && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          )}
          
          {/* End of list indicator */}
          {!hasNext && issues.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more issues to load
            </div>
          )}
        </>
      )}
    </div>
  );
}));
ConnectionIssuesList.displayName = 'ConnectionIssuesList';

// Crash Detail Modal
function CrashDetailModal({
  crash,
  onClose,
  formatDate,
  getExitCodeColor,
}: {
  crash: GameCrash;
  onClose: () => void;
  formatDate: (date: string | Date) => string;
  getExitCodeColor: (code: number) => string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Crash Details</h2>
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
              <label className="text-xs text-gray-400">Exit Code</label>
              <p className={`font-mono font-bold ${getExitCodeColor(crash.exitCode)}`}>
                {crash.exitCode}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Date</label>
              <p className="text-white">{formatDate(crash.createdAt)}</p>
            </div>
            {crash.username && (
              <div>
                <label className="text-xs text-gray-400">User</label>
                <p className="text-white">{crash.username}</p>
              </div>
            )}
            {crash.profileVersion && (
              <div>
                <label className="text-xs text-gray-400">Version</label>
                <p className="text-white">{crash.profileVersion}</p>
              </div>
            )}
            {crash.serverAddress && (
              <div>
                <label className="text-xs text-gray-400">Server</label>
                <p className="text-white font-mono">{crash.serverAddress}:{crash.serverPort}</p>
              </div>
            )}
            {crash.javaVersion && (
              <div>
                <label className="text-xs text-gray-400">Java Version</label>
                <p className="text-white">{crash.javaVersion}</p>
              </div>
            )}
            {crash.os && (
              <div>
                <label className="text-xs text-gray-400">OS</label>
                <p className="text-white">{crash.os} {crash.osVersion || ''}</p>
              </div>
            )}
          </div>

          {crash.errorMessage && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Error Message</label>
              <pre className="bg-black/30 p-4 rounded-lg text-sm text-red-300 overflow-x-auto">
                {crash.errorMessage}
              </pre>
            </div>
          )}

          {crash.stderrOutput && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Stderr Output</label>
              <pre className="bg-black/30 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                {crash.stderrOutput}
              </pre>
            </div>
          )}

          {crash.stdoutOutput && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Stdout Output (last 100 lines)</label>
              <pre className="bg-black/30 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                {crash.stdoutOutput}
              </pre>
            </div>
          )}

          {crash.stackTrace && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Stack Trace</label>
              <pre className="bg-black/30 p-4 rounded-lg text-sm text-red-300 overflow-x-auto max-h-64 overflow-y-auto">
                {crash.stackTrace}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Connection Issue Detail Modal
function ConnectionIssueDetailModal({
  issue,
  onClose,
  formatDate,
}: {
  issue: ServerConnectionIssue;
  onClose: () => void;
  formatDate: (date: string | Date) => string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Connection Issue Details</h2>
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
              <label className="text-xs text-gray-400">Issue Type</label>
              <p className={`px-3 py-1 rounded text-sm font-medium inline-block ${issueTypeColors[issue.issueType]}`}>
                {issueTypeLabels[issue.issueType]}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Date</label>
              <p className="text-white">{formatDate(issue.createdAt)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Server</label>
              <p className="text-white font-mono">{issue.serverAddress}:{issue.serverPort}</p>
            </div>
            {issue.username && (
              <div>
                <label className="text-xs text-gray-400">User</label>
                <p className="text-white">{issue.username}</p>
              </div>
            )}
            {issue.profileVersion && (
              <div>
                <label className="text-xs text-gray-400">Version</label>
                <p className="text-white">{issue.profileVersion}</p>
              </div>
            )}
            {issue.javaVersion && (
              <div>
                <label className="text-xs text-gray-400">Java Version</label>
                <p className="text-white">{issue.javaVersion}</p>
              </div>
            )}
            {issue.os && (
              <div>
                <label className="text-xs text-gray-400">OS</label>
                <p className="text-white">{issue.os}</p>
              </div>
            )}
          </div>

          {issue.errorMessage && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Error Message</label>
              <pre className="bg-black/30 p-4 rounded-lg text-sm text-red-300 overflow-x-auto">
                {issue.errorMessage}
              </pre>
            </div>
          )}

          {issue.logOutput && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Log Output</label>
              <pre className="bg-black/30 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                {issue.logOutput}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

