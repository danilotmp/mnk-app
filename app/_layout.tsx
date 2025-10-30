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
import { LanguageProvider, useTranslation } from '@/src/infrastructure/i18n';
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
  
  // Determinar si estamos en una ruta de autenticación
  const isAuthRoute = pathname?.startsWith('/auth') || segments[0] === 'auth';
  
  // Definir menú global para todas las páginas - usando traducciones
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: t.menu.inicio,
      route: '/',
    },
    {
      id: 'explore',
      label: t.menu.explorar,
      route: '/main/explore',
    },
    {
      id: 'products',
      label: t.menu.productos,
      columns: [
        {
          title: t.menu.productosTitle,
          items: [
            { id: 'network-security', label: t.menu.networkSecurity, route: '/products/network-security' },
            { id: 'vulnerability', label: t.menu.vulnerability, route: '/products/vulnerability' },
            { id: 'pam', label: t.menu.pam, route: '/products/pam' },
            { id: 'endpoint', label: t.menu.endpoint, route: '/products/endpoint' },
            { id: 'insurance', label: t.menu.insurance, route: '/products/insurance' },
          ],
        },
        {
          title: t.menu.plataformaTitle,
          items: [
            { id: 'threat-hunting', label: t.menu.threatHunting, route: '/platform/threat-hunting' },
            { id: 'uem', label: t.menu.uem, route: '/platform/uem' },
            { id: 'email-security', label: t.menu.emailSecurity, route: '/platform/email-security' },
          ],
        },
        {
          title: t.menu.serviciosAdministradosTitle,
          items: [
            { id: 'xdr', label: t.menu.xdr, route: '/services/xdr' },
            { id: 'mxdr', label: t.menu.mxdr, route: '/services/mxdr' },
          ],
        },
      ],
    },
    {
      id: 'accounts',
      label: t.menu.cuentas,
      submenu: [
        { id: 'savings', label: t.menu.savings, route: '/accounts/savings' },
        { id: 'checking', label: t.menu.checking, route: '/accounts/checking' },
        { id: 'investments', label: t.menu.investments, route: '/accounts/investments' },
      ],
    },
    {
      id: 'loans',
      label: t.menu.prestamos,
      submenu: [
        { 
          id: 'multicredit', 
          label: t.menu.multicredit, 
          description: t.menu.multicreditDesc,
          route: '/loans/multicredit' 
        },
        { 
          id: 'microcredit', 
          label: t.menu.microcredit, 
          description: t.menu.microcreditDesc,
          route: '/loans/microcredit' 
        },
        { 
          id: 'casafacil', 
          label: t.menu.casafacil, 
          description: t.menu.casafacilDesc,
          route: '/loans/casafacil' 
        },
        { 
          id: 'autofacil', 
          label: t.menu.autofacil, 
          description: t.menu.autofacilDesc,
          route: '/loans/autofacil' 
        },
        { 
          id: 'educativo', 
          label: t.menu.educativo, 
          description: t.menu.educativoDesc,
          route: '/loans/educativo' 
        },
      ],
    },
    {
      id: 'cards',
      label: t.menu.tarjetas,
      submenu: [
        { id: 'visa', label: 'Visa', route: '/cards/visa' },
        { id: 'mastercard', label: 'Mastercard', route: '/cards/mastercard' },
      ],
    },
    {
      id: 'services',
      label: t.menu.masServicios,
      submenu: [
        { id: 'transfers', label: t.menu.transfers, route: '/services/transfers' },
        { id: 'payments', label: t.menu.payments, route: '/services/payments' },
      ],
    },
    {
      id: 'contact',
      label: t.menu.contactos,
      route: 'main/contact' as any,
    },
  ];
  const colorScheme = useColorScheme();
  
  // La sesión se rehidrata automáticamente en useSession
  // Mostrar loading si aún se está cargando la sesión
  if (isSessionLoading) {
    // Por ahora solo esperamos, puedes agregar un loader aquí si lo deseas
    return null;
  }

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
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MainLayout title="MNK" menuItems={menuItems}>
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
