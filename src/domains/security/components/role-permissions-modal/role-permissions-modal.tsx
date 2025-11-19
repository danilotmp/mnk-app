/**
 * Modal básico para visualizar permisos de un rol
 * Versión simplificada - solo muestra título, subtítulo y botones
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
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
  const styles = createRolePermissionsModalStyles(colors, isMobile);

  const modalTitle = role ? `Permisos: ${role.name}` : 'Permisos del Rol';
  const subtitle = role ? `Total: ${role.permissions?.length || 0} permisos` : undefined;
  const hasPermissions = (role?.permissions?.length || 0) > 0;

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
        Este rol no tiene permisos asignados
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
              title="Editar Permisos"
              onPress={() => {
                onClose();
                onEdit(role);
              }}
              variant="secondary"
              size="md"
            />
          )}
          <Button title="Cerrar" onPress={onClose} variant="primary" size="md" />
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

