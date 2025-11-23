/**
 * Página delgada para Expo Router
 * SOLO mapea la ruta /security/companies a el componente contenedor (screen)
 * 
 * En Expo Router, la carpeta app/ es SOLO para rutas (file-based routing)
 * Toda la lógica está en src/features/security/companies/
 */

import { CompaniesListScreen } from '@/src/features/security/companies/screens/companies-list.screen';

export default function CompaniesListPage() {
  return <CompaniesListScreen />;
}
