/**
 * Tipos de API para Usuarios
 * Contratos externos de la API (DTOs)
 * Estos tipos reflejan exactamente lo que devuelve el backend
 */

import { BaseEntity } from '@/src/domains/shared/types';

/**
 * Usuario tal como viene de la API (DTO)
 * Puede tener diferencias de nomenclatura con el modelo de dominio
 */
export interface UserApi extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  
  // Sistema de estados
  status: number;
  statusDescription: string;
  
  lastLoginAt?: Date;
  lastLogin?: string;
  companyId: string;
  roleId?: string;
  roles?: Array<{
    id: string;
    name: string;
    displayName: string;
    description?: string;
    assignedAt: string;
  }>;
  branchIds?: string[];
  currentBranchId?: string;
  availableBranches?: Array<{
    id: string;
    code: string;
    name: string;
    branchId?: string;
    branchCode?: string;
  }>;
  companies?: Array<{
    id: string;
    branches: Array<{
      id: string;
      code: string;
      name: string;
    }>;
  }>;
}

