/**
 * Modal Component
 *
 * Универсальный компонент модального окна с поддержкой различных размеров и вариантов.
 * Использует дизайн-систему для консистентного стиля.
 *
 * @module components/ui/Modal
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalOverlay, modalContent, modalHeader, modalBody, modalFooter, cn } from '../../styles/design-system';
import { useOptimizedAnimation } from '../../hooks/useOptimizedAnimation';

export interface ModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Функция закрытия */
  onClose: () => void;
  /** Заголовок модального окна */
  title?: React.ReactNode;
  /** Дочерние элементы */
  children: React.ReactNode;
  /** Футер модального окна (кнопки действий) */
  footer?: React.ReactNode;
  /** Размер модального окна */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Показывать кнопку закрытия */
  showCloseButton?: boolean;
  /** Закрывать при клике на overlay */
  closeOnOverlayClick?: boolean;
  /** Дополнительные классы */
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

/**
 * Modal Component
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   footer={<Button onClick={handleConfirm}>Confirm</Button>}
 * >
 *   <p>Are you sure?</p>
 * </Modal>
 * ```
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  const { shouldAnimate } = useOptimizedAnimation();

  // Закрывать при нажатии Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Блокировать скролл body при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (typeof window === 'undefined') return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={modalOverlay}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.95, y: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : false}
            exit={shouldAnimate ? { opacity: 0, scale: 0.95, y: 20 } : false}
            transition={{ duration: 0.2 }}
            className={cn(modalContent, sizeClasses[size], className)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className={modalHeader}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {typeof title === 'string' ? (
                      <h2 className="text-xl font-semibold text-heading">{title}</h2>
                    ) : (
                      title
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-4 p-1 rounded-lg hover:bg-surface-hover transition-colors text-body-muted hover:text-heading"
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Body */}
            <div className={modalBody}>{children}</div>

            {/* Footer */}
            {footer && <div className={modalFooter}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

