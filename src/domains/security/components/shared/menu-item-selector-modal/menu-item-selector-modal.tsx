/**
 * Modal para seleccionar items del menú con checkboxes
 * Similar al flujo de permisos pero con checkboxes en lugar de iconos de acciones
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { CenteredModal } from "@/components/ui/centered-modal";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { SearchInput } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import { MenuService } from "@/src/infrastructure/menu/menu.service";
import { MenuItem } from "@/src/infrastructure/menu/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { createPermissionFlowStyles } from "../../role-permissions-flow/role-permissions-flow.styles";

export interface MenuItemSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMenuItemIds: string[];
  onSelectionChange: (menuItemIds: string[]) => void;
}

/**
 * Función recursiva para extraer todos los items de último nivel del menú
 * Solo retorna items que tienen route (son páginas, no módulos o grupos)
 * EXCLUYE items públicos (isPublic: true)
 * EXCLUYE items padre que tienen submenu o columns (solo incluye sus hijos)
 * Soporta estructuras anidadas a cualquier nivel
 */
const extractLastLevelItems = (
  items: MenuItem[],
  parentPath: string = "",
): Array<{
  id: string;
  label: string;
  route?: string;
  description?: string;
  path: string;
  isPublic?: boolean;
}> => {
  const result: Array<{
    id: string;
    label: string;
    route?: string;
    description?: string;
    path: string;
    isPublic?: boolean;
  }> = [];

  for (const item of items) {
    // Construir el path actual
    const currentPath = parentPath
      ? `${parentPath} > ${item.label}`
      : item.label;

    // Verificar si el item tiene submenu o columns
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const hasColumns = item.columns && item.columns.length > 0;

    // Solo incluir el item padre si tiene route Y NO tiene submenu ni columns
    // Si tiene submenu o columns, solo incluir sus hijos, no el padre
    if (item.route && !item.isPublic && !hasSubmenu && !hasColumns) {
      result.push({
        id: item.id,
        label: item.label,
        route: item.route,
        description: item.description,
        path: currentPath,
        isPublic: item.isPublic,
      });
    }

    // Buscar recursivamente en submenu
    if (item.submenu && item.submenu.length > 0) {
      const subItems = extractLastLevelItems(item.submenu, currentPath);
      result.push(...subItems);
    }

    // Buscar recursivamente en columnas
    if (item.columns && item.columns.length > 0) {
      for (const column of item.columns) {
        if (column.items && column.items.length > 0) {
          const columnPath = column.title
            ? `${currentPath} > ${column.title}`
            : currentPath;
          const colItems = extractLastLevelItems(column.items, columnPath);
          result.push(...colItems);
        }
      }
    }
  }

  return result;
};

