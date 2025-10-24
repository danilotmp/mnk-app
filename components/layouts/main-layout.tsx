import { Header } from '@/components/header';
import { HorizontalMenu, MenuItem } from '@/components/navigation';
import { ThemedView } from '@/components/themed-view';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { UserProfileHeader } from '@/src/domains/shared';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showUserProfile?: boolean;
  showNavigation?: boolean;
  menuItems?: MenuItem[];
}

/**
 * Layout principal de la aplicación
 * Contiene elementos persistentes como el Header, Logo y UserProfile
 * que no deben variar al navegar entre páginas
 */
export function MainLayout({
  children,
  title = 'MNK',
  showHeader = true,
  showUserProfile = true,
  showNavigation = true,
  menuItems = []
}: MainLayoutProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();

  // Menú por defecto si no se proporciona
  const defaultMenuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Inicio',
      route: '/',
    },
    {
      id: 'services',
      label: 'Servicios',
      submenu: [
        { id: 'service-1', label: 'Servicio 1', route: '/services/1' },
        { id: 'service-2', label: 'Servicio 2', route: '/services/2' },
      ],
    },
    {
      id: 'products',
      label: 'Productos',
      submenu: [
        { id: 'product-1', label: 'Producto 1', route: '/products/1' },
        { id: 'product-2', label: 'Producto 2', route: '/products/2' },
      ],
    },
    {
      id: 'about',
      label: 'Acerca de',
      route: '/about',
    },
  ];

  const finalMenuItems = menuItems.length > 0 ? menuItems : defaultMenuItems;

  const handleLogout = () => {
    // TODO: Implementar lógica de logout real
  };

  const handleSettings = () => {
    // TODO: Navegar a pantalla de configuración
  };

  const handleProfile = () => {
    // TODO: Navegar a pantalla de perfil
  };

  const router = useRouter();

  const handleMenuItemPress = (item: MenuItem) => {
    // Navegación real con Expo Router
    if (item.route) {
      try {
        router.push(item.route as any);
      } catch (error) {
        console.error('Error al navegar:', error);
      }
    }
    
    // Ejecutar callback personalizado si existe
    if (item.onPress) {
      item.onPress();
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header unificado: Logo + Menú + UserProfile en la misma línea */}
      {showHeader && (
        <View style={[styles.unifiedHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {isMobile ? (
            // Layout Mobile: [Hamburger] [Logo] ──────────── [Usuario]
            <>
              {/* Hamburger Menu a la izquierda */}
              {showNavigation && (
                <View style={styles.mobileMenuSection}>
                  <HorizontalMenu items={finalMenuItems} onItemPress={handleMenuItemPress} />
                </View>
              )}
              
              {/* Logo en el centro */}
              <View style={styles.mobileLogoSection}>
                <Header title={title} inline={true} logoSize="small" />
              </View>
              
              {/* UserProfile a la derecha */}
              {showUserProfile && (
                <View style={styles.mobileUserSection}>
                  <UserProfileHeader
                    onLogout={handleLogout}
                    onSettings={handleSettings}
                    onProfile={handleProfile}
                  />
                </View>
              )}
            </>
          ) : (
            // Layout Desktop/Tablet: [Logo] ──── [Menú CENTRADO] ──── [Usuario]
            <>
              {/* Logo */}
              <View style={styles.logoSection}>
                <Header title={title} inline={true} />
              </View>

              {/* Menú de navegación horizontal en el centro */}
              {showNavigation && (
                <View style={styles.menuSection}>
                  <HorizontalMenu items={finalMenuItems} onItemPress={handleMenuItemPress} />
                </View>
              )}

              {/* UserProfile en la derecha */}
              {showUserProfile && (
                <View style={styles.userSection}>
                  <UserProfileHeader
                    onLogout={handleLogout}
                    onSettings={handleSettings}
                    onProfile={handleProfile}
                  />
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Contenido dinámico de las páginas */}
      <View style={styles.content}>
        {children}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  unifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribuir espacio
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    zIndex: 9999, // ← Aumentado para que el mega menú quede por encima
  },
  
  // Estilos Desktop/Tablet
  logoSection: {
    flexShrink: 0,
    minWidth: 150, // Ancho mínimo para el logo
  },
  menuSection: {
    flex: 1,
    alignItems: 'center', // Centrar el menú
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  userSection: {
    flexShrink: 0,
    minWidth: 150, // Ancho mínimo para balance con logo
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  
  // Estilos Mobile
  mobileMenuSection: {
    flexShrink: 0,
    marginRight: 8, // Espacio entre hamburger y logo
  },
  mobileLogoSection: {
    flex: 1,
    alignItems: 'center', // Logo centrado en mobile
  },
  mobileUserSection: {
    flexShrink: 0,
    marginLeft: 8, // Espacio entre logo y usuario
  },
  
  content: {
    flex: 1,
  },
});

