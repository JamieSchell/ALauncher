/**
 * Tabs Component
 *
 * Универсальный компонент вкладок для организации контента.
 * Использует дизайн-систему для консистентного стиля.
 *
 * @module components/ui/Tabs
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { tabsList, tabBase, tabActive, cn } from '../../styles/design-system';
import { useOptimizedAnimation } from '../../hooks/useOptimizedAnimation';

export interface Tab {
  /** Уникальный идентификатор вкладки */
  id: string;
  /** Заголовок вкладки */
  label: React.ReactNode;
  /** Иконка вкладки */
  icon?: React.ReactNode;
  /** Контент вкладки */
  content: React.ReactNode;
  /** Отключить вкладку */
  disabled?: boolean;
}

export interface TabsProps {
  /** Вкладки */
  tabs: Tab[];
  /** Активная вкладка по умолчанию */
  defaultTab?: string;
  /** Контролируемое значение активной вкладки */
  value?: string;
  /** Обработчик изменения активной вкладки */
  onChange?: (tabId: string) => void;
  /** Дополнительные классы */
  className?: string;
}

/**
 * Tabs Component
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
 *   { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
 * ];
 *
 * <Tabs tabs={tabs} defaultTab="tab1" />
 * ```
 */
export default function Tabs({
  tabs,
  defaultTab,
  value,
  onChange,
  className,
}: TabsProps) {
  const { shouldAnimate } = useOptimizedAnimation();
  const [internalValue, setInternalValue] = useState(defaultTab || tabs[0]?.id || '');

  const activeTab = value !== undefined ? value : internalValue;
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const handleTabChange = (tabId: string) => {
    if (value === undefined) {
      setInternalValue(tabId);
    }
    onChange?.(tabId);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab List */}
      <div className={tabsList}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && handleTabChange(tab.id)}
              disabled={isDisabled}
              className={cn(
                tabBase,
                isActive && tabActive,
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {currentTab && (
        <motion.div
          key={activeTab}
          initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          {currentTab.content}
        </motion.div>
      )}
    </div>
  );
}

