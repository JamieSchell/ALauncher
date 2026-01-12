/**
 * Cyberpunk Input Component
 * Techno-Magic Design System
 */

import React from 'react';
import { Cpu } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  required?: boolean;
}

export default function Input({
  error,
  hint,
  leftIcon,
  rightIcon,
  label,
  required,
  className = '',
  id,
  style,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full group ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-xs font-bold text-techno-cyan mb-2 uppercase tracking-widest opacity-80 group-focus-within:opacity-100 transition-opacity">
          <Cpu className="w-3 h-3" /> {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-0 bg-techno-cyan/5 clip-cyber-corner pointer-events-none group-focus-within:bg-techno-cyan/10 transition-colors" />
        
        {/* Border using clip-path and pseudo-element */}
        <div className={`absolute inset-0 pointer-events-none clip-cyber-corner border transition-colors duration-300 ${error ? 'border-status-error' : 'border-techno-cyan/30 group-focus-within:border-techno-cyan group-focus-within:shadow-[0_0_5px_rgba(0,245,255,0.5)]'}`} />

        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-techno-cyan transition-colors">
            {leftIcon}
          </div>
        )}
        
        <input 
          className={`w-full bg-transparent text-white placeholder-gray-600 py-3 ${leftIcon ? 'pl-12' : 'pl-4'} pr-4 focus:outline-none font-mono tracking-wide relative z-10`}
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)', ...style }}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-status-error font-mono animate-pulse">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-gray-500 font-mono">
          {hint}
        </p>
      )}
    </div>
  );
}
