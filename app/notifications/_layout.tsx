import { Stack } from 'expo-router';

/**
 * Layout para el módulo de Notificaciones (Fase 1 Email).
 * Rutas: /notifications/templates, /notifications/sends, /notifications/params
 */
export default function NotificationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
