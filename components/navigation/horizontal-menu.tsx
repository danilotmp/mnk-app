import { ThemedText } from '@/components/themed-text';
import { isMobileDevice } from '@/constants/breakpoints';
import { useTheme } from '@/hooks/use-theme';
import { usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
  const pathname = usePathname();
  const isMobile = isMobileDevice(width);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ left: 0 });
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null); // Para rastrear opción activa del menú principal
  const [activeSubmenuItem, setActiveSubmenuItem] = useState<string | null>(null); // Para rastrear opción activa del submenú
  const menuItemRefs = useRef<any>({});

  // Detectar la ruta actual y establecer el item activo
  useEffect(() => {
    // Función recursiva para buscar el item activo basado en la ruta
    const findActiveItem = (items: MenuItem[], parentId?: string): { itemId: string | null; parentId: string | null } => {
      for (const item of items) {
        // Normalizar ambas rutas para comparación
        const normalizedPathname = pathname.toLowerCase();
        const normalizedRoute = item.route?.toLowerCase();
        
        if (item.route && normalizedPathname === normalizedRoute) {
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
        setMobileMenuOpen(false);
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
      setMobileMenuOpen(false);
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
          animationType="slide"
          transparent={true}
          visible={mobileMenuOpen}
          onRequestClose={() => setMobileMenuOpen(false)}
        >
          <Pressable
            style={styles.mobileMenuOverlay}
            onPress={() => setMobileMenuOpen(false)}
          >
            <Pressable
              style={[styles.mobileMenuContainer, { backgroundColor: colors.background }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.mobileMenuHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="h3">Menú</ThemedText>
                <TouchableOpacity onPress={() => setMobileMenuOpen(false)}>
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

const styles = StyleSheet.create({
  // Desktop Container
  desktopContainer: {
    position: 'relative',
    flex: 1,
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },

  // Mobile Hamburger
  hamburgerButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  hamburgerIcon: {
    fontSize: 24,
  },

  // Mobile Menu Modal
  mobileMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileMenuContainer: {
    width: '80%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  mobileMenuContent: {
    flex: 1,
  },
  mobileMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  submenuContainer: {
    paddingLeft: 16,
  },
  submenuItem: {
    padding: 12,
    paddingLeft: 24,
  },
  submenuText: {
    opacity: 0.8,
  },
  mobileColumn: {
    marginBottom: 16,
  },
  mobileColumnTitle: {
    marginBottom: 8,
    marginTop: 8,
    opacity: 0.9,
  },

  // Horizontal Menu (Desktop/Tablet)
  horizontalMenuScroll: {
    flexGrow: 0,
  },
  horizontalMenuContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4,
    alignItems: 'center',
  },
  horizontalMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeMenuItem: {
    borderBottomColor: '#ff3366', // Línea roja inferior
  },
  menuItemText: {
    fontSize: 14,
  },
  dropdownIndicator: {
    fontSize: 10,
    opacity: 0.6,
    marginLeft: 4,
  },

  // Mega Menu (Desktop)
  megaMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    maxWidth: 1200,
    borderWidth: 1,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10000,
    padding: 24,
  },
  megaMenuContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 48,
  },
  megaMenuColumn: {
    flex: 1,
    minWidth: 200,
  },
  megaMenuColumnTitle: {
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  megaMenuColumnLine: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  megaMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  activeMegaMenuItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#ff3366', // Línea roja vertical izquierda
    paddingLeft: 7, // Reducir padding izquierdo para compensar el borde
  },
  megaMenuItemText: {
    opacity: 0.8,
  },

  // Desktop Submenu Dropdown
  desktopSubmenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    minWidth: 280,
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10000,
    padding: 12,
  },
  desktopSubmenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  activeSubmenuItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#ff3366', // Línea roja vertical izquierda
    paddingLeft: 13, // Reducir padding izquierdo para compensar el borde
  },
  submenuItemTitle: {
    marginBottom: 4,
  },
  submenuItemDescription: {
    opacity: 0.7,
    lineHeight: 16,
  },
});
