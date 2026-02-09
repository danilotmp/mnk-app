/**
 * Página delgada para Expo Router
 * SOLO mapea la ruta /security/roles a el componente contenedor (screen)
 * 
 * En Expo Router, la carpeta app/ es SOLO para rutas (file-based routing)
 * Toda la lógica está en src/features/security/roles/
 */

import { RolesListScreen } from '@/src/features/security/roles/screens/roles-list.screen';

export default function RolesListPage() {
  return <RolesListScreen />;
}
