/**
 * Skeleton Loading Component
 * Shows placeholder content while data is loading
 */

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  count?: number;
}

const variantStyles: Record<string, string> = {
  text: 'rounded-sm h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-md',
};

const animationStyles: Record<string, string> = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer',
  none: '',
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  count = 1,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseStyle = 'bg-gray-700/50';

  const items = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`${baseStyle} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1rem' : undefined),
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
      {...props}
    />
  ));

  return count === 1 ? items[0] : <div className="space-y-2">{items}</div>;
}

/**
 * Card Skeleton - for card placeholders
 */
export interface CardSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showTitle?: boolean;
  showText?: boolean;
  lines?: number;
}

export function CardSkeleton({
  count = 1,
  showAvatar = true,
  showTitle = true,
  showText = true,
  lines = 3,
}: CardSkeletonProps) {
  const cards = Array.from({ length: count }, (_, index) => (
    <div key={index} className="bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-700/50">
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            {showTitle && <Skeleton variant="text" width="60%" />}
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      )}
      {showText && (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} variant="text" width={i === lines - 1 ? '80%' : '100%'} />
          ))}
        </div>
      )}
    </div>
  ));

  return <div className="space-y-4">{cards}</div>;
}

/**
 * Table Skeleton - for table placeholders
 */
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full space-y-3">
      {showHeader && (
        <div className="flex space-x-4 pb-2 border-b border-gray-700">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" width={120} height={20} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={colIndex === 0 ? 120 : '100%'}
              height={16}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * List Skeleton - for list placeholders
 */
export interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
}

export function ListSkeleton({ items = 5, showAvatar = true }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}
