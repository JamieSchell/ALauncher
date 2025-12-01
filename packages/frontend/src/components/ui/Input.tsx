/**
 * Input Component
 *
 * Универсальный компонент поля ввода с поддержкой различных вариантов, размеров и состояний.
 * Использует дизайн-систему для консистентного стиля.
 *
 * @module components/ui/Input
 */

import React from 'react';
import { inputVariants, inputSizes, inputBase, cn } from '../../styles/design-system';

export type InputVariant = keyof typeof inputVariants;
export type InputSize = keyof typeof inputSizes;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Вариант стиля поля ввода */
  variant?: InputVariant;
  /** Размер поля ввода */
  size?: InputSize;
  /** Текст ошибки */
  error?: string;
  /** Текст подсказки */
  hint?: string;
  /** Иконка слева */
  leftIcon?: React.ReactNode;
  /** Иконка справа */
  rightIcon?: React.ReactNode;
  /** Метка поля */
  label?: string;
  /** Обязательное поле */
  required?: boolean;
}

/**
 * Input Component
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   required
 * />
 *
 * <Input
 *   variant="error"
 *   error="This field is required"
 *   leftIcon={<Icon />}
 * />
 * ```
 */
export default function Input({
  variant = 'default',
  size = 'md',
  error,
  hint,
  leftIcon,
  rightIcon,
  label,
  required,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = variant === 'error' || !!error;
  const actualVariant = hasError ? 'error' : variant;

  const inputClasses = cn(
    inputBase,
    inputVariants[actualVariant],
    inputSizes[size],
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-heading mb-2"
        >
          {label}
          {required && <span className="text-error-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-body-muted">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-sm text-body-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

