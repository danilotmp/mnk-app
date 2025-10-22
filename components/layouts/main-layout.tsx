import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';
import { UserProfileHeader } from '@/src/domains/shared';
import { useTheme } from '@/hooks/use-theme';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showUserProfile?: boolean;
}

/**
 * Layout principal de la aplicación
 * Contiene elementos persistentes como el Header, Logo y UserProfile
 * que no deben variar al navegar entre páginas
 */
export function MainLayout({ 
  children, 
  title = 'MNK App',
  showHeader = true,
  showUserProfile = true 
}: MainLayoutProps) {
  const { colors } = useTheme();

  const handleLogout = () => {
    console.log('Logout - Redirigir a login');
    // TODO: Implementar lógica de logout real
    // - Limpiar tokens
    // - Limpiar AsyncStorage
    // - Navegar a pantalla de login
  };

  const handleSettings = () => {
    console.log('Settings - Navegar a configuración');
    // TODO: Navegar a pantalla de configuración
    // router.push('/settings');
  };

  const handleProfile = () => {
    console.log('Profile - Navegar a perfil');
    // TODO: Navegar a pantalla de perfil
    // router.push('/profile');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header persistente */}
      {showHeader && (
        <Header title={title}>
          {showUserProfile && (
            <UserProfileHeader
              onLogout={handleLogout}
              onSettings={handleSettings}
              onProfile={handleProfile}
            />
          )}
        </Header>
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
  content: {
    flex: 1,
  },
});

