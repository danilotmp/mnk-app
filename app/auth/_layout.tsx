/**
 * Layout específico para rutas de autenticación
 * No incluye MainLayout para que el login tenga su propia UI
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}

