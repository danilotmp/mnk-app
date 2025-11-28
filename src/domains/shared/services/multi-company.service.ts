import {
  ApiResponse,
  Branch,
  BranchAccess,
  BranchSwitchRequest,
  BranchSwitchResponse,
  Company,
  CompanyContext,
  MultiCompanyState,
  MultiCompanyUser,
  Permission,
} from '../types';

/**
 * Servicio para gestión de arquitectura multiempresa
 * Este es un servicio mock que simula llamadas a una API
 * En producción, estos métodos harían peticiones HTTP reales
 */
export class MultiCompanyService {
  private static instance: MultiCompanyService;
  private currentState: MultiCompanyState = {
    currentCompany: null,
    currentBranch: null,
    availableBranches: [],
    user: null,
    permissions: [],
    isLoading: false,
    error: null,
  };

  private constructor() {}

  static getInstance(): MultiCompanyService {
    if (!MultiCompanyService.instance) {
      MultiCompanyService.instance = new MultiCompanyService();
    }
    return MultiCompanyService.instance;
  }

  /**
   * Obtiene el estado actual del servicio
   */
  getCurrentState(): MultiCompanyState {
    return { ...this.currentState };
  }

  /**
   * Establece el contexto del usuario autenticado
   * Carga empresa, sucursal y permisos del usuario
   */
  async setUserContext(user: MultiCompanyUser): Promise<ApiResponse<CompanyContext>> {
    try {
      this.currentState.isLoading = true;
      this.currentState.error = null;

      // IMPORTANTE: Crear una copia del usuario para no modificar el original
      // Esto preserva el companyIdDefault original del API
      const userCopy = { ...user };

      // Simular delay de red
      await this.simulateNetworkDelay();

      // Obtener empresa del usuario desde el array companies
      // Prioridad: 1) Buscar en companies array por companyIdDefault, 2) Buscar por isDefault, 3) Primera empresa
      let company: Company | null = null;
      
      if (userCopy.companies && userCopy.companies.length > 0) {
        // Opción 1: Buscar por companyIdDefault
        const defaultCompanyInfo = userCopy.companies.find(c => c.id === userCopy.companyIdDefault);
        if (defaultCompanyInfo) {
          company = await this.getCompanyById(defaultCompanyInfo.id);
        }
        
        // Opción 2: Si no se encontró, buscar por isDefault
        if (!company) {
          const defaultByFlag = userCopy.companies.find(c => c.isDefault);
          if (defaultByFlag) {
            company = await this.getCompanyById(defaultByFlag.id);
          }
        }
        
        // Opción 3: Si aún no se encontró, usar la primera empresa del array
        if (!company && userCopy.companies.length > 0) {
          company = await this.getCompanyById(userCopy.companies[0].id);
        }
      }
      
      // Si aún no se encontró, intentar obtener por companyIdDefault directamente (compatibilidad)
      if (!company && userCopy.companyIdDefault) {
        company = await this.getCompanyById(userCopy.companyIdDefault);
      }
      
      // Si no se encuentra la empresa (por ejemplo, viene un UUID del API que no existe en mock),
      // usar la primera empresa disponible de los datos mock
      // IMPORTANTE: NO modificar user.companyIdDefault, preservar el valor original del API
      if (!company) {
        if (this.mockCompanies.length > 0) {
          company = this.mockCompanies[0];
          // NO actualizar user.companyIdDefault - preservar el valor original del API
          // El companyIdDefault debe mantenerse tal como viene del backend
        } else {
          throw new Error('No hay empresas disponibles en el sistema');
        }
      }

      // Obtener sucursales disponibles PRIMERO
      // IMPORTANTE: Preservar los datos originales del backend antes de cualquier conversión
      const originalAvailableBranches = userCopy.availableBranches || [];
      
      let availableBranches: BranchAccess[] = [];
      const userAvailableBranches = userCopy.availableBranches || [];
      
      if (userAvailableBranches.length > 0) {
        // Convertir Branch[] a BranchAccess[] si es necesario
        // El backend puede devolver Branch[] directamente o BranchAccess[]
        const firstItem = userAvailableBranches[0];
        const isBranchArray = firstItem && 
          typeof firstItem === 'object' && 
          'id' in firstItem && 
          'name' in firstItem && 
          !('branchId' in firstItem) && 
          !('branch' in firstItem);
        
        if (isBranchArray) {
          // Es Branch[], convertir a BranchAccess[]
          availableBranches = userAvailableBranches.map((branch: any) => ({
            branchId: branch.id,
            branch: branch,
            role: 'user',
            permissions: [],
            grantedAt: new Date(),
            grantedBy: 'system',
            isActive: true,
          }));
        } else {
          // Ya es BranchAccess[]
          // IMPORTANTE: Filtrar solo las sucursales que pertenecen a la empresa actual
          // para evitar mostrar sucursales de otras empresas cuando se cambia de empresa
          availableBranches = userAvailableBranches.filter((access: any) => {
            // Si tiene branch completo, verificar companyId
            if (access.branch?.companyId) {
              return access.branch.companyId === company.id;
            }
            // Si no tiene branch completo pero tiene branchId, buscar en mockBranches
            if (access.branchId && !access.branch) {
              const branch = this.mockBranches.find(b => b.id === access.branchId);
              return branch?.companyId === company.id;
            }
            // Si no se puede determinar, incluir por defecto (compatibilidad)
            // Esto puede pasar si el API no envía companyId en los branches
            return true;
          });
        }
      } else {
        // Si no hay sucursales disponibles pero hay sucursales en la empresa, usar esas
        const companyBranches = this.mockBranches.filter(b => b.companyId === company.id);
        availableBranches = companyBranches.map(branch => ({
          branchId: branch.id,
          branch: branch,
          role: 'user',
          permissions: [],
          grantedAt: new Date(),
          grantedBy: 'system',
          isActive: true,
        }));
      }
      
      // Actualizar el usuario con las sucursales (filtradas por empresa) para que se preserven en la sesión
      userCopy.availableBranches = availableBranches;
      // Preservar los roles del usuario (vienen como userRoles del API)
      userCopy.roles = userCopy.roles || [];

      // Obtener sucursal actual desde availableBranches usando currentBranchId
      let currentBranch: Branch | null = null;
      
      if (user.currentBranchId && availableBranches.length > 0) {
        // Buscar la sucursal en availableBranches usando currentBranchId
        const branchAccess = availableBranches.find(
          access => access.branchId === user.currentBranchId || access.branch?.id === user.currentBranchId
        );
        if (branchAccess?.branch) {
          currentBranch = branchAccess.branch;
        }
      }
      
      // Si no se encontró la sucursal, usar la primera disponible del usuario
      if (!currentBranch && availableBranches.length > 0) {
        const firstBranchAccess = availableBranches[0];
        if (firstBranchAccess?.branch) {
          currentBranch = firstBranchAccess.branch;
          // Actualizar el currentBranchId del usuario
          user.currentBranchId = currentBranch.id;
        }
      }
      
      // Si aún no hay sucursal, usar la primera sucursal de la empresa (buscando en mockBranches)
      if (!currentBranch) {
        const companyBranches = this.mockBranches.filter(b => b.companyId === company.id);
        if (companyBranches.length > 0) {
          currentBranch = companyBranches[0];
          // Actualizar el currentBranchId del usuario (en la copia, no en el original)
          userCopy.currentBranchId = currentBranch.id;
        }
      }

      // Obtener permisos del usuario para la sucursal actual
      // Si no hay sucursal actual, usar permisos vacíos
      const branchIdForPermissions = currentBranch?.id || userCopy.currentBranchId || '';
      const permissions = branchIdForPermissions 
        ? await this.getUserPermissions(userCopy.id, branchIdForPermissions)
        : [];

      // Actualizar estado
      // availableBranches en el estado debe ser Branch[], pero tenemos BranchAccess[]
      // Convertir BranchAccess[] a Branch[] para el estado
      const branchesForState = availableBranches.map(access => access.branch);
      
      this.currentState = {
        currentCompany: company,
        currentBranch: currentBranch,
        availableBranches: branchesForState,
        user: userCopy, // Usar la copia, no el original
        permissions: permissions,
        isLoading: false,
        error: null,
      };

      const context: CompanyContext = {
        company,
        currentBranch: currentBranch || null,
        availableBranches,
        user: {
          ...userCopy, // Usar la copia para preservar companyIdDefault original
          currentBranchId: currentBranch?.id || userCopy.currentBranchId || '',
          // Preservar los availableBranches filtrados por empresa actual
          // para que el componente pueda usarlos directamente sin conversiones
          availableBranches: availableBranches,
          // Preservar los roles del usuario (vienen como userRoles del API)
          roles: userCopy.roles || [],
        },
        permissions,
        canSwitchBranch: availableBranches.length > 1,
      };

      return {
        data: context,
        message: 'Contexto de usuario establecido correctamente',
        success: true,
        statusCode: 200,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.currentState.error = errorMessage;
      this.currentState.isLoading = false;
      throw error;
    }
  }

  /**
   * Cambia la sucursal activa del usuario
   */
  async switchBranch(request: BranchSwitchRequest): Promise<ApiResponse<BranchSwitchResponse>> {
    try {
      if (!this.currentState.user) {
        throw new Error('Usuario no autenticado');
      }

      // Simular delay de red
      await this.simulateNetworkDelay();

      // Verificar que el usuario tiene acceso a la sucursal
      const hasAccess = this.currentState.user.availableBranches.some(
        (access) => access.branchId === request.branchId && access.isActive
      );

      if (!hasAccess) {
        throw new Error('No tienes acceso a esta sucursal');
      }

      // Obtener nueva sucursal
      const newBranch = await this.getBranchById(request.branchId);
      if (!newBranch) {
        throw new Error('Sucursal no encontrada');
      }

      // Obtener permisos para la nueva sucursal
      const permissions = await this.getUserPermissions(this.currentState.user.id, request.branchId);

      // Actualizar estado
      this.currentState.currentBranch = newBranch;
      this.currentState.permissions = permissions;
      this.currentState.user.currentBranchId = request.branchId;

      const response: BranchSwitchResponse = {
        success: true,
        newBranch,
        permissions,
        message: `Cambiado a sucursal ${newBranch.name}`,
      };

      return {
        data: response,
        message: 'Sucursal cambiada correctamente',
        success: true,
        statusCode: 200,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error al cambiar sucursal');
    }
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permissionCode: string): boolean {
    return this.currentState.permissions.some(
      (permission) => permission.code === permissionCode && permission.isActive
    );
  }

  /**
   * Verifica si el usuario tiene acceso a un módulo con una acción específica
   */
  hasModuleAccess(module: string, action: string): boolean {
    return this.currentState.permissions.some(
      (permission) =>
        permission.module === module && permission.action === action && permission.isActive
    );
  }

  /**
   * Verifica si el usuario puede cambiar de sucursal
   */
  canSwitchBranch(): boolean {
    return this.currentState.availableBranches.length > 1;
  }

  /**
   * Obtiene las sucursales disponibles para el usuario
   */
  getAvailableBranches(): Branch[] {
    return this.currentState.availableBranches;
  }

  /**
   * Obtiene el contexto actual del usuario
   */
  getCurrentContext(): CompanyContext | null {
    if (
      !this.currentState.currentCompany ||
      !this.currentState.currentBranch ||
      !this.currentState.user
    ) {
      return null;
    }

    // Convertir Branch[] a BranchAccess[] para el contexto
    const availableBranchesAccess: BranchAccess[] = this.currentState.availableBranches.map(branch => ({
      branchId: branch.id,
      branch: branch,
      role: 'user',
      permissions: [],
      grantedAt: new Date(),
      grantedBy: 'system',
      isActive: true,
    }));

    return {
      company: this.currentState.currentCompany!,
      currentBranch: this.currentState.currentBranch,
      availableBranches: availableBranchesAccess,
      user: this.currentState.user!,
      permissions: this.currentState.permissions,
      canSwitchBranch: this.canSwitchBranch(),
    };
  }

  // ===== Métodos privados de simulación =====

  private async simulateNetworkDelay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtiene una empresa por su ID
   * Público para permitir que los componentes obtengan información completa de la empresa
   */
  async getCompanyById(companyId: string): Promise<Company | null> {
    // En producción, esto haría una llamada HTTP: GET /api/companies/{id}
    return this.mockCompanies.find((c) => c.id === companyId) || null;
  }

  private async getBranchById(branchId: string): Promise<Branch | null> {
    // En producción, esto haría una llamada HTTP: GET /api/branches/{id}
    return this.mockBranches.find((b) => b.id === branchId) || null;
  }

  private async getUserAvailableBranches(userId: string): Promise<Branch[]> {
    // En producción, esto haría una llamada HTTP: GET /api/users/{id}/branches
    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) return [];

    return user.availableBranches
      .filter((access) => access.isActive)
      .map((access) => access.branch);
  }

  private async getUserPermissions(userId: string, branchId: string): Promise<Permission[]> {
    // En producción, esto haría una llamada HTTP: GET /api/users/{id}/permissions?branchId={branchId}
    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) return [];

    const branchAccess = user.availableBranches.find((access) => access.branchId === branchId);
    return branchAccess ? branchAccess.permissions : [];
  }

