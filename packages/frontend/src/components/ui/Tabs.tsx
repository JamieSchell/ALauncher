/**
 * Simple Tabs Component - No Design
 */

import React, { useState } from 'react';

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
      <div style={tabsListStyle}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && handleTabChange(tab.id)}
              disabled={isDisabled}
              style={
                isDisabled
                  ? tabButtonDisabledStyle
                  : isActive
                  ? tabButtonActiveStyle
                  : tabButtonStyle
              }
            >
              {tab.icon && <span style={{ marginRight: '8px' }}>{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>

      {currentTab && (
        <div>
          {currentTab.content}
        </div>
      )}
    </div>
  );
}
