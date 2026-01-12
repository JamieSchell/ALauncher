/**
 * Loading Spinner Component
 * Informative loading indicator with messages
 */

import { useTranslation } from '../hooks/useTranslation';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message,
  subMessage,
  size = 'md',
  fullScreen = false
}: LoadingSpinnerProps) {
  const { t } = useTranslation();

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { width: '24px', height: '24px' },
    md: { width: '48px', height: '48px' },
    lg: { width: '64px', height: '64px' },
  };

  const spinner = (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        ...sizeStyles[size],
        border: '4px solid rgba(99, 102, 241, 0.3)',
        borderTopColor: 'rgb(99, 102, 241)',
        borderRadius: '50%',
        margin: '0 auto 16px',
        animation: 'spin 1s linear infinite'
      }} />
      {message && (
        <p style={{ color: '#ccc', fontSize: '18px', fontWeight: 500, marginBottom: '4px' }}>{message}</p>
      )}
      {subMessage && (
        <p style={{ color: '#888', fontSize: '14px' }}>{subMessage}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingButton({
  isLoading,
  children,
  loadingText,
  className = ''
}: LoadingButtonProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className={className}>
      {isLoading && (
        <div style={{ animation: 'spin 1s linear infinite' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
            <path d="M12 2C17.5228 2 22 6.47715 22 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <span>{isLoading ? loadingText : children}</span>
    </div>
  );
}
