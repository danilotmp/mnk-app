/**
 * Componente de filtros específico para PermissionsManagementFlow
 * Filtra datos locales (JSONs) sin enviar consultas al backend
 */

import { ThemedText } from '@/components/themed-text';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { createPermissionsFlowFiltersStyles } from './permissions-management-flow-filters.styles';
import { PermissionsFlowFiltersProps } from './permissions-management-flow-filters.types';

export function PermissionsFlowFilters({
  menuItems,
  searchValue,
  onSearchChange,
  selectedModule,
  onModuleChange,
  selectedAction,
  onActionChange,
  showDefaultOptions,
  onShowDefaultOptionsChange,
  onClearFilters,
}: PermissionsFlowFiltersProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const styles = createPermissionsFlowFiltersStyles(colors, isMobile);

  const [isCollapsed, setIsCollapsed] = useState(true); // Por defecto colapsado (ocultar filtros)

  // Extraer módulos únicos del menú (items padre)
  // Excluir items con isPublic = true ya que se manejan por separado
  const modules = useMemo(() => {
    const moduleSet = new Set<string>();
    
    menuItems.forEach((item) => {
      if (item.label) {
        // Solo agregar si NO es público (isPublic !== true)
        // Verificar si es público de forma flexible (boolean true, string "true", o número 1)
        const isPublicValue = item.isPublic;
        const isPublic = isPublicValue === true || 
                         (typeof isPublicValue === 'string' && isPublicValue === 'true') || 
                         (typeof isPublicValue === 'number' && isPublicValue === 1);
        if (!isPublic) {
          moduleSet.add(item.label);
        }
      }
    });
    
    return Array.from(moduleSet).sort();
  }, [menuItems]);

  // Opciones de acciones
  const actionOptions = [
    { value: '', label: t.common?.all || 'Todos' },
    { value: 'view', label: 'Ver' },
    { value: 'create', label: 'Crear' },
    { value: 'edit', label: 'Editar' },
    { value: 'delete', label: 'Eliminar' },
  ];

  const hasActiveFilters = searchValue.trim() !== '' || selectedModule !== '' || selectedAction !== '' || !showDefaultOptions;

  return (
    <View style={styles.container}>
      {/* Input de búsqueda - siempre visible, filtra en tiempo real */}
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
            placeholder={t.security?.permissions?.filterPlaceholder || 'Filtrar por nombre, ruta o descripción...'}
            placeholderTextColor={colors.textSecondary || '#999'}
            value={searchValue}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchValue && searchValue.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary || '#999'} />
            </TouchableOpacity>
          )}
        </InputWithFocus>

        <View style={styles.actionButtons}>
          <Tooltip
            text={isCollapsed ? (t.common?.showFilters || 'Mostrar filtros') : (t.common?.hideFilters || 'Ocultar filtros')}
            position="top"
          >
            <TouchableOpacity
              style={[styles.actionButton, styles.expandButton, { borderColor: colors.border }]}
              onPress={() => setIsCollapsed(!isCollapsed)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                size={isMobile ? 20 : 18}
                color={colors.text}
              />
            </TouchableOpacity>
          </Tooltip>
        </View>
      </View>

      {/* Filtros - colapsables */}
      {!isCollapsed && (
        <View style={styles.filtersContainer}>
          {/* Contenedor horizontal para Módulo, Acción y Opciones por defecto */}
          <View style={styles.filtersRow}>
            {/* Selector de Módulo */}
            <View style={styles.filterSection}>
              <ThemedText type="body2" style={[styles.filterLabel, { color: colors.text }]}>
                {t.security?.permissions?.module || 'Módulo'}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterOptionsContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: selectedModule === '' ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => onModuleChange('')}
                >
                  <ThemedText
                    type="body2"
                    style={{
                      color: selectedModule === '' ? '#FFFFFF' : colors.text,
                      fontWeight: selectedModule === '' ? '600' : '400',
                    }}
                  >
                    {t.common?.all || 'Todos'}
                  </ThemedText>
                </TouchableOpacity>
                {modules.map((module) => (
                  <TouchableOpacity
                    key={module}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: selectedModule === module ? colors.primary : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => onModuleChange(module)}
                  >
                    <ThemedText
                      type="body2"
                      style={{
                        color: selectedModule === module ? '#FFFFFF' : colors.text,
                        fontWeight: selectedModule === module ? '600' : '400',
                      }}
                    >
                      {module}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Selector de Acción */}
            <View style={styles.filterSection}>
              <ThemedText type="body2" style={[styles.filterLabel, { color: colors.text }]}>
                {t.security?.permissions?.action || 'Acción'}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterOptionsContainer}
              >
                {actionOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: selectedAction === option.value ? colors.primary : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => onActionChange(option.value)}
                  >
                    <ThemedText
                      type="body2"
                      style={{
                        color: selectedAction === option.value ? '#FFFFFF' : colors.text,
                        fontWeight: selectedAction === option.value ? '600' : '400',
                      }}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sección de Opciones por defecto */}
            <View style={styles.filterSection}>
              <ThemedText type="body2" style={[styles.filterLabel, { color: colors.text }]}>
                {t.security?.roles?.defaultOptionsPlural || 'Opciones por defecto'}
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.defaultOptionsButton,
                  {
                    backgroundColor: showDefaultOptions ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => onShowDefaultOptionsChange(!showDefaultOptions)}
                activeOpacity={0.7}
              >
                <ThemedText
                  type="body2"
                  style={{
                    color: showDefaultOptions ? '#FFFFFF' : colors.text,
                    fontWeight: showDefaultOptions ? '600' : '400',
                  }}
                >
                  {t.security?.permissions?.show || 'Mostrar'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <View style={styles.clearContainer}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={onClearFilters}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={colors.textSecondary} />
                <ThemedText type="body2" style={[styles.clearText, { color: colors.textSecondary, marginLeft: 4 }]}>
                  {t.common?.clearFilters || 'Limpiar filtros'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
