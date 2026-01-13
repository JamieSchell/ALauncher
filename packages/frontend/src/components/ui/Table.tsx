/**
 * Simple Table Component with full accessibility support
 */

import React, { useRef, useEffect } from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: React.ReactNode;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  rowKey?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: React.ReactNode;
  className?: string;
}

export default function Table<T = any>({
  data,
  columns,
  rowKey = 'id',
  onRowClick,
  emptyMessage = 'No data available',
  className = '',
}: TableProps<T>) {
  const tableRef = useRef<HTMLTableElement>(null);

  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }
    return (row as any)[rowKey] || `row-${index}`;
  };

  // Keyboard navigation for table rows
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, row: T, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick?.(row, index);
    }
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const thStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    padding: '8px 12px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
  };

  const tdStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    padding: '8px 12px',
  };

  const trClickableStyle: React.CSSProperties = {
    cursor: 'pointer',
  };

  const trHoverStyle: React.CSSProperties = {
    ...trClickableStyle,
    backgroundColor: '#f9fafb',
  };

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }} className={className}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }} className={className}>
      <table ref={tableRef} style={tableStyle} role="grid" aria-label="Data table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                role="columnheader"
                style={{
                  ...thStyle,
                  textAlign: column.align || 'left',
                  width: column.width,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              style={onRowClick ? trClickableStyle : undefined}
              onClick={() => onRowClick?.(row, index)}
              onKeyDown={(e) => handleKeyDown(e, row, index)}
              tabIndex={onRowClick ? 0 : undefined}
              role="row"
              onMouseEnter={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {columns.map((column) => {
                const value = (row as any)[column.key];
                const content = column.render
                  ? column.render(value, row, index)
                  : value ?? '—';

                return (
                  <td
                    key={column.key}
                    role="gridcell"
                    style={{
                      ...tdStyle,
                      textAlign: column.align || 'left',
                    }}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
