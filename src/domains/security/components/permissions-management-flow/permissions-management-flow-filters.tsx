/**
 * Componente de filtros específico para PermissionsManagementFlow
 * Filtra datos locales (JSONs) sin enviar consultas al backend
 */

import { ThemedText } from "@/components/themed-text";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { DynamicIcon, SearchInput } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { createPermissionsFlowFiltersStyles } from "./permissions-management-flow-filters.styles";
import { PermissionsFlowFiltersProps } from "./permissions-management-flow-filters.types";

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
  showAll = false,
  onShowAllChange,
  customPermissions = [],
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
    if (!menuItems || menuItems.length === 0) {
      return [];
    }

    const moduleSet = new Set<string>();

    menuItems.forEach((item) => {
      if (item.label) {
        // Solo agregar si NO es público (isPublic !== true)
        // Verificar si es público de forma flexible (boolean true, string "true", o número 1)
        const isPublicValue = item.isPublic;
        const isPublic =
          isPublicValue === true ||
          (typeof isPublicValue === "string" && isPublicValue === "true") ||
          (typeof isPublicValue === "number" && isPublicValue === 1);
        if (!isPublic) {
          moduleSet.add(item.label);
        }
      }
    });

    return Array.from(moduleSet).sort();
  }, [menuItems]);

  // Opciones de acciones estándar
  const standardActionOptions = [
    { value: "", label: t.common?.all || "Todos", icon: null },
    { value: "view", label: t.common?.view || "Ver", icon: "eye-outline" },
    {
      value: "create",
      label: t.common?.create || "Crear",
      icon: "create-outline",
    },
    {
      value: "edit",
      label: t.common?.edit || "Editar",
      icon: "pencil-outline",
    },
    {
      value: "delete",
      label: t.common?.delete || "Eliminar",
      icon: "trash-outline",
    },
  ];

  // Agregar permisos personalizados a las opciones de acción
  // Ordenar por el campo `order` antes de mapear
  const customActionOptions = customPermissions
    .sort((a, b) => {
      // Si ambos tienen order, ordenar por order
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // Si solo uno tiene order, el que tiene order va primero
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      // Si ninguno tiene order, mantener el orden original
      return 0;
    })
    .map((perm) => ({
      value: perm.code || perm.id, // Usar code como identificador único
      label: perm.name,
      icon: perm.icon || null, // Usar el icono del permiso si existe
      permission: perm, // Guardar referencia al permiso completo
    }));

  // Combinar opciones estándar con permisos personalizados
  const actionOptions = [...standardActionOptions, ...customActionOptions];

  const hasActiveFilters =
    searchValue.trim() !== "" ||
    selectedModule !== "" ||
    selectedAction !== "" ||
    !showDefaultOptions;

  return (
    <View style={styles.container}>
      {/* Input de búsqueda - siempre visible, filtra en tiempo real */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={
            t.security?.permissions?.filterPlaceholder ||
            "Filtrar por nombre, ruta o descripción..."
          }
          containerStyle={[
            styles.searchInputContainer,
            {
              backgroundColor: colors.filterInputBackground,
              borderColor: colors.border,
            },
          ]}
          inputStyle={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.actionButtons}>
          <Tooltip
            text={
              isCollapsed
                ? t.common?.showFilters || "Mostrar filtros"
                : t.common?.hideFilters || "Ocultar filtros"
            }
            position="top"
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.expandButton,
                { borderColor: colors.border },
              ]}
              onPress={() => setIsCollapsed(!isCollapsed)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isCollapsed ? "chevron-down" : "chevron-up"}
                size={isMobile ? 20 : 18}
                color={colors.text}
              />
            </TouchableOpacity>
          </Tooltip>

          {/* Botón Vista previa */}
          {onShowAllChange && (
            <Tooltip
              text={t.security?.permissions?.preview || "Vista previa"}
              position="top"
            >
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.expandButton,
                  {
                    borderColor: showAll ? colors.primary : colors.border,
                    backgroundColor: showAll ? colors.primary : colors.surface,
                  },
                ]}
                onPress={() => onShowAllChange(!showAll)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showAll ? "eye" : "eye-off-outline"}
                  size={isMobile ? 20 : 18}
                  color={showAll ? "#FFFFFF" : colors.text}
                />
              </TouchableOpacity>
            </Tooltip>
          )}
        </View>
      </View>

      {/* Filtros - colapsables */}
      {!isCollapsed && (
        <View style={styles.filtersContainer}>
          {/* Contenedor horizontal para Módulo, Acción y Opciones por defecto */}
          <View style={styles.filtersRow}>
            {/* Sección de Opciones por defecto */}
            <View style={styles.filterSection}>
              <ThemedText
                type="body2"
                style={[styles.filterLabel, { color: colors.text }]}
              >
                {t.security?.permissions?.show || "Mostrar"}
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.defaultOptionsButton,
                  {
                    backgroundColor: showDefaultOptions
                      ? colors.primary
                      : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => onShowDefaultOptionsChange(!showDefaultOptions)}
                activeOpacity={0.7}
              >
                <ThemedText
                  type="body2"
                  style={{
                    color: showDefaultOptions ? "#FFFFFF" : colors.text,
                    fontWeight: showDefaultOptions ? "600" : "400",
                  }}
                >
                  {t.security?.roles?.defaultOptionsPlural || "Todo"}
                </ThemedText>
              </TouchableOpacity>
            </View>
            {/* Selector de Módulo */}
            <View style={styles.filterSection}>
              <ThemedText
                type="body2"
                style={[styles.filterLabel, { color: colors.text }]}
              >
                {t.security?.permissions?.module || "Módulo"}
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
                      backgroundColor:
                        selectedModule === "" ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => onModuleChange("")}
                >
                  <ThemedText
                    type="body2"
                    style={{
                      color: selectedModule === "" ? "#FFFFFF" : colors.text,
                      fontWeight: selectedModule === "" ? "600" : "400",
                    }}
                  >
                    {t.common?.all || "Todos"}
                  </ThemedText>
                </TouchableOpacity>
                {modules.map((module) => (
                  <TouchableOpacity
                    key={module}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor:
                          selectedModule === module
                            ? colors.primary
                            : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => onModuleChange(module)}
                  >
                    <ThemedText
                      type="body2"
                      style={{
                        color:
                          selectedModule === module ? "#FFFFFF" : colors.text,
                        fontWeight: selectedModule === module ? "600" : "400",
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
              <ThemedText
                type="body2"
                style={[styles.filterLabel, { color: colors.text }]}
              >
                {t.security?.permissions?.action || "Acción"}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterOptionsContainer}
              >
                {actionOptions.map((option) => {
                  const isSelected = selectedAction === option.value;
                  const iconColor = isSelected ? "#FFFFFF" : colors.text;

                  // Si es "Todos", mostrar solo texto sin tooltip
                  if (option.value === "") {
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.filterOption,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => onActionChange(option.value)}
                      >
                        <ThemedText
                          type="body2"
                          style={{
                            color: isSelected ? "#FFFFFF" : colors.text,
                            fontWeight: isSelected ? "600" : "400",
                          }}
                        >
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  }

                  // Para los demás botones:
                  // - Si está seleccionado: mostrar icono + texto
                  // - Si NO está seleccionado: mostrar solo icono
                  // Si es un permiso personalizado, usar DynamicIcon
                  const isCustomPermission = (option as any).permission;
                  const hasIcon =
                    option.icon !== null && option.icon !== undefined;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => onActionChange(option.value)}
                    >
                      {isSelected ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {hasIcon &&
                            (isCustomPermission ? (
                              <DynamicIcon
                                name={option.icon!}
                                size={16}
                                color={iconColor}
                              />
                            ) : (
                              <Ionicons
                                name={option.icon as any}
                                size={16}
                                color={iconColor}
                              />
                            ))}
                          <ThemedText
                            type="body2"
                            style={{
                              color: iconColor,
                              fontWeight: "600",
                            }}
                          >
                            {option.label}
                          </ThemedText>
                        </View>
                      ) : (
                        hasIcon &&
                        (isCustomPermission ? (
                          <DynamicIcon
                            name={option.icon!}
                            size={16}
                            color={iconColor}
                          />
                        ) : (
                          <Ionicons
                            name={option.icon as any}
                            size={16}
                            color={iconColor}
                          />
                        ))
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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
                <Ionicons
                  name="refresh"
                  size={16}
                  color={colors.textSecondary}
                />
                <ThemedText
                  type="body2"
                  style={[
                    styles.clearText,
                    { color: colors.textSecondary, marginLeft: 4 },
                  ]}
                >
                  {t.common?.clearFilters || "Limpiar filtros"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
