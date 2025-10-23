import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { MainLayout, MenuItem } from '@/components/layouts';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Definir menú personalizado - INCLUYE Home y Explore
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Inicio',
      route: '/index',
      onPress: () => console.log('Navegar a Home'),
    },
    {
      id: 'explore',
      label: 'Explorar',
      route: '/explore',
      onPress: () => console.log('Navegar a Explore'),
    },
    {
      id: 'accounts',
      label: 'Cuentas e Inversiones',
      submenu: [
        { id: 'savings', label: 'Cuentas de Ahorro', route: '/accounts/savings' },
        { id: 'checking', label: 'Cuentas Corrientes', route: '/accounts/checking' },
        { id: 'investments', label: 'Inversiones', route: '/accounts/investments' },
      ],
    },
    {
      id: 'loans',
      label: 'Préstamos',
      submenu: [
        { id: 'personal', label: 'Préstamo Personal', route: '/loans/personal' },
        { id: 'mortgage', label: 'Préstamo Hipotecario', route: '/loans/mortgage' },
        { id: 'auto', label: 'Préstamo Vehicular', route: '/loans/auto' },
      ],
    },
    {
      id: 'cards',
      label: 'Tarjetas de Crédito',
      submenu: [
        { id: 'visa', label: 'Visa', route: '/cards/visa' },
        { id: 'mastercard', label: 'Mastercard', route: '/cards/mastercard' },
      ],
    },
    {
      id: 'services',
      label: 'Más Servicios',
      submenu: [
        { id: 'transfers', label: 'Transferencias', route: '/services/transfers' },
        { id: 'payments', label: 'Pagos', route: '/services/payments' },
        { id: 'insurance', label: 'Seguros', route: '/services/insurance' },
      ],
    },
    {
      id: 'business',
      label: 'Empresas',
      route: '/business',
    },
  ];

  return (
    <MainLayout title="MNK App" menuItems={menuItems}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: { display: 'none' }, // Ocultar Tab Bar
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
      </Tabs>
    </MainLayout>
  );
}
