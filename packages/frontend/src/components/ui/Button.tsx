/**
 * Cyberpunk Button Component
 * Techno-Magic Design System
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'hex';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export default function Button({
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  variant = 'primary',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center text-xs font-bold tracking-wider transition-all duration-200 group overflow-hidden";

  const variants: Record<ButtonVariant, string> = {
    primary: "text-dark-primary bg-techno-cyan hover:bg-white clip-hex-button px-8 py-3 hover:shadow-[0_0_20px_rgba(0,245,255,0.6)]",
    secondary: "text-techno-cyan bg-transparent border-none clip-cyber-corner px-6 py-3 hover:text-white hover:bg-techno-cyan/10 ring-1 ring-techno-cyan/40",
    danger: "text-status-error bg-status-error/10 clip-cyber-corner px-6 py-3 hover:bg-status-error hover:text-white ring-1 ring-status-error",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5 rounded px-4 py-2",
    hex: "bg-dark-card border border-magic-purple text-magic-purple hover:bg-magic-purple hover:text-white clip-hex-button px-8 py-3 shadow-[0_0_10px_rgba(176,38,255,0.2)]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${isLoading ? 'opacity-80 cursor-wait' : ''} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Decorative circuitry lines for Primary/Hex */}
      {(variant === 'primary' || variant === 'hex') && (
        <div className="absolute inset-0 pointer-events-none opacity-30">
           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-current" />
           <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current" />
        </div>
      )}

      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}

      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {rightIcon && !isLoading && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
}
