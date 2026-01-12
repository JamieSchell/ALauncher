/**
 * Progress Bar Component
 * Displays progress with percentage and optional message
 */

interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showIcon?: boolean;
}

export default function ProgressBar({
  progress,
  message,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  animated = true,
  showIcon = false,
}: ProgressBarProps) {
  const heightStyles: Record<string, string> = {
    sm: '6px',
    md: '8px',
    lg: '12px',
  };

  const colorStyles: Record<string, { background: string }> = {
    primary: { background: 'linear-gradient(to right, rgb(99, 102, 241), rgb(79, 70, 229))' },
    success: { background: 'linear-gradient(to right, rgb(74, 222, 128), rgb(34, 197, 94))' },
    warning: { background: 'linear-gradient(to right, rgb(250, 204, 21), rgb(234, 179, 8))' },
    error: { background: 'linear-gradient(to right, rgb(248, 113, 113), rgb(239, 68, 68))' },
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const isComplete = clampedProgress >= 100;
  const isError = color === 'error';

  return (
    <div style={{ width: '100%' }}>
      {(message || showPercentage) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showIcon && isComplete && !isError && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(74, 222, 128)" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {showIcon && isError && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(248, 113, 113)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
            {message && (
              <span style={{
                fontWeight: 500,
                color: isError ? 'rgb(248, 113, 113)' :
                  isComplete ? 'rgb(74, 222, 128)' :
                    '#d1d5db'
              }}>
                {message}
              </span>
            )}
          </div>
          {showPercentage && (
            <span style={{
              fontWeight: 600,
              color: isError ? 'rgb(248, 113, 113)' :
                isComplete ? 'rgb(74, 222, 128)' :
                  '#9ca3af'
            }}>
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      <div style={{
        position: 'relative',
        height: heightStyles[size],
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderRadius: '9999px',
        overflow: 'hidden'
      }}>
        {/* Progress fill */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: `${clampedProgress}%`,
          borderRadius: '9999px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          transition: animated ? 'width 0.3s ease-out' : 'none',
          ...colorStyles[color]
        }} />
      </div>
    </div>
  );
}
