import { ThemedText } from '@/components/themed-text';
import { isMobileDevice } from '@/constants/breakpoints';
import { useTheme } from '@/hooks/use-theme';
import React, { useState } from 'react';
import {
  Modal,
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
  description?: string; // Descripción para mostrar en el dropdown
  submenu?: MenuItem[];
  columns?: MenuColumn[]; // Nuevo: para mega menú con columnas
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
 * Menú de navegación horizontal responsive con mega menú estilo Heimdal
 * - Desktop/Tablet: Menú horizontal con mega menú de columnas
 * - Mobile: Menú hamburger con drawer
 */
export function HorizontalMenu({ items, onItemPress }: HorizontalMenuProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = isMobileDevice(width);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const handleItemPress = (item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      // Toggle submenu
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else if (item.columns && item.columns.length > 0) {
      // Toggle mega menu
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else {
      // Navigate or execute action
      if (item.onPress) {
        item.onPress();
      }
      if (onItemPress) {
        onItemPress(item);
      }
      // Close mobile menu
      if (isMobile) {
        setMobileMenuOpen(false);
      }
      setActiveSubmenu(null);
    }
  };

  // Mobile: Hamburger Menu
  if (isMobile) {
    return (
      <>
        {/* Hamburger Button */}
        <TouchableOpacity
          style={[styles.hamburgerButton, { backgroundColor: colors.surface }]}
          onPress={() => setMobileMenuOpen(true)}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.hamburgerIcon}>☰</ThemedText>
        </TouchableOpacity>

        {/* Mobile Menu Modal */}
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
              {/* Header */}
              <View style={[styles.mobileMenuHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="h3">Menú</ThemedText>
                <TouchableOpacity onPress={() => setMobileMenuOpen(false)}>
                  <ThemedText type="h3">✕</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Menu Items */}
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
                        <ThemedText>
                          {activeSubmenu === item.id ? '▲' : '▼'}
                        </ThemedText>
                      )}
                    </TouchableOpacity>

                    {/* Submenu o Mega Menu */}
                    {(item.submenu || item.columns) &&
                      activeSubmenu === item.id && (
                        <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                          {item.submenu?.map((subitem) => (
                            <TouchableOpacity
                              key={subitem.id}
                              style={styles.submenuItem}
                              onPress={() => handleItemPress(subitem)}
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
                                  style={styles.submenuItem}
                                  onPress={() => handleItemPress(subitem)}
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

  // Desktop/Tablet: Horizontal Menu con Mega Menu
  return (
    <>
      {/* Overlay invisible para cerrar menú al hacer click fuera */}
      {activeSubmenu && (
        <Pressable
          style={styles.overlay}
          onPress={() => setActiveSubmenu(null)}
        />
      )}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalMenuContent}
        style={styles.horizontalMenuScroll}
      >
        {items.map((item) => (
          <View key={item.id} style={styles.menuItemWrapper}>
            <TouchableOpacity
              style={[
                styles.horizontalMenuItem,
                activeSubmenu === item.id && { borderBottomColor: '#ff3366' }, // Rojo cuando está activo
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

            {/* Mega Menu con Columnas (Desktop) */}
            {item.columns &&
              item.columns.length > 0 &&
              activeSubmenu === item.id && (
                <View
                  style={[
                    styles.megaMenu,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      shadowColor: colors.text,
                    },
                  ]}
                >
                  <View style={styles.megaMenuContent}>
                    {item.columns.map((column, colIdx) => (
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
                            ]}
                            onPress={() => handleItemPress(subitem)}
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

            {/* Dropdown Submenu tradicional (Desktop) */}
            {item.submenu &&
              item.submenu.length > 0 &&
              activeSubmenu === item.id && (
                <View
                  style={[
                    styles.desktopSubmenu,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      shadowColor: colors.text,
                    },
                  ]}
                >
                  {item.submenu.map((subitem) => (
                    <TouchableOpacity
                      key={subitem.id}
                      style={[
                        styles.desktopSubmenuItem,
                        { borderBottomColor: colors.border },
                      ]}
                      onPress={() => handleItemPress(subitem)}
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
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  // Overlay para cerrar menú
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
  menuItemWrapper: {
    position: 'relative',
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
  menuItemText: {
    fontSize: 14,
  },
  dropdownIndicator: {
    fontSize: 10,
    opacity: 0.6,
    marginLeft: 4,
  },

  // Mega Menu (Desktop) - Estilo Heimdal
  megaMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '90vw', // Ancho casi completo de la pantalla
    maxWidth: 1200,
    borderWidth: 1,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
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
  megaMenuItemText: {
    opacity: 0.8,
  },

  // Desktop Submenu Dropdown tradicional
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
    zIndex: 1000,
    padding: 12,
  },
  desktopSubmenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  submenuItemTitle: {
    marginBottom: 4,
  },
  submenuItemDescription: {
    opacity: 0.7,
    lineHeight: 16,
  },
});