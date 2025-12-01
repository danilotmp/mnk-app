/**
 * Layout para el módulo de Seguridades
 * Agrupa todas las páginas de administración de usuarios, roles, permisos y accesos
 * 
 * Nota: No es necesario registrar rutas anidadas explícitamente en Expo Router.
 * Las rutas como "users", "roles", "permissions" son directorios con sus propias
 * rutas anidadas (index.tsx, [id].tsx, create.tsx) que Expo Router maneja automáticamente.
 */

import { Stack } from 'expo-router';

export default function SecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Las rutas anidadas se manejan automáticamente por Expo Router */}
      {/* No es necesario registrar "users", "roles", "permissions", etc. como pantallas */}
    </Stack>
  );
}

