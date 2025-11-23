/**
 * Tipos de dominio para Roles
 */

import { BaseEntity, PaginationParams } from '@/src/domains/shared/types';
import { SecurityPermission } from '@/src/domains/security/types';

/**
 * Rol del sistema (Modelo de Dominio)
 */
export interface Role extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  companyId?: string;
  status: number;
  statusDescription: string;
  permissions: SecurityPermission[];
}

/**
 * Filtros para búsqueda de roles
 */
export interface RoleFilters extends PaginationParams {
  search?: string;
  status?: number;
  isSystem?: boolean;
}

