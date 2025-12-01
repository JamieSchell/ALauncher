/**
 * Routing Components Module
 * 
 * Экспортирует компоненты для защиты маршрутов.
 * 
 * @module components/routing
 */

export { ProtectedRoute } from './ProtectedRoute';
export { AdminRoute } from './AdminRoute';

/**
 * Routing Components API
 * 
 * @example
 * ```tsx
 * import { ProtectedRoute, AdminRoute } from '@/components/routing';
 * 
 * // Protected route (requires authentication)
 * <ProtectedRoute>
 *   <YourPage />
 * </ProtectedRoute>
 * 
 * // Admin route (requires admin role)
 * <AdminRoute>
 *   <AdminPage />
 * </AdminRoute>
 * ```
 */

