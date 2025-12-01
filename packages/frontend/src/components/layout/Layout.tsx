/**
 * Main Layout Component
 * 
 * Главный layout контейнер приложения, который включает:
 * - TitleBar (кастомная панель заголовка окна)
 * - Sidebar (боковая навигация)
 * - Breadcrumbs (навигационные крошки)
 * - Анимированный фон с градиентами
 * - Skip links для accessibility
 * - Плавные переходы между страницами
 * 
 * @component
 * @example
 * ```tsx
 * import { Layout } from '@/components/layout';
 * 
 * function App() {
 *   return (
 *     <Layout>
 *       <YourPageContent />
 *     </Layout>
 *   );
 * }
 * ```
 */

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

/**
 * Props for Layout component
 */
interface LayoutProps {
  /** Content to render inside the layout */
  children: ReactNode;
}

/**
 * Main Layout Component
 * 
 * @param props - Layout component props
 * @returns Layout wrapper with TitleBar, Sidebar, Breadcrumbs and animated content area
 */
export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-background-primary relative overflow-hidden">
      {/* Skip Links for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      {/* Modern Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background-primary via-background-secondary to-background-tertiary" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-primary-500/15 to-primary-700/5 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-primary-400/15 to-primary-600/5 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
        
        {/* Animated Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.015] to-transparent animate-shimmer" style={{ 
          backgroundSize: '200% 100%'
        }} />
      </div>
      
      <TitleBar />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-6" role="main" aria-label="Main content">
          <Breadcrumbs />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
