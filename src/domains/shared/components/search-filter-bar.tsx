/**
 * Barra de búsqueda y filtros
 * Componente reutilizable para búsqueda y filtrado
 */

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { createSearchFilterBarStyles } from '@/src/styles/components/search-filter-bar.styles';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  activeFilters?: Record<string, any>;
  onFilterChange?: (key: string, value: any) => void;
  onClearFilters?: () => void;
  showClearButton?: boolean;
}

/**
 * Componente SearchFilterBar
 */
export function SearchFilterBar({
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Buscar...',
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  showClearButton = true,
}: SearchFilterBarProps) {
  const { colors } = useTheme();
  const styles = createSearchFilterBarStyles();
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  /**
   * Renderizar filtro select
   */
  const renderSelectFilter = (filter: FilterConfig) => {
    const value = activeFilters[filter.key];
    const hasOptions = filter.options && filter.options.length > 0;

    return (
      <View key={filter.key} style={styles.filterItem}>
        <ThemedText type="body2" style={styles.filterLabel}>
          {filter.label}
        </ThemedText>
        <View
          style={[
            styles.selectContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {hasOptions ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.selectOptions}>
                {filter.options!.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.selectOption,
                      value === option.value && {
                        backgroundColor: colors.primary,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => onFilterChange?.(filter.key, option.value)}
                  >
                    <ThemedText
                      type="body2"
                      style={
                        value === option.value
                          ? { color: '#FFFFFF' }
                          : { color: colors.text }
                      }
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
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
  };

  /**
   * Renderizar filtro text
   */
  const renderTextFilter = (filter: FilterConfig) => {
    return (
      <View key={filter.key} style={styles.filterItem}>
        <ThemedText type="body2" style={styles.filterLabel}>
          {filter.label}
        </ThemedText>
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder={filter.placeholder}
          placeholderTextColor={colors.textSecondary}
          value={activeFilters[filter.key] || ''}
          onChangeText={(text) => onFilterChange?.(filter.key, text)}
        />
      </View>
    );
  };

  /**
   * Renderizar filtro boolean
   */
  const renderBooleanFilter = (filter: FilterConfig) => {
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
            onPress={() => onFilterChange?.(filter.key, value === true ? undefined : true)}
          >
            <ThemedText
              type="body2"
              style={value === true ? { color: '#FFFFFF' } : {}}
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
            onPress={() => onFilterChange?.(filter.key, value === false ? undefined : false)}
          >
            <ThemedText
              type="body2"
              style={value === false ? { color: '#FFFFFF' } : {}}
            >
              No
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Renderizar filtro según tipo
   */
  const renderFilter = (filter: FilterConfig) => {
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
  };

  return (
    <Card style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={searchValue}
            onChangeText={onSearchChange}
            onSubmitEditing={() => onSearchSubmit?.(searchValue)}
            returnKeyType="search"
          />
          {searchValue.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange?.('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      {filters.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {filters.map((filter) => renderFilter(filter))}
          </ScrollView>
        </View>
      )}

      {/* Botón limpiar filtros */}
      {showClearButton && hasActiveFilters && (
        <View style={styles.clearContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearFilters}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.error} />
            <ThemedText type="body2" variant="error" style={styles.clearText}>
              Limpiar filtros
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

