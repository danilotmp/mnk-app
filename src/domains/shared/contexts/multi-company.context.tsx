import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { MultiCompanyService } from '../services/multi-company.service';
import {
    Branch,
    MultiCompanyState,
    MultiCompanyUser
} from '../types';

interface MultiCompanyContextType extends MultiCompanyState {
  setUserContext: (user: MultiCompanyUser) => Promise<void>;
  switchBranch: (newBranch: Branch) => Promise<void>;
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
   * Usa UserSessionService para obtener currentCompanyId y currentBranchId de session storage
   */
  const setUserContext = useCallback(async (user: MultiCompanyUser): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Obtener currentCompanyId y currentBranchId de session storage
      const { UserSessionService } = await import('../services/user-session.service');
      const { UserContextService } = await import('../services/user-context.service');
      const userSessionService = UserSessionService.getInstance();
      const userContextService = UserContextService.getInstance();

      const currentCompanyId = await userSessionService.getCurrentCompany() || user.companyIdDefault;
      const currentBranchId = await userSessionService.getCurrentBranch() || user.currentBranchId || '';

      // Obtener empresa y sucursal actuales usando UserContextService (datos reales del UserResponse)
      const currentCompany = await userContextService.getCurrentCompany();
      const currentBranch = await userContextService.getCurrentBranch();

      // Si no hay currentCompany, buscarlo directamente en las empresas del usuario
      // UserContextService.getCurrentCompany() puede devolver null si no encuentra la empresa
      let finalCurrentCompany = currentCompany;
      
      if (!finalCurrentCompany && user.companies && Array.isArray(user.companies) && user.companies.length > 0) {
        // Buscar la empresa por currentCompanyId
        if (currentCompanyId) {
          const foundCompany = user.companies.find(c => c.id === currentCompanyId);
          if (foundCompany) {
            // Convertir CompanyInfo a Company (mínimo necesario)
            finalCurrentCompany = {
              id: foundCompany.id,
              code: foundCompany.code,
              name: foundCompany.name,
              description: '',
              email: '',
              phone: '',
              address: {
                street: '',
                city: '',
                state: '',
                country: '',
                postalCode: '',
              },
              settings: {
                timezone: 'America/Guayaquil',
                currency: 'USD',
                language: 'es',
              },
              subscriptionPlan: {
                name: 'Basic',
                maxUsers: 10,
                maxBranches: 5,
              },
              isActive: (foundCompany.status || 1) === 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any;
          }
        }
        // Si aún no hay empresa, usar la primera disponible
        if (!finalCurrentCompany) {
          const firstCompanyInfo = user.companies[0];
          finalCurrentCompany = {
            id: firstCompanyInfo.id,
            code: firstCompanyInfo.code,
            name: firstCompanyInfo.name,
            description: '',
            email: '',
            phone: '',
            address: {
              street: '',
              city: '',
              state: '',
              country: '',
              postalCode: '',
            },
            settings: {
              timezone: 'America/Guayaquil',
              currency: 'USD',
              language: 'es',
            },
            subscriptionPlan: {
              name: 'Basic',
              maxUsers: 10,
              maxBranches: 5,
            },
            isActive: (firstCompanyInfo.status || 1) === 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        }
      }

      // Filtrar sucursales por la empresa actual
      const branchesForCompany = (user.branches || [])
        .filter(access => {
          const branch = access.branch;
          if (!branch) return false;
          // Si tenemos finalCurrentCompany, filtrar por companyId
          if (finalCurrentCompany && branch.companyId) {
            return branch.companyId === finalCurrentCompany.id;
          }
          // Si no, usar todas las sucursales disponibles
          return true;
        })
        .map(access => access.branch)
        .filter((branch): branch is Branch => branch != null && typeof branch === 'object' && 'id' in branch);

      // Si no hay currentBranch pero hay currentBranchId, buscarlo en las sucursales disponibles
      let finalCurrentBranch = currentBranch;
      
      if (!finalCurrentBranch && currentBranchId && branchesForCompany.length > 0) {
        finalCurrentBranch = branchesForCompany.find(b => b.id === currentBranchId) || null;
      }
      // Si aún no hay sucursal, usar la primera disponible
      if (!finalCurrentBranch && branchesForCompany.length > 0) {
        finalCurrentBranch = branchesForCompany[0];
      }
      
      // Si no hay sucursales disponibles, crear una sucursal por defecto
      // Esto es necesario porque UserProfileHeader requiere currentBranch
      if (!finalCurrentBranch && user.branches && Array.isArray(user.branches) && user.branches.length > 0) {
        // Buscar cualquier sucursal del usuario (no filtrada por empresa)
        const anyBranch = user.branches
          .map(access => access.branch)
          .filter((branch): branch is Branch => branch != null && typeof branch === 'object' && 'id' in branch)[0];
        if (anyBranch) {
          finalCurrentBranch = anyBranch;
        }
      }
      
      // Si aún no hay sucursal, crear una mínima para evitar que falle el renderizado
      // Esto solo debería pasar si el usuario realmente no tiene sucursales
      if (!finalCurrentBranch && finalCurrentCompany) {
        finalCurrentBranch = {
          id: 'default-branch',
          code: 'DEFAULT',
          name: 'Sucursal Principal',
          type: 'main',
          companyId: finalCurrentCompany.id,
          address: undefined,
          phone: undefined,
          email: undefined,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Branch;
      }

      setState({
        currentCompany: finalCurrentCompany,
        currentBranch: finalCurrentBranch,
        availableBranches: branchesForCompany, // Branch[] filtradas por empresa para el estado
        user: {
          ...user,
          // IMPORTANTE: Preservar TODAS las sucursales del usuario en user.branches
          // No solo las filtradas, para que el componente pueda filtrarlas según necesite
          branches: user.branches || [], // BranchAccess[] completo con todas las sucursales
        },
        permissions: user.permissions || [],
        isLoading: false,
        error: null,
      });
      
      // LOGS SESSION STORAGE: Aquí se agregará el log para verificar que el estado se estableció correctamente
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al establecer contexto';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const switchBranch = useCallback(async (newBranch: Branch): Promise<void> => {
    if (!state.user) {
      return;
    }

    const updatedUser = {
      ...state.user,
      currentBranchId: newBranch.id,
    };

    setState((prev) => ({
      ...prev,
      currentBranch: newBranch,
      user: updatedUser,
    }));

    // No necesitamos guardar el usuario aquí porque switchBranch solo cambia la sucursal
    // El usuario completo ya está guardado en session storage
    // Solo actualizamos currentBranchId en session storage
    const { UserSessionService } = await import('../services/user-session.service');
    const userSessionService = UserSessionService.getInstance();
    await userSessionService.setCurrentBranch(newBranch.id, true);
  }, [state.user]);

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback((permissionCode: string): boolean => {
    return service.hasPermission(permissionCode);
  }, [service]);

  /**
   * Verifica si el usuario tiene acceso a un módulo con una acción específica
   */
  const hasModuleAccess = useCallback((module: string, action: string): boolean => {
    return service.hasModuleAccess(module, action);
  }, [service]);

  /**
   * Verifica si el usuario puede cambiar de sucursal
   */
  const canSwitchBranch = useCallback((): boolean => {
    return service.canSwitchBranch();
  }, [service]);

  /**
   * Limpia el contexto (útil para logout)
   */
  const clearContext = useCallback((): void => {
    setState({
      currentCompany: null,
      currentBranch: null,
      availableBranches: [],
      user: null,
      permissions: [],
      isLoading: false,
      error: null,
    });
  }, []);

  const value = useMemo<MultiCompanyContextType>(() => ({
    ...state,
    setUserContext,
    switchBranch,
    hasPermission,
    hasModuleAccess,
    canSwitchBranch,
    clearContext,
  }), [state, setUserContext, switchBranch, hasPermission, hasModuleAccess, canSwitchBranch, clearContext]);

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

