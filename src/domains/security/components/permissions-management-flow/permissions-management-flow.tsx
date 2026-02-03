/**
 * Componente de administración masiva de permisos
 * Basado en el diseño de role-permissions-flow pero para edición masiva
 */

import { ThemedText } from "@/components/themed-text";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/src/infrastructure/i18n";
import { MenuService } from "@/src/infrastructure/menu/menu.service";
import { MenuItem } from "@/src/infrastructure/menu/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { PermissionMenuItem } from "../shared/permission-menu-item";
import { createPermissionFlowStyles } from "./permissions-management-flow.styles";
import {
    PermissionChange,
    PermissionsManagementFlowProps,
} from "./permissions-management-flow.types";

export function PermissionsManagementFlow({
  permissions,
  roleId,
  onChanges,
  searchValue = "",
  selectedModule = "",
  selectedAction = "",
  showDefaultOptions = true,
  showAll = false,
  onMenuItemsLoaded,
  customPermissions = [],
}: PermissionsManagementFlowProps) {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const styles = createPermissionFlowStyles(colors, isMobile);

  // Color para iconos activos: primaryDark en dark theme, primary en light theme
  const activeIconColor = isDark ? colors.primaryDark : colors.primary;

  // Estado para el menú completo
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  // Ref para mantener la referencia estable del callback y evitar bucles infinitos
  const onMenuItemsLoadedRef = useRef(onMenuItemsLoaded);
  useEffect(() => {
    onMenuItemsLoadedRef.current = onMenuItemsLoaded;
  }, [onMenuItemsLoaded]);

  // Estado para rastrear qué items están expandidos (inicialmente todos colapsados)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Estado para rastrear cambios de permisos
  // Estructura: { [route]: { view: boolean, create: boolean, edit: boolean, delete: boolean, [customPermissionId]: boolean } }
  const [permissionChanges, setPermissionChanges] = useState<
    Record<
      string,
      {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        [key: string]: boolean; // Permite permisos personalizados dinámicos
      }
    >
  >({});

  /**
   * Verifica si existe un permiso para una ruta y acción específica
   * También maneja permisos personalizados (cuando action es un ID de permiso personalizado)
   */
  const hasPermissionForRoute = (
    route: string | undefined,
    action: string,
  ): boolean => {
    if (!route) return false;

    // Si action es un ID de permiso personalizado (UUID), buscar en customPermissions
    const isCustomPermissionId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        action,
      );
    if (isCustomPermissionId) {
      // Buscar el permiso personalizado por ID
      const customPerm = customPermissions.find(
        (perm) => perm.id === action || perm.code === action,
      );
      if (!customPerm) return false;

      // Verificar si el permiso personalizado está asignado al rol para esta ruta
      // Buscar en los permisos del rol si existe este permiso personalizado asignado
      // Nota: permissions puede tener permissionId (RolePermission) o id (SecurityPermission)
      const roleHasCustomPerm = permissions.some((perm) => {
        const permId = (perm as any).permissionId || perm.id;
        return (
          permId === customPerm.id &&
          perm.route === route &&
          (perm.status === 1 || (perm as any).status === 1)
        );
      });

      return roleHasCustomPerm;
    }

    // Buscar permiso estándar por ruta exacta
    const routePermission = permissions.find(
      (perm) =>
        perm.route &&
        perm.route === route &&
        perm.action === action &&
        perm.status === 1, // Solo permisos activos
    );

    if (routePermission) {
      return true;
    }

    // Si no hay permiso por ruta, buscar por módulo (retrocompatibilidad)
    const moduleFromRoute = route.split("/").filter((p) => p)[0];
    if (moduleFromRoute) {
      const modulePermission = permissions.find(
        (perm) =>
          perm.module === moduleFromRoute &&
          perm.action === action &&
          (perm.route === null ||
            perm.route === undefined ||
            perm.route === "") &&
          perm.status === 1,
      );

      if (modulePermission) {
        return true;
      }
    }

    return false;
  };

  /**
   * Verifica si existe al menos un permiso para una ruta (cualquiera de las 4 acciones)
   * Usado para determinar si mostrar iconos o el texto "Opción por defecto"
   */
  const hasAnyPermissionForRoute = (route: string | undefined): boolean => {
    if (!route) return false;
    return ["view", "create", "edit", "delete"].some((action) =>
      hasPermissionForRoute(route, action),
    );
  };

  /**
   * Obtiene el estado actual de un permiso (considerando cambios pendientes)
   * Maneja tanto acciones estándar como permisos personalizados
   */
  const getPermissionState = (
    route: string | undefined,
    action: string,
  ): boolean => {
    if (!route) return false;

    // Si hay cambios pendientes, usar esos
    if (permissionChanges[route]) {
      return permissionChanges[route][action] || false;
    }

    // Si no, usar el estado actual
    return hasPermissionForRoute(route, action);
  };

  /**
   * Verifica si hay un cambio pendiente (aún no guardado) para una ruta y acción específica
   * Retorna true si el estado actual difiere del estado original guardado en el backend
   * Maneja tanto acciones estándar como permisos personalizados
   */
  const hasPendingChange = (
    route: string | undefined,
    action: string,
  ): boolean => {
    if (!route) return false;

    // Si hay cambios pendientes en permissionChanges, verificar si difiere del estado original
    if (permissionChanges[route]) {
      const currentState = permissionChanges[route][action];
      const originalState = hasPermissionForRoute(route, action);
      // Hay cambio pendiente si el estado actual difiere del original
      return currentState !== originalState;
    }

    return false;
  };

  /**
   * Toggle de un permiso específico
   * Maneja tanto acciones estándar como permisos personalizados
   */
  const togglePermission = (route: string | undefined, action: string) => {
    if (!route) return;

    setPermissionChanges((prev) => {
      const currentState = getPermissionState(route, action);
      const newState = !currentState;

      const newChanges = { ...prev };

      if (!newChanges[route]) {
        // Inicializar con el estado actual de acciones estándar
        newChanges[route] = {
          view: hasPermissionForRoute(route, "view"),
          create: hasPermissionForRoute(route, "create"),
          edit: hasPermissionForRoute(route, "edit"),
          delete: hasPermissionForRoute(route, "delete"),
        };
      }

      // Aplicar el cambio (puede ser una acción estándar o un permiso personalizado)
      newChanges[route] = {
        ...newChanges[route],
        [action]: newState,
      };

      // Verificar si todos los valores coinciden con el estado original
      // Para acciones estándar
      const originalView = hasPermissionForRoute(route, "view");
      const originalCreate = hasPermissionForRoute(route, "create");
      const originalEdit = hasPermissionForRoute(route, "edit");
      const originalDelete = hasPermissionForRoute(route, "delete");

      // Verificar acciones estándar
      const standardActionsMatch =
        newChanges[route].view === originalView &&
        newChanges[route].create === originalCreate &&
        newChanges[route].edit === originalEdit &&
        newChanges[route].delete === originalDelete;

      // Verificar permisos personalizados
      // Obtener todos los permisos personalizados que podrían estar en cambios
      const customPermKeys = Object.keys(newChanges[route]).filter(
        (key) =>
          key !== "view" &&
          key !== "create" &&
          key !== "edit" &&
          key !== "delete",
      );

      // Verificar si todos los permisos personalizados coinciden con el estado original
      const customPermsMatch = customPermKeys.every((key) => {
        const originalState = hasPermissionForRoute(route, key);
        return newChanges[route][key] === originalState;
      });

      // Si todos los valores (estándar y personalizados) coinciden, eliminar el cambio
      if (standardActionsMatch && customPermsMatch) {
        delete newChanges[route];
      }

      // Notificar cambios al padre
      if (onChanges) {
        const changes: PermissionChange[] = Object.entries(newChanges).map(
          ([route, actions]) => {
            const change: PermissionChange = {
              route,
              view: actions.view,
              create: actions.create,
              edit: actions.edit,
              delete: actions.delete,
            };
            // Agregar permisos personalizados como propiedades adicionales
            // Los permisos personalizados tienen sus IDs como keys en actions
            const customPermKeys = Object.keys(actions).filter(
              (key) =>
                key !== "view" &&
                key !== "create" &&
                key !== "edit" &&
                key !== "delete",
            );
            // Agregar cada permiso personalizado al objeto change
            for (const customPermKey of customPermKeys) {
              (change as any)[customPermKey] = actions[customPermKey];
            }
            return change;
          },
        );
        onChanges(changes);
      }

      return newChanges;
    });
  };

  // Consultar menú del rol o menú completo
  useEffect(() => {
    if (!roleId) {
      // Si no hay roleId, cargar menú completo
      const loadMenu = async () => {
        setLoadingMenu(true);
        setMenuError(null);

        try {
          const menu = await MenuService.getMenu("es", !showAll); // Invertir: cuando showAll es false (no seleccionado), enviar true
          setMenuItems(menu);
          onMenuItemsLoadedRef.current?.(menu);
        } catch (error: any) {
          console.error("Error al cargar menú:", error);
          setMenuError(error.message || "Error al cargar el menú");
        } finally {
          setLoadingMenu(false);
        }
      };

      loadMenu();
      return;
    }

    // Si hay roleId, cargar menú del rol específico
    const loadMenuForRole = async () => {
      setLoadingMenu(true);
      setMenuError(null);

      try {
        const menu = await MenuService.getMenuForRole(roleId, "es", !showAll); // Invertir: cuando showAll es false (no seleccionado), enviar true
        setMenuItems(menu);
        onMenuItemsLoadedRef.current?.(menu);
      } catch (error: any) {
        console.error("Error al cargar menú del rol:", error);
        setMenuError(error.message || "Error al cargar el menú del rol");
      } finally {
        setLoadingMenu(false);
      }
    };

    loadMenuForRole();
  }, [roleId, showAll]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {(() => {
        if (loadingMenu) {
          return (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText
                type="body2"
                variant="secondary"
                style={styles.emptyStateText}
              >
                Cargando menú...
              </ThemedText>
            </View>
          );
        }

        if (menuError) {
          return (
            <View style={styles.emptyState}>
              <Ionicons
                name="alert-circle"
                size={64}
                color={colors.error || colors.textSecondary}
              />
              <ThemedText
                type="body1"
                variant="secondary"
                style={styles.emptyStateText}
              >
                {menuError}
              </ThemedText>
            </View>
          );
        }

        if (menuItems.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons
                name="lock-closed"
                size={64}
                color={colors.textSecondary}
              />
              <ThemedText
                type="body1"
                variant="secondary"
                style={styles.emptyStateText}
              >
                No hay items de menú disponibles
              </ThemedText>
            </View>
          );
        }

        // Aplicar filtros a los menuItems
        const filteredMenuItems = menuItems.filter((menuItem) => {
          // Filtro por opciones por defecto (isPublic = true)
          const isPublic =
            menuItem.isPublic === true ||
            (typeof menuItem.isPublic === "string" &&
              menuItem.isPublic === "true") ||
            (typeof menuItem.isPublic === "number" && menuItem.isPublic === 1);
          if (isPublic && !showDefaultOptions) {
            // Si el item es público pero showDefaultOptions está desactivado, ocultarlo
            return false;
          }

          // Filtro por módulo
          if (selectedModule && menuItem.label !== selectedModule) {
            return false;
          }

          // Filtro por búsqueda (label, route, description)
          if (searchValue.trim()) {
            const searchLower = searchValue.toLowerCase();
            const matchesLabel = menuItem.label
              ?.toLowerCase()
              .includes(searchLower);
            const matchesRoute = menuItem.route
              ?.toLowerCase()
              .includes(searchLower);
            const matchesDescription = menuItem.description
              ?.toLowerCase()
              .includes(searchLower);

            // También buscar en subitems
            let matchesSubItems = false;
            if (menuItem.submenu) {
              matchesSubItems = menuItem.submenu.some((subItem) => {
                return (
                  subItem.label?.toLowerCase().includes(searchLower) ||
                  subItem.route?.toLowerCase().includes(searchLower) ||
                  subItem.description?.toLowerCase().includes(searchLower)
                );
              });
            }

            // También buscar en columnas
            let matchesColumns = false;
            if (menuItem.columns) {
              matchesColumns = menuItem.columns.some((column) => {
                return column.items?.some((item) => {
                  return (
                    item.label?.toLowerCase().includes(searchLower) ||
                    item.route?.toLowerCase().includes(searchLower) ||
                    item.description?.toLowerCase().includes(searchLower)
                  );
                });
              });
            }

            if (
              !matchesLabel &&
              !matchesRoute &&
              !matchesDescription &&
              !matchesSubItems &&
              !matchesColumns
            ) {
              return false;
            }
          }

          // Filtro por acción (solo si se seleccionó una acción)
          if (selectedAction) {
            const hasActionPermission = hasPermissionForRoute(
              menuItem.route,
              selectedAction,
            );

            // Verificar también en subitems
            let hasActionInSubItems = false;
            if (menuItem.submenu) {
              hasActionInSubItems = menuItem.submenu.some((subItem) =>
                hasPermissionForRoute(subItem.route, selectedAction),
              );
            }

            // Verificar también en columnas
            let hasActionInColumns = false;
            if (menuItem.columns) {
              hasActionInColumns = menuItem.columns.some((column) =>
                column.items?.some((item) =>
                  hasPermissionForRoute(item.route, selectedAction),
                ),
              );
            }

            if (
              !hasActionPermission &&
              !hasActionInSubItems &&
              !hasActionInColumns
            ) {
              return false;
            }
          }

          return true;
        });

        // Función auxiliar para verificar si un item debe mostrarse según los filtros
        const shouldShowItem = (item: {
          label?: string;
          route?: string;
          description?: string;
          isPublic?: boolean;
        }): boolean => {
          // Filtro por búsqueda
          if (searchValue.trim()) {
            const searchLower = searchValue.toLowerCase();
            const matchesLabel = item.label
              ?.toLowerCase()
              .includes(searchLower);
            const matchesRoute = item.route
              ?.toLowerCase()
              .includes(searchLower);
            const matchesDescription = item.description
              ?.toLowerCase()
              .includes(searchLower);

            if (!matchesLabel && !matchesRoute && !matchesDescription) {
              return false;
            }
          }

          // Filtro por acción
          if (selectedAction) {
            return hasPermissionForRoute(item.route, selectedAction);
          }

          return true;
        };

        return (
          <View style={styles.permissionsContainer}>
            {filteredMenuItems.map((menuItem, index) => {
              // Verificar si el item original es un módulo (tiene submenu o columns)
              // Esto NO debe depender de los filtros aplicados
              const originalHasSubItems =
                (menuItem.submenu && menuItem.submenu.length > 0) ||
                (menuItem.columns && menuItem.columns.length > 0);

              // Estructura jerárquica: items directos y columnas como grupos
              const directItems: Array<{
                id: string;
                label: string;
                route?: string;
                description?: string;
                isPublic?: boolean;
              }> = [];
              if (menuItem.submenu && menuItem.submenu.length > 0) {
                directItems.push(...menuItem.submenu);
              }
              const columnGroups: Array<{
                title?: string;
                items: Array<{
                  id: string;
                  label: string;
                  route?: string;
                  description?: string;
                  isPublic?: boolean;
                }>;
              }> = [];
              if (menuItem.columns && menuItem.columns.length > 0) {
                for (const column of menuItem.columns) {
                  columnGroups.push({
                    title: column.title,
                    items: column.items || [],
                  });
                }
              }

              // Filtrar items directos y columnas según los filtros aplicados
              const filteredDirectItems = directItems.filter((item) =>
                shouldShowItem(item),
              );
              const filteredColumnGroups = columnGroups
                .map((group) => ({
                  ...group,
                  items: group.items.filter((item) => shouldShowItem(item)),
                }))
                .filter((group) => group.items.length > 0); // Solo mostrar grupos que tengan items después del filtro

              const displayLabel = menuItem.label.toUpperCase();

              const itemId = menuItem.id || `item-${index}`;
              const isExpanded = expandedItems.has(itemId);
              // Usar hasSubItems original, no filtrado, para determinar si es módulo
              const hasSubItems = originalHasSubItems;

              // Toggle para expandir/colapsar
              const toggleExpand = () => {
                setExpandedItems((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(itemId)) {
                    newSet.delete(itemId);
                  } else {
                    newSet.add(itemId);
                  }
                  return newSet;
                });
              };

              // Si NO tiene subitems, renderizar directamente como un permissionItem (página)
              if (!hasSubItems) {
                return (
                  <View key={itemId} style={styles.moduleContainer}>
                    <PermissionMenuItem
                      item={{
                        id: menuItem.id || itemId,
                        label: menuItem.label,
                        route: menuItem.route,
                        description: menuItem.description,
                        isPublic: menuItem.isPublic,
                      }}
                      itemStyle={[
                        styles.permissionItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      actionsContainerStyle={styles.permissionActions}
                      actionIconsProps={{
                        interactive: true,
                        onTogglePermission: togglePermission,
                        getPermissionState,
                        hasPendingChange,
                        customPermissions,
                        menuItemId: menuItem.id || itemId,
                      }}
                    />
                  </View>
                );
              }

              // Si SÍ tiene subitems, renderizar como módulo colapsable
              return (
                <View key={itemId} style={styles.moduleContainer}>
                  {/* Header del módulo/item del menú - siempre clickeable */}
                  <TouchableOpacity
                    style={[
                      styles.moduleHeader,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={toggleExpand}
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
                        {displayLabel}
                      </ThemedText>
                      <Ionicons
                        name={isExpanded ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color={colors.textSecondary}
                        style={styles.chevronIcon}
                      />
                    </View>
                    <View style={[styles.moduleBadge]}>
                      <ThemedText
                        type="caption"
                        style={{
                          color: colors.contrastText,
                          fontWeight: "600",
                        }}
                      >
                        {filteredDirectItems.length +
                          filteredColumnGroups.reduce(
                            (acc, g) => acc + g.items.length,
                            0,
                          )}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>

                  {/* Lista de items del menú - solo mostrar si está expandido */}
                  {isExpanded && (
                    <View>
                      {/* Items directos */}
                      {filteredDirectItems.length > 0 && (
                        <View style={styles.permissionsList}>
                          {filteredDirectItems.map((subItem, subIndex) => (
                            <PermissionMenuItem
                              key={subItem.id || subIndex}
                              item={{
                                id: subItem.id || `sub-${subIndex}`,
                                label: subItem.label,
                                route: subItem.route,
                                description: subItem.description,
                                isPublic: subItem.isPublic,
                              }}
                              itemStyle={[
                                styles.permissionItem,
                                {
                                  backgroundColor: colors.background,
                                  borderColor: colors.border,
                                },
                                subIndex < filteredDirectItems.length - 1 &&
                                  styles.permissionItemNotLast,
                              ]}
                              actionsContainerStyle={styles.permissionActions}
                              actionIconsProps={{
                                interactive: true,
                                onTogglePermission: togglePermission,
                                getPermissionState,
                                hasPendingChange,
                                customPermissions,
                                menuItemId: subItem.id || `sub-${subIndex}`,
                              }}
                            />
                          ))}
                        </View>
                      )}

                      {/* Grupos de columnas */}
                      {filteredColumnGroups.map((group, groupIndex) => (
                        <View
                          key={`group-${groupIndex}`}
                          style={styles.groupContainer}
                        >
                          <View
                            style={[
                              styles.groupHeader,
                              {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <ThemedText
                              type="body2"
                              style={[
                                styles.groupTitle,
                                { color: colors.text },
                              ]}
                            >
                              {group.title || "Grupo"}
                            </ThemedText>
                            <View style={styles.groupBadge}>
                              <ThemedText
                                type="caption"
                                style={{
                                  color: colors.text,
                                  fontWeight: "600",
                                }}
                              >
                                {group.items.length}
                              </ThemedText>
                            </View>
                          </View>

                          {group.items.length > 0 && (
                            <View style={styles.permissionsList}>
                              {group.items.map((subItem, subIndex) => (
                                <PermissionMenuItem
                                  key={subItem.id || subIndex}
                                  item={{
                                    id: subItem.id || `col-${subIndex}`,
                                    label: subItem.label,
                                    route: subItem.route,
                                    description: subItem.description,
                                    isPublic: subItem.isPublic,
                                  }}
                                  itemStyle={[
                                    styles.permissionItem,
                                    {
                                      backgroundColor: colors.background,
                                      borderColor: colors.border,
                                    },
                                    subIndex < group.items.length - 1 &&
                                      styles.permissionItemNotLast,
                                  ]}
                                  actionsContainerStyle={
                                    styles.permissionActions
                                  }
                                  actionIconsProps={{
                                    interactive: true,
                                    onTogglePermission: togglePermission,
                                    getPermissionState,
                                    hasPendingChange,
                                    customPermissions,
                                    menuItemId: subItem.id || `col-${subIndex}`,
                                  }}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      })()}
    </ScrollView>
  );
}
