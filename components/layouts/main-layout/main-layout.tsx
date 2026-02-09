/**
 * Layout principal de la aplicación
 * Contiene elementos persistentes como el Header, Logo y UserProfile
 * que no deben variar al navegar entre páginas
 */

import { Header } from "@/components/header";
import {
    HorizontalMenu,
    MenuItem,
    VerticalMenu,
} from "@/components/navigation";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { AppConfig } from "@/src/config";
import {
    useCompany,
    useMultiCompany,
    UserProfileHeader,
} from "@/src/domains/shared";
import { useMenu } from "@/src/infrastructure/menu";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { createMainLayoutStyles } from "./main-layout.styles";
import { MainLayoutProps } from "./main-layout.types";

export function MainLayout({
  children,
  title = "AIBox",
  showHeader = true,
  showUserProfile = true,
  showNavigation = true,
  menuItems = [],
}: MainLayoutProps) {
  const { colors, shadows } = useTheme();
  const { isMobile } = useResponsive();
  const { company, user } = useCompany();
  const { setUserContext } = useMultiCompany();
  const { menu, refetch } = useMenu();
  const alert = useAlert();
  const styles = createMainLayoutStyles(colors);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [titleWidth, setTitleWidth] = useState<number>(0);
  const [verticalMenuCollapsed, setVerticalMenuCollapsed] = useState(true); // Inicia colapsado por defecto
  const companySelectorRef = useRef<View>(null);
  const companyDropdownRef = useRef<View>(null);

  // Determinar el tipo de menú según configuración y estado de autenticación
  // El menú horizontal siempre se muestra antes del login
  // Después del login, se aplica la configuración de AppConfig
  // En móviles, siempre se usa el menú horizontal independientemente de la configuración
  const isAuthenticated = !!user;
  const menuType = isAuthenticated
    ? AppConfig.navigation.menuType
    : "horizontal";

  // En móviles, siempre usar menú horizontal independientemente de la configuración
  const useVerticalMenu =
    !isMobile && menuType === "vertical" && isAuthenticated;
  const useMixMenu = !isMobile && menuType === "mix" && isAuthenticated;

  const companies = user?.companies || [];

  // Obtener currentCompanyId de session storage, no de user.companyIdDefault
  // porque puede haber cambiado después de seleccionar otra empresa
  const [currentCompanyId, setCurrentCompanyId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    const loadCurrentCompanyId = async () => {
      const { UserSessionService } =
        await import("@/src/domains/shared/services/user-session.service");
      const userSessionService = UserSessionService.getInstance();
      const storedCompanyId = await userSessionService.getCurrentCompany();
      // Si el usuario tiene una sola empresa, usar esa siempre (evita mostrar selector)
      const singleCompanyId = companies.length === 1 ? companies[0].id : null;
      setCurrentCompanyId(
        storedCompanyId || user?.companyIdDefault || singleCompanyId || null,
      );
    };
    loadCurrentCompanyId();
  }, [user?.companyIdDefault, companies]);

  const displayTitle =
    companies.find((c) => c.id === currentCompanyId)?.name ||
    company?.name ||
    title;
  const displaySubtitle = isAuthenticated
    ? companies.find((c) => c.id === currentCompanyId)?.name ||
      company?.name ||
      ""
    : "Artificial Intelligence Box";
  const availableCompanies = companies.filter((c) => c.id !== currentCompanyId);
  // No mostrar selector de empresa si el usuario tiene acceso a una sola empresa
  const showCompanySelector = companies.length > 1;

  const handleCompanySelect = async (companyInfo: (typeof companies)[0]) => {
    if (companyInfo.id === currentCompanyId) {
      setShowCompanyDropdown(false);
      return;
    }

    try {
      setShowCompanyDropdown(false);

      const { UserContextService } =
        await import("@/src/domains/shared/services/user-context.service");
      const userContextService = UserContextService.getInstance();

      // Cambiar empresa y obtener nuevo menú
      const newMenu = await userContextService.switchCompany(companyInfo.id);

      // Actualizar currentCompanyId en el estado local
      setCurrentCompanyId(companyInfo.id);

      // Actualizar el contexto del usuario con la nueva empresa
      const { UserSessionService } =
        await import("@/src/domains/shared/services/user-session.service");
      const userSessionService = UserSessionService.getInstance();
      const updatedUser = await userSessionService.getUser();

      if (updatedUser) {
        const { mapUserResponseToMultiCompanyUser } =
          await import("@/src/infrastructure/services/user-mapper.service");
        const mappedUser = mapUserResponseToMultiCompanyUser(updatedUser);
        await setUserContext(mappedUser);
      }

      // El menú ya fue actualizado por switchCompany, pero refetch asegura que se actualice en el hook
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.message || "Error al cambiar de empresa";
      alert.showError(errorMessage);
      console.error("Error al cambiar empresa:", error);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!showCompanyDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      // En web, verificar si el clic fue fuera del dropdown y del botón
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const target = event.target as HTMLElement;
        if (target) {
          // Verificar si el clic fue en el dropdown o en el contenedor del selector
          // Usar data attributes como fallback si los refs no están disponibles
          const isClickInDropdown = target.closest?.("[data-company-dropdown]");
          const isClickInSelector = target.closest?.("[data-company-selector]");

          // También verificar usando refs si están disponibles
          const dropdownElement = companyDropdownRef.current;
          const selectorElement = companySelectorRef.current;

          let isInDropdown = false;
          let isInSelector = false;

          if (dropdownElement) {
            // En React Native Web, el ref puede tener una propiedad _nativeNode
            const nativeNode =
              (dropdownElement as any)._nativeNode || (dropdownElement as any);
            isInDropdown =
              nativeNode === target || nativeNode?.contains?.(target);
          }

          if (selectorElement) {
            const nativeNode =
              (selectorElement as any)._nativeNode || (selectorElement as any);
            isInSelector =
              nativeNode === target || nativeNode?.contains?.(target);
          }

          // Si no está en ninguno de los dos, cerrar el dropdown
          if (
            !isClickInDropdown &&
            !isClickInSelector &&
            !isInDropdown &&
            !isInSelector
          ) {
            setShowCompanyDropdown(false);
          }
        }
      }
    };

    // En web, usar addEventListener
    if (Platform.OS === "web" && typeof document !== "undefined") {
      // Usar setTimeout para evitar que el clic que abre el dropdown también lo cierre
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [showCompanyDropdown]);

  // Menú por defecto si no se proporciona (cuando el usuario no está autenticado)
  const defaultMenuItems: MenuItem[] = [
    {
      id: "home",
      label: "Inicio",
      route: "/",
      icon: "home",
    },
    {
      id: "services",
      label: "Servicios",
      submenu: [
        { id: "service-1", label: "Servicio 1", route: "/services/1" },
        { id: "service-2", label: "Servicio 2", route: "/services/2" },
      ],
    },
    {
      id: "products",
      label: "Productos",
      submenu: [
        { id: "product-1", label: "Producto 1", route: "/products/1" },
        { id: "product-2", label: "Producto 2", route: "/products/2" },
      ],
      icon: "AntDesign:product",
    },
    {
      id: "contact",
      label: "Contactos",
      route: "/main/contact",
      icon: "MaterialCommunityIcons:contacts",
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
      .filter((item) => item.isPublic === true)
      .map((item) => {
        const filtered: MenuItem = { ...item };
        if (item.submenu) {
          filtered.submenu = filterPublicItems(item.submenu);
          // Si el submenu queda vacío, eliminarlo
          if (filtered.submenu.length === 0) {
            delete filtered.submenu;
          }
        }
        if (item.columns) {
          filtered.columns = item.columns
            .map((column) => ({
              ...column,
              items: filterPublicItems(column.items),
            }))
            .filter((column) => column.items.length > 0);
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
      .filter((item) => item.isPublic !== true)
      .map((item) => {
        const filtered: MenuItem = { ...item };
        if (item.submenu) {
          filtered.submenu = filterPrivateItems(item.submenu);
          // Si el submenu queda vacío, eliminarlo
          if (filtered.submenu.length === 0) {
            delete filtered.submenu;
          }
        }
        if (item.columns) {
          filtered.columns = item.columns
            .map((column) => ({
              ...column,
              items: filterPrivateItems(column.items),
            }))
            .filter((column) => column.items.length > 0);
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
  const privateMenuItems = useMixMenu
    ? filterPrivateItems(finalMenuItems)
    : finalMenuItems;

  // Determinar si realmente se debe mostrar el menú vertical
  // En modo mix, solo se muestra si hay items privados
  // En modo vertical, solo se muestra si hay items
  const shouldShowVerticalMenu =
    (useVerticalMenu || useMixMenu) &&
    showNavigation &&
    (useMixMenu ? privateMenuItems.length > 0 : finalMenuItems.length > 0);

  const router = useRouter();

  const handleLogout = () => {
    // Redirigir al Home después del logout
    router.push("/");
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

  // Renderizar dropdown de empresas (reutilizable); solo si hay más de una empresa
  const renderCompanyDropdown = (isDesktop: boolean = false) => {
    if (!showCompanyDropdown || !showCompanySelector || titleWidth === 0) {
      return null;
    }

    const dropdownStyles = isDesktop
      ? [
          styles.companyDropdown,
          styles.companyDropdownDesktop,
          {
            backgroundColor: colors.dropdownBackground,
            borderColor: colors.border,
            ...shadows.lg,
          },
        ]
      : [
          styles.companyDropdown,
          {
            backgroundColor: colors.dropdownBackground,
            borderColor: colors.border,
            width: titleWidth,
            ...shadows.lg,
          },
        ];

    // Para desktop, calcular posición y tamaño dinámicamente
    if (isDesktop) {
      const isVerticalMenuExpanded =
        shouldShowVerticalMenu && !verticalMenuCollapsed;
      const isWebDesktop =
        Platform.OS === "web" && !isMobile && !useVerticalMenu;

      // En web desktop con tres bloques, usar ancho fijo igual al bloque izquierdo
      const dropdownWidth = isWebDesktop
        ? 280 // Mismo ancho que webLeftSection
        : isVerticalMenuExpanded
          ? shouldShowVerticalMenu && !verticalMenuCollapsed
            ? AppConfig.navigation.verticalMenuExpandedWidth - 6
            : AppConfig.navigation.verticalMenuExpandedWidth
          : AppConfig.navigation.verticalMenuExpandedWidth -
            (AppConfig.navigation.verticalMenuCollapsedWidth - 16);

      const itemPaddingLeft = isVerticalMenuExpanded
        ? shouldShowVerticalMenu && !verticalMenuCollapsed
          ? AppConfig.navigation.verticalMenuCollapsedWidth - 6
          : AppConfig.navigation.verticalMenuCollapsedWidth
        : 12; // Padding izquierdo de 10 para las opciones cuando el menú está colapsado

      // Calcular el margin izquierdo del dropdown cuando el menú está colapsado
      // Cuando el menú vertical está colapsado, usar el ancho del menú colapsado como margin izquierdo
      // Solo aplicar cuando hay menú vertical (vertical o mix) Y está colapsado
      const dropdownMarginLeft =
        shouldShowVerticalMenu && !isVerticalMenuExpanded
          ? AppConfig.navigation.verticalMenuCollapsedWidth
          : undefined;

      return (
        <View
          ref={companyDropdownRef}
          data-company-dropdown={true}
          style={[
            ...dropdownStyles,
            {
              top: "100%",
              left: isWebDesktop
                ? 0 // Alineado al inicio del bloque izquierdo
                : isVerticalMenuExpanded
                  ? shouldShowVerticalMenu && !verticalMenuCollapsed
                    ? 3
                    : 0
                  : 0, // Cuando colapsado, left: 0, el margin izquierdo desplaza el dropdown
              ...(dropdownMarginLeft !== undefined && {
                marginLeft: dropdownMarginLeft,
              }), // Margin izquierdo cuando el menú está colapsado (48px)
              marginTop: isVerticalMenuExpanded && !isWebDesktop ? 3 : 0,
              width: dropdownWidth,
            },
          ]}
        >
          {/* Flecha superior del dropdown */}
          <View
            style={[
              styles.companyDropdownArrow,
              styles.companyDropdownArrowDesktop,
              { borderBottomColor: colors.border },
            ]}
          />
          <View
            style={[
              styles.companyDropdownArrow,
              styles.companyDropdownArrowInnerDesktop,
              { borderBottomColor: colors.dropdownBackground },
            ]}
          />
          {availableCompanies.map((companyInfo) => {
            return (
              <TouchableOpacity
                key={companyInfo.id}
                onPress={() => handleCompanySelect(companyInfo)}
                style={[
                  styles.companyDropdownItemDesktop,
                  {
                    borderBottomColor: colors.border,
                    paddingLeft: itemPaddingLeft,
                  },
                ]}
              >
                <ThemedText type="defaultSemiBold">
                  {companyInfo.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // Para mobile/tablet
    return (
      <View
        ref={companyDropdownRef}
        data-company-dropdown={true}
        style={dropdownStyles}
      >
        {/* Flecha superior del dropdown */}
        <View
          style={[
            styles.companyDropdownArrow,
            styles.companyDropdownArrowOuter,
            { borderBottomColor: colors.border },
          ]}
        />
        <View
          style={[
            styles.companyDropdownArrow,
            styles.companyDropdownArrowInner,
            {
              borderBottomColor: colors.dropdownBackground,
            },
          ]}
        />
        {availableCompanies.map((companyInfo) => {
          return (
            <TouchableOpacity
              key={companyInfo.id}
              onPress={() => handleCompanySelect(companyInfo)}
              style={[
                styles.companyDropdownItem,
                { borderBottomColor: colors.border, paddingLeft: 10 },
              ]}
            >
              <ThemedText type="body2" style={{ fontWeight: "600" }}>
                {companyInfo.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header unificado: Logo + Menú + UserProfile en la misma línea - SIEMPRE ocupa todo el ancho */}
      {showHeader && (
        <View
          style={[
            styles.unifiedHeader,
            {
              backgroundColor: colors.surfaceVariant,
              borderBottomColor: colors.border,
              paddingLeft: isMobile ? 16 : 0, // Padding izquierdo solo en móvil
              paddingRight: isMobile ? 4 : undefined, // Menos padding derecho en móvil para acercar el botón hamburguesa al borde
              ...shadows.md,
            },
          ]}
        >
          {isMobile ? (
            // Layout Mobile: [Logo] ──────────── [Usuario] [Hamburger]
            <>
              {/* Logo alineado a la izquierda */}
              <View style={styles.mobileLogoSection}>
                <View style={styles.companyDropdownContainer}>
                  <Header
                    title="AIBox"
                    subtitle={displaySubtitle}
                    inline={true}
                    logoSize="small"
                    titleClickable={showCompanySelector}
                    onTitlePress={() =>
                      showCompanySelector &&
                      setShowCompanyDropdown(!showCompanyDropdown)
                    }
                    onTitleLayout={(width) => setTitleWidth(width)}
                    renderDropdown={renderCompanyDropdown(false)}
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
            // Layout Desktop/Tablet: Tres bloques en web, layout normal en otras plataformas
            <>
              {Platform.OS === "web" && !isMobile && !useVerticalMenu ? (
                // Layout Web Desktop: [Logo + Selector] ──── [Menú Centrado] ──── [Acciones]
                <>
                  {/* Primer bloque: Logo, nombre y selector de empresas */}
                  <View style={styles.webLeftSection}>
                    <View
                      ref={companySelectorRef}
                      style={styles.companyDropdownContainer}
                      data-company-selector={true}
                    >
                      <Header
                        title="AIBox"
                        subtitle={displaySubtitle}
                        inline={true}
                        logoSize="small"
                        titleClickable={showCompanySelector}
                        onTitlePress={() =>
                          showCompanySelector &&
                          setShowCompanyDropdown(!showCompanyDropdown)
                        }
                        onTitleLayout={(width) => setTitleWidth(width)}
                        renderDropdown={undefined}
                      />
                    </View>
                  </View>

                  {/* Segundo bloque: Menú de navegación centrado */}
                  {showNavigation && (
                    <View style={styles.webMenuSection}>
                      <HorizontalMenu
                        items={useMixMenu ? publicMenuItems : finalMenuItems}
                        onItemPress={handleMenuItemPress}
                      />
                    </View>
                  )}

                  {/* Tercer bloque: Botones de acción (tema, idioma, avatar) */}
                  {showUserProfile && (
                    <View style={styles.webRightSection}>
                      <UserProfileHeader
                        onLogout={handleLogout}
                        onSettings={handleSettings}
                        onProfile={handleProfile}
                      />
                    </View>
                  )}

                  {/* Dropdown de empresas - Posicionado debajo del primer bloque (solo Web Desktop) */}
                  {showNavigation &&
                    (!useVerticalMenu || useMixMenu) &&
                    renderCompanyDropdown(true)}
                </>
              ) : (
                // Layout normal para otras plataformas o menú vertical
                <>
                  {/* Logo separado solo si es menú vertical */}
                  {useVerticalMenu && (
                    <View style={styles.logoSection}>
                      <View
                        ref={companySelectorRef}
                        style={styles.companyDropdownContainer}
                        data-company-selector={true}
                      >
                        <Header
                          title={displayTitle}
                          inline={true}
                          titleClickable={showCompanySelector}
                          onTitlePress={() =>
                            showCompanySelector &&
                            setShowCompanyDropdown(!showCompanyDropdown)
                          }
                          onTitleLayout={(width) => setTitleWidth(width)}
                          renderDropdown={renderCompanyDropdown(false)}
                        />
                      </View>
                    </View>
                  )}

                  {/* Menú de navegación horizontal */}
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
            </>
          )}
        </View>
      )}

      {/* Contenedor del body: Menú vertical (si aplica) + Content */}
      <View
        style={[
          styles.bodyContainer,
          shouldShowVerticalMenu && styles.bodyContainerWithVerticalMenu,
        ]}
      >
        {/* Menú vertical (solo cuando está autenticado y configurado, o en modo mix) */}
        {shouldShowVerticalMenu && (
          <VerticalMenu
            items={useMixMenu ? privateMenuItems : finalMenuItems}
            onItemPress={handleMenuItemPress}
            collapsed={verticalMenuCollapsed}
            onToggleCollapse={() =>
              setVerticalMenuCollapsed(!verticalMenuCollapsed)
            }
          />
        )}

        {/* Contenido dinámico de las páginas */}
        <View style={styles.content}>{children}</View>
      </View>
    </ThemedView>
  );
}
