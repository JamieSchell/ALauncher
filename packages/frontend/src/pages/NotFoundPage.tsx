/**
 * 404 Not Found Page - Functionality Only
 */

import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '448px', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <AlertCircle style={{ width: '96px', height: '96px', margin: '0 auto 16px', color: '#6366f1' }} />
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>404</h1>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
            {t('errors.pageNotFound') || 'Page Not Found'}
          </h2>
          <p style={{ marginBottom: '32px' }}>
            {t('errors.pageNotFoundDescription') || 'The page you are looking for does not exist.'}
          </p>
        </div>

        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#6366f1', color: 'white', borderRadius: '8px', fontWeight: '500', textDecoration: 'none' }}
        >
          <Home style={{ width: '20px', height: '20px' }} />
          {t('nav.home') || 'Go Home'}
        </Link>
      </div>
    </div>
  );
}

