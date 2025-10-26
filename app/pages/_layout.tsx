import { MainLayout, MenuItem } from '@/components/layouts';
import { Slot } from 'expo-router';

export default function PagesLayout() {
  // Definir menú global para todas las páginas
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Inicio',
      route: '/',
    },
    {
      id: 'explore',
      label: 'Explorar',
      route: '/main/explore',
    },
    {
      id: 'products',
      label: 'Productos',
      columns: [
        {
          title: 'PRODUCTOS',
          items: [
            { id: 'network-security', label: 'Seguridad de la red', route: '/products/network-security' },
            { id: 'vulnerability', label: 'Gestión de vulnerabilidades', route: '/products/vulnerability' },
            { id: 'pam', label: 'Gestión de acceso privilegiado', route: '/products/pam' },
            { id: 'endpoint', label: 'Seguridad de puntos finales', route: '/products/endpoint' },
            { id: 'insurance', label: 'Seguros', route: '/products/insurance' },
          ],
        },
        {
          title: 'PLATAFORMA',
          items: [
            { id: 'threat-hunting', label: 'Caza de amenazas', route: '/platform/threat-hunting' },
            { id: 'uem', label: 'Gestión unificada de puntos finales', route: '/platform/uem' },
            { id: 'email-security', label: 'Seguridad del correo electrónico', route: '/platform/email-security' },
          ],
        },
        {
          title: 'SERVICIOS ADMINISTRADOS',
          items: [
            { id: 'xdr', label: 'Detección y respuesta extendidas (XDR)', route: '/services/xdr' },
            { id: 'mxdr', label: 'Detección y respuesta administradas (MDR)', route: '/services/mxdr' },
          ],
        },
      ],
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
        { 
          id: 'multicredit', 
          label: 'Multicrédito', 
          description: 'Define el monto y las cuotas en línea.',
          route: '/loans/multicredit' 
        },
        { 
          id: 'microcredit', 
          label: 'Microcrédito', 
          description: 'Potencia tu pequeño negocio.',
          route: '/loans/microcredit' 
        },
        { 
          id: 'casafacil', 
          label: 'Casafácil', 
          description: 'Compra una casa nueva o usada.',
          route: '/loans/casafacil' 
        },
        { 
          id: 'autofacil', 
          label: 'Autofácil', 
          description: 'Califica por un crédito del 80% del monto total.',
          route: '/loans/autofacil' 
        },
        { 
          id: 'educativo', 
          label: 'Educativo', 
          description: 'Solicítalo y paga cuando te gradúes.',
          route: '/loans/educativo' 
        },
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
      ],
    },
    {
      id: 'business',
      label: 'Empresas',
      route: '/business',
    },
  ];

  return (
    <MainLayout title="MNK" menuItems={menuItems}>
      <Slot />
    </MainLayout>
  );
}

