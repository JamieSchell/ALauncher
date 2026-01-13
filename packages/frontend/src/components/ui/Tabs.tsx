/**
 * Simple Tabs Component with full accessibility support
 */

import React, { useState, useCallback } from 'react';

export interface Tab {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  value?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  defaultTab,
  value,
  onChange,
  className = '',
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultTab || tabs[0]?.id || '');

  const activeTab = value !== undefined ? value : internalValue;
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const handleTabChange = (tabId: string) => {
    if (value === undefined) {
      setInternalValue(tabId);
    }
    onChange?.(tabId);
  };

  // Keyboard navigation for tabs
  const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string) => {
    const tabIds = tabs.map(t => t.id);
    const currentIndex = tabIds.indexOf(tabId);

    let nextIndex: number;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1;
        handleTabChange(tabIds[nextIndex]);
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : 0;
        handleTabChange(tabIds[nextIndex]);
        break;
      case 'Home':
        e.preventDefault();
        handleTabChange(tabIds[0]);
        break;
      case 'End':
        e.preventDefault();
        handleTabChange(tabIds[tabIds.length - 1]);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleTabChange(tabId);
        break;
    }
  }, [tabs, value, onChange]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
  };

  const tabsListStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '16px',
  };

  const tabButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    opacity: 1,
  };

  const tabButtonActiveStyle: React.CSSProperties = {
    ...tabButtonStyle,
    borderBottom: '2px solid #000',
    fontWeight: 'bold',
  };

  const tabButtonDisabledStyle: React.CSSProperties = {
    ...tabButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  return (
    <div style={containerStyle} className={className}>
      <div role="tablist" aria-orientation="horizontal" style={tabsListStyle}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              aria-disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !isDisabled && handleTabChange(tab.id)}
              onKeyDown={(e) => !isDisabled && handleKeyDown(e, tab.id)}
              disabled={isDisabled}
              style={
                isDisabled
                  ? tabButtonDisabledStyle
                  : isActive
                  ? tabButtonActiveStyle
                  : tabButtonStyle
              }
            >
              {tab.icon && <span aria-hidden="true" style={{ marginRight: '8px' }}>{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>

      {currentTab && (
        <div
          role="tabpanel"
          id={`tabpanel-${currentTab.id}`}
          aria-labelledby={`tab-${currentTab.id}`}
          tabIndex={0}
        >
          {currentTab.content}
        </div>
      )}
    </div>
  );
}
