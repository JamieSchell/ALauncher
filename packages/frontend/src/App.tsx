import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ErrorLoggerService from './services/errorLogger';
import LauncherUpdateModal from './components/LauncherUpdateModal';
import { useLauncherUpdate } from './hooks/useLauncherUpdate';
import { API_CONFIG } from './config/api';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ServerDetailsPage = lazy(() => import('./pages/ServerDetailsPage'));
const ProfilesManagementPage = lazy(() => import('./pages/ProfilesManagementPage'));
const CrashesManagementPage = lazy(() => import('./pages/CrashesManagementPage'));
const UsersManagementPage = lazy(() => import('./pages/UsersManagementPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuthStore();
  
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { updateCheckResult, currentVersion } = useLauncherUpdate();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    // Initialize error logger
    ErrorLoggerService.initialize();

    // Global error handlers
    const handleError = (event: ErrorEvent) => {
      ErrorLoggerService.logErrorAuto(event.error || new Error(event.message), {
        component: 'GlobalErrorHandler',
        action: 'unhandledError',
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      ErrorLoggerService.logErrorAuto(event.reason, {
        component: 'GlobalErrorHandler',
        action: 'unhandledRejection',
      });
    };

    // Register global error handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout>
              <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                <HomePage />
              </Suspense>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/settings"
        element={
          isAuthenticated ? (
            <Layout>
              <Suspense fallback={<LoadingSpinner fullScreen message="Loading settings..." />}>
                <SettingsPage />
              </Suspense>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/profile"
        element={
          isAuthenticated ? (
            <Layout>
              <Suspense fallback={<LoadingSpinner fullScreen message="Loading profile..." />}>
                <ProfilePage />
              </Suspense>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/statistics"
        element={
          isAuthenticated ? (
            <Layout>
              <Suspense fallback={<LoadingSpinner fullScreen message="Loading statistics..." />}>
                <StatisticsPage />
              </Suspense>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/server"
        element={<Navigate to="/" replace />}
      />
      <Route
        path="/server/:id"
        element={
          isAuthenticated ? (
            <Layout>
              <Suspense fallback={<LoadingSpinner fullScreen message="Loading server details..." />}>
                <ServerDetailsPage />
              </Suspense>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={<Navigate to="/admin/profiles" replace />}
      />
      <Route
        path="/admin/profiles"
        element={
          isAuthenticated ? (
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading profiles..." />}>
                  <ProfilesManagementPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin/crashes"
        element={
          isAuthenticated ? (
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading crashes..." />}>
                  <CrashesManagementPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin/users"
        element={
          isAuthenticated ? (
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading users..." />}>
                  <UsersManagementPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          isAuthenticated ? (
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading dashboard..." />}>
                  <AdminDashboardPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
    </>
  );
}

export default App;
