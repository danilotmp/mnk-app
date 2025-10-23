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
    useWindowDimensions,
} from 'react-native';

export interface MenuItem {
  id: string;
  label: string;
  route?: string;
  onPress?: () => void;
  icon?: string;
  submenu?: MenuItem[];
}

interface HorizontalMenuProps {
  items: MenuItem[];
  onItemPress?: (item: MenuItem) => void;
}

/**
 * Menú de navegación horizontal responsive
 * - Desktop/Tablet: Menú horizontal completo
 * - Mobile: Menú hamburger con drawer
 */
export function HorizontalMenu({ items, onItemPress }: HorizontalMenuProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = isMobileDevice(width);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const handleItemPress = (item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      // Toggle submenu
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
                      {item.submenu && item.submenu.length > 0 && (
                        <ThemedText>
                          {activeSubmenu === item.id ? '▲' : '▼'}
                        </ThemedText>
                      )}
                    </TouchableOpacity>

                    {/* Submenu */}
                    {item.submenu &&
                      item.submenu.length > 0 &&
                      activeSubmenu === item.id && (
                        <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                          {item.submenu.map((subitem) => (
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

  // Desktop/Tablet: Horizontal Menu (inline, sin contenedor)
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalMenuContent}
      style={styles.horizontalMenuScroll}
    >
      {items.map((item) => (
        <View key={item.id} style={styles.menuItemWrapper}>
          <TouchableOpacity
            style={styles.horizontalMenuItem}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <ThemedText type="defaultSemiBold" style={styles.menuItemText}>
              {item.label}
            </ThemedText>
            {item.submenu && item.submenu.length > 0 && (
              <ThemedText style={styles.dropdownIndicator}>▼</ThemedText>
            )}
          </TouchableOpacity>

          {/* Dropdown Submenu (Desktop) */}
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
                    <ThemedText type="body2">{subitem.label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  },
  menuItemText: {
    fontSize: 14,
  },
  dropdownIndicator: {
    fontSize: 10,
    opacity: 0.6,
  },

  // Desktop Submenu Dropdown
  desktopSubmenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    minWidth: 200,
    borderWidth: 1,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  desktopSubmenuItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
});

