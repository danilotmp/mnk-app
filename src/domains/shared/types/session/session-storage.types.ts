import { UserResponse } from '../api/user-response.types';
import { MenuItem } from '@/src/infrastructure/menu/types';

export interface SessionStorageData {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
  user: UserResponse;
  currentCompanyId?: string;
  currentBranchId?: string;
  menu?: MenuItem[];
  lastUpdated: number;
}


