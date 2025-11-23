/**
 * Página para crear nuevo usuario
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { UserCreateForm } from '@/src/features/security/users';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator } from 'react-native';

export default function CreateUserPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const {
    loading: accessLoading,
    allowed: hasAccess,
  } = useRouteAccessGuard(pathname);

  if (accessLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 12 }}>{t.common?.loading || 'Cargando...'}</ThemedText>
      </ThemedView>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const handleClose = () => {
    router.back();
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <UserCreateForm
        onSuccess={handleClose}
        onCancel={handleClose}
        showHeader
        showFooter
      />
    </ThemedView>
  );
}