export function MenuItemSelectorModal({
  visible,
  onClose,
  selectedMenuItemIds,
  onSelectionChange,
}: MenuItemSelectorModalProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  // Reutilizar estilos del flujo de permisos para mantener consistencia
  const flowStyles = createPermissionFlowStyles(colors, isMobile);
  // Estilos adicionales solo para elementos específicos del modal
  const styles = StyleSheet.create({
    ...flowStyles,
    container: {
      flex: 1,
      padding: 16,
    },
    searchContainer: {
      marginBottom: 16,
    },
    selectedCount: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
    },
    itemsContainer: {
      marginTop: 8,
      gap: 8,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    menuItemIcon: {
      width: 32,
      height: 32,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    menuItemInfo: {
      flex: 1,
    },
    checkboxContainer: {
      marginLeft: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyText: {
      marginTop: 12,
      textAlign: "center",
    },
    modalFooter: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12,
      paddingTop: 16,
    },
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [searchValue, setSearchValue] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(true); // Preseleccionado al inicio

  // Extraer todos los items de último nivel (excluyendo públicos)
  const lastLevelItems = extractLastLevelItems(menuItems, "");

  // Inicializar todos los módulos como expandidos cuando se cargan los items
  useEffect(() => {
    if (lastLevelItems.length > 0) {
      const allModuleIds = new Set<string>();
      lastLevelItems.forEach((item) => {
        const pathParts = item.path.split(" > ");
        const module = pathParts[0] || "Otros";
        allModuleIds.add(`module-${module}`);
      });
      setExpandedModules(allModuleIds);
    }
  }, [lastLevelItems.length]); // Cuando se cargan los items del menú

  // Agrupar items por módulo/path
  const groupedItems = lastLevelItems.reduce(
    (acc, item) => {
      const pathParts = item.path.split(" > ");
      const module = pathParts[0] || "Otros";

      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(item);
      return acc;
    },
    {} as Record<string, typeof lastLevelItems>,
  );

  // Filtrar items según búsqueda y selección
  const filteredGroupedItems = Object.entries(groupedItems).reduce(
    (acc, [module, items]) => {
      let filtered = items;

      // Si showOnlySelected está activo, mostrar solo los seleccionados
      if (showOnlySelected) {
        filtered = filtered.filter((item) =>
          selectedMenuItemIds.includes(item.id),
        );
      }

      // Aplicar filtro de búsqueda
      if (searchValue.trim()) {
        const searchLower = searchValue.toLowerCase();
        filtered = filtered.filter((item) => {
          return (
            item.label.toLowerCase().includes(searchLower) ||
            item.route?.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower) ||
            item.path.toLowerCase().includes(searchLower)
          );
        });
      }

      if (filtered.length > 0) {
        acc[module] = filtered;
      }
      return acc;
    },
    {} as Record<string, typeof lastLevelItems>,
  );

  // Cargar menú al abrir el modal
  useEffect(() => {
    if (visible) {
      loadMenu();
      // Resetear búsqueda al abrir
      setSearchValue("");
    }
  }, [visible]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      // Cargar menú con showAll=true para ver todas las opciones
      const menu = await MenuService.getMenu("es", true);
      setMenuItems(menu);
    } catch (error) {
      // Error al cargar menú - el estado de error se maneja arriba
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenuItem = useCallback(
    (menuItemId: string) => {
      const newSelection = selectedMenuItemIds.includes(menuItemId)
        ? selectedMenuItemIds.filter((id) => id !== menuItemId)
        : [...selectedMenuItemIds, menuItemId];
      onSelectionChange(newSelection);
    },
    [selectedMenuItemIds, onSelectionChange],
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={
        t.security?.permissions?.selectMenuItems || "Seleccionar Items del Menú"
      }
      subtitle={
        t.security?.permissions?.selectMenuItemsSubtitle ||
        "Selecciona los items del menú a los que se asociará este permiso"
      }
      width="90%"
      height="90%"
      footer={
        <View style={styles.modalFooter}>
          <Button
            title={t.common?.cancel || "Cancelar"}
            onPress={onClose}
            variant="outlined"
            size="md"
          />
          <Button
            title={t.common?.accept || "Aceptar"}
            onPress={onClose}
            variant="primary"
            size="md"
          />
        </View>
      }
    >
      <View style={styles.container}>
        {/* Barra de búsqueda y botón de filtro */}
        <View style={styles.searchContainer}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <SearchInput
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder={
                  t.security?.permissions?.filterPlaceholder ||
                  "Filtrar por nombre, código, módulo o acción..."
                }
                containerStyle={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
                inputStyle={{ color: colors.text }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowOnlySelected(!showOnlySelected)}
              style={[
                {
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: showOnlySelected
                    ? colors.primary
                    : colors.surface,
                  borderColor: showOnlySelected
                    ? colors.primary
                    : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  showOnlySelected
                    ? "checkmark-circle"
                    : "checkmark-circle-outline"
                }
                size={20}
                color={showOnlySelected ? "#FFFFFF" : colors.textSecondary}
              />
              <ThemedText
                type="body2"
                style={{
                  color: showOnlySelected ? "#FFFFFF" : colors.text,
                  fontWeight: "500",
                }}
              >
                {t.security?.permissions?.showOnlySelected ||
                  "Solo seleccionados"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contador de seleccionados */}
        {selectedMenuItemIds.length > 0 && (
          <View
            style={[
              styles.selectedCount,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <ThemedText
              type="body2"
              style={{ color: colors.primary, fontWeight: "600" }}
            >
              {selectedMenuItemIds.length}{" "}
              {selectedMenuItemIds.length === 1
                ? "item seleccionado"
                : "items seleccionados"}
            </ThemedText>
          </View>
        )}

        {/* Lista de items */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText
              type="body2"
              variant="secondary"
              style={styles.loadingText}
            >
              Cargando menú...
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
          >
            {Object.entries(filteredGroupedItems).map(([module, items]) => {
              const moduleId = `module-${module}`;
              const isExpanded = expandedModules.has(moduleId);

              return (
                <View key={moduleId} style={styles.moduleContainer}>
                  {/* Header del módulo */}
                  <TouchableOpacity
                    style={[
                      styles.moduleHeader,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => toggleModule(moduleId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.moduleHeaderLeft}>
                      <View
                        style={[
                          styles.moduleIcon,
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Ionicons
                          name="cube"
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <ThemedText
                        type="body1"
                        style={[styles.moduleTitle, { color: colors.text }]}
                      >
                        {module.toUpperCase()}
                      </ThemedText>
                      <Ionicons
                        name={isExpanded ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color={colors.textSecondary}
                        style={styles.chevronIcon}
                      />
                    </View>
                    <View
                      style={[
                        styles.moduleBadge,
                        { backgroundColor: "transparent" },
                      ]}
                    >
                      <ThemedText
                        type="caption"
                        style={{ color: colors.text, fontWeight: "600" }}
                      >
                        {items.length}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>

                  {/* Items del módulo */}
                  {isExpanded && (
                    <View style={styles.itemsContainer}>
                      {items.map((item) => {
                        const isSelected = selectedMenuItemIds.includes(
                          item.id,
                        );

                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.menuItem,
                              {
                                backgroundColor: colors.background,
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.border,
                              },
                            ]}
                            onPress={() => toggleMenuItem(item.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.menuItemLeft}>
                              <View
                                style={[
                                  styles.menuItemIcon,
                                  { backgroundColor: colors.primary + "15" },
                                ]}
                              >
                                <Ionicons
                                  name={item.icon || "document-text"}
                                  size={16}
                                  color={colors.primary}
                                />
                              </View>
                              <View style={styles.menuItemInfo}>
                                <ThemedText
                                  type="body2"
                                  style={{
                                    color: colors.text,
                                    fontWeight: "500",
                                  }}
                                >
                                  {item.label}
                                </ThemedText>
                                {item.description && (
                                  <ThemedText
                                    type="caption"
                                    style={{
                                      marginTop: 2,
                                      color: colors.textSecondary,
                                    }}
                                  >
                                    {item.description}
                                  </ThemedText>
                                )}
                                {item.route && (
                                  <ThemedText
                                    type="caption"
                                    variant="secondary"
                                    style={{ marginTop: 2 }}
                                  >
                                    {item.route}
                                  </ThemedText>
                                )}
                              </View>
                            </View>
                            <View style={styles.checkboxContainer}>
                              <View
                                style={[
                                  styles.checkbox,
                                  {
                                    backgroundColor: isSelected
                                      ? colors.primary
                                      : "transparent",
                                    borderColor: isSelected
                                      ? colors.primary
                                      : colors.border,
                                  },
                                ]}
                              >
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark"
                                    size={16}
                                    color="#FFFFFF"
                                  />
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {Object.keys(filteredGroupedItems).length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <ThemedText
                  type="body2"
                  variant="secondary"
                  style={styles.emptyText}
                >
                  {searchValue.trim()
                    ? "No se encontraron items"
                    : "No hay items disponibles"}
                </ThemedText>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </CenteredModal>
  );
}
