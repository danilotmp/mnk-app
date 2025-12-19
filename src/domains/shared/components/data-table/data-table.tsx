/**
 * Componente de tabla de datos con paginación
 * Componente reutilizable para mostrar listas con paginación
 * Reestructurado para mejor distribución de columnas
 */

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { createDataTableStyles } from './data-table.styles';
import { DataTableProps, TableAction, TableColumn } from './data-table.types';

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
  actions,
  editAction,
  deleteAction,
  actionsColumnWidth = '18%',
  actionsColumnLabel,
  enableRowClick = false,
  showRowNumber = true,
}: DataTableProps<T>) {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const styles = createDataTableStyles(isMobile);
  
  // Color para iconos de acción: primaryDark en dark theme, primary en light theme
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;
  
  /**
   * Construir lista de acciones ordenadas: personalizadas → editar → eliminar
   */
  const orderedActions = useMemo(() => {
    const actionList: (TableAction<T> | { type: 'edit' | 'delete'; action: any })[] = [];
    
    // 1. Acciones personalizadas (en el orden del array, o ordenadas por 'order' si existe)
    if (actions && actions.length > 0) {
      const customActions = [...actions];
      // Ordenar por 'order' si existe, mantener orden del array si no
      const hasOrder = customActions.some(a => a.order !== undefined);
      if (hasOrder) {
        customActions.sort((a, b) => {
          const orderA = a.order ?? Infinity;
          const orderB = b.order ?? Infinity;
          return orderA - orderB;
        });
      }
      actionList.push(...customActions);
    }
    
    // 2. Acción de editar (antes de eliminar)
    if (editAction) {
      actionList.push({ type: 'edit', action: editAction });
    }
    
    // 3. Acción de eliminar (al final)
    if (deleteAction) {
      actionList.push({ type: 'delete', action: deleteAction });
    }
    
    return actionList;
  }, [actions, editAction, deleteAction]);
  
  /**
   * Renderizar acciones para un item
   */
  const renderActions = useCallback((item: T, index: number) => {
    // Color para iconos deshabilitados
    const disabledIconColor = colors.textSecondary || '#9ca3af';
    
    return (
      <View style={styles.actionsContainer}>
        {orderedActions.map((actionOrConfig) => {
          // Acción personalizada
          if ('id' in actionOrConfig) {
            const action = actionOrConfig as TableAction<T>;
            const isVisible = action.visible === undefined ? true : action.visible(item);
            const iconColor = isVisible ? actionIconColor : disabledIconColor;
            
            return (
              <Tooltip key={action.id} text={action.tooltip} position="left">
                <TouchableOpacity
                  style={[styles.actionButton, !isVisible && { opacity: 0.5 }]}
                  onPress={isVisible ? () => action.onPress(item) : undefined}
                  disabled={!isVisible}
                >
                  <Ionicons name={action.icon as any} size={18} color={iconColor} />
                </TouchableOpacity>
              </Tooltip>
            );
          }
          
          // Acción estándar (editar o eliminar)
          const { type, action } = actionOrConfig as { type: 'edit' | 'delete'; action: any };
          const isVisible = action.visible === undefined ? true : action.visible(item);
          const iconName = type === 'edit' ? 'pencil' : 'trash';
          const tooltipText = action.tooltip || (type === 'edit' ? (t.common?.edit || 'Editar') : (t.common?.delete || 'Eliminar'));
          const iconColor = isVisible ? actionIconColor : disabledIconColor;
          
          return (
            <Tooltip key={type} text={tooltipText} position="left">
              <TouchableOpacity
                style={[styles.actionButton, !isVisible && { opacity: 0.5 }]}
                onPress={isVisible ? () => action.onPress(item) : undefined}
                disabled={!isVisible}
              >
                <Ionicons name={iconName as any} size={18} color={iconColor} />
              </TouchableOpacity>
            </Tooltip>
          );
        })}
      </View>
    );
  }, [orderedActions, styles, colors, actionIconColor]);
  
  /**
   * Construir columnas finales incluyendo la columna de contador (si está habilitada) y la columna de acciones (si hay acciones definidas)
   */
  const finalColumns = useMemo(() => {
    let resultColumns = [...columns];
    
    // Agregar columna de contador al inicio si está habilitada
    if (showRowNumber) {
      resultColumns = [
        {
          key: 'rowNumber',
          label: '#',
          width: '5%',
          align: 'center' as const,
          render: (item: T, index: number) => {
            // Calcular el número de registro considerando la paginación
            const rowNumber = pagination 
              ? (pagination.page - 1) * pagination.limit + index + 1
              : index + 1;
            
            // Determinar qué acción de editar usar:
            // 1. Si hay editAction y está visible, usar editAction
            // 2. Si no hay editAction pero hay onRowPress, usar onRowPress
            let canEdit = false;
            let editHandler: (() => void) | undefined = undefined;
            
            if (editAction) {
              const isVisible = editAction.visible === undefined ? true : editAction.visible(item);
              if (isVisible) {
                canEdit = true;
                editHandler = () => editAction.onPress(item);
              }
            } else if (onRowPress) {
              // Si no hay editAction pero hay onRowPress, usar onRowPress
              canEdit = true;
              editHandler = () => onRowPress(item, index);
            }
            
            if (canEdit && editHandler) {
              return (
                <TouchableOpacity
                  onPress={editHandler}
                  activeOpacity={0.7}
                >
                  <ThemedText type="body2" style={{ color: actionIconColor }}>
                    {rowNumber}
                  </ThemedText>
                </TouchableOpacity>
              );
            }
            
            return (
              <ThemedText type="body2" style={{ color: actionIconColor }}>
                {rowNumber}
              </ThemedText>
            );
          },
        },
        ...resultColumns,
      ];
    }
    
    // Agregar columna de acciones al final si hay acciones definidas
    const hasActions = (actions && actions.length > 0) || editAction || deleteAction;
    if (hasActions) {
      resultColumns.push({
        key: 'actions',
        label: actionsColumnLabel || t.common?.actions || 'Acciones',
        width: actionsColumnWidth,
        align: 'center' as const,
        render: (item: T, index: number) => renderActions(item, index),
      });
    }
    
    return resultColumns;
  }, [columns, actions, editAction, deleteAction, actionsColumnWidth, actionsColumnLabel, renderActions, showRowNumber, pagination, t, actionIconColor, onRowPress]);
  
  // Calcular altura máxima para el DataTable
  // Restamos espacio para header de la app, header de la página, búsqueda, padding, y paginación
  const appHeaderHeight = isMobile ? 60 : 80; // Header principal de la app
  const pageHeaderHeight = isMobile ? 100 : 120; // Header de la página (título, botón)
  const searchBarHeight = isMobile ? 80 : 100; // Barra de búsqueda y filtros
  const pagePadding = isMobile ? 24 : 24; // Padding superior e inferior de la página (reducido)
  const paginationHeight = isMobile ? 120 : 80; // Altura de la paginación
  const availableHeight = windowHeight - appHeaderHeight - pageHeaderHeight - searchBarHeight - pagePadding - paginationHeight;
  // Usar 95% del espacio disponible para maximizar el tamaño de la tabla
  const maxTableHeight = Math.max(300, availableHeight * 0.95); // 95% del espacio disponible, mínimo 300px

  /**
   * Lista estándar de nombres de columnas que deben tener comportamiento compacto
   * Estas columnas serán más pequeñas que el resto
   * Se puede extender fácilmente agregando nuevos nombres a esta lista
   */
  const compactColumnKeys = [
    'status', 'estado',
    'sistema',
    'phone', 'telefono', 'teléfono',
    'code', 'codigo', 'código',
    'permisos', 'permissions',
    'tipo', 'type',
    'empresa', 'empresas', 'company', 'companies',
    // Agregar más nombres de columnas compactas aquí según se vayan detectando
  ];

  /**
   * Verificar si una columna debe tener comportamiento compacto
   */
  const isCompactColumn = (column: TableColumn<T>): boolean => {
    const key = column.key?.toLowerCase() || '';
    const label = column.label?.toLowerCase() || '';
    return compactColumnKeys.some(compactKey => 
      key === compactKey.toLowerCase() || 
      label.includes(compactKey.toLowerCase())
    );
  };

  /**
   * Calcular flex value para cada columna basado en width
   * Sistema autoajustable: usa flex con minWidth para permitir crecimiento según contenido
   */
  const getColumnFlex = (column: TableColumn<T>, index: number): number => {
    // Columna de acciones: flex 0 para tamaño fijo
    if (column.key === 'actions' || column.key === 'acciones') {
      return 0;
    }
    
    // Columnas compactas: flex reducido para que sean más pequeñas
    if (isCompactColumn(column)) {
      return 0.5;
    }
    
    // Si no tiene width, usar flex: 1 (distribución igual con autoajuste)
    if (!column.width) {
      return 1;
    }
    
    // Si es un número, usar ese valor como ratio de flex (más flexible)
    if (typeof column.width === 'number') {
      return column.width;
    }
    
    // Si es un string con porcentaje, convertir a ratio de flex pero más flexible
    if (typeof column.width === 'string' && column.width.endsWith('%')) {
      const percentage = parseFloat(column.width) / 100;
      // Convertir porcentaje a ratio de flex (multiplicar por 100 para mejor granularidad)
      // Usar un mínimo más bajo para permitir más flexibilidad
      return Math.max(0.3, percentage * 100);
    }
    
    // Por defecto, flex: 1 (autoajustable)
    return 1;
  };

  /**
   * Calcular minWidth basado en el label y contenido estimado
   * Ahora considera tanto el header como el contenido de las filas
   */
  const getColumnMinWidth = (column: TableColumn<T>): number => {
    // MinWidth mínimo para cualquier columna
    const baseMinWidth = isMobile ? 100 : 120;
    
    // Columna de contador: tamaño fijo pequeño
    if (column.key === 'rowNumber') {
      return isMobile ? 40 : 50;
    }
    
    // Calcular ancho estimado del label
    const labelLength = column.label?.length || 0;
    const labelWidth = labelLength * (isMobile ? 7 : 8); // Aproximadamente 7-8px por carácter
    
    // Para columnas críticas con contenido variable, usar un minWidth más grande
    // Estos valores consideran tanto el header como el contenido promedio de las filas
    if (column.key === 'email') {
      // Emails pueden ser largos, necesitan espacio generoso
      return Math.max(baseMinWidth, isMobile ? 200 : 250);
    }
    
    // Columnas compactas: usar minWidth reducido
    if (isCompactColumn(column)) {
      if (column.key === 'phone' || column.key === 'telefono' || column.key === 'teléfono' || 
          column.label?.toLowerCase().includes('teléfono') || column.label?.toLowerCase().includes('telefono')) {
        // Teléfono: tamaño compacto
        return isMobile ? 90 : 110;
      }
      if (column.key === 'code' || column.key === 'codigo' || column.key === 'código' ||
          column.label?.toLowerCase().includes('codigo') || column.label?.toLowerCase().includes('código') ||
          column.label?.toLowerCase().includes('code')) {
        // Código: 50% más grande que el tamaño compacto estándar
        return isMobile ? 120 : 200;
      }
      if (column.key === 'empresa' || column.key === 'empresas' || column.key === 'company' || column.key === 'companies' ||
          column.label?.toLowerCase().includes('empresa') || column.label?.toLowerCase().includes('empresas') ||
          column.label?.toLowerCase().includes('company') || column.label?.toLowerCase().includes('companies')) {
        // Empresa: mismo tamaño que código (50% más grande que el tamaño compacto estándar)
        return isMobile ? 120 : 200;
      }
      if (column.key === 'tipo' || column.key === 'type' ||
          column.label?.toLowerCase().includes('tipo') || column.label?.toLowerCase().includes('type')) {
        // Tipo: mismo tamaño que código (50% más grande que el tamaño compacto estándar)
        return isMobile ? 120 : 200;
      }
      // Otras columnas compactas (estado, sistema, etc.): tamaño compacto estándar
      return isMobile ? 80 : 100;
    }
    
    if (column.key === 'phone' || column.key === 'teléfono' || column.label?.toLowerCase().includes('teléfono') || column.label?.toLowerCase().includes('telefono')) {
      // Teléfonos pueden tener formato internacional, necesitan espacio
      return Math.max(baseMinWidth, isMobile ? 130 : 160);
    }
    
    if (column.key === 'name' || column.key === 'nombre') {
      // Nombres pueden ser largos
      return Math.max(baseMinWidth, isMobile ? 120 : 150);
    }
    
    if (column.key === 'description' || column.key === 'descripción') {
      // Descripciones pueden ser muy largas
      return Math.max(baseMinWidth, isMobile ? 150 : 200);
    }
    
    if (column.key === 'code' || column.key === 'código') {
      // Códigos pueden ser variables
      return Math.max(baseMinWidth, isMobile ? 110 : 140);
    }
    
    
    if (column.key === 'actions' || column.key === 'acciones') {
      // Acciones: tamaño fijo para aproximadamente 5 iconos (40px cada uno + padding)
      // 5 iconos * 40px + padding horizontal = ~220px
      return isMobile ? 180 : 220;
    }
    
    // Para otras columnas, usar el máximo entre baseMinWidth y labelWidth
    // Multiplicamos por 1.5 para dar más espacio al contenido
    return Math.max(baseMinWidth, (labelWidth * 1.5) + (isMobile ? 20 : 30));
  };

  /**
   * Renderizar celda
   */
  const renderCell = (item: T, column: TableColumn<T>, index: number) => {
    // Si hay render custom, normalizamos para mantener color tipográfico del tema
    if (column.render) {
      const rendered = column.render(item, index);
      if (React.isValidElement(rendered)) {
        return rendered;
      }
      if (typeof rendered === 'string' || typeof rendered === 'number') {
        return (
          <ThemedText
            type="body2"
            style={styles.cellText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {rendered}
          </ThemedText>
        );
      }
      return rendered;
    }

    const value = (item as any)[column.key];
    // Permitir que el texto se muestre completo, con más líneas para contenido largo
    // En móvil, permitir hasta 2 líneas; en desktop hasta 3 líneas
    const isLongContent = column.key === 'email' || column.key === 'description' || column.key === 'descripción';
    return (
      <ThemedText 
        type="body2" 
        style={styles.cellText}
        numberOfLines={isLongContent ? (isMobile ? 2 : 3) : (isMobile ? 1 : 2)}
        ellipsizeMode="tail"
      >
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
        {finalColumns.map((column, colIndex) => {
          const columnFlex = getColumnFlex(column, colIndex);
          const columnMinWidth = getColumnMinWidth(column);
          const isLastColumn = colIndex === finalColumns.length - 1;
          const isFirstColumn = colIndex === 0;
          // Columnas críticas no deben comprimirse tanto
          const isCriticalColumn = column.key === 'email' || column.key === 'phone' || column.key === 'teléfono' || 
                                   column.key === 'name' || column.key === 'nombre';
          // Columna de acciones: tamaño fijo, no crece ni se comprime
          const isActionsColumn = column.key === 'actions' || column.key === 'acciones';
          // Columna de contador: tamaño fijo, no crece ni se comprime
          const isRowNumberColumn = column.key === 'rowNumber';
          // Columnas compactas: más pequeñas, se comprimen más
          const isCompactCol = isCompactColumn(column);
          return (
            <View
              key={column.key}
              style={[
                styles.cell,
                { 
                  flex: columnFlex,
                  minWidth: columnMinWidth,
                  maxWidth: (isActionsColumn || isRowNumberColumn) ? columnMinWidth : undefined, // Acciones y contador: tamaño fijo
                  flexShrink: (isActionsColumn || isRowNumberColumn) ? 0 : (isCompactCol ? 1.5 : (isCriticalColumn ? 0.5 : 1)), // Columnas compactas se comprimen más
                  flexGrow: (isActionsColumn || isRowNumberColumn) ? 0 : (isCompactCol ? 0 : 1), // Columnas compactas, acciones y contador no crecen
                },
                column.align === 'center' && styles.cellCenter,
                column.align === 'right' && styles.cellRight,
                isFirstColumn && styles.cellFirst,
                isLastColumn && styles.cellLast,
                { borderRightWidth: isLastColumn ? 0 : 1, borderRightColor: colors.border },
              ]}
            >
              {renderCell(item, column, index)}
            </View>
          );
        })}
      </>
    );

    // Solo hacer la fila clickeable si enableRowClick está habilitado Y onRowPress está definido
    if (enableRowClick && onRowPress) {
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

    const { page, limit, total, totalPages, hasNext, hasPrev, onPageChange, onLimitChange, limitOptions } =
      pagination;

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    // Filtrar opciones de límite: solo mostrar opciones que sean útiles según el total de registros
    // Lógica:
    // 1. Mostrar todas las opciones que sean <= total (estas siempre tienen sentido mostrar)
    // 2. Si el límite actual es > total, siempre incluirlo (para que sea visible)
    // 3. Mostrar solo la primera opción > total que sea útil (la más cercana al total)
    // Esto evita mostrar opciones innecesarias como 50 o 100 cuando solo hay 2 registros
    const filteredLimitOptions = limitOptions
      ? limitOptions.filter((option) => {
          // Siempre incluir el límite actual
          if (option === limit) {
            return true;
          }
          // Si la opción es menor o igual al total, siempre mostrarla (útil)
          if (option <= total) {
            return true;
          }
          // Si la opción es mayor que el total, solo mostrarla si es la siguiente opción útil
          // (es decir, la primera opción mayor que total pero menor que las demás opciones mayores)
          // Esto evita mostrar 50 o 100 cuando solo hay 2 registros
          const optionsGreaterThanTotal = limitOptions.filter(opt => opt > total).sort((a, b) => a - b);
          const smallestGreaterThanTotal = optionsGreaterThanTotal[0];
          return option === smallestGreaterThanTotal;
        })
      : [];

    // Si después del filtro no hay opciones, incluir al menos el límite actual
    const finalLimitOptions = filteredLimitOptions.length > 0 
      ? filteredLimitOptions 
      : limitOptions?.filter(opt => opt === limit) || [];
    
    // Ordenar las opciones finales
    finalLimitOptions.sort((a, b) => a - b);

    const minLimitValue = finalLimitOptions.length > 0 ? Math.min(...finalLimitOptions) : limit;

    return (
      <View style={[styles.pagination, { backgroundColor: colors.surfaceVariant, borderTopColor: colors.border }]}>
        {isMobile ? (
          <>
            {/* Información de registros - línea completa */}
            <View style={styles.paginationInfoMobile}>
              <ThemedText
                type="body2"
                style={{ fontSize: 12, color: colors.text }}
                numberOfLines={1}
              >
                {t.common?.showingResults 
                  ? t.common.showingResults(start, end, total) 
                  : `Mostrando ${start}-${end} de ${total}`}
              </ThemedText>
            </View>

            {/* Controles - línea completa */}
            <View style={styles.paginationControlsMobile}>
              {/* Selector de registros por página - alineado a la izquierda */}
              {onLimitChange && finalLimitOptions && finalLimitOptions.length > 0 && total > minLimitValue && (
                <View style={styles.limitSelector}>
                  <ThemedText
                    type="body2"
                    style={[styles.limitLabel, { color: colors.text }]}
                  >
                    {t.common?.show || 'Mostrar:'}
                  </ThemedText>
                  <View style={styles.limitOptions}>
                    {finalLimitOptions.map((option) => (
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

              {/* Botones de navegación - alineados a la derecha */}
              <View style={[styles.pageButtons, styles.pageButtonsMobile]}>
                {/* Botón primera página - solo mostrar si hay más de una página */}
                {totalPages > 1 && (
                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      page === 1 && styles.pageButtonDisabled,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => onPageChange(1)}
                    disabled={page === 1 || !hasPrev}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={page === 1 || !hasPrev ? colors.textSecondary : colors.text}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    !hasPrev && styles.pageButtonDisabled,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => onPageChange(page - 1)}
                  disabled={!hasPrev}
                >
                  <Ionicons
                    name="chevron-back-outline"
                    size={18}
                    color={!hasPrev ? colors.textSecondary : colors.text}
                  />
                </TouchableOpacity>

                {/* Indicador de página actual */}
                <View style={styles.pageIndicator}>
                  <ThemedText type="body2" style={{ fontSize: 12 }}>
                    {t.common?.pageInfo 
                      ? t.common.pageInfo(page, totalPages) 
                      : `Página ${page} de ${totalPages}`}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    !hasNext && styles.pageButtonDisabled,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => onPageChange(page + 1)}
                  disabled={!hasNext}
                >
                  <Ionicons
                    name="chevron-forward-outline"
                    size={18}
                    color={!hasNext ? colors.textSecondary : colors.text}
                  />
                </TouchableOpacity>

                {/* Botón última página - solo mostrar si hay más de una página */}
                {totalPages > 1 && (
                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      page === totalPages && styles.pageButtonDisabled,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => onPageChange(totalPages)}
                    disabled={page === totalPages || !hasNext}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={page === totalPages || !hasNext ? colors.textSecondary : colors.text}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Información de registros */}
            <View style={styles.paginationInfo}>
              <ThemedText type="body2" style={{ fontSize: 14, color: colors.text }}>
                {t.common?.showingResults 
                  ? t.common.showingResults(start, end, total) 
                  : `Mostrando ${start}-${end} de ${total}`}
              </ThemedText>
            </View>

            {/* Controles de paginación */}
            <View style={styles.paginationControls}>
              {/* Selector de registros por página */}
              {onLimitChange && finalLimitOptions && finalLimitOptions.length > 0 && total > minLimitValue && (
                  <View style={styles.limitSelector}>
                    <ThemedText
                      type="body2"
                      style={[styles.limitLabel, { color: colors.text }]}
                    >
                      {t.common?.show || 'Mostrar:'}
                    </ThemedText>
                  <View style={styles.limitOptions}>
                    {finalLimitOptions.map((option) => (
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
                {/* Botón primera página - solo mostrar si hay más de una página */}
                {totalPages > 1 && (
                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      page === 1 && styles.pageButtonDisabled,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => onPageChange(1)}
                    disabled={page === 1 || !hasPrev}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={page === 1 || !hasPrev ? colors.textSecondary : colors.text}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    !hasPrev && styles.pageButtonDisabled,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => onPageChange(page - 1)}
                  disabled={!hasPrev}
                >
                  <Ionicons
                    name="chevron-back-outline"
                    size={20}
                    color={!hasPrev ? colors.textSecondary : colors.text}
                  />
                </TouchableOpacity>

                {/* Indicador de página actual */}
                <View style={styles.pageIndicator}>
                  <ThemedText type="body2" style={{ fontSize: 14 }}>
                    {t.common?.pageInfo 
                      ? t.common.pageInfo(page, totalPages) 
                      : `Página ${page} de ${totalPages}`}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    !hasNext && styles.pageButtonDisabled,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => onPageChange(page + 1)}
                  disabled={!hasNext}
                >
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color={!hasNext ? colors.textSecondary : colors.text}
                  />
                </TouchableOpacity>

                {/* Botón última página - solo mostrar si hay más de una página */}
                {totalPages > 1 && (
                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      page === totalPages && styles.pageButtonDisabled,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => onPageChange(totalPages)}
                    disabled={page === totalPages || !hasNext}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={page === totalPages || !hasNext ? colors.textSecondary : colors.text}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
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
    <Card style={{ ...styles.container, maxHeight: maxTableHeight + paginationHeight } as any}>
      {/* Contenedor con scroll horizontal cuando sea necesario */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.horizontalScrollContent}
        style={styles.horizontalScrollContainer}
      >
        {/* Contenedor interno con ancho mínimo */}
        <View style={{ ...styles.tableWrapper, maxHeight: maxTableHeight } as any}>
          {/* Encabezado de la tabla */}
          <View style={[styles.header, { backgroundColor: colors.surfaceVariant, borderBottomColor: isDark ? colors.border : 'transparent' }]}>
                <View style={styles.headerRow}>
                  {finalColumns.map((column, colIndex) => {
                    const columnFlex = getColumnFlex(column, colIndex);
                    const columnMinWidth = getColumnMinWidth(column);
                    const isLastColumn = colIndex === finalColumns.length - 1;
                    const isFirstColumn = colIndex === 0;
                    // Columnas críticas no deben comprimirse tanto
                    const isCriticalColumn = column.key === 'email' || column.key === 'phone' || column.key === 'teléfono' || 
                                             column.key === 'name' || column.key === 'nombre';
                    // Columna de acciones: tamaño fijo, no crece ni se comprime
                    const isActionsColumn = column.key === 'actions' || column.key === 'acciones';
                    // Columna de contador: tamaño fijo, no crece ni se comprime
                    const isRowNumberColumn = column.key === 'rowNumber';
                    // Columnas compactas: más pequeñas, se comprimen más
                    const isCompactCol = isCompactColumn(column);
                    return (
                      <View
                        key={column.key}
                        style={[
                          styles.headerCell,
                          { 
                            flex: columnFlex,
                            minWidth: columnMinWidth,
                            maxWidth: (isActionsColumn || isRowNumberColumn) ? columnMinWidth : undefined, // Acciones y contador: tamaño fijo
                            flexShrink: (isActionsColumn || isRowNumberColumn) ? 0 : (isCompactCol ? 1.5 : (isCriticalColumn ? 0.5 : 1)), // Columnas compactas se comprimen más
                            flexGrow: (isActionsColumn || isRowNumberColumn) ? 0 : (isCompactCol ? 0 : 1), // Columnas compactas, acciones y contador no crecen
                          },
                          column.align === 'center' && styles.headerCellCenter,
                          column.align === 'right' && styles.headerCellRight,
                          isFirstColumn && styles.cellFirst,
                          isLastColumn && styles.cellLast,
                          { borderRightWidth: isLastColumn ? 0 : 1, borderRightColor: isDark ? colors.border : 'transparent' },
                        ]}
                      >
                        <ThemedText type="defaultSemiBold" style={styles.headerText}>
                          {column.label}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
          </View>

          {/* Cuerpo de la tabla con scroll vertical interno */}
          <ScrollView 
            style={styles.body} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {data.map((item, index) => renderRow(item, index))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Paginación - siempre visible en la parte inferior */}
      {renderPagination()}
    </Card>
  );
}

