/**
 * Página delgada para Expo Router
 * SOLO mapea la ruta /security/users a el componente contenedor (screen)
 * 
 * En Expo Router, la carpeta app/ es SOLO para rutas (file-based routing)
 * Toda la lógica está en src/features/security/users/
 */

import { UsersListScreen } from '@/src/features/security/users/screens/users-list.screen';

export default function UsersListPage() {
  return <UsersListScreen />;
}