  // ===== Datos mock para desarrollo =====

  private mockCompanies: Company[] = [
    {
      id: 'company-1',
      name: 'MNK Empresa Demo',
      code: 'MNK-DEMO',
      description: 'Empresa de demostración para arquitectura multiempresa',
      email: 'info@mnk-demo.com',
      address: {
        street: 'Av. Principal 123',
        city: 'Quito',
        state: 'Pichincha',
        country: 'Ecuador',
        postalCode: '170150',
      },
      settings: {
        timezone: 'America/Guayaquil',
        currency: 'USD',
        language: 'es',
        dateFormat: 'DD/MM/YYYY',
        features: ['users', 'branches', 'reports', 'analytics'],
      },
      subscriptionPlan: {
        id: 'plan-premium',
        name: 'Premium',
        features: ['unlimited_users', 'unlimited_branches', 'advanced_analytics'],
        maxUsers: -1, // -1 = ilimitado
        maxBranches: -1,
        isActive: true,
      },
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
  ];

  private mockBranches: Branch[] = [
    {
      id: 'branch-quito',
      companyId: 'company-1',
      name: 'Sede Principal Quito',
      code: 'QUITO-HQ',
      type: 'headquarters',
      address: {
        street: 'Av. Principal 123',
        city: 'Quito',
        state: 'Pichincha',
        country: 'Ecuador',
        postalCode: '170150',
      },
      contactInfo: {
        phone: '+593-2-1234567',
        email: 'quito@mnk-demo.com',
      },
      settings: {
        timezone: 'America/Guayaquil',
        workingHours: {
          monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          saturday: { isOpen: false },
          sunday: { isOpen: false },
        },
        services: ['ventas', 'atencion_cliente', 'administracion', 'finanzas'],
        features: ['full_access'],
      },
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
    {
      id: 'branch-loja',
      companyId: 'company-1',
      name: 'Sucursal Loja',
      code: 'LOJA-BR',
      type: 'branch',
      address: {
        street: 'Calle Bolívar 456',
        city: 'Loja',
        state: 'Loja',
        country: 'Ecuador',
        postalCode: '110150',
      },
      contactInfo: {
        phone: '+593-7-1234567',
        email: 'loja@mnk-demo.com',
      },
      settings: {
        timezone: 'America/Guayaquil',
        workingHours: {
          monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          saturday: { isOpen: true, openTime: '09:00', closeTime: '13:00' },
          sunday: { isOpen: false },
        },
        services: ['ventas', 'atencion_cliente'],
        features: ['limited_access'],
      },
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
    },
  ];

  private mockPermissions: Permission[] = [
    // Permisos de administración
    {
      id: 'perm-1',
      name: 'Ver usuarios',
      code: 'users.view',
      module: 'admin',
      action: 'view',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-2',
      name: 'Crear usuarios',
      code: 'users.create',
      module: 'admin',
      action: 'create',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-3',
      name: 'Editar usuarios',
      code: 'users.edit',
      module: 'admin',
      action: 'edit',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-4',
      name: 'Eliminar usuarios',
      code: 'users.delete',
      module: 'admin',
      action: 'delete',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-5',
      name: 'Ver sucursales',
      code: 'branches.view',
      module: 'admin',
      action: 'view',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-6',
      name: 'Gestionar sucursales',
      code: 'branches.manage',
      module: 'admin',
      action: 'manage',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Permisos de usuario
    {
      id: 'perm-7',
      name: 'Ver perfil',
      code: 'profile.view',
      module: 'user',
      action: 'view',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-8',
      name: 'Editar perfil',
      code: 'profile.edit',
      module: 'user',
      action: 'edit',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-9',
      name: 'Cambiar sucursal',
      code: 'branch.switch',
      module: 'user',
      action: 'switch',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private mockUsers: MultiCompanyUser[] = [
    // Usuario 1: Danilo (Administrador con acceso a todas las sucursales)
    {
      id: 'user-danilo',
      email: 'danilo@mnk-demo.com',
      firstName: 'Danilo',
      lastName: 'Administrador',
      isEmailVerified: true,
      companyIdDefault: 'company-1',
      companies: [
        {
          id: 'company-1',
          code: 'MNK-DEMO',
          name: 'MNK Empresa Demo',
          status: 1,
          isDefault: true,
        },
      ],
      currentBranchId: 'branch-quito',
      availableBranches: [
        {
          branchId: 'branch-quito',
          branch: this.mockBranches[0],
          role: 'admin',
          permissions: this.mockPermissions.filter((p) => p.module === 'admin'),
          grantedAt: new Date(),
          grantedBy: 'system',
          isActive: true,
        },
        {
          branchId: 'branch-loja',
          branch: this.mockBranches[1],
          role: 'admin',
          permissions: this.mockPermissions.filter((p) => p.module === 'admin'),
          grantedAt: new Date(),
          grantedBy: 'system',
          isActive: true,
        },
      ],
      roles: [],
      permissions: [],
      preferences: {
        language: 'es',
        timezone: 'America/Guayaquil',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
          types: {
            security: true,
            updates: true,
            marketing: false,
            system: true,
          },
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Usuario 2: Juan (Usuario solo de Loja)
    {
      id: 'user-juan',
      email: 'juan@mnk-demo.com',
      firstName: 'Juan',
      lastName: 'Usuario',
      isEmailVerified: true,
      companyIdDefault: 'company-1',
      companies: [
        {
          id: 'company-1',
          code: 'MNK-DEMO',
          name: 'MNK Empresa Demo',
          status: 1,
          isDefault: true,
        },
      ],
      currentBranchId: 'branch-loja',
      availableBranches: [
        {
          branchId: 'branch-loja',
          branch: this.mockBranches[1],
          role: 'user',
          permissions: this.mockPermissions.filter((p) => p.module === 'user'),
          grantedAt: new Date(),
          grantedBy: 'user-danilo',
          isActive: true,
        },
      ],
      roles: [],
      permissions: [],
      preferences: {
        language: 'es',
        timezone: 'America/Guayaquil',
        theme: 'auto',
        notifications: {
          email: true,
          push: true,
          sms: false,
          types: {
            security: true,
            updates: true,
            marketing: true,
            system: false,
          },
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Usuario 3: Sebastian (Usuario con acceso a Quito y Loja)
    {
      id: 'user-sebastian',
      email: 'sebastian@mnk-demo.com',
      firstName: 'Sebastian',
      lastName: 'Multi',
      isEmailVerified: true,
      companyIdDefault: 'company-1',
      companies: [
        {
          id: 'company-1',
          code: 'MNK-DEMO',
          name: 'MNK Empresa Demo',
          status: 1,
          isDefault: true,
        },
      ],
      currentBranchId: 'branch-quito',
      availableBranches: [
        {
          branchId: 'branch-quito',
          branch: this.mockBranches[0],
          role: 'user',
          permissions: this.mockPermissions.filter((p) => p.module === 'user'),
          grantedAt: new Date(),
          grantedBy: 'user-danilo',
          isActive: true,
        },
        {
          branchId: 'branch-loja',
          branch: this.mockBranches[1],
          role: 'user',
          permissions: this.mockPermissions.filter((p) => p.module === 'user'),
          grantedAt: new Date(),
          grantedBy: 'user-danilo',
          isActive: true,
        },
      ],
      roles: [],
      permissions: [],
      preferences: {
        language: 'es',
        timezone: 'America/Guayaquil',
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          sms: false,
          types: {
            security: true,
            updates: false,
            marketing: false,
            system: false,
          },
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  /**
   * Método público para obtener usuarios mock (útil para testing/demo)
   */
  getMockUsers(): MultiCompanyUser[] {
    return this.mockUsers;
  }

  /**
   * Método público para obtener empresas mock (útil para testing/demo)
   */
  getMockCompanies(): Company[] {
    return this.mockCompanies;
  }

  /**
   * Método público para obtener sucursales mock (útil para testing/demo)
   */
  getMockBranches(): Branch[] {
    return this.mockBranches;
  }
}

