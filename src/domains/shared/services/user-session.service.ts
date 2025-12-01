import { sessionManager } from '@/src/infrastructure/session/session-manager';
import { UserResponse } from '../types/api/user-response.types';
import { MenuItem } from '@/src/infrastructure/menu/types';

export class UserSessionService {
  private static instance: UserSessionService;

  private constructor() {}

  static getInstance(): UserSessionService {
    if (!UserSessionService.instance) {
      UserSessionService.instance = new UserSessionService();
    }
    return UserSessionService.instance;
  }

  async saveUser(user: UserResponse): Promise<void> {
    // LOGS SESSION STORAGE: Aquí se agregará el log al guardar UserResponse
    
    await sessionManager.setItem('user', 'current', user, {
      ttl: 30 * 60 * 1000,
    });
    
    // LOGS SESSION STORAGE: Aquí se agregará el log para verificar que se guardó correctamente
  }

  async getUser(): Promise<UserResponse | null> {
    const user = await sessionManager.getItem<UserResponse>('user', 'current');
    
    // LOGS SESSION STORAGE: Aquí se agregará el log al leer UserResponse
    
    return user;
  }

  async setCurrentCompany(companyId: string, skipBroadcast: boolean = false): Promise<void> {
    await sessionManager.setItem('user', 'currentCompanyId', companyId, {
      skipBroadcast,
    });
  }

  async getCurrentCompany(): Promise<string | null> {
    return await sessionManager.getItem<string>('user', 'currentCompanyId');
  }

  async setCurrentBranch(branchId: string, skipBroadcast: boolean = false): Promise<void> {
    await sessionManager.setItem('user', 'currentBranchId', branchId, {
      skipBroadcast,
    });
  }

  async getCurrentBranch(): Promise<string | null> {
    return await sessionManager.getItem<string>('user', 'currentBranchId');
  }

  async setMenu(menu: MenuItem[], skipBroadcast: boolean = false): Promise<void> {
    await sessionManager.setItem('menu', 'current', menu, {
      ttl: 30 * 60 * 1000,
      skipBroadcast,
    });
  }

  async getMenu(): Promise<MenuItem[] | null> {
    return await sessionManager.getItem<MenuItem[]>('menu', 'current');
  }

  async clearAll(): Promise<void> {
    await sessionManager.clearAll();
  }
}


