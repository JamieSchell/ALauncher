/**
 * Crashes Management Page - для администраторов
 * Просмотр крэшей игры и проблем подключения к серверу
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { AlertTriangle, WifiOff, RefreshCw, Loader2, Filter, X, Eye, Calendar, User, Server, Code, Bell, ArrowLeft, Terminal } from 'lucide-react';
import { crashesAPI, GameCrash, ServerConnectionIssue, LauncherError } from '../api/crashes';
import { useFormatDate } from '../hooks/useFormatDate';
import { LauncherErrorsList, LauncherErrorDetailModal } from './CrashesManagementPage-LauncherErrors';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input } from '../components/ui';
import { useTranslation } from '../hooks/useTranslation';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const { formatDate } = useFormatDate();
  const [activeTab, setActiveTab] = useState<TabType>('crashes');
  const [selectedCrash, setSelectedCrash] = useState<GameCrash | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ServerConnectionIssue | null>(null);
  const [selectedLauncherError, setSelectedLauncherError] = useState<LauncherError | null>(null);

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
    <div className="flex flex-col animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('ui.backToDashboard')}
          </button>
          <h1 className="text-base font-display font-bold text-white">{t('admin.crashReports')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <Badge status="ERROR" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {notifications.length}
            </Badge>
          )}
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => {
              if (activeTab === 'crashes') {
                refetchCrashes();
              } else if (activeTab === 'connection-issues') {
                refetchIssues();
              } else if (activeTab === 'launcher-errors') {
                refetchLauncherErrors();
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        <button
          onClick={() => setActiveTab('crashes')}
          className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
            activeTab === 'crashes'
              ? 'border-status-error text-status-error'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Game Crashes</span>
            {crashes.length > 0 && (
              <Badge status="ERROR" className="text-xs px-1.5 py-0.5">
                {crashes.length}
              </Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('connection-issues')}
          className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
            activeTab === 'connection-issues'
              ? 'border-status-warning text-status-warning'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>Connection Issues</span>
            {issues.length > 0 && (
              <Badge status="WARNING" className="text-xs px-1.5 py-0.5">
                {issues.length}
              </Badge>
            )}
          </div>
        </button>
        {role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('launcher-errors')}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'launcher-errors'
                ? 'border-techno-cyan text-techno-cyan'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>Launcher Errors</span>
              {launcherErrors.length > 0 && (
                <Badge status="ERROR" className="text-xs px-1.5 py-0.5">
                  {launcherErrors.length}
                </Badge>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-techno-cyan" />
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">{t('ui.filters')}</h3>
          </div>
          {(filters.profileId || filters.serverAddress || filters.issueType || filters.errorType || filters.component) && (
            <Button
              variant="ghost"
              leftIcon={<X className="w-3 h-3" />}
              onClick={handleClearFilters}
              className="text-xs h-7"
            >
              {t('ui.clearAll')}
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Profile ID"
            value={filters.profileId}
            onChange={(e) => setFilters({ ...filters, profileId: e.target.value })}
            placeholder="Filter by profile..."
            leftIcon={<User className="w-3 h-3" />}
            className="text-xs"
          />
          
          {activeTab === 'connection-issues' && (
            <>
              <Input
                label="Server Address"
                value={filters.serverAddress}
                onChange={(e) => setFilters({ ...filters, serverAddress: e.target.value })}
                placeholder="Filter by server..."
                leftIcon={<Server className="w-3 h-3" />}
                className="text-xs"
              />
              <div className="w-full">
                <label className="flex items-center gap-2 text-xs font-bold text-techno-cyan mb-2 uppercase tracking-widest opacity-80">
                  <Filter className="w-3 h-3" />
                  Issue Type
                </label>
                <select
                  value={filters.issueType}
                  onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}
                  className="w-full bg-dark-panel/80 backdrop-blur-md border border-white/5 clip-cyber-corner text-white text-xs py-2 px-4 focus:outline-none focus:border-techno-cyan transition-colors font-mono"
                >
                  <option value="">All Types</option>
                  {Object.entries(issueTypeLabels).map(([value, label]) => (
                    <option key={value} value={value} className="bg-dark-panel">{label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          {activeTab === 'launcher-errors' && (
            <>
              <div className="w-full">
                <label className="flex items-center gap-2 text-xs font-bold text-techno-cyan mb-2 uppercase tracking-widest opacity-80">
                  <Code className="w-3 h-3" />
                  Error Type
                </label>
                <select
                  value={filters.errorType}
                  onChange={(e) => setFilters({ ...filters, errorType: e.target.value })}
                  className="w-full bg-dark-panel/80 backdrop-blur-md border border-white/5 clip-cyber-corner text-white text-xs py-2 px-4 focus:outline-none focus:border-techno-cyan transition-colors font-mono"
                >
                  <option value="">All Types</option>
                  <option value="PROFILE_LOAD_ERROR" className="bg-dark-panel">Profile Load Error</option>
                  <option value="FILE_DOWNLOAD_ERROR" className="bg-dark-panel">File Download Error</option>
                  <option value="API_ERROR" className="bg-dark-panel">API Error</option>
                  <option value="AUTHENTICATION_ERROR" className="bg-dark-panel">Authentication Error</option>
                  <option value="VALIDATION_ERROR" className="bg-dark-panel">Validation Error</option>
                  <option value="FILE_SYSTEM_ERROR" className="bg-dark-panel">File System Error</option>
                  <option value="NETWORK_ERROR" className="bg-dark-panel">Network Error</option>
                  <option value="ELECTRON_ERROR" className="bg-dark-panel">Electron Error</option>
                  <option value="JAVA_DETECTION_ERROR" className="bg-dark-panel">Java Detection Error</option>
                  <option value="CLIENT_LAUNCH_ERROR" className="bg-dark-panel">Client Launch Error</option>
                  <option value="UNKNOWN_ERROR" className="bg-dark-panel">Unknown Error</option>
                </select>
              </div>
              <Input
                label="Component"
                value={filters.component}
                onChange={(e) => setFilters({ ...filters, component: e.target.value })}
                placeholder="Filter by component..."
                leftIcon={<Code className="w-3 h-3" />}
                className="text-xs"
              />
            </>
          )}
          
          <div className="w-full">
            <label className="flex items-center gap-2 text-xs font-bold text-techno-cyan mb-2 uppercase tracking-widest opacity-80">
              <Filter className="w-3 h-3" />
              Limit
            </label>
            <input
              type="number"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) || 50 })}
              min="10"
              max="500"
              className="w-full bg-dark-panel/80 backdrop-blur-md border border-white/5 clip-cyber-corner text-white text-xs py-2 px-4 focus:outline-none focus:border-techno-cyan transition-colors font-mono"
            />
          </div>
        </div>
      </Card>

      {/* Content - Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* List */}
        <div className="col-span-4 flex flex-col gap-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
          {activeTab === 'crashes' ? (
            <CrashesList
              ref={crashesListRef}
              crashes={crashes}
              isLoading={crashesLoading}
              isFetchingNext={crashesFetchingNext}
              hasNext={crashesHasNext}
              selectedCrash={selectedCrash}
              onSelectCrash={setSelectedCrash}
              formatDate={formatDate}
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
              formatDate={formatDate}
            />
          ) : (
            <LauncherErrorsList
              errors={launcherErrors}
              isLoading={launcherErrorsLoading}
              isFetchingNext={launcherErrorsFetchingNext}
              hasNext={launcherErrorsHasNext}
              selectedError={selectedLauncherError}
              onSelectError={setSelectedLauncherError}
              formatDate={formatDate}
            />
          )}
        </div>

        {/* Detail View */}
        <div className="col-span-8">
          <Card className="min-h-[400px] flex flex-col font-mono text-xs relative overflow-hidden">
            {activeTab === 'crashes' && selectedCrash ? (
              <>
                <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xs font-bold text-status-error flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Exit Code: {selectedCrash.exitCode}
                    </h2>
                    <div className="text-gray-500 text-[10px] mt-1">
                      Reported by {selectedCrash.username || 'Unknown'} at {formatDate(selectedCrash.createdAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="h-8 text-xs">Assign</Button>
                    <Button variant="primary" className="h-8 text-xs">Resolve</Button>
                  </div>
                </div>
                
                <div className="flex-1 bg-black/50 p-4 rounded overflow-auto custom-scrollbar border border-white/5">
                  <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    <span className="text-status-error">Stack Trace:</span>
                    {'\n' + (selectedCrash.stackTrace || selectedCrash.errorMessage || 'No stack trace available')}
                  </pre>
                </div>
              </>
            ) : activeTab === 'connection-issues' && selectedIssue ? (
              <>
                <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xs font-bold text-status-warning flex items-center gap-2">
                      <WifiOff className="w-4 h-4" /> {issueTypeLabels[selectedIssue.issueType] || 'Connection Issue'}
                    </h2>
                    <div className="text-gray-500 text-[10px] mt-1">
                      Reported by {selectedIssue.username || 'Unknown'} at {formatDate(selectedIssue.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 bg-black/50 p-4 rounded overflow-auto custom-scrollbar border border-white/5">
                  <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    <span className="text-status-warning">Details:</span>
                    {'\nServer: ' + selectedIssue.serverAddress + ':' + selectedIssue.serverPort}
                    {'\nError: ' + (selectedIssue.errorMessage || 'No error message')}
                  </pre>
                </div>
              </>
            ) : activeTab === 'launcher-errors' && selectedLauncherError ? (
              <>
                <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xs font-bold text-status-error flex items-center gap-2">
                      <Code className="w-4 h-4" /> {selectedLauncherError.errorType}
                    </h2>
                    <div className="text-gray-500 text-[10px] mt-1">
                      Component: {selectedLauncherError.component} at {formatDate(selectedLauncherError.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 bg-black/50 p-4 rounded overflow-auto custom-scrollbar border border-white/5">
                  <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    <span className="text-status-error">Error Details:</span>
                    {'\n' + (selectedLauncherError.errorMessage || 'No error message')}
                    {selectedLauncherError.stackTrace && '\n\nStack Trace:\n' + selectedLauncherError.stackTrace}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <Terminal className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-xs">Select a report to view details.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

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

  return (
    <div
      key={crash.id}
      onClick={() => onSelect(crash)}
      className={`p-4 rounded border cursor-pointer transition-all ${
        isSelected ? 'bg-status-error/10 border-status-error' : 'bg-dark-card border-white/5 hover:border-white/20'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-xs text-gray-500">{crash.id.slice(0, 8)}</span>
        <Badge status={crash.exitCode === 0 ? 'SUCCESS' : 'ERROR'} className="text-xs px-2 py-0.5">
          {crash.exitCode === 0 ? 'RESOLVED' : 'OPEN'}
        </Badge>
      </div>
      <div className="font-bold text-white mb-1 text-xs">Exit Code: {crash.exitCode}</div>
      {crash.errorMessage && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{crash.errorMessage.substring(0, 100)}</p>
      )}
      <div className="text-xs text-gray-400 flex items-center gap-2">
        {crash.username && <span>{crash.username}</span>}
        {crash.username && <span>•</span>}
        <span>{formatDate(crash.createdAt).split(' ')[0]}</span>
      </div>
    </div>
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
  if (isLoading && crashes.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-techno-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-2">
      {crashes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">No crashes found</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {crashes.map((crash) => (
              <CrashItem
                key={crash.id}
                crash={crash}
                isSelected={selectedCrash?.id === crash.id}
                onSelect={onSelectCrash}
                formatDate={formatDate}
                getExitCodeColor={getExitCodeColor}
              />
            ))}
          </div>
          
          {/* Loading indicator for next page */}
          {isFetchingNext && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-techno-cyan animate-spin" />
            </div>
          )}
          
          {/* End of list indicator */}
          {!hasNext && crashes.length > 0 && (
            <div className="text-center py-4 text-xs text-gray-500">
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

  return (
    <div
      key={issue.id}
      onClick={() => onSelect(issue)}
      className={`p-4 rounded border cursor-pointer transition-all ${
        isSelected ? 'bg-status-warning/10 border-status-warning' : 'bg-dark-card border-white/5 hover:border-white/20'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-xs text-gray-500">{issue.id.slice(0, 8)}</span>
        <Badge status="WARNING" className="text-xs px-2 py-0.5">
          {issueTypeLabels[issue.issueType] || 'ISSUE'}
        </Badge>
      </div>
      <div className="font-bold text-white mb-1 text-xs">{issueTypeLabels[issue.issueType] || 'Connection Issue'}</div>
      {issue.errorMessage && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{issue.errorMessage.substring(0, 100)}</p>
      )}
      <div className="text-xs text-gray-400 flex items-center gap-2">
        {issue.username && <span>{issue.username}</span>}
        {issue.username && <span>•</span>}
        <span>{formatDate(issue.createdAt).split(' ')[0]}</span>
      </div>
    </div>
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

  if (isLoading && issues.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-techno-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-2">
      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <WifiOff className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">No connection issues found</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {issues.map((issue) => (
              <ConnectionIssueItem
                key={issue.id}
                issue={issue}
                isSelected={selectedIssue?.id === issue.id}
                onSelect={onSelectIssue}
                formatDate={formatDate}
              />
            ))}
          </div>
          
          {/* Loading indicator for next page */}
          {isFetchingNext && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-techno-cyan animate-spin" />
            </div>
          )}
          
          {/* End of list indicator */}
          {!hasNext && issues.length > 0 && (
            <div className="text-center py-4 text-xs text-gray-500">
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
    <div >
      <div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        
      >
        <div >
          <h2 style={{ fontSize: "24px", fontWeight: 700 }}>Crash Details</h2>
          <button
            onClick={onClose}
            
          >
            <X size={20}  />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div >
            <div>
              <label >Exit Code</label>
              <p className={`font-mono font-bold ${getExitCodeColor(crash.exitCode)}`}>
                {crash.exitCode}
              </p>
            </div>
            <div>
              <label >Date</label>
              <p style={{ color: "white" }}>{formatDate(crash.createdAt)}</p>
            </div>
            {crash.username && (
              <div>
                <label >User</label>
                <p style={{ color: "white" }}>{crash.username}</p>
              </div>
            )}
            {crash.profileVersion && (
              <div>
                <label >Version</label>
                <p style={{ color: "white" }}>{crash.profileVersion}</p>
              </div>
            )}
            {crash.serverAddress && (
              <div>
                <label >Server</label>
                <p >{crash.serverAddress}:{crash.serverPort}</p>
              </div>
            )}
            {crash.javaVersion && (
              <div>
                <label >Java Version</label>
                <p style={{ color: "white" }}>{crash.javaVersion}</p>
              </div>
            )}
            {crash.os && (
              <div>
                <label >OS</label>
                <p style={{ color: "white" }}>{crash.os} {crash.osVersion || ''}</p>
              </div>
            )}
          </div>

          {crash.errorMessage && (
            <div>
              <label >Error Message</label>
              <pre >
                {crash.errorMessage}
              </pre>
            </div>
          )}

          {crash.stderrOutput && (
            <div>
              <label >Stderr Output</label>
              <pre >
                {crash.stderrOutput}
              </pre>
            </div>
          )}

          {crash.stdoutOutput && (
            <div>
              <label >Stdout Output (last 100 lines)</label>
              <pre >
                {crash.stdoutOutput}
              </pre>
            </div>
          )}

          {crash.stackTrace && (
            <div>
              <label >Stack Trace</label>
              <pre >
                {crash.stackTrace}
              </pre>
            </div>
          )}
        </div>
      </div>
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
    <div >
      <div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        
      >
        <div >
          <h2 style={{ fontSize: "24px", fontWeight: 700 }}>Connection Issue Details</h2>
          <button
            onClick={onClose}
            
          >
            <X size={20}  />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div >
            <div>
              <label >Issue Type</label>
              <p className={`px-3 py-1 rounded text-sm font-medium inline-block ${issueTypeColors[issue.issueType]}`}>
                {issueTypeLabels[issue.issueType]}
              </p>
            </div>
            <div>
              <label >Date</label>
              <p style={{ color: "white" }}>{formatDate(issue.createdAt)}</p>
            </div>
            <div>
              <label >Server</label>
              <p >{issue.serverAddress}:{issue.serverPort}</p>
            </div>
            {issue.username && (
              <div>
                <label >User</label>
                <p style={{ color: "white" }}>{issue.username}</p>
              </div>
            )}
            {issue.profileVersion && (
              <div>
                <label >Version</label>
                <p style={{ color: "white" }}>{issue.profileVersion}</p>
              </div>
            )}
            {issue.javaVersion && (
              <div>
                <label >Java Version</label>
                <p style={{ color: "white" }}>{issue.javaVersion}</p>
              </div>
            )}
            {issue.os && (
              <div>
                <label >OS</label>
                <p style={{ color: "white" }}>{issue.os}</p>
              </div>
            )}
          </div>

          {issue.errorMessage && (
            <div>
              <label >Error Message</label>
              <pre >
                {issue.errorMessage}
              </pre>
            </div>
          )}

          {issue.logOutput && (
            <div>
              <label >Log Output</label>
              <pre >
                {issue.logOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

