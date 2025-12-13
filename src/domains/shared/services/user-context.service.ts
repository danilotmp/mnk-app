import { MenuService } from '@/src/infrastructure/menu/menu.service';
import { MenuItem } from '@/src/infrastructure/menu/types';
import { BranchInfo, CompanyInfo, RoleInfo, UserResponse } from '../types/api/user-response.types';
import { UserSessionService } from './user-session.service';

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
    
    if (!user || !user.companies || !Array.isArray(user.companies) || user.companies.length === 0) {
      return null;
    }

    const currentCompanyId = await this.userSessionService.getCurrentCompany() || user.companyIdDefault;
    return user.companies.find(c => c.id === currentCompanyId) || null;
  }

  async getCurrentBranch(): Promise<BranchInfo | null> {
      const user = await this.userSessionService.getUser();
      if (!user) return null;

      const currentCompanyId = await this.userSessionService.getCurrentCompany() || user.companyIdDefault;
    const currentBranchId = await this.userSessionService.getCurrentBranch() || user.branchIdDefault;

    if (!currentBranchId || !currentCompanyId) {
      return null;
    }

    // Nueva estructura: branches están anidados dentro de companies
    const branches = this.getBranchesForCompany(currentCompanyId, user);
    return branches.find(b => b.id === currentBranchId) || null;
  }

  getBranchesForCompany(companyId: string, user?: UserResponse | null): BranchInfo[] {
    if (!user || !user.companies || !Array.isArray(user.companies)) return [];
    
    // Nueva estructura: branches están anidados dentro de cada empresa
    const company = user.companies.find(c => c.id === companyId);
    return company?.branches || [];
  }

  getRolesForCompany(companyId: string, user?: UserResponse | null): RoleInfo[] {
    if (!user) return [];
    if (!user.companies || !Array.isArray(user.companies)) return [];
    const company = user.companies.find(c => c.id === companyId);
    return company?.roles || [];
  }

  async switchCompany(companyId: string): Promise<MenuItem[]> {
    const user = await this.userSessionService.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!user.companies || !Array.isArray(user.companies) || user.companies.length === 0) {
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

    // IMPORTANTE: SIEMPRE usar companyIdDefault del UserResponse como fuente de verdad
    // No confiar en session storage que puede tener valores antiguos
    let currentCompanyId = await this.userSessionService.getCurrentCompany();
    
    // Si no hay currentCompanyId en session storage O si es diferente del companyIdDefault del login,
    // usar el companyIdDefault del UserResponse (que es la fuente de verdad del login)
    if (!currentCompanyId || currentCompanyId !== user.companyIdDefault) {
      if (user.companyIdDefault) {
        currentCompanyId = user.companyIdDefault;
        await this.userSessionService.setCurrentCompany(user.companyIdDefault, true);
      }
    }

    const currentBranchId = await this.userSessionService.getCurrentBranch();
    if (!currentBranchId && user.branchIdDefault) {
      await this.userSessionService.setCurrentBranch(user.branchIdDefault, true);
    }

    const menu = await this.userSessionService.getMenu();
    if (!menu && currentCompanyId) {
      try {
        // Verificar nuevamente que el token esté disponible antes de llamar al menú
        const { apiClient } = await import('@/src/infrastructure/api/api.client');
        const tokens = await apiClient.getTokens();
        if (!tokens || !tokens.accessToken) {
          console.warn('Token no disponible, no se puede obtener el menú');
          return;
        }
        
        const newMenu = await MenuService.getMenuForCompany(currentCompanyId);
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

