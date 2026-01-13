/**
 * Cyberpunk Card Component with keyboard support
 * Techno-Magic Design System
 */

import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

/**
 * Memoized Card component to prevent unnecessary re-renders
 * Only re-renders when props actually change
 */
const Card = React.memo(function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  hoverEffect = false,
  onClick,
}: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={typeof title === 'string' ? title : onClick ? 'Card action' : undefined}
      className={`relative bg-dark-card/60 backdrop-blur-md clip-cyber-corner border-0 p-1 ${className} ${hoverEffect ? 'group cursor-pointer hover:-translate-y-1 transition-transform duration-300' : ''}`}
    >
      {/* Dynamic Border via CSS/Divs */}
      <div className={`absolute inset-0 clip-cyber-corner border border-white/5 ${hoverEffect ? 'group-hover:border-techno-cyan/50 group-hover:shadow-neon-cyan' : 'border-white/10'}`} />

      {/* Inner Content Container */}
      <div className="relative bg-dark-panel/80 clip-cyber-corner h-full p-5 overflow-hidden">
        {/* Holographic Background */}
        <div className="absolute inset-0 bg-rune-pattern opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-techno-cyan/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {/* Tech Decor */}
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-techno-cyan/50 to-transparent" />
        <div className="absolute bottom-0 right-0 w-20 h-1 bg-gradient-to-l from-magic-purple/50 to-transparent" />

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
});

export default Card;
