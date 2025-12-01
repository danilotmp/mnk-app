import { UserSessionService } from './user-session.service';
import { UserResponse, CompanyInfo, BranchInfo, RoleInfo } from '../types/api/user-response.types';
import { MenuService } from '@/src/infrastructure/menu/menu.service';
import { MenuItem } from '@/src/infrastructure/menu/types';

export class UserContextService {
  private static instance: UserContextService;

  private constructor(
    private userSessionService: UserSessionService
  ) {}

  static getInstance(): UserContextService {
    if (!UserContextService.instance) {
      UserSessionService.getInstance();
      UserContextService.instance = new UserContextService(
        UserSessionService.getInstance()
      );
    }
    return UserContextService.instance;
  }

  async getCurrentCompany(): Promise<CompanyInfo | null> {
    const user = await this.userSessionService.getUser();
    if (!user || !user.companies || user.companies.length === 0) return null;

    const currentCompanyId = await this.userSessionService.getCurrentCompany() || user.companyIdDefault;
    return user.companies.find(c => c.id === currentCompanyId) || null;
  }

  async getCurrentBranch(): Promise<BranchInfo | null> {
    const user = await this.userSessionService.getUser();
    if (!user) return null;

    const currentCompanyId = await this.userSessionService.getCurrentCompany() || user.companyIdDefault;
    const currentBranchId = await this.userSessionService.getCurrentBranch() || user.branchIdDefault;

    if (!currentBranchId || !user.branches || user.branches.length === 0) return null;

    const branches = this.getBranchesForCompany(currentCompanyId, user);
    return branches.find(b => b.id === currentBranchId) || null;
  }

  getBranchesForCompany(companyId: string, user?: UserResponse | null): BranchInfo[] {
    if (!user) return [];
    if (!user.branches) return [];
    return user.branches.filter(b => b.companyId === companyId);
  }

  getRolesForCompany(companyId: string, user?: UserResponse | null): RoleInfo[] {
    if (!user) return [];
    if (!user.rolesByCompany) return [];
    const companyRoles = user.rolesByCompany.find(r => r.companyId === companyId);
    return companyRoles?.roles || [];
  }

  async switchCompany(companyId: string): Promise<MenuItem[]> {
    const user = await this.userSessionService.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!user.companies || user.companies.length === 0) {
      throw new Error('No hay empresas disponibles para el usuario');
    }

    const hasAccess = user.companies.some(c => c.id === companyId);
    if (!hasAccess) {
      throw new Error('No tienes acceso a esta empresa');
    }

    await this.userSessionService.setCurrentCompany(companyId, true);

    const menu = await MenuService.getMenuForCompany(companyId);
    await this.userSessionService.setMenu(menu, true);

    return menu;
  }

  async switchBranch(branchId: string): Promise<void> {
    const user = await this.userSessionService.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const currentCompanyId = await this.userSessionService.getCurrentCompany() || user.companyIdDefault;
    const branches = this.getBranchesForCompany(currentCompanyId, user);
    const hasAccess = branches.some(b => b.id === branchId);
    
    if (!hasAccess) {
      throw new Error('No tienes acceso a esta sucursal');
    }

    await this.userSessionService.setCurrentBranch(branchId, true);
  }

  async initializeContext(): Promise<void> {
    const user = await this.userSessionService.getUser();
    if (!user) return;

    // Verificar que el token esté disponible antes de hacer llamadas autenticadas
    const { apiClient } = await import('@/src/infrastructure/api/api.client');
    const tokens = await apiClient.getTokens();
    if (!tokens || !tokens.accessToken) {
      console.warn('Token no disponible, no se puede inicializar el contexto');
      return;
    }

    const currentCompanyId = await this.userSessionService.getCurrentCompany();
    if (!currentCompanyId) {
      await this.userSessionService.setCurrentCompany(user.companyIdDefault, true);
    }

    const currentBranchId = await this.userSessionService.getCurrentBranch();
    if (!currentBranchId && user.branchIdDefault) {
      await this.userSessionService.setCurrentBranch(user.branchIdDefault, true);
    }

    const menu = await this.userSessionService.getMenu();
    if (!menu) {
      const companyId = currentCompanyId || user.companyIdDefault;
      try {
        // Verificar nuevamente que el token esté disponible antes de llamar al menú
        const { apiClient } = await import('@/src/infrastructure/api/api.client');
        const tokens = await apiClient.getTokens();
        if (!tokens || !tokens.accessToken) {
          console.warn('Token no disponible, no se puede obtener el menú');
          return;
        }
        
        const newMenu = await MenuService.getMenuForCompany(companyId);
        await this.userSessionService.setMenu(newMenu, true);
      } catch (error: any) {
        // Si es un error 401, no hacer nada (el menú se cargará después cuando el token esté disponible)
        if (error?.statusCode === 401 || error?.message?.includes('Token') || error?.message?.includes('auth token')) {
          console.warn('Token no disponible para obtener el menú, se intentará más tarde');
          return;
        }
        console.error('Error al obtener el menú durante la inicialización:', error);
      }
    }
  }
}

