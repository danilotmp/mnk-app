/**
 * Barra de búsqueda y filtros
 * Componente reutilizable para búsqueda y filtrado
 * 
 * Separación de conceptos:
 * - FILTRAR: Búsqueda local/cliente en la tabla ya cargada (sin API)
 * - BUSCAR: Consulta al API para obtener más datos
 */

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { createSearchFilterBarStyles } from '@/src/styles/components/search-filter-bar.styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * Opción de filtro
 */
export interface FilterOption {
  key: string;
  label: string;
  value: any;
}

/**
 * Configuración de filtro
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
}

/**
 * Props del componente SearchFilterBar
 */
export interface SearchFilterBarProps {
  // Input principal (filtrado local)
  filterValue?: string; // Valor para filtrar localmente
  onFilterChange?: (value: string) => void; // Callback cuando cambia el filtro (local, sin API)
  
  // Búsqueda API
  onSearchSubmit?: (value: string) => void; // Callback cuando se presiona buscar (consulta API)
  
  // Filtros avanzados
  filters?: FilterConfig[];
  activeFilters?: Record<string, any>;
  onAdvancedFilterChange?: (key: string, value: any) => void; // Callback cuando cambia un filtro avanzado (consulta API)
  onClearFilters?: () => void;
  showClearButton?: boolean;
  
  // Localización
  filterPlaceholder?: string; // Placeholder cuando está colapsado (default: "Filtrar...")
  searchPlaceholder?: string; // Placeholder cuando está expandido (default: "Buscar...")
  
  // Estado inicial
  defaultCollapsed?: boolean; // Si true, inicia colapsado (default: true)
  
  // Mensaje de ayuda cuando no hay resultados filtrados
  filteredCount?: number; // Cantidad de resultados después del filtro local
  totalCount?: number; // Cantidad total de resultados sin filtro
  showSearchHint?: boolean; // Si mostrar el mensaje de ayuda (default: true)
}

/**
 * Componente SearchFilterBar
 */
