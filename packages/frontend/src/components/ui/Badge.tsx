/**
 * Badge Component
 * Techno-Magic Design System
 */

import React from 'react';

export type BadgeStatus = 'online' | 'offline' | 'loading' | 'error' | 'warning' | 'success' | 'info';

export interface BadgeProps {
  status: BadgeStatus;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

const statusStyles: Record<BadgeStatus, { bg: string; text: string; dot: string }> = {
  online: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  offline: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
  loading: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  success: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-sm gap-2',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const dotSize = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

/**
 * Memoized Badge component to prevent unnecessary re-renders
 */
const Badge = React.memo(function Badge({
  status,
  text,
  size = 'md',
  className = '',
  animated = false,
}: BadgeProps) {
  const styles = statusStyles[status];
  const sizeClass = sizeStyles[size];
  const dotClass = dotSize[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border border-current/20 ${styles.bg} ${styles.text} ${sizeClass} ${className} ${animated ? 'animate-pulse' : ''}`}
    >
      <span className={`rounded-full ${styles.dot} ${dotClass}`} aria-hidden="true" />
      {text && <span className="font-medium">{text}</span>}
    </span>
  );
});

export default Badge;
