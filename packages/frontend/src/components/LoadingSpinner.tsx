/**
 * Loading Spinner Component
 * Informative loading indicator with messages
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message,
  subMessage,
  size = 'md',
  fullScreen = false
}: LoadingSpinnerProps) {
  const { t } = useTranslation();
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const spinner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} border-4 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-4`}
      />
      {message && (
        <p className="text-gray-300 text-lg font-medium mb-1">{message}</p>
      )}
      {subMessage && (
        <p className="text-gray-500 text-sm">{subMessage}</p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        {spinner}
      </div>
    );
  }

  return spinner;
}

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText,
  className = ''
}: LoadingButtonProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={16} className="text-current" />
        </motion.div>
      )}
      <span>{isLoading ? loadingText : children}</span>
    </div>
  );
}

