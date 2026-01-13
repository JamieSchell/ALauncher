/**
 * Simple Modal Component - No Design
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Focus trap hook for accessibility
 * Keeps keyboard focus within modal when open
 */
function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element when modal opens
    if (firstElement) {
      firstElement.focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isActive, containerRef]);
}

export type ModalSize = 'small' | 'default' | 'large';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap for accessibility
  useFocusTrap(isOpen, modalRef);

  // Store the element that had focus before modal opened
  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement as HTMLElement;

    return () => {
      // Restore focus when modal closes
      previousActiveElement?.focus();
    };
  }, [isOpen]);

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

  const sizeStyles = {
    small: { maxWidth: '400px' },
    default: { maxWidth: '600px' },
    large: { maxWidth: '900px' },
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    ...sizeStyles[size],
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '16px',
    overflowY: 'auto',
    flex: 1,
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
  };

  const modal = (
    <>
      {isOpen && (
        <div
          style={overlayStyle}
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            style={modalStyle}
            className={className}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div style={headerStyle}>
                <div style={{ flex: 1 }}>
                  {typeof title === 'string' ? (
                    <h2 id="modal-title" style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{title}</h2>
                  ) : (
                    <div id="modal-title">{title}</div>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    style={closeButtonStyle}
                    aria-label="Close modal"
                    aria-keyshortcuts="Escape"
                    type="button"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            <div style={bodyStyle}>
              {children}
            </div>

            {footer && (
              <div style={footerStyle}>
                {footer}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return createPortal(modal, document.body);
}
