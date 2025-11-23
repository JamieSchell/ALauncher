import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ServerDetailsPage from './pages/ServerDetailsPage';
import ProfilesManagementPage from './pages/ProfilesManagementPage';
import CrashesManagementPage from './pages/CrashesManagementPage';
import UsersManagementPage from './pages/UsersManagementPage';
import ProfilePage from './pages/ProfilePage';
import StatisticsPage from './pages/StatisticsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ErrorLoggerService from './services/errorLogger';
import LauncherUpdateModal from './components/LauncherUpdateModal';
import { useLauncherUpdate } from './hooks/useLauncherUpdate';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7240';

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
          apiUrl={API_URL}
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
              <HomePage />
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
              <SettingsPage />
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
              <ProfilePage />
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
              <StatisticsPage />
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
              <ServerDetailsPage />
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
                <ProfilesManagementPage />
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
                <CrashesManagementPage />
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
                <UsersManagementPage />
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
                <AdminDashboardPage />
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
