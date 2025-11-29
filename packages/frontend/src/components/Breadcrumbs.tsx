/**
 * Breadcrumbs Component
 * Displays navigation breadcrumbs
 */

import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const location = useLocation();
  const { t } = useTranslation();

  // Auto-generate breadcrumbs from path if not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [{ label: t('nav.home'), path: '/' }];
    
    // Special handling for /server/:id routes
    if (paths.length >= 2 && paths[0] === 'server') {
      // For /server/:id, create a single breadcrumb "Server Details" that links back to home
      // Don't create a clickable /server breadcrumb since that route doesn't exist
      result.push({ 
        label: t('server.serverDetails'), 
        path: location.pathname // Use full path, but make it non-clickable
      });
      return result;
    }
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      let label = path;
      
      // Human-readable labels
      if (path === 'admin') {
        label = 'Admin';
      } else if (path === 'profiles') {
        label = t('nav.manageProfiles');
      } else if (path === 'users') {
        label = t('nav.manageUsers');
      } else if (path === 'crashes') {
        label = t('nav.crashes');
      } else if (path === 'settings') {
        label = t('nav.settings');
      } else if (path === 'profile') {
        label = t('nav.profile');
      } else if (path === 'statistics') {
        label = t('nav.statistics');
      } else if (path === 'dashboard') {
        label = t('nav.dashboard');
      } else {
        // Capitalize first letter
        label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      }
      
      result.push({ label, path: currentPath });
    });
    
    return result;
  })();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if only on home page
  }

  return (
    <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={item.path} className="flex items-center gap-2">
            {index === 0 ? (
              <Link
                to={item.path}
                className="flex items-center gap-1 text-gray-400 hover:text-[#6b8e23] transition-colors"
              >
                <Home size={16} />
                <span>{item.label}</span>
              </Link>
            ) : isLast ? (
              <span className="text-white font-medium">{item.label}</span>
            ) : (
              <Link
                to={item.path}
                className="text-gray-400 hover:text-[#6b8e23] transition-colors"
              >
                {item.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight size={16} className="text-gray-500" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

