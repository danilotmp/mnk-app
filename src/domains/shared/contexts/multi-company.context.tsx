import React, { createContext, ReactNode, useContext, useState } from 'react';
import { MultiCompanyService } from '../services/multi-company.service';
import {
    BranchSwitchRequest,
    MultiCompanyState,
    MultiCompanyUser
} from '../types';

interface MultiCompanyContextType extends MultiCompanyState {
  setUserContext: (user: MultiCompanyUser) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
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

      setState({
        currentCompany: context.company,
        currentBranch: context.currentBranch,
        availableBranches: context.availableBranches,
        user: context.user,
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
   */
  const switchBranch = async (branchId: string): Promise<void> => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const request: BranchSwitchRequest = {
        branchId,
        userId: state.user!.id,
      };

      const response = await service.switchBranch(request);
      const switchResponse = response.data;

      setState((prev) => ({
        ...prev,
        currentBranch: switchResponse.newBranch,
        permissions: switchResponse.permissions,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar sucursal';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
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

