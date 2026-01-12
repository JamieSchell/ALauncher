/**
 * Container Component
 * Provides consistent max-width and padding for content
 */

import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { maxWidth: '640px' },
  md: { maxWidth: '768px' },
  lg: { maxWidth: '1024px' },
  xl: { maxWidth: '1280px' },
  '2xl': { maxWidth: '1536px' },
  full: { maxWidth: '100%' },
};

export default function Container({
  children,
  size = 'xl',
  className = ''
}: ContainerProps) {
  return (
    <div style={{ margin: '0 auto', padding: '1rem', ...sizeStyles[size] }}>
      {children}
    </div>
  );
}
