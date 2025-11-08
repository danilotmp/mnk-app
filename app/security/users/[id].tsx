/**
 * Página para editar usuario existente
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { UserEditForm } from '@/src/domains/security';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator } from 'react-native';

export default function EditUserPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const pathname = usePathname();

  const userId = Array.isArray(id) ? id[0] : id;

  const {
    loading: accessLoading,
    allowed: hasAccess,
  } = useRouteAccessGuard(pathname);

  if (!userId) {
    return null;
  }

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
      <UserEditForm
        userId={userId}
        onSuccess={handleClose}
        onCancel={handleClose}
        showHeader
        showFooter
      />
    </ThemedView>
  );
}

