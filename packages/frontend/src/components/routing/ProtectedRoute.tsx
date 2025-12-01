/**
 * Protected Route Component
 * 
 * Защищает маршрут, требуя авторизации пользователя.
 * Если пользователь не авторизован, перенаправляет на страницу входа.
 * 
 * @component
 * @example
 * ```tsx
 * import { ProtectedRoute } from '@/components/routing';
 * 
 * <Route
 *   path="/settings"
 *   element={
 *     <ProtectedRoute>
 *       <SettingsPage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Props for ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** Content to render if user is authenticated */
  children: ReactNode;
  /** Optional redirect path (default: '/login') */
  redirectTo?: string;
}

/**
 * Protected Route Component
 * 
 * Wraps content that requires authentication.
 * Shows loading spinner while checking auth state, then either renders children
 * or redirects to login page.
 * 
 * @param props - ProtectedRoute component props
 * @returns Protected content or redirect to login
 */
export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, accessToken } = useAuthStore();

  // Show loading while checking auth state
  if (accessToken === undefined) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render protected content
  return <>{children}</>;
}

