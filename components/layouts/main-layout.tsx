import { Header } from '@/components/header';
import { HorizontalMenu, MenuItem, VerticalMenu } from '@/components/navigation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { AppConfig } from '@/src/config';
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
  const { menu, refetch } = useMenu();
  const styles = createMainLayoutStyles();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [titleWidth, setTitleWidth] = useState<number>(0);
  const [verticalMenuCollapsed, setVerticalMenuCollapsed] = useState(true); // Inicia colapsado por defecto

  // Determinar el tipo de menú según configuración y estado de autenticación
  // El menú horizontal siempre se muestra antes del login
  // Después del login, se aplica la configuración de AppConfig
  // En móviles, siempre se usa el menú horizontal independientemente de la configuración
  const isAuthenticated = !!user;
  const menuType = isAuthenticated 
    ? AppConfig.navigation.menuType 
    : 'horizontal';
  
  // En móviles, siempre usar menú horizontal independientemente de la configuración
  const useVerticalMenu = !isMobile && menuType === 'vertical' && isAuthenticated;
  const useMixMenu = !isMobile && menuType === 'mix' && isAuthenticated;

  const companies = user?.companies || [];
  
  // Obtener currentCompanyId de session storage, no de user.companyIdDefault
  // porque puede haber cambiado después de seleccionar otra empresa
  const [currentCompanyId, setCurrentCompanyId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const loadCurrentCompanyId = async () => {
      const { UserSessionService } = await import('@/src/domains/shared/services/user-session.service');
      const userSessionService = UserSessionService.getInstance();
      const storedCompanyId = await userSessionService.getCurrentCompany();
      setCurrentCompanyId(storedCompanyId || user?.companyIdDefault || null);
    };
    loadCurrentCompanyId();
  }, [user?.companyIdDefault]);
  
  const displayTitle = companies.find((c) => c.id === currentCompanyId)?.name || company?.name || title;
  const availableCompanies = companies.filter((c) => c.id !== currentCompanyId);
  const canSwitchCompany = availableCompanies.length > 0;

  const handleCompanySelect = async (companyInfo: typeof companies[0]) => {
    if (companyInfo.id === currentCompanyId) {
      setShowCompanyDropdown(false);
      return;
    }

    try {
      setShowCompanyDropdown(false);

      const { UserContextService } = await import('@/src/domains/shared/services/user-context.service');
      const userContextService = UserContextService.getInstance();
      
      // Cambiar empresa y obtener nuevo menú
      const newMenu = await userContextService.switchCompany(companyInfo.id);
      
      // Actualizar currentCompanyId en el estado local
      setCurrentCompanyId(companyInfo.id);
      
      // Actualizar el contexto del usuario con la nueva empresa
      const { UserSessionService } = await import('@/src/domains/shared/services/user-session.service');
      const userSessionService = UserSessionService.getInstance();
      const updatedUser = await userSessionService.getUser();
      
      if (updatedUser) {
        const { mapUserResponseToMultiCompanyUser } = await import('@/src/infrastructure/services/user-mapper.service');
        const mappedUser = mapUserResponseToMultiCompanyUser(updatedUser);
        await setUserContext(mappedUser);
      }
      
      // El menú ya fue actualizado por switchCompany, pero refetch asegura que se actualice en el hook
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cambiar de empresa';
      alert.showError(errorMessage);
      console.error('Error al cambiar empresa:', error);
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
  
  // Función helper para filtrar items públicos (recursiva para submenu y columns)
  const filterPublicItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => item.isPublic === true)
      .map(item => {
        const filtered: MenuItem = { ...item };
        if (item.submenu) {
          filtered.submenu = filterPublicItems(item.submenu);
          // Si el submenu queda vacío, eliminarlo
          if (filtered.submenu.length === 0) {
            delete filtered.submenu;
          }
        }
        if (item.columns) {
          filtered.columns = item.columns.map(column => ({
            ...column,
            items: filterPublicItems(column.items),
          })).filter(column => column.items.length > 0);
          // Si columns queda vacío, eliminarlo
          if (filtered.columns.length === 0) {
            delete filtered.columns;
          }
        }
        return filtered;
      });
  };
  
  // Función helper para filtrar items privados (no públicos)
  const filterPrivateItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => item.isPublic !== true)
      .map(item => {
        const filtered: MenuItem = { ...item };
        if (item.submenu) {
          filtered.submenu = filterPrivateItems(item.submenu);
          // Si el submenu queda vacío, eliminarlo
          if (filtered.submenu.length === 0) {
            delete filtered.submenu;
          }
        }
        if (item.columns) {
          filtered.columns = item.columns.map(column => ({
            ...column,
            items: filterPrivateItems(column.items),
          })).filter(column => column.items.length > 0);
          // Si columns queda vacío, eliminarlo
          if (filtered.columns.length === 0) {
            delete filtered.columns;
          }
        }
        return filtered;
      });
  };
  
  // Filtrar items según el modo de menú
  const publicMenuItems = useMixMenu ? filterPublicItems(finalMenuItems) : [];
  const privateMenuItems = useMixMenu ? filterPrivateItems(finalMenuItems) : finalMenuItems;

  // Determinar si realmente se debe mostrar el menú vertical
  // En modo mix, solo se muestra si hay items privados
  // En modo vertical, solo se muestra si hay items
  const shouldShowVerticalMenu = (useVerticalMenu || useMixMenu) && 
                                 showNavigation && 
                                 (useMixMenu ? privateMenuItems.length > 0 : finalMenuItems.length > 0);

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
      {/* Header unificado: Logo + Menú + UserProfile en la misma línea - SIEMPRE ocupa todo el ancho */}
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
                {/* Hamburger Menu a la derecha (solo si no es menú vertical, o si es modo mix) */}
                {showNavigation && (!useVerticalMenu || useMixMenu) && (
                  <View style={styles.mobileMenuSection}>
                    <HorizontalMenu 
                      items={useMixMenu ? publicMenuItems : finalMenuItems} 
                      onItemPress={handleMenuItemPress} 
                    />
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

              {/* Menú de navegación horizontal en el centro (si no es menú vertical, o si es modo mix) */}
              {showNavigation && (!useVerticalMenu || useMixMenu) && (
                <View style={styles.menuSection}>
                  <HorizontalMenu 
                    items={useMixMenu ? publicMenuItems : finalMenuItems} 
                    onItemPress={handleMenuItemPress} 
                  />
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

      {/* Contenedor del body: Menú vertical (si aplica) + Content */}
      <View style={[styles.bodyContainer, shouldShowVerticalMenu && styles.bodyContainerWithVerticalMenu]}>
        {/* Menú vertical (solo cuando está autenticado y configurado, o en modo mix) */}
        {shouldShowVerticalMenu && (
          <VerticalMenu
            items={useMixMenu ? privateMenuItems : finalMenuItems}
            onItemPress={handleMenuItemPress}
            collapsed={verticalMenuCollapsed}
            onToggleCollapse={() => setVerticalMenuCollapsed(!verticalMenuCollapsed)}
          />
        )}

        {/* Contenido dinámico de las páginas */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </ThemedView>
  );
}

// estilos movidos a src/styles/components/main-layout.styles.ts

