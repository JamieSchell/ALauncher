import { Routes, Route } from 'react-router-dom';
import { useEffect, useState, Suspense } from 'react';
import ErrorLoggerService from './services/errorLogger';
import LauncherUpdateModal from './components/LauncherUpdateModal';
import { useLauncherUpdate } from './hooks/useLauncherUpdate';
import { API_CONFIG } from './config/api';
import { routes, wrapRouteComponent } from './config/routes';
import NotFoundPage from './pages/NotFoundPage';
import { Layout } from './components/layout';
import LoadingSpinner from './components/LoadingSpinner';
import { useToastContext } from './providers/ToastProvider';

function App() {
  const { updateCheckResult, currentVersion } = useLauncherUpdate();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { showError } = useToastContext();

  useEffect(() => {
    // Initialize error logger
    ErrorLoggerService.initialize();

    // Global error handlers
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      
      // Log error
      ErrorLoggerService.logErrorAuto(error, {
        component: 'GlobalErrorHandler',
        action: 'unhandledError',
      });

      // Show toast for critical errors (not network errors or expected errors)
      const errorMessage = error.message || String(error);
      const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                            errorMessage.toLowerCase().includes('fetch') ||
                            errorMessage.toLowerCase().includes('connection');
      
      if (!isNetworkError && !errorMessage.includes('ResizeObserver')) {
        showError('An unexpected error occurred. Please try refreshing the page.', 8000);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      // Log error
      ErrorLoggerService.logErrorAuto(reason, {
        component: 'GlobalErrorHandler',
        action: 'unhandledRejection',
      });

      // Show toast for critical promise rejections
      const errorMessage = reason?.message || String(reason);
      const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                            errorMessage.toLowerCase().includes('fetch') ||
                            errorMessage.toLowerCase().includes('connection');
      
      // Don't show toast for network errors (they're handled by API interceptor)
      // Don't show for known non-critical errors
      if (!isNetworkError && 
          !errorMessage.includes('ResizeObserver') &&
          !errorMessage.includes('Non-Error promise rejection')) {
        showError('An operation failed. Please try again.', 6000);
      }
    };

    // Register global error handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [showError]);

  // Show update modal when update is available
  useEffect(() => {
    if (updateCheckResult?.hasUpdate && updateCheckResult.updateInfo) {
      console.log('[App] Update available, showing modal:', updateCheckResult.updateInfo.version);
      setShowUpdateModal(true);
    } else if (updateCheckResult?.error) {
      console.warn('[App] Update check error:', updateCheckResult.error);
    }
  }, [updateCheckResult]);

  return (
    <>
      {/* Launcher Update Modal */}
      {updateCheckResult?.hasUpdate && updateCheckResult.updateInfo && (
        <LauncherUpdateModal
          isOpen={showUpdateModal}
          onClose={() => {
            if (!updateCheckResult.isRequired) {
              setShowUpdateModal(false);
            }
          }}
          updateInfo={updateCheckResult.updateInfo}
          isRequired={updateCheckResult.isRequired || false}
          apiUrl={API_CONFIG.baseUrl}
          currentVersion={currentVersion || undefined}
        />
      )}

      <Routes>
        {/* Generate routes from configuration */}
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={wrapRouteComponent(route)}
          />
        ))}
        
        {/* 404 - Catch all unmatched routes */}
        <Route
          path="*"
          element={
            <Suspense fallback={<LoadingSpinner fullScreen message="Loading page..." />}>
              <Layout>
                <NotFoundPage />
              </Layout>
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default App;
