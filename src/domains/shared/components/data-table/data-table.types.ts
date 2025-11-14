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
 * Acción personalizada de la tabla
 * Permite agregar botones de acción específicos por interfaz
 */
export interface TableAction<T = any> {
  id: string;                    // Identificador único
  icon: string;                  // Nombre del icono de Ionicons (ej: "pencil", "trash", "eye", "key")
  tooltip: string;               // Texto del tooltip
  onPress: (item: T) => void;    // Función a ejecutar
  visible?: (item: T) => boolean; // Opcional: mostrar/ocultar según el item (default: true)
  order?: number;                // Opcional: orden de visualización (por defecto: orden del array)
}

/**
 * Acción estándar de editar
 */
export interface EditAction<T = any> {
  onPress: (item: T) => void;
  tooltip?: string;              // Default: 'Editar'
  visible?: (item: T) => boolean; // Opcional: mostrar/ocultar según el item (default: true)
}

/**
 * Acción estándar de eliminar
 */
export interface DeleteAction<T = any> {
  onPress: (item: T) => void;
  tooltip?: string;              // Default: 'Eliminar'
  visible?: (item: T) => boolean; // Opcional: mostrar/ocultar según el item (default: true)
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
  
  // Sistema de acciones configurables
  actions?: TableAction<T>[];     // Acciones personalizadas (se renderizan primero)
  editAction?: EditAction<T>;     // Acción estándar de editar (se renderiza antes de eliminar)
  deleteAction?: DeleteAction<T>; // Acción estándar de eliminar (se renderiza al final)
  actionsColumnWidth?: string;    // Opcional: ancho de la columna acciones (default: '18%')
  actionsColumnLabel?: string;    // Opcional: label de la columna (default: 'Acciones')
}

