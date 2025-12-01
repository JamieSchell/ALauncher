/**
 * 404 Not Found Page
 * 
 * Страница, отображаемая при переходе на несуществующий маршрут.
 */

import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <div className="mb-8">
          <AlertCircle className="w-24 h-24 mx-auto text-primary-500 mb-4" />
          <h1 className="text-6xl font-bold text-text-primary mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-text-secondary mb-4">
            {t('errors.pageNotFound') || 'Page Not Found'}
          </h2>
          <p className="text-text-tertiary mb-8">
            {t('errors.pageNotFoundDescription') || 'The page you are looking for does not exist.'}
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
        >
          <Home className="w-5 h-5" />
          {t('nav.home') || 'Go Home'}
        </Link>
      </motion.div>
    </div>
  );
}

