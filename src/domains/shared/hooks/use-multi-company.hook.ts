import { useMultiCompanyContext } from '../contexts/multi-company.context';

/**
 * Hook principal para acceder a toda la funcionalidad multiempresa
 */
export function useMultiCompany() {
  const context = useMultiCompanyContext();
  return context;
}

/**
 * Hook simplificado para acceder a información de la empresa actual
 */
export function useCompany() {
  const { currentCompany, currentBranch, user } = useMultiCompanyContext();

  return {
    company: currentCompany,
    branch: currentBranch,
    user,
  };
}

/**
 * Hook para acceder a las sucursales disponibles
 */
export function useBranches() {
  const { availableBranches, currentBranch, switchBranch, canSwitchBranch, isLoading } =
    useMultiCompanyContext();

  return {
    branches: availableBranches,
    currentBranch,
    switchBranch,
    canSwitch: canSwitchBranch(),
    isLoading,
  };
}

/**
 * Hook para verificar permisos
 */
export function usePermissions() {
  const { permissions, hasPermission, hasModuleAccess } = useMultiCompanyContext();

  return {
    permissions,
    hasPermission,
    hasModuleAccess,
    /**
     * Verifica si el usuario tiene TODOS los permisos especificados
     */
    hasAllPermissions: (permissionCodes: string[]): boolean => {
      return permissionCodes.every((code) => hasPermission(code));
    },
    /**
     * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
     */
    hasAnyPermission: (permissionCodes: string[]): boolean => {
      return permissionCodes.some((code) => hasPermission(code));
    },
  };
}

