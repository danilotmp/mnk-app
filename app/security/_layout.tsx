/**
 * Layout para el módulo de Seguridades
 * Agrupa todas las páginas de administración de usuarios, roles, permisos y accesos
 */

import { Stack } from 'expo-router';

export default function SecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="users" />
      <Stack.Screen name="roles" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="accesses" />
    </Stack>
  );
}

