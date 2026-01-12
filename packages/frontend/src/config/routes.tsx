/**
 * Routes Configuration
 * 
 * Централизованная конфигурация всех маршрутов приложения.
 * Используется для генерации Routes в App.tsx без дублирования логики.
 * 
 * @module config/routes
 */

import { lazy, ComponentType, ReactElement, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { ProtectedRoute, AdminRoute } from '../components/routing';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('../pages/HomePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ServerDetailsPage = lazy(() => import('../pages/ServerDetailsPage'));
const ProfilesManagementPage = lazy(() => import('../pages/ProfilesManagementPage'));
const CrashesManagementPage = lazy(() => import('../pages/CrashesManagementPage'));
const UsersManagementPage = lazy(() => import('../pages/UsersManagementPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const StatisticsPage = lazy(() => import('../pages/StatisticsPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));

/**
 * Route access level
 */
export enum RouteAccess {
  /** Public route - accessible to everyone */
  PUBLIC = 'public',
  /** Protected route - requires authentication */
  PROTECTED = 'protected',
  /** Admin route - requires admin role */
  ADMIN = 'admin',
}

/**
 * Route configuration interface
 */
export interface RouteConfig {
  /** Route path */
  path: string;
  /** Lazy-loaded page component */
  component: ComponentType<any>;
  /** Access level */
  access: RouteAccess;
  /** Loading message for Suspense fallback */
  loadingMessage?: string;
  /** Redirect path (for redirect routes) */
  redirectTo?: string;
}

/**
 * Routes configuration array
 * 
 * Порядок важен: более специфичные маршруты должны быть выше общих.
 */
export const routes: RouteConfig[] = [
  // Public routes
  {
    path: '/login',
    component: lazy(() => import('../pages/LoginPage')),
    access: RouteAccess.PUBLIC,
  },

  // Redirects
  {
    path: '/server',
    component: () => null, // Will be handled as redirect
    access: RouteAccess.PUBLIC,
    redirectTo: '/',
  },
  {
    path: '/admin',
    component: () => null, // Will be handled as redirect
    access: RouteAccess.PUBLIC,
    redirectTo: '/admin/profiles',
  },

  // Protected routes
  {
    path: '/',
    component: HomePage,
    access: RouteAccess.PROTECTED,
    loadingMessage: 'Loading...',
  },
  {
    path: '/settings',
    component: SettingsPage,
    access: RouteAccess.PROTECTED,
    loadingMessage: 'Loading settings...',
  },
  {
    path: '/profile',
    component: ProfilePage,
    access: RouteAccess.PROTECTED,
    loadingMessage: 'Loading profile...',
  },
  {
    path: '/statistics',
    component: StatisticsPage,
    access: RouteAccess.PROTECTED,
    loadingMessage: 'Loading statistics...',
  },
  {
    path: '/server/:id',
    component: ServerDetailsPage,
    access: RouteAccess.PROTECTED,
    loadingMessage: 'Loading server details...',
  },

  // Admin routes
  {
    path: '/admin/profiles',
    component: ProfilesManagementPage,
    access: RouteAccess.ADMIN,
    loadingMessage: 'Loading profiles...',
  },
  {
    path: '/admin/crashes',
    component: CrashesManagementPage,
    access: RouteAccess.ADMIN,
    loadingMessage: 'Loading crashes...',
  },
  {
    path: '/admin/users',
    component: UsersManagementPage,
    access: RouteAccess.ADMIN,
    loadingMessage: 'Loading users...',
  },
  {
    path: '/admin/dashboard',
    component: AdminDashboardPage,
    access: RouteAccess.ADMIN,
    loadingMessage: 'Loading dashboard...',
  },
];

/**
 * Helper function to wrap route component with appropriate protection
 * 
 * @param config - Route configuration
 * @returns Wrapped component with protection and layout
 */
export function wrapRouteComponent(config: RouteConfig): any {
  const { component: Component, access, loadingMessage = 'Loading...', redirectTo } = config;

  // Handle redirects
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // Wrap component with Suspense
  const SuspenseWrapper = (
    <Suspense fallback={<LoadingSpinner fullScreen message={loadingMessage} />}>
      <Component />
    </Suspense>
  );

  // Wrap with Layout for protected and admin routes
  const LayoutWrapper = <Layout>{SuspenseWrapper}</Layout>;

  // Apply access control
  switch (access) {
    case RouteAccess.PUBLIC:
      return SuspenseWrapper;

    case RouteAccess.PROTECTED:
      return <ProtectedRoute>{LayoutWrapper}</ProtectedRoute>;
    
    case RouteAccess.ADMIN:
      return (
        <AdminRoute>
          {LayoutWrapper}
        </AdminRoute>
      );
    
    default:
      return SuspenseWrapper;
  }
}

