import { ThemedText } from '@/components/themed-text';
import { isMobileDevice } from '@/constants/breakpoints';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { createHorizontalMenuStyles } from '@/src/styles/components/horizontal-menu.styles';
import { usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

export interface MenuItem {
  id: string;
  label: string;
  route?: string;
  onPress?: () => void;
  icon?: string;
  description?: string;
  submenu?: MenuItem[];
  columns?: MenuColumn[];
}

export interface MenuColumn {
  title: string;
  items: MenuItem[];
}

interface HorizontalMenuProps {
  items: MenuItem[];
  onItemPress?: (item: MenuItem) => void;
}

/**
 * Menú de navegación horizontal responsive con mega menú
 * - Desktop/Tablet: Menú horizontal con mega menú de columnas
 * - Mobile: Menú hamburger con drawer
 */
export function HorizontalMenu({ items, onItemPress }: HorizontalMenuProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createHorizontalMenuStyles();
  const pathname = usePathname();
  const isMobile = isMobileDevice(width);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ left: 0 });
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null); // Para rastrear opción activa del menú principal
  const [activeSubmenuItem, setActiveSubmenuItem] = useState<string | null>(null); // Para rastrear opción activa del submenú
  const menuItemRefs = useRef<any>({});
  const slideAnim = useRef(new Animated.Value(-400)).current; // Animación para deslizar desde la izquierda

  // Función para cerrar el menú con animación
  const closeMobileMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setMobileMenuOpen(false);
    });
  };

  // Detectar la ruta actual y establecer el item activo
  useEffect(() => {
    // Función para comparar rutas de manera flexible
    const isRouteMatch = (pathname: string, route: string): boolean => {
      const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
      const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
      
      // Verificar coincidencia exacta
      if (normalizedPath === normalizedRoute) {
        return true;
      }
      
      // Verificar si el pathname empieza con la ruta seguida de /
      if (normalizedPath.startsWith(normalizedRoute + '/')) {
        return true;
      }
      
      // Verificar si el pathname termina con / seguido de la ruta
      if (normalizedPath.endsWith('/' + normalizedRoute)) {
        return true;
      }
      
      // Verificar si contiene la ruta con delimitadores
      return normalizedPath.includes('/' + normalizedRoute + '/');
    };

    // Función recursiva para buscar el item activo basado en la ruta
    const findActiveItem = (items: MenuItem[], parentId?: string): { itemId: string | null; parentId: string | null } => {
      for (const item of items) {
        // Comparar la ruta
        if (item.route && isRouteMatch(pathname, item.route)) {
          // Si encontramos el item activo en el nivel principal, marcarlo
          if (!parentId) {
            setActiveMenuItem(item.id);
          }
          return { itemId: item.id, parentId: parentId || null };
        }
        if (item.submenu) {
          const result = findActiveItem(item.submenu, item.id);
          if (result.itemId) {
            // Si encontramos un subitem activo, también marcar el padre
            setActiveMenuItem(item.id);
            // NO abrir el submenú automáticamente - solo el usuario puede abrirlo con click
            return result;
          }
        }
        if (item.columns) {
          for (const column of item.columns) {
            const result = findActiveItem(column.items, item.id);
            if (result.itemId) {
              // Si encontramos un subitem activo, también marcar el padre
              setActiveMenuItem(item.id);
              // NO abrir el mega menú automáticamente - solo el usuario puede abrirlo con click
              return result;
            }
          }
        }
      }
      return { itemId: null, parentId: null };
    };

    const { itemId, parentId } = findActiveItem(items);
    if (itemId) {
      setActiveSubmenuItem(itemId);
    } else {
      // Si no hay item activo, limpiar los estados
      setActiveMenuItem(null);
      setActiveSubmenuItem(null);
      setActiveSubmenu(null);
    }
  }, [pathname]); // Removido items del array de dependencias para evitar loops infinitos

  const handleItemPress = (item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      // Medir posición del elemento antes de abrir el submenú
      if (menuItemRefs.current[item.id]) {
        menuItemRefs.current[item.id].measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          // Usar x (posición relativa al ScrollView) en lugar de pageX (posición absoluta)
          setSubmenuPosition({ left: x });
        });
      }
      // Si el submenú ya está abierto, lo cerramos; si no, lo abrimos
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
      setActiveMenuItem(item.id); // Marcar como activa
      // NO limpiar activeSubmenuItem aquí porque el useEffect lo manejará basado en la ruta actual
    } else if (item.columns && item.columns.length > 0) {
      // Medir posición del elemento antes de abrir el mega menú
      if (menuItemRefs.current[item.id]) {
        menuItemRefs.current[item.id].measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          // Usar x (posición relativa al ScrollView) en lugar de pageX (posición absoluta)
          setSubmenuPosition({ left: x });
        });
      }
      // Si el mega menú ya está abierto, lo cerramos; si no, lo abrimos
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
      setActiveMenuItem(item.id); // Marcar como activa
      // NO limpiar activeSubmenuItem aquí porque el useEffect lo manejará basado en la ruta actual
    } else {
      // Navegar o ejecutar acción
      setActiveMenuItem(item.id); // Marcar como activa
      setActiveSubmenuItem(null); // Limpiar selección del submenú (solo cuando navegamos a una página principal)
      if (item.onPress) {
        item.onPress();
      }
      if (onItemPress) {
        onItemPress(item);
      }
      if (isMobile) {
        closeMobileMenu();
      }
      setActiveSubmenu(null);
    }
  };

  const handleSubmenuItemPress = (item: MenuItem, parentId: string) => {
    setActiveSubmenuItem(item.id); // Marcar como activa
    if (item.onPress) {
      item.onPress();
    }
    if (onItemPress) {
      onItemPress(item);
    }
    if (isMobile) {
      closeMobileMenu();
    }
  };

  const handleMouseEnter = (itemId: string) => {
    // Solo funciona en web
    if (Platform.OS === 'web') {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      // Si hay un submenú activo diferente, lo cerramos
      if (activeSubmenu && activeSubmenu !== itemId) {
        setActiveSubmenu(null);
      }
      // Medir posición del elemento antes de abrir el submenú
      if (menuItemRefs.current[itemId]) {
        menuItemRefs.current[itemId].measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          setSubmenuPosition({ left: x });
        });
      }
      setActiveSubmenu(itemId);
    }
  };

  const handleMouseLeave = () => {
    // Solo funciona en web
    if (Platform.OS === 'web') {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      const timeout = setTimeout(() => {
        setActiveSubmenu(null);
      }, 200) as ReturnType<typeof setTimeout>;
      setHoverTimeout(timeout);
    }
  };

  const handleSubmenuMouseEnter = () => {
    // Solo funciona en web
    if (Platform.OS === 'web') {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    }
  };

  const handleClickOutside = () => {
    setActiveSubmenu(null);
  };

  // Detectar si se hace click fuera del menú
  useEffect(() => {
    if (activeSubmenu) {
      const handleDocumentClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && !target.closest('[data-menu-container]')) {
          setActiveSubmenu(null);
        }
      };
      
      if (Platform.OS === 'web') {
        document.addEventListener('click', handleDocumentClick);
        return () => {
          document.removeEventListener('click', handleDocumentClick);
        };
      }
    }
  }, [activeSubmenu]);

  // Efecto para animar el menú móvil
  useEffect(() => {
    if (mobileMenuOpen) {
      // Resetear animación al abrir
      slideAnim.setValue(-400);
      // Animar entrada desde la izquierda
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [mobileMenuOpen]);

  // Mobile: Hamburger Menu
  if (isMobile) {
    return (
      <>
        <TouchableOpacity
          style={[styles.hamburgerButton, { backgroundColor: colors.surface }]}
          onPress={() => setMobileMenuOpen(true)}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.hamburgerIcon}>☰</ThemedText>
        </TouchableOpacity>

        <Modal
          animationType="none"
          transparent={true}
          visible={mobileMenuOpen}
          onRequestClose={closeMobileMenu}
        >
          <Pressable
            style={styles.mobileMenuOverlay}
            onPress={closeMobileMenu}
          >
            <Animated.View
              style={[
                styles.mobileMenuContainer,
                { backgroundColor: colors.background },
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{ flex: 1 }}
              >
              <View style={[styles.mobileMenuHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="h3">{t.menuLabel.menu}</ThemedText>
                <TouchableOpacity onPress={closeMobileMenu}>
                  <ThemedText type="h3">✕</ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.mobileMenuContent}>
                {items.map((item) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={[
                        styles.mobileMenuItem,
                        { borderBottomColor: colors.border },
                      ]}
                      onPress={() => handleItemPress(item)}
                    >
                      <ThemedText type="defaultSemiBold">{item.label}</ThemedText>
                      {(item.submenu || item.columns) && (
                        <ThemedText>{activeSubmenu === item.id ? '▲' : '▼'}</ThemedText>
                      )}
                    </TouchableOpacity>

                    {(item.submenu || item.columns) && activeSubmenu === item.id && (
                      <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                        {item.submenu?.map((subitem) => (
                          <TouchableOpacity
                            key={subitem.id}
                            style={[
                              styles.submenuItem,
                              activeSubmenuItem === subitem.id && styles.activeSubmenuItem
                            ]}
                            onPress={() => handleSubmenuItemPress(subitem, item.id)}
                          >
                            <ThemedText type="body2" style={styles.submenuText}>
                              {subitem.label}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                        {item.columns?.map((column, colIdx) => (
                          <View key={colIdx} style={styles.mobileColumn}>
                            <ThemedText type="defaultSemiBold" style={styles.mobileColumnTitle}>
                              {column.title}
                            </ThemedText>
                            {column.items.map((subitem) => (
                              <TouchableOpacity
                                key={subitem.id}
                                style={[
                                  styles.submenuItem,
                                  activeSubmenuItem === subitem.id && styles.activeSubmenuItem
                                ]}
                                onPress={() => handleSubmenuItemPress(subitem, item.id)}
                              >
                                <ThemedText type="body2" style={styles.submenuText}>
                                  {subitem.label}
                                </ThemedText>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </>
    );
  }

  // Desktop/Tablet: Horizontal Menu
  const activeItem = items.find(item => item.id === activeSubmenu);

  return (
    <View style={styles.desktopContainer} data-menu-container="true">
      {/* Menú horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalMenuContent}
        style={styles.horizontalMenuScroll}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            ref={(ref) => {
              if (ref) {
                menuItemRefs.current[item.id] = ref;
              }
            }}
            style={[
              styles.horizontalMenuItem,
              (activeMenuItem === item.id || activeSubmenu === item.id) && styles.activeMenuItem,
            ]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <ThemedText type="defaultSemiBold" style={styles.menuItemText}>
              {item.label}
            </ThemedText>
            {(item.submenu || item.columns) && (
              <ThemedText style={styles.dropdownIndicator}>
                {activeSubmenu === item.id ? '▲' : '▼'}
              </ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mega Menu o Submenu - Renderizado fuera del ScrollView */}
      {activeSubmenu && activeItem && (
        <>
          {activeItem.columns && activeItem.columns.length > 0 && (
            <View
              style={[
                styles.megaMenu,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                  left: submenuPosition.left,
                },
              ]}
            >
              <View style={styles.megaMenuContent}>
                {activeItem.columns.map((column, colIdx) => (
                  <View key={colIdx} style={styles.megaMenuColumn}>
                    <ThemedText
                      type="h6"
                      style={[
                        styles.megaMenuColumnTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {column.title}
                    </ThemedText>
                    <View
                      style={[styles.megaMenuColumnLine, { backgroundColor: colors.border }]}
                    />
                    {column.items.map((subitem) => (
                      <TouchableOpacity
                        key={subitem.id}
                        style={[
                          styles.megaMenuItem, 
                          { borderBottomColor: colors.border },
                          activeSubmenuItem === subitem.id && styles.activeMegaMenuItem
                        ]}
                        onPress={() => handleSubmenuItemPress(subitem, activeItem.id)}
                      >
                        <ThemedText type="body2" style={styles.megaMenuItemText}>
                          {subitem.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeItem.submenu && activeItem.submenu.length > 0 && (
            <View
              style={[
                styles.desktopSubmenu,
                {
                  backgroundColor: colors.background, // ← Agregado explícitamente
                  borderColor: colors.border,
                  shadowColor: colors.text,
                  left: submenuPosition.left, // ← Posición calculada
                },
              ]}
            >
              {activeItem.submenu.map((subitem) => (
                <TouchableOpacity
                  key={subitem.id}
                  style={[
                    styles.desktopSubmenuItem, 
                    { borderBottomColor: colors.border },
                    activeSubmenuItem === subitem.id && styles.activeSubmenuItem
                  ]}
                  onPress={() => handleSubmenuItemPress(subitem, activeItem.id)}
                >
                  <ThemedText type="defaultSemiBold" style={styles.submenuItemTitle}>
                    {subitem.label}
                  </ThemedText>
                  {subitem.description && (
                    <ThemedText type="caption" style={styles.submenuItemDescription}>
                      {subitem.description}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

// estilos movidos a src/styles/components/horizontal-menu.styles.ts
