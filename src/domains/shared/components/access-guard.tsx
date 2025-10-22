import { ThemedText } from '@/components/themed-text';
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { usePermissions } from '../hooks/use-multi-company.hook';

interface AccessGuardProps {
  children: ReactNode;
  /**
   * Código de permiso requerido
   */
  permission?: string;
  /**
   * Lista de permisos (requiere TODOS)
   */
  permissions?: string[];
  /**
   * Lista de permisos (requiere AL MENOS UNO)
   */
  anyPermission?: string[];
  /**
   * Módulo y acción requeridos
   */
  moduleAccess?: {
    module: string;
    action: string;
  };
  /**
   * Componente a mostrar si no tiene acceso
   */
  fallback?: ReactNode;
  /**
   * Si es true, no muestra nada cuando no tiene acceso
   * Si es false, muestra el fallback
   */
  hideOnDenied?: boolean;
}

/**
 * Componente para controlar el acceso basado en permisos
 * 
 * Ejemplos de uso:
 * 
 * // Permiso único
 * <AccessGuard permission="users.view">
 *   <UsersList />
 * </AccessGuard>
 * 
 * // Todos los permisos requeridos
 * <AccessGuard permissions={["users.view", "users.edit"]}>
 *   <UserForm />
 * </AccessGuard>
 * 
 * // Al menos un permiso
 * <AccessGuard anyPermission={["admin.view", "superadmin.view"]}>
 *   <AdminPanel />
 * </AccessGuard>
 * 
 * // Por módulo y acción
 * <AccessGuard moduleAccess={{ module: "admin", action: "view" }}>
 *   <AdminDashboard />
 * </AccessGuard>
 * 
 * // Con fallback personalizado
 * <AccessGuard permission="premium.feature" fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </AccessGuard>
 */
export function AccessGuard({
  children,
  permission,
  permissions,
  anyPermission,
  moduleAccess,
  fallback,
  hideOnDenied = true,
}: AccessGuardProps) {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasModuleAccess,
  } = usePermissions();

  // Verificar permiso único
  if (permission && !hasPermission(permission)) {
    return hideOnDenied ? null : (fallback || <AccessDenied />);
  }

  // Verificar todos los permisos
  if (permissions && !hasAllPermissions(permissions)) {
    return hideOnDenied ? null : (fallback || <AccessDenied />);
  }

  // Verificar al menos un permiso
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return hideOnDenied ? null : (fallback || <AccessDenied />);
  }

  // Verificar acceso por módulo y acción
  if (moduleAccess && !hasModuleAccess(moduleAccess.module, moduleAccess.action)) {
    return hideOnDenied ? null : (fallback || <AccessDenied />);
  }

  // Si pasa todas las validaciones, mostrar el contenido
  return <>{children}</>;
}

/**
 * Componente por defecto cuando no se tiene acceso
 */
function AccessDenied() {
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <ThemedText type="h4" variant="secondary">
        Acceso Denegado
      </ThemedText>
      <ThemedText type="body2" variant="secondary" style={{ marginTop: 8 }}>
        No tienes permisos para ver este contenido
      </ThemedText>
    </View>
  );
}

