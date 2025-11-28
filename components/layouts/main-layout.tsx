import { Header } from '@/components/header';
import { HorizontalMenu, MenuItem } from '@/components/navigation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useCompany, useMultiCompany, UserProfileHeader } from '@/src/domains/shared';
import { useMenu } from '@/src/infrastructure/menu';
import { createMainLayoutStyles } from '@/src/styles/components/main-layout.styles';
import { useRouter } from 'expo-router';
import React, { ReactNode, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

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
  const { company, user } = useCompany();
  const { setUserContext } = useMultiCompany();
  const { menu, refetchForRole } = useMenu();
  const styles = createMainLayoutStyles();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [titleWidth, setTitleWidth] = useState<number>(0);

  // Usar el nombre de la empresa si está autenticado, sino usar "MNK" por defecto
  const companies = user?.companies || [];console.log("DANILO user",user);
  // Usar companyIdDefault de la sesión como fuente de verdad, no company?.id que puede ser mock
  const currentCompanyId = user?.companyIdDefault;
  const displayTitle = companies.find((c) => c.id === currentCompanyId)?.name || company?.name || title; 
  // Filtrar empresas para mostrar solo las diferentes a la actual
  const availableCompanies = companies.filter((c) => c.id !== currentCompanyId);
  const canSwitchCompany = availableCompanies.length > 0;

  // Manejar cambio de empresa
  const handleCompanySelect = async (companyInfo: typeof companies[0]) => {
    if (companyInfo.id === currentCompanyId) {
      setShowCompanyDropdown(false);
      return;
    }

    try {
      // Cerrar dropdown primero para evitar re-renders innecesarios
      setShowCompanyDropdown(false);

      // Actualizar el usuario con la nueva empresa
      // Usar directamente el ID de companyInfo ya que viene del array companies del usuario
      // IMPORTANTE: Preservar availableBranches para que no se pierdan al cambiar de empresa
      const updatedUser = {
        ...user!,
        companyIdDefault: companyInfo.id,
        // Preservar availableBranches para que el servicio los filtre por empresa
        availableBranches: user?.availableBranches || [],
      };

      // PRIMERO: Guardar en la sesión silenciosamente (sin disparar eventos)
      // Esto debe hacerse ANTES de setUserContext para evitar bucles
      const { sessionManager } = await import('@/src/infrastructure/session');
      await sessionManager.setItem('user', 'current', updatedUser, {
        ttl: 30 * 60 * 1000, // 30 minutos
        skipBroadcast: true, // CRÍTICO: No disparar evento para evitar bucles infinitos
      });

      // DESPUÉS: Usar setUserContext para actualizar todo el contexto
      // Esto actualizará currentCompany, currentBranch, permisos, etc.
      // setUserContext NO debe guardar en sesión para evitar duplicados
      await setUserContext(updatedUser);

      // Buscar el rol correspondiente a la empresa seleccionada
      // user.roles viene de userRoles del API y tiene estructura: { role: { companyId, id, ... }, ... }
      // Buscar el rol que tenga role.companyId === companyInfo.id
      // Nota: userRoles del API se mapea a roles, pero mantiene la estructura original
      const roles = (user?.roles as any[]) || [];
      const userRole = roles.find((roleItem: any) => {
        // La estructura de userRoles del API: { role: { companyId, id, ... }, roleId, ... }
        // Buscar por role.companyId que debe coincidir con la empresa seleccionada
        return roleItem.role?.companyId === companyInfo.id;
      });

      // Si se encuentra el rol, obtener el roleId
      // userRoles del API tiene roleId o role.id
      let roleId: string | undefined;
      if (userRole) {
        // userRoles del API tiene roleId o role.id
        roleId = userRole.roleId || userRole.role?.id;
      }

      // Si se encuentra el roleId, actualizar el menú con ese rol
      if (roleId) {
        await refetchForRole(roleId);
      }
    } catch (error) {
      // Error manejado silenciosamente
    }
  };

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

  // Usar el menú del hook useMenu si está disponible, sino usar menuItems prop, sino usar defaultMenuItems
  // Esto permite que el menú se actualice automáticamente cuando cambia (por ejemplo, al cambiar de empresa)
  let finalMenuItems: MenuItem[];
  if (menu.length > 0) {
    finalMenuItems = menu;
  } else if (menuItems.length > 0) {
    finalMenuItems = menuItems;
  } else {
    finalMenuItems = defaultMenuItems;
  }

  const router = useRouter();

  const handleLogout = () => {
    // Redirigir al Home después del logout
    router.push('/');
  };

  const handleSettings = () => {
    // TODO: Navegar a pantalla de configuración
  };

  const handleProfile = () => {
    // TODO: Navegar a pantalla de perfil
  };

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
                <View style={{ position: 'relative' }}>
                  <Header 
                    title={displayTitle} 
                    inline={true} 
                    logoSize="small"
                    titleClickable={canSwitchCompany}
                    onTitlePress={() => canSwitchCompany && setShowCompanyDropdown(!showCompanyDropdown)}
                    onTitleLayout={(width) => setTitleWidth(width)}
                    renderDropdown={
                      showCompanyDropdown && canSwitchCompany && titleWidth > 0 ? (
                        <View style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: 4,
                          backgroundColor: colors.background,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                          width: titleWidth,
                          maxHeight: 300,
                          zIndex: 1000,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 5,
                        }}>
                          {/* Flecha superior del dropdown */}
                          <View style={{
                            position: 'absolute',
                            top: -6,
                            left: 20,
                            width: 0,
                            height: 0,
                            borderLeftWidth: 6,
                            borderRightWidth: 6,
                            borderBottomWidth: 6,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderBottomColor: colors.border,
                          }} />
                          <View style={{
                            position: 'absolute',
                            top: -5,
                            left: 20,
                            width: 0,
                            height: 0,
                            borderLeftWidth: 6,
                            borderRightWidth: 6,
                            borderBottomWidth: 6,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderBottomColor: colors.background,
                          }} />
                          {availableCompanies.map((companyInfo) => {
                            return (
                              <TouchableOpacity
                                key={companyInfo.id}
                                onPress={() => handleCompanySelect(companyInfo)}
                                style={{
                                  padding: 12,
                                  borderBottomWidth: 1,
                                  borderBottomColor: colors.border,
                                }}
                              >
                                <ThemedText
                                  type="defaultSemiBold"
                                >
                                  {companyInfo.name}
                                </ThemedText>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : null
                    }
                  />
                </View>
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
                <View style={{ position: 'relative' }}>
                  <Header 
                    title={displayTitle} 
                    inline={true}
                    titleClickable={canSwitchCompany}
                    onTitlePress={() => canSwitchCompany && setShowCompanyDropdown(!showCompanyDropdown)}
                    onTitleLayout={(width) => setTitleWidth(width)}
                    renderDropdown={
                      showCompanyDropdown && canSwitchCompany && titleWidth > 0 ? (
                        <View style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: 4,
                          backgroundColor: colors.background,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                          width: titleWidth,
                          maxHeight: 300,
                          zIndex: 1000,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 5,
                        }}>
                          {/* Flecha superior del dropdown */}
                          <View style={{
                            position: 'absolute',
                            top: -6,
                            left: 20,
                            width: 0,
                            height: 0,
                            borderLeftWidth: 6,
                            borderRightWidth: 6,
                            borderBottomWidth: 6,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderBottomColor: colors.border,
                          }} />
                          <View style={{
                            position: 'absolute',
                            top: -5,
                            left: 20,
                            width: 0,
                            height: 0,
                            borderLeftWidth: 6,
                            borderRightWidth: 6,
                            borderBottomWidth: 6,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderBottomColor: colors.background,
                          }} />
                          {availableCompanies.map((companyInfo) => {
                            return (
                              <TouchableOpacity
                                key={companyInfo.id}
                                onPress={() => handleCompanySelect(companyInfo)}
                                style={{
                                  padding: 12,
                                  borderBottomWidth: 1,
                                  borderBottomColor: colors.border,
                                }}
                              >
                                <ThemedText
                                  type="defaultSemiBold"
                                >
                                  {companyInfo.name}
                                </ThemedText>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : null
                    }
                  />
                </View>
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

