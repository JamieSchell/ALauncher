/**
 * Table Component
 *
 * Универсальный компонент таблицы с поддержкой сортировки и адаптивности.
 * Использует дизайн-систему для консистентного стиля.
 *
 * @module components/ui/Table
 */

import React from 'react';
import { tableBase, tableHeader, tableHeaderCell, tableBody, tableRow, tableCell, cn } from '../../styles/design-system';

export interface TableColumn<T = any> {
  /** Ключ данных для колонки */
  key: string;
  /** Заголовок колонки */
  header: React.ReactNode;
  /** Функция рендеринга ячейки */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Выравнивание текста */
  align?: 'left' | 'center' | 'right';
  /** Ширина колонки */
  width?: string | number;
  /** Скрыть на мобильных */
  hideOnMobile?: boolean;
}

export interface TableProps<T = any> {
  /** Данные для таблицы */
  data: T[];
  /** Конфигурация колонок */
  columns: TableColumn<T>[];
  /** Ключ для уникальной идентификации строк */
  rowKey?: string | ((row: T, index: number) => string);
  /** Обработчик клика по строке */
  onRowClick?: (row: T, index: number) => void;
  /** Показывать пустое состояние */
  emptyMessage?: React.ReactNode;
  /** Дополнительные классы */
  className?: string;
}

/**
 * Table Component
 *
 * @example
 * ```tsx
 * const columns = [
 *   { key: 'name', header: 'Name' },
 *   { key: 'email', header: 'Email' },
 *   { key: 'role', header: 'Role', render: (value) => <Badge>{value}</Badge> },
 * ];
 *
 * <Table data={users} columns={columns} rowKey="id" />
 * ```
 */
export default function Table<T = any>({
  data,
  columns,
  rowKey = 'id',
  onRowClick,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }
    return (row as any)[rowKey] || `row-${index}`;
  };

  if (data.length === 0) {
    return (
      <div className={cn('text-center py-12 text-body-muted', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={tableBase}>
        <thead className={tableHeader}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  tableHeaderCell,
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.hideOnMobile && 'hidden md:table-cell'
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={tableBody}>
          {data.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className={cn(tableRow, onRowClick && 'cursor-pointer')}
              onClick={() => onRowClick?.(row, index)}
            >
              {columns.map((column) => {
                const value = (row as any)[column.key];
                const content = column.render
                  ? column.render(value, row, index)
                  : value ?? '—';

                return (
                  <td
                    key={column.key}
                    className={cn(
                      tableCell,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.hideOnMobile && 'hidden md:table-cell'
                    )}
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

