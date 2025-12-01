/**
 * Progress Bar Component
 * Displays progress with percentage and optional message
 */

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    success: 'bg-gradient-to-r from-success-500 to-success-600',
    warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
    error: 'bg-gradient-to-r from-error-500 to-error-600',
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const isComplete = clampedProgress >= 100;
  const isError = color === 'error';

  return (
    <div className="w-full space-y-2">
      {(message || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {showIcon && isComplete && !isError && (
              <CheckCircle2 size={16} className="text-success-400" />
            )}
            {showIcon && isError && (
              <AlertCircle size={16} className="text-error-400" />
            )}
            {message && (
              <span className={`font-medium ${
                isError ? 'text-error-400' : 
                isComplete ? 'text-success-400' : 
                'text-body'
              }`}>
                {message}
              </span>
            )}
          </div>
          {showPercentage && (
            <span className={`font-semibold ${
              isError ? 'text-error-400' : 
              isComplete ? 'text-success-400' : 
              'text-body-muted'
            }`}>
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`relative ${heightClasses[size]} bg-gray-800/50 rounded-full overflow-hidden`}>
        {/* Animated background */}
        {animated && !isComplete && !isError && (
          <motion.div
            className={`absolute inset-0 ${colorClasses[color]} opacity-20`}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          />
        )}
        
        {/* Progress fill */}
        <motion.div
          className={`absolute inset-y-0 left-0 ${colorClasses[color]} rounded-full shadow-lg ${
            animated && !isComplete ? 'transition-all duration-300' : ''
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: animated ? 0.3 : 0, ease: 'easeOut' }}
        >
          {/* Shine effect */}
          {animated && !isComplete && !isError && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

