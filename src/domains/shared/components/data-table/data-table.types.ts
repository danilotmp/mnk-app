/**
 * Tipos para el componente DataTable
 */

import React from 'react';

/**
 * Configuración de columna
 */
export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

/**
 * Props del componente DataTable
 */
export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowPress?: (item: T, index: number) => void;
  keyExtractor?: (item: T, index: number) => string;
  showPagination?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    limitOptions?: number[];
  };
  variant?: 'bordered' | 'striped' | 'hover';
  size?: 'sm' | 'md' | 'lg';
}

