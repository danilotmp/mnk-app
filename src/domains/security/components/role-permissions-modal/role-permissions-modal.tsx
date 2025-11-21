/**
 * Modal básico para visualizar permisos de un rol
 * Versión simplificada - solo muestra título, subtítulo y botones
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { PermissionFlow } from '../role-permissions-flow';
import { createRolePermissionsModalStyles } from './role-permissions-modal.styles';
import { RolePermissionsModalProps } from './role-permissions-modal.types';

export function RolePermissionsModal({
  visible,
  role,
  onClose,
  onEdit,
}: RolePermissionsModalProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const styles = createRolePermissionsModalStyles(colors, isMobile);

  const permissionsCount = role?.permissions?.length || 0;
  const modalTitle = role 
    ? `${t.security?.roles?.permissionsPrefix || 'Permisos:'} ${role.name}` 
    : (t.security?.roles?.rolePermissions || 'Permisos del Rol');
  const subtitle = role 
    ? (t.security?.roles?.totalPermissions || 'Total: {count} permisos').replace('{count}', permissionsCount.toString())
    : undefined;
  const hasPermissions = permissionsCount > 0;

  // Renderizar estado vacío cuando no hay permisos
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="lock-closed"
        size={64}
        color={colors.textSecondary}
        style={styles.emptyStateIcon}
      />
      <ThemedText type="body1" style={styles.emptyStateText}>
        {t.security?.roles?.noPermissionsAssigned || 'Este rol no tiene permisos asignados'}
      </ThemedText>
    </View>
  );

  return (
    <SideModal
      visible={visible}
      onClose={onClose}
      title={modalTitle}
      subtitle={subtitle}
      width={isMobile ? '100%' : '60%'}
      footer={
        <View style={styles.footerButtons}>
          {onEdit && role && (
            <Button
              title={t.security?.roles?.editPermissions || 'Editar Permisos'}
              onPress={() => {
                onClose();
                onEdit(role);
              }}
              variant="secondary"
              size="md"
            />
          )}
          <Button title={t.common?.close || 'Cerrar'} onPress={onClose} variant="primary" size="md" />
        </View>
      }
    >
      {hasPermissions ? (
        <View style={styles.treeContainer}>
          <PermissionFlow 
            permissions={role.permissions} 
            roleName={role.name}
            roleCode={role.code}
            roleId={role.id}
            companyId={role.companyId}
          />
        </View>
      ) : (
        <View style={styles.treeContainer}>
          {renderEmptyState()}
        </View>
      )}
    </SideModal>
  );
}