export function SearchFilterBar({
  filterValue = '',
  onFilterChange,
  onSearchSubmit,
  filters = [],
  activeFilters = {},
  onAdvancedFilterChange,
  onClearFilters,
  showClearButton = true,
  filterPlaceholder = 'Filtrar...',
  searchPlaceholder = 'Buscar...',
  defaultCollapsed = true,
  filteredCount,
  totalCount,
  showSearchHint = true,
}: SearchFilterBarProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const styles = createSearchFilterBarStyles(isMobile);
  
  // Estado colapsado/expandido
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Placeholder dinámico según estado
  const currentPlaceholder = isCollapsed ? filterPlaceholder : searchPlaceholder;
  
  // Determinar si mostrar el mensaje de ayuda
  const hasLocalFilter = typeof filterValue === 'string' && filterValue.trim().length > 0;
  const shouldShowHint = showSearchHint && hasLocalFilter;
  
  // Toggle colapsar/expandir
  const toggleFilters = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Handler para cambios en el filtro principal (siempre debe tener un callback válido)
  const handleMainInputChange = useCallback((text: string) => {
    if (onFilterChange) {
      onFilterChange(text);
    }
  }, [onFilterChange]);

  /**
   * Detectar filtros activos (solo valores reales: no undefined, null, ni strings vacíos)
   */
  const hasActiveFilters = useMemo(() => {
    return Object.entries(activeFilters).some(([_, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    });
  }, [activeFilters]);

  /**
   * Contar filtros activos
   */
  const activeFiltersCount = useMemo(() => {
    return Object.entries(activeFilters).filter(([_, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    }).length;
  }, [activeFilters]);

  /**
   * Renderizar filtro select
   */
  const renderSelectFilter = useCallback((filter: FilterConfig) => {
    const value = activeFilters[filter.key];
    const hasOptions = filter.options && filter.options.length > 0;

    return (
      <View key={filter.key} style={styles.filterItem}>
        {filter.label ? (
          <ThemedText type="body2" style={styles.filterLabel}>
            {filter.label}
          </ThemedText>
        ) : null}
        <View
          style={[
            styles.selectContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {hasOptions ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.selectOptions}>
                {filter.options!.map((option) => {
                  const isSelected = value === option.value;
                  const nextValue = isSelected ? '' : option.value;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.selectOption,
                        isSelected && {
                          backgroundColor: colors.primary,
                        },
                        { borderColor: colors.border },
                      ]}
                      onPress={() => onAdvancedFilterChange?.(filter.key, nextValue)}
                    >
                      <ThemedText
                        type="body2"
                        style={[
                          styles.selectOptionText,
                          isSelected ? { color: '#FFFFFF' } : { color: colors.text },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <ThemedText type="body2" variant="secondary">
              {filter.placeholder || 'Sin opciones'}
            </ThemedText>
          )}
        </View>
      </View>
    );
  }, [activeFilters, colors, styles, onAdvancedFilterChange]);

  /**
   * Renderizar filtro text
   */
  const renderTextFilter = useCallback((filter: FilterConfig) => {
    const value = activeFilters[filter.key] || '';
    const hasValue = value.trim().length > 0;

    return (
      <View key={filter.key} style={styles.filterItem}>
        <ThemedText type="body2" style={styles.filterLabel}>
          {filter.label}
        </ThemedText>
        <InputWithFocus
          containerStyle={[
            styles.textInputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          primaryColor={colors.primary}
        >
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder={filter.placeholder}
            placeholderTextColor={colors.textSecondary || '#999'}
            value={value}
            onChangeText={(text) => onAdvancedFilterChange?.(filter.key, text)}
          />
          {hasValue && (
            <TouchableOpacity
              onPress={() => onAdvancedFilterChange?.(filter.key, '')}
              style={styles.clearFilterButton}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary || '#999'} />
            </TouchableOpacity>
          )}
        </InputWithFocus>
      </View>
    );
  }, [activeFilters, colors, styles, onAdvancedFilterChange]);

  /**
   * Renderizar filtro boolean
   */
  const renderBooleanFilter = useCallback((filter: FilterConfig) => {
    const value = activeFilters[filter.key];

    return (
      <View key={filter.key} style={styles.filterItem}>
        <ThemedText type="body2" style={styles.filterLabel}>
          {filter.label}
        </ThemedText>
        <View style={styles.booleanOptions}>
          <TouchableOpacity
            style={[
              styles.booleanOption,
              value === true && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => onAdvancedFilterChange?.(filter.key, value === true ? undefined : true)}
          >
            <ThemedText
              type="body2"
              style={value === true ? { color: '#FFFFFF' } : { color: colors.text }}
            >
              Sí
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.booleanOption,
              value === false && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => onAdvancedFilterChange?.(filter.key, value === false ? undefined : false)}
          >
            <ThemedText
              type="body2"
              style={value === false ? { color: '#FFFFFF' } : { color: colors.text }}
            >
              No
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [activeFilters, colors, styles, onAdvancedFilterChange]);

  /**
   * Renderizar filtro según tipo
   */
  const renderFilter = useCallback((filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return renderSelectFilter(filter);
      case 'text':
        return renderTextFilter(filter);
      case 'boolean':
        return renderBooleanFilter(filter);
      default:
        return null;
    }
  }, [renderSelectFilter, renderTextFilter, renderBooleanFilter]);

  /**
   * Renderizar filtros
   */
  const filtersContent = useMemo(() => {
    return filters.map((filter) => renderFilter(filter));
  }, [filters, renderFilter]);

  return (
    <Card style={styles.container}>
      {/* Contenedor para input y mensaje de ayuda con gap reducido */}
      <View style={styles.searchAndHintContainer}>
        {/* Barra de filtrado/búsqueda principal */}
        <View style={styles.searchContainer}>
          <InputWithFocus
            containerStyle={[
              styles.searchInputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            primaryColor={colors.primary}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary || '#999'} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={currentPlaceholder}
              placeholderTextColor={colors.textSecondary || '#999'}
              value={filterValue || ''}
              onChangeText={handleMainInputChange}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (!isCollapsed) {
                  onSearchSubmit?.(filterValue);
                }
              }}
            />
            {filterValue && filterValue.length > 0 && (
              <TouchableOpacity onPress={() => onFilterChange?.('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary || '#999'} />
              </TouchableOpacity>
            )}
          </InputWithFocus>
          
          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            {/* Botón de búsqueda (API) */}
            <Tooltip text="Buscar" position="top">
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => onSearchSubmit?.(filterValue)}
              >
                <Ionicons name="search" size={isMobile ? 20 : 18} color="#FFFFFF" />
              </TouchableOpacity>
            </Tooltip>
            
            {/* Botón expandir/colapsar filtros */}
            {filters.length > 0 && (
              <Tooltip text={isMobile ? '' : (isCollapsed ? 'Más filtros' : 'Ocultar filtros')} position="top">
                <TouchableOpacity
                  style={[styles.actionButton, styles.expandButton, { borderColor: colors.border }]}
                  onPress={toggleFilters}
                >
                  <Ionicons 
                    name={isCollapsed ? "chevron-down" : "chevron-up"} 
                    size={isMobile ? 20 : 18} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
              </Tooltip>
            )}
          </View>
        </View>

        {/* Mensaje de ayuda cuando no hay resultados filtrados */}
        {shouldShowHint && (
          <View style={styles.hintContainer}>
            <ThemedText 
              type="caption" 
              style={[styles.hintText, { color: colors.textSecondary || '#999' }]}
            >
              {t.common?.searchHint || 'No se encontraron resultados. Prueba usando la búsqueda para consultar más datos.'}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Filtros avanzados (colapsables) */}
      {filters.length > 0 && !isCollapsed && (
        <View style={styles.filtersContainer}>
          {isMobile ? (
            // En móvil: apilar verticalmente
            <View style={styles.filtersContentVertical}>
              {filtersContent}
            </View>
          ) : (
            // En desktop: scroll horizontal
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {filtersContent}
            </ScrollView>
          )}
        </View>
      )}

      {/* Botón limpiar filtros */}
      {showClearButton && hasActiveFilters && !isCollapsed && (
        <View style={styles.clearContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearFilters}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.error} />
            <ThemedText type="body2" variant="error" style={styles.clearText}>
              {activeFiltersCount > 1 
                ? `Limpiar ${activeFiltersCount} filtros`
                : 'Limpiar filtro'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}
