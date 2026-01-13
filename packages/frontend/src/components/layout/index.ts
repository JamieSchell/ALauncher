/**
 * Layout Components Module
 *
 * Экспортирует все layout компоненты с четким API.
 * Используется для создания структуры приложения: заголовок, боковая панель, навигация.
 *
 * @module components/layout
 */

export { default as Layout } from './Layout';
export { default as TitleBar } from './TitleBar';
export { default as Sidebar } from './Sidebar';
export { default as Breadcrumbs } from './Breadcrumbs';

/**
 * Layout API
 *
 * @example
 * ```tsx
 * import { Layout, TitleBar, Sidebar, Breadcrumbs } from '@/components/layout';
 *
 * function App() {
 *   return (
 *     <Layout>
 *       <YourPageContent />
 *     </Layout>
 *   );
 * }
 * ```
 *
 * Layout автоматически включает:
 * - TitleBar (верхняя панель)
 * - Sidebar (боковая навигация)
 * - Breadcrumbs (навигационные крошки)
 * - Анимированный фон
 * - Skip links для accessibility
 */

