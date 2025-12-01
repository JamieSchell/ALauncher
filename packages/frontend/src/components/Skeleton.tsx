/**
 * Skeleton Loader Component
 * Displays skeleton placeholders while content is loading
 */

import { motion } from 'framer-motion';

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
  const baseClasses = 'bg-gray-700/50 rounded animate-pulse';
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`${baseClasses} ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            style={{ height: height || '1rem' }}
          />
        ))}
      </div>
    );
  }

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${
        variant === 'circular' ? 'rounded-full' : 
        variant === 'text' ? 'rounded' : 
        'rounded-lg'
      } ${className}`}
      style={style}
    />
  );
}

// Predefined skeleton components
export function SkeletonCard() {
  return (
    <div className="bg-surface-elevated/90 border border-white/15 rounded-2xl p-lg space-y-base">
      <Skeleton variant="rectangular" height="24px" width="60%" />
      <Skeleton variant="text" lines={2} />
      <div className="grid grid-cols-2 gap-md">
        <Skeleton variant="rectangular" height="60px" />
        <Skeleton variant="rectangular" height="60px" />
      </div>
    </div>
  );
}

export function SkeletonServerCard() {
  return (
    <div className="bg-surface-elevated/90 border border-white/15 rounded-2xl p-lg space-y-base">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="rectangular" height="28px" width="70%" />
          <Skeleton variant="rectangular" height="16px" width="50%" />
        </div>
        <Skeleton variant="rectangular" height="24px" width="80px" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height="24px" width="60px" />
        <Skeleton variant="rectangular" height="24px" width="60px" />
      </div>
      <div className="grid grid-cols-2 gap-md">
        <Skeleton variant="rectangular" height="60px" />
        <Skeleton variant="rectangular" height="60px" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-surface-elevated/90 border border-white/10 rounded-lg">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="rectangular" height="16px" width="40%" />
            <Skeleton variant="rectangular" height="12px" width="60%" />
          </div>
          <Skeleton variant="rectangular" height="32px" width="100px" />
        </div>
      ))}
    </div>
  );
}

