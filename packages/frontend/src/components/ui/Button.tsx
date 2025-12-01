/**
 * Button Component
 *
 * Универсальный компонент кнопки с поддержкой различных вариантов, размеров и состояний.
 * Использует дизайн-систему для консистентного стиля.
 *
 * @module components/ui/Button
 */

import React from 'react';
import { motion } from 'framer-motion';
import { buttonVariants, buttonSizes, buttonBase, cn } from '../../styles/design-system';
import { useOptimizedAnimation } from '../../hooks/useOptimizedAnimation';

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Вариант стиля кнопки */
  variant?: ButtonVariant;
  /** Размер кнопки */
  size?: ButtonSize;
  /** Показать состояние загрузки */
  isLoading?: boolean;
  /** Иконка слева от текста */
  leftIcon?: React.ReactNode;
  /** Иконка справа от текста */
  rightIcon?: React.ReactNode;
  /** Полная ширина */
  fullWidth?: boolean;
  /** Дочерние элементы */
  children: React.ReactNode;
}

/**
 * Button Component
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * <Button variant="secondary" isLoading={isLoading} leftIcon={<Icon />}>
 *   Loading...
 * </Button>
 * ```
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const { shouldAnimate } = useOptimizedAnimation();

  const buttonClasses = cn(
    buttonBase,
    buttonVariants[variant],
    buttonSizes[size],
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </>
  );

  if (shouldAnimate) {
    return (
      <motion.button
        className={buttonClasses}
        disabled={disabled || isLoading}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {content}
    </button>
  );
}

