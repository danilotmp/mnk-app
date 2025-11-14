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
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

import { createSearchFilterBarStyles } from './search-filter-bar.styles';
import {
  type FilterConfig,
  type FilterOption,
  type SearchFilterBarProps,
} from './search-filter-bar.types';

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

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const currentPlaceholder = isCollapsed ? filterPlaceholder : searchPlaceholder;

  const hasLocalFilter = typeof filterValue === 'string' && filterValue.trim().length > 0;
  const shouldShowHint = showSearchHint && hasLocalFilter;

  const toggleFilters = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleMainInputChange = useCallback(
    (text: string) => {
      if (onFilterChange) {
        onFilterChange(text);
      }
    },
    [onFilterChange],
  );

  const hasActiveFilters = useMemo(() => {
    return Object.entries(activeFilters).some(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    });
  }, [activeFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(activeFilters).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    }).length;
  }, [activeFilters]);

  const renderSelectFilter = useCallback(
    (filter: FilterConfig) => {
      const value = activeFilters[filter.key];
      const hasOptions = filter.options && filter.options.length > 0;
      const isSingleOption = (filter.options?.length || 0) === 1;

      return (
        <View
          key={filter.key}
          style={[styles.filterItem, isSingleOption && styles.filterItemCompact]}
        >
          {filter.label ? (
            <ThemedText type="body2" style={styles.filterLabel}>
              {filter.label}
            </ThemedText>
          ) : null}
          <View
            style={[
              styles.selectContainer,
              isSingleOption && styles.selectContainerSingle,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {hasOptions ? (
              isSingleOption ? (
                <View style={styles.selectOptions}>
                  {filter.options!.map((option: FilterOption) => {
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
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectOptions}>
                    {filter.options!.map((option: FilterOption) => {
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
              )
            ) : (
              <ThemedText type="body2" variant="secondary">
                {filter.placeholder || 'Sin opciones'}
              </ThemedText>
            )}
          </View>
        </View>
      );
    },
    [activeFilters, colors, styles, onAdvancedFilterChange],
  );

  const renderTextFilter = useCallback(
    (filter: FilterConfig) => {
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
    },
    [activeFilters, colors, styles, onAdvancedFilterChange],
  );

  const renderBooleanFilter = useCallback(
    (filter: FilterConfig) => {
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
              onPress={() =>
                onAdvancedFilterChange?.(filter.key, value === false ? undefined : false)
              }
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
    },
    [activeFilters, colors, styles, onAdvancedFilterChange],
  );

  const renderFilter = useCallback(
    (filter: FilterConfig) => {
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
    },
    [renderSelectFilter, renderTextFilter, renderBooleanFilter],
  );

  const filtersContent = useMemo(() => {
    return filters.map((filter) => renderFilter(filter));
  }, [filters, renderFilter]);

  return (
    <Card style={styles.container}>
      <View style={styles.searchAndHintContainer}>
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

          <View style={styles.actionButtons}>
            <Tooltip text="Buscar" position="top">
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => onSearchSubmit?.(filterValue)}
              >
                <Ionicons name="search" size={isMobile ? 20 : 18} color="#FFFFFF" />
              </TouchableOpacity>
            </Tooltip>

            {filters.length > 0 && (
              <Tooltip text={isMobile ? '' : isCollapsed ? 'Más filtros' : 'Ocultar filtros'} position="top">
                <TouchableOpacity
                  style={[styles.actionButton, styles.expandButton, { borderColor: colors.border }]}
                  onPress={toggleFilters}
                >
                  <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={isMobile ? 20 : 18}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </Tooltip>
            )}
          </View>
        </View>

        {shouldShowHint && (
          <View style={styles.hintContainer}>
            <ThemedText
              type="caption"
              style={[styles.hintText, { color: colors.textSecondary || '#999' }]}
            >
              {t.common?.searchHint ||
                'No se encontraron resultados. Prueba usando la búsqueda para consultar más datos.'}
            </ThemedText>
          </View>
        )}
      </View>

      {filters.length > 0 && !isCollapsed && (
        <View style={styles.filtersContainer}>
          {isMobile ? (
            <View style={styles.filtersContentVertical}>{filtersContent}</View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filtersContent}>{filtersContent}</View>
            </ScrollView>
          )}
        </View>
      )}

      {filters.length > 0 && !isCollapsed && showClearButton && (
        <View style={styles.clearContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onFilterChange?.('');
              onClearFilters?.();
            }}
          >
            <Ionicons name="refresh" size={16} color={colors.textSecondary || '#999'} />
            <ThemedText type="body2" style={[styles.clearText, { color: colors.textSecondary || '#999' }]}>
              {t.common?.clearFilters || 'Limpiar filtros'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {typeof filteredCount === 'number' &&
        typeof totalCount === 'number' &&
        filteredCount !== totalCount && (
          <View style={styles.hintContainer}>
            <ThemedText type="caption" style={[styles.hintText, { color: colors.textSecondary || '#999' }]}>
              {t.common?.filteredResultsMessage
                ? t.common.filteredResultsMessage(filteredCount, totalCount)
                : `Mostrando ${filteredCount} de ${totalCount} resultados`}
            </ThemedText>
          </View>
        )}
    </Card>
  );
}

