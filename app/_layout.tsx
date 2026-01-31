import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

// Solo importar reanimated en plataformas nativas para evitar problemas con worklets en web
if (Platform.OS !== 'web') {
  require('react-native-reanimated');
}

import { MainLayout, MenuItem } from '@/components/layouts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider as CustomThemeProvider } from '@/hooks/use-theme-mode';
import { MultiCompanyProvider } from '@/src/domains/shared';
import { useScrollbarStyles } from '@/src/hooks/use-scrollbar-styles.hook';
import { LanguageProvider, useTranslation } from '@/src/infrastructure/i18n';
import { useMenu } from '@/src/infrastructure/menu';
import { ToastContainer, ToastProvider } from '@/src/infrastructure/messages';
import { useSession } from '@/src/infrastructure/session';

// Suprimir errores de FontFaceObserver timeout en web
// Este error no afecta la funcionalidad, solo es un warning de carga de fuentes
if (typeof window !== 'undefined') {
  // Interceptar errores no capturados de FontFaceObserver
  const originalError = window.console?.error;
  if (originalError) {
    window.console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || '';
      // Ignorar errores específicos de FontFaceObserver timeout
      if (
        errorMessage.includes('fontfaceobserver') ||
        errorMessage.includes('6000ms timeout exceeded') ||
        errorMessage.includes('timeout exceeded')
      ) {
        // Este es un error conocido y no afecta la funcionalidad
        // Las fuentes del sistema se cargan correctamente sin necesidad de FontFaceObserver
        return;
      }
      originalError(...args);
    };
  }
  
  // También capturar errores no capturados globalmente
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorString = message?.toString() || '';
    if (
      errorString.includes('fontfaceobserver') ||
      errorString.includes('6000ms timeout exceeded') ||
      errorString.includes('timeout exceeded')
    ) {
      // Suprimir este error específico
      return true; // Prevenir que se muestre en consola
    }
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };
}

function LayoutContent() {
  const { t, interpolate } = useTranslation();
  const pathname = usePathname();
  const segments = useSegments();
  const { isLoading: isSessionLoading } = useSession();
  const { menu, loading: menuLoading } = useMenu();
  
  // Aplicar estilos de scrollbar adaptados al tema
  useScrollbarStyles();
  
  // Determinar si estamos en una ruta de autenticación
  const isAuthRoute = pathname?.startsWith('/auth') || segments[0] === 'auth';
  
  // Convertir menú del backend al formato del componente
  // El menú viene del backend y ya tiene la estructura correcta
  // Si el menú está vacío (durante la carga), usar un array vacío
  const menuItems: MenuItem[] = menu.length > 0 ? menu.map((item) => {
    // Mapear submenu del backend al formato del componente
    const mappedItem: MenuItem = {
      id: item.id,
      label: item.label,
      route: item.route,
      description: item.description,
      isPublic: item.isPublic, // Incluir propiedad isPublic del backend
    };

    // Si tiene submenu, mapearlo
    if (item.submenu && item.submenu.length > 0) {
      mappedItem.submenu = item.submenu.map((subItem) => ({
        id: subItem.id,
        label: subItem.label,
        route: subItem.route,
        description: subItem.description,
        icon: subItem.icon,
        isPublic: subItem.isPublic, // Incluir propiedad isPublic del backend
      }));
    }

    // Si tiene columns, mapearlas
    if (item.columns && item.columns.length > 0) {
      mappedItem.columns = item.columns.map((column) => ({
        title: column.title,
        items: column.items.map((colItem) => ({
          id: colItem.id,
          label: colItem.label,
          route: colItem.route,
          description: colItem.description,
          icon: colItem.icon,
          isPublic: colItem.isPublic, // Incluir propiedad isPublic del backend
        })),
      }));
    }

    return mappedItem;
  }) : [];

  const colorScheme = useColorScheme();
  
  // La sesión se rehidrata automáticamente en useSession
  // IMPORTANTE: No bloquear la renderización durante la carga del menú
  // Esto previene redirecciones al home cuando se refresca la página
  // Solo esperar si la sesión está cargando (necesario para autenticación)
  // El menú puede cargarse en segundo plano sin bloquear la navegación
  if (isSessionLoading) {
    // Solo esperar si la sesión está cargando (necesario para determinar autenticación)
    return null;
  }
  
  // Si el menú está cargando, usar un menú vacío temporalmente
  // Esto permite que la página actual se renderice mientras el menú carga
  // El menú se actualizará automáticamente cuando termine de cargar
  const menuItemsToUse: MenuItem[] = menuLoading ? [] : menuItems;

  // Si es una ruta de autenticación, no usar MainLayout
  if (isAuthRoute) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }
  // Para otras rutas, usar MainLayout
  // Usar menuItemsToUse que puede estar vacío durante la carga inicial
  // Esto permite que la página actual se renderice mientras el menú carga
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MainLayout title="AIBox" menuItems={menuItemsToUse}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="+not-found" options={{ title: '404' }} />
        </Stack>
      </MainLayout>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <CustomThemeProvider>
        <MultiCompanyProvider>
          <ToastProvider>
            <LayoutContent />
            <ToastContainer />
          </ToastProvider>
        </MultiCompanyProvider>
      </CustomThemeProvider>
    </LanguageProvider>
  );
}
