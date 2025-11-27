import { sessionManager } from '@/src/infrastructure/session';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { MultiCompanyService } from '../services/multi-company.service';
import {
  Branch,
  MultiCompanyState,
  MultiCompanyUser
} from '../types';

interface MultiCompanyContextType extends MultiCompanyState {
  setUserContext: (user: MultiCompanyUser) => Promise<void>;
  switchBranch: (newBranch: Branch) => void;
  hasPermission: (permissionCode: string) => boolean;
  hasModuleAccess: (module: string, action: string) => boolean;
  canSwitchBranch: () => boolean;
  clearContext: () => void;
}

const MultiCompanyContext = createContext<MultiCompanyContextType | undefined>(undefined);

interface MultiCompanyProviderProps {
  children: ReactNode;
}

export function MultiCompanyProvider({ children }: MultiCompanyProviderProps) {
  const [state, setState] = useState<MultiCompanyState>({
    currentCompany: null,
    currentBranch: null,
    availableBranches: [],
    user: null,
    permissions: [],
    isLoading: false,
    error: null,
  });

  const service = MultiCompanyService.getInstance();

  /**
   * Establece el contexto del usuario autenticado
   */
  const setUserContext = async (user: MultiCompanyUser): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await service.setUserContext(user);
      const context = response.data;

      // Convertir BranchAccess[] a Branch[] para el estado
      // Filtrar elementos que no tengan branch válido
      const branches = context.availableBranches
        .map(access => access.branch)
        .filter((branch): branch is Branch => branch != null && typeof branch === 'object' && 'id' in branch);

      // Actualizar el usuario con las sucursales disponibles si no las tenía
      const updatedUser = {
        ...context.user,
        availableBranches: context.availableBranches, // Preservar BranchAccess[] completo en el usuario
      };

      setState({
        currentCompany: context.company,
        currentBranch: context.currentBranch,
        availableBranches: branches, // Branch[] para el estado
        user: updatedUser,
        permissions: context.permissions,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al establecer contexto';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  /**
   * Cambia la sucursal activa del usuario
   * IMPORTANTE: Persiste silenciosamente sin disparar eventos de storage
   * para evitar bucles infinitos y recargas de página
   */
  const switchBranch = (newBranch: Branch): void => {
    if (!state.user) {
      return;
    }

    // Actualizar el usuario con el nuevo currentBranchId
    const updatedUser = {
      ...state.user,
      currentBranchId: newBranch.id,
    };

    // PRIMERO: Actualizar el estado inmediatamente (sin bloquear)
    setState((prev) => ({
      ...prev,
      currentBranch: newBranch,
      user: updatedUser,
    }));

    // DESPUÉS: Persistir silenciosamente en SessionManager sin disparar eventos
    // skipBroadcast evita que se dispare el evento que causa re-renders y bucles
    sessionManager.setItem('user', 'current', updatedUser, {
      ttl: 30 * 60 * 1000, // 30 minutos
      skipBroadcast: true, // No disparar evento para evitar bucles infinitos
    }).catch(() => {
      // Si falla, no afecta la UI, solo no persistirá al recargar
    });
  };

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = (permissionCode: string): boolean => {
    return service.hasPermission(permissionCode);
  };

  /**
   * Verifica si el usuario tiene acceso a un módulo con una acción específica
   */
  const hasModuleAccess = (module: string, action: string): boolean => {
    return service.hasModuleAccess(module, action);
  };

  /**
   * Verifica si el usuario puede cambiar de sucursal
   */
  const canSwitchBranch = (): boolean => {
    return service.canSwitchBranch();
  };

  /**
   * Limpia el contexto (útil para logout)
   */
  const clearContext = (): void => {
    setState({
      currentCompany: null,
      currentBranch: null,
      availableBranches: [],
      user: null,
      permissions: [],
      isLoading: false,
      error: null,
    });
  };

  const value: MultiCompanyContextType = {
    ...state,
    setUserContext,
    switchBranch,
    hasPermission,
    hasModuleAccess,
    canSwitchBranch,
    clearContext,
  };

  return <MultiCompanyContext.Provider value={value}>{children}</MultiCompanyContext.Provider>;
}

/**
 * Hook para acceder al contexto multiempresa
 * Debe ser usado dentro de un MultiCompanyProvider
 */
export function useMultiCompanyContext(): MultiCompanyContextType {
  const context = useContext(MultiCompanyContext);
  if (context === undefined) {
    throw new Error('useMultiCompanyContext debe ser usado dentro de un MultiCompanyProvider');
  }
  return context;
}

export { MultiCompanyContext };

