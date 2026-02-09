import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { MultiCompanyService } from '../services/multi-company.service';
import {
  Branch,
  Company,
  MultiCompanyState,
  MultiCompanyUser
} from '../types';

/**
 * Infiere el tipo de sucursal desde el código
 */
function inferBranchType(code: string): 'headquarters' | 'branch' | 'warehouse' | 'store' {
  const upperCode = code.toUpperCase();
  if (upperCode.includes('HQ') || upperCode.includes('HEADQUARTERS') || upperCode.includes('CASA MATRIZ')) {
    return 'headquarters';
  }
  if (upperCode.includes('WAREHOUSE') || upperCode.includes('ALMACEN') || upperCode.includes('BODEGA')) {
    return 'warehouse';
  }
  if (upperCode.includes('STORE') || upperCode.includes('TIENDA') || upperCode.includes('LOCAL')) {
    return 'store';
  }
  return 'branch';
}

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

      // Convertir CompanyInfo a Company si existe, o buscar en user.companies
      // UserContextService.getCurrentCompany() devuelve CompanyInfo, pero necesitamos Company
      let finalCurrentCompany: Company | null = null;
      
      // Si hay currentCompany (CompanyInfo), buscar el Company completo en user.companies
      if (currentCompany && user.companies && Array.isArray(user.companies)) {
        const foundCompanyInfo = user.companies.find(c => c.id === currentCompany.id);
        if (foundCompanyInfo) {
          finalCurrentCompany = {
            id: foundCompanyInfo.id,
            code: foundCompanyInfo.code,
            name: foundCompanyInfo.name,
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
            isActive: (foundCompanyInfo.status || 1) === 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Company;
        }
      }
      
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

      // Obtener sucursales directamente desde la empresa actual
      // Nueva estructura: branches están anidados dentro de companies[].branches[]
      let branchesForCompany: Branch[] = [];
      
      if (finalCurrentCompany) {
        // Obtener branches directamente desde UserResponse usando UserContextService
        // Usar la estructura del profile sin depender de user.branches mapeado
        const userResponse = await userSessionService.getUser();
        if (userResponse) {
          const branchInfos = userContextService.getBranchesForCompany(finalCurrentCompany.id, userResponse);
          // Convertir BranchInfo[] a Branch[] directamente desde company.branches[]
          branchesForCompany = branchInfos.map(branchInfo => {
            // Crear objeto Branch completo desde BranchInfo del profile
            return {
              id: branchInfo.id,
              code: branchInfo.code,
              name: branchInfo.name,
              type: inferBranchType(branchInfo.code) as any,
              companyId: finalCurrentCompany.id,
              address: {
                street: '',
                city: '',
                state: '',
                country: '',
                postalCode: '',
              },
              contactInfo: {
                phone: '',
                email: '',
              },
              settings: {
                timezone: 'America/Guayaquil',
                workingHours: {
                  monday: { isOpen: false },
                  tuesday: { isOpen: false },
                  wednesday: { isOpen: false },
                  thursday: { isOpen: false },
                  friday: { isOpen: false },
                  saturday: { isOpen: false },
                  sunday: { isOpen: false },
                },
                services: [],
                features: [],
              },
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Branch;
          });
        }
      }

      // Convertir BranchInfo a Branch si existe, o buscar en branchesForCompany
      // UserContextService.getCurrentBranch() devuelve BranchInfo, pero necesitamos Branch
      let finalCurrentBranch: Branch | null = null;
      
      // Si hay currentBranch (BranchInfo), buscar el Branch completo en branchesForCompany
      if (currentBranch && branchesForCompany.length > 0) {
        finalCurrentBranch = branchesForCompany.find(b => b.id === currentBranch.id) || null;
      }
      
      if (!finalCurrentBranch && currentBranchId && branchesForCompany.length > 0) {
        finalCurrentBranch = branchesForCompany.find(b => b.id === currentBranchId) || null;
      }
      // Si aún no hay sucursal, usar la primera disponible
      if (!finalCurrentBranch && branchesForCompany.length > 0) {
        finalCurrentBranch = branchesForCompany[0];
      }
      
      // Si no hay sucursales disponibles, intentar obtener desde UserResponse
      if (!finalCurrentBranch && branchesForCompany.length === 0 && finalCurrentCompany) {
        const userResponse = await userSessionService.getUser();
        if (userResponse) {
          // Intentar obtener la sucursal por defecto desde UserResponse
          if (userResponse.branchIdDefault) {
            const branchInfos = userContextService.getBranchesForCompany(finalCurrentCompany.id, userResponse);
            const defaultBranchInfo = branchInfos.find(b => b.id === userResponse.branchIdDefault);
            if (defaultBranchInfo) {
              finalCurrentBranch = {
                id: defaultBranchInfo.id,
                code: defaultBranchInfo.code,
                name: defaultBranchInfo.name,
                type: inferBranchType(defaultBranchInfo.code) as any,
                companyId: finalCurrentCompany.id,
                address: {
                  street: '',
                  city: '',
                  state: '',
                  country: '',
                  postalCode: '',
                },
                contactInfo: {
                  phone: '',
                  email: '',
                },
                settings: {
                  timezone: 'America/Guayaquil',
                  workingHours: {
                    monday: { isOpen: false },
                    tuesday: { isOpen: false },
                    wednesday: { isOpen: false },
                    thursday: { isOpen: false },
                    friday: { isOpen: false },
                    saturday: { isOpen: false },
                    sunday: { isOpen: false },
                  },
                  services: [],
                  features: [],
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as Branch;
            }
          }
        }
      }
      
      // Si aún no hay sucursal, crear una mínima para evitar que falle el renderizado
      // Esto solo debería pasar si el usuario realmente no tiene sucursales
      if (!finalCurrentBranch && finalCurrentCompany) {
        finalCurrentBranch = {
          id: 'default-branch',
          code: 'DEFAULT',
          name: 'Sucursal Principal',
          type: 'main' as any,
          companyId: finalCurrentCompany.id,
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          },
          contactInfo: {
            phone: '',
            email: '',
          },
          settings: {
            timezone: 'America/Guayaquil',
            workingHours: {
              monday: { isOpen: false },
              tuesday: { isOpen: false },
              wednesday: { isOpen: false },
              thursday: { isOpen: false },
              friday: { isOpen: false },
              saturday: { isOpen: false },
              sunday: { isOpen: false },
            },
            services: [],
            features: [],
          },
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

