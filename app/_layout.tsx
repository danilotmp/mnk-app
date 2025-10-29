import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { MainLayout, MenuItem } from '@/components/layouts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider as CustomThemeProvider } from '@/hooks/use-theme-mode';
import { MultiCompanyProvider } from '@/src/domains/shared';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { MultiCompanyService } from '@/src/domains/shared/services';
import { LanguageProvider, useTranslation } from '@/src/infrastructure/i18n';

function LayoutContent() {
  const { t, interpolate } = useTranslation();
  
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
  const { user, setUserContext } = useMultiCompany();

  // Simular login automático del usuario "danilo" para demostración
  useEffect(() => {
    const initUser = async () => {
      if (!user) {
        const service = MultiCompanyService.getInstance();
        const mockUsers = service.getMockUsers();
        // Usar el primer usuario (Danilo - Administrador)
        await setUserContext(mockUsers[0]);
      }
    };
    initUser();
  }, []);

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
          <LayoutContent />
        </MultiCompanyProvider>
      </CustomThemeProvider>
    </LanguageProvider>
  );
}
