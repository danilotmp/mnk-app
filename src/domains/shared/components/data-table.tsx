/**
 * Componente de tabla de datos con paginación
 * Componente reutilizable para mostrar listas con paginación
 * Reestructurado para mejor distribución de columnas
 */

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { createDataTableStyles } from '@/src/styles/components/data-table.styles';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    View
} from 'react-native';

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
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    limitOptions?: number[];
  };
  variant?: 'bordered' | 'striped' | 'hover';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente DataTable con paginación
 */
export function DataTable<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onRowPress,
  keyExtractor = (item: T, index: number) => `row-${index}`,
  showPagination = true,
  pagination,
  variant = 'bordered',
  size = 'md',
}: DataTableProps<T>) {
  const { colors } = useTheme();
  const styles = createDataTableStyles();

  /**
   * Calcular flex value para cada columna basado en width
   * Usamos flex en lugar de width absoluto para mejor distribución
   */
  const getColumnFlex = (column: TableColumn<T>, index: number): number => {
    // Si no tiene width, usar flex: 1 (distribución igual)
    if (!column.width) {
      return 1;
    }
    
    // Si es un número, usar ese valor como ratio de flex
    if (typeof column.width === 'number') {
      return column.width;
    }
    
    // Si es un string con porcentaje, convertir a ratio de flex
    if (typeof column.width === 'string' && column.width.endsWith('%')) {
      const percentage = parseFloat(column.width) / 100;
      // Convertir porcentaje a ratio de flex (multiplicar por 100 para mejor granularidad)
      return Math.max(0.5, percentage * 100);
    }
    
    // Por defecto, flex: 1
    return 1;
  };

  /**
   * Renderizar celda
   */
  const renderCell = (item: T, column: TableColumn<T>, index: number) => {
    if (column.render) {
      return column.render(item, index);
    }

    const value = (item as any)[column.key];
    return (
      <ThemedText type="body2" style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">
        {value !== undefined && value !== null ? String(value) : '-'}
      </ThemedText>
    );
  };

  /**
   * Renderizar fila
   */
  const renderRow = (item: T, index: number) => {
    const rowKey = keyExtractor(item, index);
    const isStriped = variant === 'striped' && index % 2 === 1;

    const rowContent = (
      <>
        {columns.map((column, colIndex) => {
          const columnFlex = getColumnFlex(column, colIndex);
          const isLastColumn = colIndex === columns.length - 1;
          return (
            <View
              key={column.key}
              style={[
                styles.cell,
                { flex: columnFlex },
                column.align === 'center' && styles.cellCenter,
                column.align === 'right' && styles.cellRight,
                { borderRightWidth: isLastColumn ? 0 : 1, borderRightColor: colors.border },
              ]}
            >
              {renderCell(item, column, index)}
            </View>
          );
        })}
      </>
    );

    if (onRowPress) {
      return (
        <TouchableOpacity
          key={rowKey}
          style={[
            styles.row,
            isStriped && styles.stripedRow,
            { borderBottomColor: colors.border },
          ]}
          onPress={() => onRowPress(item, index)}
          activeOpacity={0.7}
        >
          {rowContent}
        </TouchableOpacity>
      );
    }

    return (
      <View
        key={rowKey}
        style={[
          styles.row,
          isStriped && styles.stripedRow,
          { borderBottomColor: colors.border },
        ]}
      >
        {rowContent}
      </View>
    );
  };

  /**
   * Renderizar paginación
   */
  const renderPagination = () => {
    if (!showPagination || !pagination) {
      return null;
    }

    const { page, limit, total, totalPages, onPageChange, onLimitChange, limitOptions } =
      pagination;

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    return (
      <View style={[styles.pagination, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Información de registros */}
        <View style={styles.paginationInfo}>
          <ThemedText type="body2" variant="secondary">
            Mostrando {start}-{end} de {total}
          </ThemedText>
        </View>

        {/* Controles de paginación */}
        <View style={styles.paginationControls}>
          {/* Selector de registros por página */}
          {onLimitChange && limitOptions && limitOptions.length > 0 && (
            <View style={styles.limitSelector}>
              <ThemedText type="body2" variant="secondary" style={styles.limitLabel}>
                Mostrar:
              </ThemedText>
              <View style={styles.limitOptions}>
                {limitOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.limitOption,
                      limit === option && { backgroundColor: colors.primary },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => onLimitChange(option)}
                  >
                    <ThemedText
                      type="body2"
                      style={limit === option ? { color: '#FFFFFF' } : {}}
                    >
                      {option}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Botones de navegación */}
          <View style={styles.pageButtons}>
            <TouchableOpacity
              style={[
                styles.pageButton,
                page === 1 && styles.pageButtonDisabled,
                { borderColor: colors.border },
              ]}
              onPress={() => onPageChange(1)}
              disabled={page === 1}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={page === 1 ? colors.textSecondary : colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pageButton,
                page === 1 && styles.pageButtonDisabled,
                { borderColor: colors.border },
              ]}
              onPress={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <Ionicons
                name="chevron-back-outline"
                size={20}
                color={page === 1 ? colors.textSecondary : colors.text}
              />
            </TouchableOpacity>

            {/* Indicador de página actual */}
            <View style={styles.pageIndicator}>
              <ThemedText type="body2">
                Página {page} de {totalPages}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.pageButton,
                page === totalPages && styles.pageButtonDisabled,
                { borderColor: colors.border },
              ]}
              onPress={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={page === totalPages ? colors.textSecondary : colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pageButton,
                page === totalPages && styles.pageButtonDisabled,
                { borderColor: colors.border },
              ]}
              onPress={() => onPageChange(totalPages)}
              disabled={page === totalPages}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={page === totalPages ? colors.textSecondary : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
            Cargando datos...
          </ThemedText>
        </View>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
          <ThemedText type="body1" variant="secondary" style={styles.emptyText}>
            {emptyMessage}
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      {/* Encabezado de la tabla */}
      <View style={[styles.header, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          {columns.map((column, colIndex) => {
            const columnFlex = getColumnFlex(column, colIndex);
            const isLastColumn = colIndex === columns.length - 1;
            return (
              <View
                key={column.key}
                style={[
                  styles.headerCell,
                  { flex: columnFlex },
                  column.align === 'center' && styles.headerCellCenter,
                  column.align === 'right' && styles.headerCellRight,
                  { borderRightWidth: isLastColumn ? 0 : 1, borderRightColor: colors.border },
                ]}
              >
                <ThemedText type="defaultSemiBold" style={styles.headerText} numberOfLines={1}>
                  {column.label}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>

      {/* Cuerpo de la tabla */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {data.map((item, index) => renderRow(item, index))}
      </ScrollView>

      {/* Paginación */}
      {renderPagination()}
    </Card>
  );
}
