/**
 * Menú de navegación vertical estilo Azure DevOps
 * - Se muestra en el lado izquierdo de la página
 * - Puede expandirse/colapsarse
 * - Cuando está colapsado, muestra solo iconos
 * - Cuando está expandido, muestra iconos + texto
 */

import { ThemedText } from "@/components/themed-text";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { useTheme } from "@/hooks/use-theme";
import { AppConfig } from "@/src/config";
import { DynamicIcon } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import { createVerticalMenuStyles } from "@/src/styles/components/vertical-menu.styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Animated,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import type {
    MenuColumn,
    MenuItem,
} from "../horizontal-menu/horizontal-menu.types";
import { createVerticalMenuAdditionalStyles } from "./vertical-menu.styles";
import { VerticalMenuProps } from "./vertical-menu.types";

export function VerticalMenu({
  items,
  onItemPress,
  collapsed = false,
  onToggleCollapse,
  onExpandedChange,
}: VerticalMenuProps) {
  const { colors } = useTheme();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Calcular altura disponible: altura de ventana - header (~60px) - botón (40px)
  const HEADER_HEIGHT = 80; // Altura aproximada del header (padding + contenido)
  const TOGGLE_BUTTON_HEIGHT = 40;
  const availableHeight = windowHeight - HEADER_HEIGHT - TOGGLE_BUTTON_HEIGHT;

  // Obtener el color para items activos desde el tema cuando sea el azul primario
  // Unifica: 'blue', '#0087FF', '#007AFF' → colors.primary (del tema Light/Dark)
  const getActiveItemColor = (): string => {
    const configColor = String(AppConfig.navigation.activeItemColor || "blue")
      .trim()
      .toLowerCase();
    if (configColor === "red") return "#ff3366";
    if (configColor === "blue") return colors.primary;
    if (configColor === "#0087ff" || configColor === "#007aff")
      return colors.primary;
    return configColor; // Cualquier otro color se usa directamente
  };
  const activeItemColor = getActiveItemColor();
  const styles = createVerticalMenuStyles(collapsed);
  const additionalStyles = createVerticalMenuAdditionalStyles(colors);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isManuallyExpanded, setIsManuallyExpanded] =
    useState<boolean>(!collapsed); // Estado para saber si fue expandido manualmente
  const [isHovered, setIsHovered] = useState<boolean>(false); // Estado para hover
  const [searchValue, setSearchValue] = useState<string>(""); // Estado para búsqueda

  // Obtener anchos del menú desde la configuración
  const expandedWidth = AppConfig.navigation.verticalMenuExpandedWidth;
  const collapsedWidth = AppConfig.navigation.verticalMenuCollapsedWidth;

  const [animatedWidth, setAnimatedWidth] = useState<number>(
    collapsed ? collapsedWidth : expandedWidth,
  ); // Estado para rastrear el ancho animado
  const slideAnim = React.useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const activeItemIdRef = React.useRef<string | null>(null); // Ref para proteger el activeItemId

  // Determinar si el menú debe estar expandido
  // Si fue expandido manualmente, siempre expandido
  // Si está colapsado pero hay hover, expandir temporalmente
  const isExpanded = isManuallyExpanded || (collapsed && isHovered);

  // Determinar si el texto debe mostrarse basado en el ancho actual
  const shouldShowText = animatedWidth > 100; // Mostrar texto solo si el ancho es mayor a 100px

  // Animar el cambio de estado colapsado/expandido
  useEffect(() => {
    const targetValue = isExpanded ? 1 : 0;

    // Notificar cambios en el estado de expansión ANTES de animar para mejor sincronización
    if (onExpandedChange) {
      onExpandedChange(isExpanded);
    }

    Animated.timing(slideAnim, {
      toValue: targetValue,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Actualizar el ancho inmediatamente para sincronizar el renderizado
    setAnimatedWidth(isExpanded ? expandedWidth : collapsedWidth);
  }, [isExpanded, slideAnim, expandedWidth, collapsedWidth, onExpandedChange]);

  // Listener para el ancho animado (opcional, para mayor precisión)
  useEffect(() => {
    const listenerId = slideAnim.addListener(({ value }) => {
      const currentWidth =
        value * (expandedWidth - collapsedWidth) + collapsedWidth; // Interpolación: 0 -> collapsedWidth, 1 -> expandedWidth
      setAnimatedWidth(currentWidth);
    });

    return () => {
      slideAnim.removeListener(listenerId);
    };
  }, [slideAnim, expandedWidth, collapsedWidth]);

  // Sincronizar isManuallyExpanded cuando cambia collapsed desde fuera
  useEffect(() => {
    if (!collapsed) {
      setIsManuallyExpanded(true);
    }
  }, [collapsed]);

  // Función para comparar rutas (igual que HorizontalMenu)
  const isRouteMatch = (currentPath: string, route: string): boolean => {
    if (!route) return false;
    const normalizedPath = currentPath.toLowerCase().replace(/^\/+|\/+$/g, "");
    const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, "");
    if (normalizedPath === normalizedRoute) return true;
    if (normalizedPath.startsWith(normalizedRoute + "/")) return true;
    if (normalizedPath.endsWith("/" + normalizedRoute)) return true;
    return normalizedPath.includes("/" + normalizedRoute + "/");
  };

  // Detectar la ruta actual y establecer el item activo
  useEffect(() => {
    if (!pathname || !items || items.length === 0) {
      return;
    }

    // Función recursiva simple: buscar el item que tiene la ruta actual
    const findItemByRoute = (
      menuItems: MenuItem[],
      currentPath: string,
    ): { item: MenuItem | null; parent: MenuItem | null } => {
      for (const item of menuItems) {
        // Verificar si este item tiene la ruta
        if (item.route && isRouteMatch(currentPath, item.route)) {
          return { item, parent: null };
        }

        // Buscar en submenu
        if (item.submenu) {
          for (const subItem of item.submenu) {
            if (subItem.route && isRouteMatch(currentPath, subItem.route)) {
              return { item: subItem, parent: item };
            }
          }
        }

        // Buscar en columnas (mega menú)
        if (item.columns) {
          for (const column of item.columns) {
            for (const colItem of column.items) {
              if (colItem.route && isRouteMatch(currentPath, colItem.route)) {
                return { item: colItem, parent: item };
              }
            }
          }
        }
      }
      return { item: null, parent: null };
    };

    // Buscar el item que coincide con la ruta actual
    const { item, parent } = findItemByRoute(items, pathname);

    if (item) {
      // Marcar el item encontrado como activo
      activeItemIdRef.current = item.id;
      setActiveItemId(item.id);

      // Si tiene padre, expandir el padre para que sea visible
      if (parent) {
        setExpandedItems((prev) => {
          const newSet = new Set(prev);
          newSet.add(parent.id);
          return newSet;
        });
      }
    } else {
      // Si no encontramos el item en este menú, limpiar el estado activo
      // Esto asegura que cuando se selecciona un item en otro menú, este menú se desactive
      activeItemIdRef.current = null;
      setActiveItemId(null);
    }
  }, [pathname, items]);

  const handleItemPress = (item: MenuItem) => {
    // Si tiene submenu o columnas, expandir/colapsar
    if (
      (item.submenu && item.submenu.length > 0) ||
      (item.columns && item.columns.length > 0)
    ) {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      // Si no tiene submenu ni columnas, navegar
      if (item.route || item.onPress) {
        activeItemIdRef.current = item.id;
        setActiveItemId(item.id);
        if (onItemPress) {
          onItemPress(item);
        }
        // Si está colapsado (no expandido manualmente), colapsar después de seleccionar
        if (collapsed && !isManuallyExpanded) {
          setIsHovered(false);
        }
      }
    }
  };

  const handleSubItemPress = (parentItem: MenuItem, subItem: MenuItem) => {
    activeItemIdRef.current = subItem.id;
    setActiveItemId(subItem.id);
    if (onItemPress) {
      onItemPress(subItem);
    }
    // Si está colapsado (no expandido manualmente), colapsar después de seleccionar
    if (collapsed && !isManuallyExpanded) {
      setIsHovered(false);
    }
  };

  const handleColumnItemPress = (parentItem: MenuItem, colItem: MenuItem) => {
    activeItemIdRef.current = colItem.id;
    setActiveItemId(colItem.id);
    if (onItemPress) {
      onItemPress(colItem);
    }
    // Si está colapsado (no expandido manualmente), colapsar después de seleccionar
    if (collapsed && !isManuallyExpanded) {
      setIsHovered(false);
    }
  };

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
    // Si se está expandiendo manualmente, marcar como expandido manualmente
    if (collapsed) {
      setIsManuallyExpanded(true);
    } else {
      // Si se está colapsando manualmente, permitir hover de nuevo
      setIsManuallyExpanded(false);
      setIsHovered(false);
    }
  };

  const handleMouseEnter = () => {
    // Solo expandir con hover si está colapsado y no fue expandido manualmente
    if (collapsed && !isManuallyExpanded) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    // Solo colapsar con hover si está colapsado y no fue expandido manualmente
    if (collapsed && !isManuallyExpanded) {
      setIsHovered(false);
    }
  };

  const isItemActive = (item: MenuItem): boolean => {
    // Verificar directamente la ruta en el render (igual que HorizontalMenu)
    return !!(
      activeItemId === item.id ||
      activeItemIdRef.current === item.id ||
      (item.route && pathname && isRouteMatch(pathname, item.route))
    );
  };

  const isSubItemActive = (subItem: MenuItem): boolean => {
    // Verificar directamente la ruta en el render (igual que HorizontalMenu)
    return !!(
      activeItemId === subItem.id ||
      activeItemIdRef.current === subItem.id ||
      (subItem.route && pathname && isRouteMatch(pathname, subItem.route))
    );
  };

  const isItemExpanded = (item: MenuItem): boolean => {
    return expandedItems.has(item.id);
  };

  // Función auxiliar recursiva para renderizar solo los hijos de un item (sin el botón principal)
  // Se usa cuando un item tiene hijos y queremos renderizarlos recursivamente
  const renderVerticalMenuItemChildren = (
    item: MenuItem,
    level: number,
    parentItem: MenuItem,
  ): React.ReactNode => {
    const isSubItemActive = (subItem: MenuItem): boolean => {
      return !!(
        activeItemId === subItem.id ||
        activeItemIdRef.current === subItem.id ||
        (subItem.route && pathname && isRouteMatch(pathname, subItem.route))
      );
    };

    return (
      <View style={additionalStyles.submenuMargin}>
        {item.submenu && item.submenu.length > 0 && (
          <View style={styles.submenuContainer}>
            {item.submenu.map((subItem) => {
              const isSubActive = isSubItemActive(subItem);
              const isSubExpanded = expandedItems.has(subItem.id);
              const hasSubChildren =
                (subItem.submenu && subItem.submenu.length > 0) ||
                (subItem.columns && subItem.columns.length > 0);

              return (
                <View key={subItem.id}>
                  <TouchableOpacity
                    style={[
                      styles.submenuItem,
                      isSubActive && {
                        backgroundColor: activeItemColor + "10",
                      },
                    ]}
                    onPress={() =>
                      hasSubChildren
                        ? handleItemPress(subItem)
                        : handleSubItemPress(parentItem, subItem)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.submenuItemContent}>
                      {subItem.icon && (
                        <DynamicIcon
                          name={subItem.icon}
                          size={16}
                          color={
                            isSubActive ? activeItemColor : colors.textSecondary
                          }
                          style={styles.submenuItemIcon}
                        />
                      )}
                      <ThemedText
                        type="caption"
                        style={[
                          styles.submenuItemLabel,
                          {
                            color: isSubActive
                              ? activeItemColor
                              : colors.textSecondary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {subItem.label}
                      </ThemedText>
                      {hasSubChildren && (
                        <Ionicons
                          name={isSubExpanded ? "chevron-up" : "chevron-down"}
                          size={12}
                          color={colors.textSecondary}
                          style={additionalStyles.chevronMargin}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  {/* Renderizar recursivamente si tiene hijos y está expandido */}
                  {isSubExpanded &&
                    (subItem.submenu || subItem.columns) &&
                    renderVerticalMenuItemChildren(subItem, level + 1, subItem)}
                </View>
              );
            })}
          </View>
        )}
        {item.columns && item.columns.length > 0 && (
          <View style={styles.columnsContainer}>
            {item.columns.map((column, colIdx) => (
              <View key={colIdx} style={styles.columnContainer}>
                {column.title && (
                  <ThemedText
                    type="caption"
                    style={[
                      styles.columnTitle,
                      { color: colors.textSecondary, fontWeight: "600" },
                    ]}
                  >
                    {column.title}
                  </ThemedText>
                )}
                {column.items.map((colItem) => {
                  const isColActive =
                    activeItemId === colItem.id ||
                    activeItemIdRef.current === colItem.id ||
                    (colItem.route &&
                      pathname &&
                      isRouteMatch(pathname, colItem.route));
                  const isColExpanded = expandedItems.has(colItem.id);
                  const hasColChildren =
                    (colItem.submenu && colItem.submenu.length > 0) ||
                    (colItem.columns && colItem.columns.length > 0);

                  return (
                    <View key={colItem.id}>
                      <TouchableOpacity
                        style={[
                          styles.columnItem,
                          isColActive && {
                            backgroundColor: activeItemColor + "10",
                          },
                        ]}
                        onPress={() =>
                          hasColChildren
                            ? handleItemPress(colItem)
                            : handleColumnItemPress(parentItem, colItem)
                        }
                        activeOpacity={0.7}
                      >
                        <View style={styles.columnItemContent}>
                          {colItem.icon && (
                            <DynamicIcon
                              name={colItem.icon}
                              size={16}
                              color={
                                isColActive
                                  ? activeItemColor
                                  : colors.textSecondary
                              }
                              style={styles.columnItemIcon}
                            />
                          )}
                          <ThemedText
                            type="caption"
                            style={[
                              styles.columnItemLabel,
                              {
                                color: isColActive
                                  ? activeItemColor
                                  : colors.textSecondary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {colItem.label}
                          </ThemedText>
                          {hasColChildren && (
                            <Ionicons
                              name={
                                isColExpanded ? "chevron-up" : "chevron-down"
                              }
                              size={12}
                              color={colors.textSecondary}
                              style={additionalStyles.chevronMargin}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                      {/* Renderizar recursivamente si tiene hijos y está expandido */}
                      {isColExpanded &&
                        (colItem.submenu || colItem.columns) &&
                        renderVerticalMenuItemChildren(
                          colItem,
                          level + 1,
                          colItem,
                        )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Función para filtrar recursivamente items y sus hijos
  const filterItemRecursively = (
    item: MenuItem,
    searchLower: string,
  ): MenuItem | null => {
    const itemMatches =
      item.label.toLowerCase().includes(searchLower) ||
      item.route?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower);

    let filteredSubmenu: MenuItem[] | undefined;
    if (item.submenu && item.submenu.length > 0) {
      filteredSubmenu = item.submenu
        .map((subItem) => filterItemRecursively(subItem, searchLower))
        .filter((subItem): subItem is MenuItem => subItem !== null);
    }

    let filteredColumns: MenuColumn[] | undefined;
    if (item.columns && item.columns.length > 0) {
      filteredColumns = item.columns
        .map((col) => {
          const filteredColItems = col.items
            .map((colItem) => filterItemRecursively(colItem, searchLower))
            .filter((colItem): colItem is MenuItem => colItem !== null);

          if (filteredColItems.length > 0) {
            return {
              ...col,
              items: filteredColItems,
            };
          }
          return null;
        })
        .filter((col): col is MenuColumn => col !== null);

      if (filteredColumns.length === 0) {
        filteredColumns = undefined;
      }
    }

    if (
      itemMatches ||
      (filteredSubmenu && filteredSubmenu.length > 0) ||
      (filteredColumns && filteredColumns.length > 0)
    ) {
      return {
        ...item,
        submenu:
          filteredSubmenu && filteredSubmenu.length > 0
            ? filteredSubmenu
            : undefined,
        columns: filteredColumns,
      };
    }

    return null;
  };

  // Filtrar items
  const filteredItems = items
    .map((item) => {
      if (!searchValue) return item;
      const searchLower = searchValue.toLowerCase();
      return filterItemRecursively(item, searchLower);
    })
    .filter((item): item is MenuItem => item !== null);

  return (
    <Animated.View
      style={[
        styles.container,
        additionalStyles.animatedContainer,
        {
          width: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [collapsedWidth, expandedWidth],
          }),
        },
      ]}
      {...(Platform.OS === "web"
        ? {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
          }
        : {})}
    >
      {/* Input de búsqueda y icono de bloqueo */}
      <View style={additionalStyles.searchContainer}>
        <View style={additionalStyles.searchRow}>
          {/* Icono de bloqueo/desbloqueo del menú - siempre visible */}
          {onToggleCollapse && (
            <TouchableOpacity
              onPress={handleToggleCollapse}
              activeOpacity={0.7}
              style={additionalStyles.lockButton}
            >
              <MaterialCommunityIcons
                name={isExpanded ? "menu-open" : "menu-close"}
                size={20}
                color={
                  isManuallyExpanded ? activeItemColor : colors.textSecondary
                }
              />
            </TouchableOpacity>
          )}
          {/* Input de búsqueda - solo visible cuando el menú está expandido */}
          {shouldShowText && (
            <View style={additionalStyles.searchInputContainer}>
              <Ionicons
                name="search"
                size={18}
                color={colors.textSecondary}
                style={additionalStyles.searchIcon}
              />
              {searchValue.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchValue("")}
                  style={additionalStyles.clearButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              <InputWithFocus
                containerStyle={[
                  additionalStyles.searchInputWrapper,
                  {
                    paddingRight: searchValue.length > 0 ? 36 : 10,
                  },
                ]}
                primaryColor={colors.primary}
              >
                <TextInput
                  placeholder="Buscar..."
                  value={searchValue}
                  onChangeText={setSearchValue}
                  style={[additionalStyles.searchInput, { color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
              </InputWithFocus>
            </View>
          )}
        </View>
      </View>

      {/* Contenedor con altura fija y scroll para todo el menú */}
      <View
        style={[
          additionalStyles.scrollContainerWithHeight,
          { height: shouldShowText ? availableHeight - 60 : availableHeight },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {filteredItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const hasColumns = item.columns && item.columns.length > 0;
            const hasChildren = hasSubmenu || hasColumns;
            const isActive = isItemActive(item);
            const isExpanded = isItemExpanded(item);

            // Verificar si algún item hijo está activo
            const hasActiveChild = hasSubmenu
              ? item.submenu!.some((subItem) => isSubItemActive(subItem))
              : hasColumns
                ? item.columns!.some((column) =>
                    column.items.some((colItem) => activeItemId === colItem.id),
                  )
                : false;

            return (
              <View key={item.id}>
                {/* Item principal */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    (isActive || hasActiveChild) && {
                      backgroundColor: activeItemColor + "15",
                    },
                    {
                      borderLeftColor:
                        isActive || hasActiveChild
                          ? activeItemColor
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <DynamicIcon
                      name={item.icon || "ellipse-outline"}
                      size={20}
                      color={
                        isActive || hasActiveChild
                          ? activeItemColor
                          : colors.textSecondary
                      }
                      style={styles.menuItemIcon}
                    />
                    {shouldShowText && (
                      <>
                        <ThemedText
                          type="body2"
                          style={[
                            styles.menuItemLabel,
                            {
                              color:
                                isActive || hasActiveChild
                                  ? activeItemColor
                                  : colors.text,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </ThemedText>
                        {hasChildren && (
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={16}
                            color={colors.textSecondary}
                            style={styles.chevronIcon}
                          />
                        )}
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Submenu simple (solo cuando está expandido y el texto se muestra) - renderizado recursivo */}
                {hasSubmenu && isExpanded && shouldShowText && (
                  <View style={styles.submenuContainer}>
                    {item.submenu!.map((subItem) => {
                      const isSubActive = isSubItemActive(subItem);
                      const isSubExpanded = expandedItems.has(subItem.id);
                      const hasSubChildren =
                        (subItem.submenu && subItem.submenu.length > 0) ||
                        (subItem.columns && subItem.columns.length > 0);

                      return (
                        <View key={subItem.id}>
                          <TouchableOpacity
                            style={[
                              styles.submenuItem,
                              isSubActive && {
                                backgroundColor: activeItemColor + "10",
                              },
                            ]}
                            onPress={() =>
                              hasSubChildren
                                ? handleItemPress(subItem)
                                : handleSubItemPress(item, subItem)
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.submenuItemContent}>
                              {subItem.icon && (
                                <DynamicIcon
                                  name={subItem.icon}
                                  size={16}
                                  color={
                                    isSubActive
                                      ? activeItemColor
                                      : colors.textSecondary
                                  }
                                  style={styles.submenuItemIcon}
                                />
                              )}
                              <ThemedText
                                type="caption"
                                style={[
                                  styles.submenuItemLabel,
                                  {
                                    color: isSubActive
                                      ? activeItemColor
                                      : colors.textSecondary,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {subItem.label}
                              </ThemedText>
                              {hasSubChildren && (
                                <Ionicons
                                  name={
                                    isSubExpanded
                                      ? "chevron-up"
                                      : "chevron-down"
                                  }
                                  size={12}
                                  color={colors.textSecondary}
                                  style={additionalStyles.chevronMargin}
                                />
                              )}
                            </View>
                          </TouchableOpacity>
                          {/* Renderizar recursivamente si tiene hijos y está expandido */}
                          {isSubExpanded &&
                            (subItem.submenu || subItem.columns) &&
                            renderVerticalMenuItemChildren(subItem, 1, subItem)}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Columnas (mega menú) - solo cuando está expandido y el texto se muestra - renderizado recursivo */}
                {hasColumns && isExpanded && shouldShowText && (
                  <View style={styles.columnsContainer}>
                    {item.columns!.map((column, colIdx) => (
                      <View key={colIdx} style={styles.columnContainer}>
                        {/* Título de la columna */}
                        {column.title && (
                          <ThemedText
                            type="caption"
                            style={[
                              styles.columnTitle,
                              {
                                color: colors.textSecondary,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {column.title}
                          </ThemedText>
                        )}
                        {/* Items de la columna */}
                        {column.items.map((colItem) => {
                          const isColActive =
                            activeItemId === colItem.id ||
                            activeItemIdRef.current === colItem.id ||
                            (colItem.route &&
                              pathname &&
                              isRouteMatch(pathname, colItem.route));
                          const isColExpanded = expandedItems.has(colItem.id);
                          const hasColChildren =
                            (colItem.submenu && colItem.submenu.length > 0) ||
                            (colItem.columns && colItem.columns.length > 0);

                          return (
                            <View key={colItem.id}>
                              <TouchableOpacity
                                style={[
                                  styles.columnItem,
                                  isColActive && {
                                    backgroundColor: activeItemColor + "10",
                                  },
                                ]}
                                onPress={() =>
                                  hasColChildren
                                    ? handleItemPress(colItem)
                                    : handleColumnItemPress(item, colItem)
                                }
                                activeOpacity={0.7}
                              >
                                <View style={styles.columnItemContent}>
                                  {colItem.icon && (
                                    <DynamicIcon
                                      name={colItem.icon}
                                      size={16}
                                      color={
                                        isColActive
                                          ? activeItemColor
                                          : colors.textSecondary
                                      }
                                      style={styles.columnItemIcon}
                                    />
                                  )}
                                  <ThemedText
                                    type="caption"
                                    style={[
                                      styles.columnItemLabel,
                                      {
                                        color: isColActive
                                          ? activeItemColor
                                          : colors.textSecondary,
                                      },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {colItem.label}
                                  </ThemedText>
                                  {hasColChildren && (
                                    <Ionicons
                                      name={
                                        isColExpanded
                                          ? "chevron-up"
                                          : "chevron-down"
                                      }
                                      size={12}
                                      color={colors.textSecondary}
                                      style={additionalStyles.chevronMargin}
                                    />
                                  )}
                                </View>
                              </TouchableOpacity>
                              {/* Renderizar recursivamente si tiene hijos y está expandido */}
                              {isColExpanded &&
                                (colItem.submenu || colItem.columns) &&
                                renderVerticalMenuItemChildren(
                                  colItem,
                                  1,
                                  colItem,
                                )}
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}
