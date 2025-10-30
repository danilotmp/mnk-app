import { Header } from '@/components/header';
import { HorizontalMenu, MenuItem } from '@/components/navigation';
import { ThemedView } from '@/components/themed-view';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { UserProfileHeader } from '@/src/domains/shared';
import { createMainLayoutStyles } from '@/src/styles/components/main-layout.styles';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { View } from 'react-native';

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
  const styles = createMainLayoutStyles();

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
        // Si realmente es crítico, usa un toast:
        // alert.showError('No se pudo navegar a la ruta.');
        // Pero nunca console.error
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
        <View style={[
          styles.unifiedHeader,
          { 
            backgroundColor: colors.background, 
            borderBottomColor: colors.border,
            paddingHorizontal: 16
          }
        ]}>
          {isMobile ? (
            // Layout Mobile: [Logo] ──────────── [Usuario] [Hamburger]
            <>
              {/* Logo alineado a la izquierda */}
              <View style={styles.mobileLogoSection}>
                <Header title={title} inline={true} logoSize="small" />
              </View>
              
              {/* UserProfile y Hamburger a la derecha */}
              <View style={styles.mobileRightSection}>
                {showUserProfile && (
                  <View style={styles.mobileUserSection}>
                    <UserProfileHeader
                      onLogout={handleLogout}
                      onSettings={handleSettings}
                      onProfile={handleProfile}
                    />
                  </View>
                )}
                {/* Hamburger Menu a la derecha */}
                {showNavigation && (
                  <View style={styles.mobileMenuSection}>
                    <HorizontalMenu items={finalMenuItems} onItemPress={handleMenuItemPress} />
                  </View>
                )}
              </View>
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

// estilos movidos a src/styles/components/main-layout.styles.ts

