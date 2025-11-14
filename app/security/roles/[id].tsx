/**
 * Página para editar rol existente
 * Utiliza el componente RoleEditForm refactorizado
 */

import { ThemedView } from '@/components/themed-view';
import { RoleEditForm } from '@/src/domains/security';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export default function EditRolePage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pathname = usePathname();

  const {
    loading: accessLoading,
    allowed: hasAccess,
  } = useRouteAccessGuard(pathname);

  const handleSuccess = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  if (accessLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={{ marginTop: 12 }}>
          {t.common?.loading || 'Cargando información...'}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!hasAccess) {
    return null;
  }

  if (!id) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText type="body2" variant="error">
          ID de rol no válido
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <RoleEditForm
        roleId={id}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={true}
        showFooter={true}
      />
    </ThemedView>
  );
}

