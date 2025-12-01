/**
 * Card Component
 *
 * Универсальный компонент карточки для группировки контента.
 * Использует дизайн-систему для консистентного стиля.
 *
 * @module components/ui/Card
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cardVariants, cardBase, cn } from '../../styles/design-system';
import { useOptimizedAnimation } from '../../hooks/useOptimizedAnimation';

export type CardVariant = keyof typeof cardVariants;

export interface CardProps {
  /** Вариант стиля карточки */
  variant?: CardVariant;
  /** Заголовок карточки */
  title?: React.ReactNode;
  /** Подзаголовок карточки */
  subtitle?: React.ReactNode;
  /** Действия в заголовке (кнопки, иконки) */
  actions?: React.ReactNode;
  /** Дочерние элементы */
  children: React.ReactNode;
  /** Дополнительные классы */
  className?: string;
  /** Анимировать появление */
  animate?: boolean;
}

/**
 * Card Component
 *
 * @example
 * ```tsx
 * <Card title="Server Status" subtitle="Minecraft Server">
 *   <p>Content here</p>
 * </Card>
 *
 * <Card variant="elevated" title="Profile" actions={<Button>Edit</Button>}>
 *   <ProfileInfo />
 * </Card>
 * ```
 */
export default function Card({
  variant = 'default',
  title,
  subtitle,
  actions,
  children,
  className,
  animate = true,
}: CardProps) {
  const { shouldAnimate } = useOptimizedAnimation();

  const cardClasses = cn(cardBase, cardVariants[variant], className);

  const content = (
    <>
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-heading mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-body-muted">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div>{children}</div>
    </>
  );

  if (animate && shouldAnimate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cardClasses}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}

