/**
 * Skeleton Loader Component
 * Displays skeleton placeholders while content is loading
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonProps) {
  const baseStyle = {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              ...baseStyle,
              height: height || '16px',
              width: i === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  const style: React.CSSProperties = {
    ...baseStyle,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return <div style={style} className={className} />;
}

// Predefined skeleton components
export function SkeletonCard() {
  return (
    <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Skeleton variant="rectangular" height="24px" width="60%" />
      <Skeleton variant="text" lines={2} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Skeleton variant="rectangular" height="60px" />
        <Skeleton variant="rectangular" height="60px" />
      </div>
    </div>
  );
}

export function SkeletonServerCard() {
  return (
    <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Skeleton variant="rectangular" height="28px" width="70%" />
          <Skeleton variant="rectangular" height="16px" width="50%" />
        </div>
        <Skeleton variant="rectangular" height="24px" width="80px" />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton variant="rectangular" height="24px" width="60px" />
        <Skeleton variant="rectangular" height="24px" width="60px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Skeleton variant="rectangular" height="60px" />
        <Skeleton variant="rectangular" height="60px" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton variant="rectangular" height="16px" width="40%" />
            <Skeleton variant="rectangular" height="12px" width="60%" />
          </div>
          <Skeleton variant="rectangular" height="32px" width="100px" />
        </div>
      ))}
    </div>
  );
}
