/**
 * Admin Route Component
 * 
 * Защищает маршрут, требуя прав администратора.
 * Если пользователь не авторизован, перенаправляет на страницу входа.
 * Если пользователь не является администратором, перенаправляет на главную страницу.
 * 
 * @component
 * @example
 * ```tsx
 * import { AdminRoute } from '@/components/routing';
 * 
 * <Route
 *   path="/admin/users"
 *   element={
 *     <AdminRoute>
 *       <UsersManagementPage />
 *     </AdminRoute>
 *   }
 * />
 * ```
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Props for AdminRoute component
 */
interface AdminRouteProps {
  /** Content to render if user is admin */
  children: ReactNode;
  /** Optional redirect path for non-admin users (default: '/') */
  redirectTo?: string;
  /** Optional redirect path for unauthenticated users (default: '/login') */
  loginRedirectTo?: string;
}

/**
 * Admin Route Component
 * 
 * Wraps content that requires admin privileges.
 * Shows loading spinner while checking auth state, then either renders children
 * or redirects based on user role.
 * 
 * @param props - AdminRoute component props
 * @returns Admin content or redirect
 */
export function AdminRoute({ 
  children, 
  redirectTo = '/',
  loginRedirectTo = '/login'
}: AdminRouteProps) {
  const { isAuthenticated, isAdmin, accessToken } = useAuthStore();

  // Show loading while checking auth state
  if (accessToken === undefined) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={loginRedirectTo} replace />;
  }

  // Redirect to home if not admin
  if (!isAdmin()) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render admin content
  return <>{children}</>;
}

