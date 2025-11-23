/**
 * Adaptador para transformar datos de API a modelos de dominio para Roles
 */

import { Role } from '../types/domain/role.types';
import { RoleApi } from '../types/api/role-api.types';

export function roleAdapter(apiRole: RoleApi): Role {
  return {
    id: apiRole.id,
    createdAt: apiRole.createdAt,
    updatedAt: apiRole.updatedAt,
    name: apiRole.name,
    code: apiRole.code,
    description: apiRole.description,
    isSystem: apiRole.isSystem,
    companyId: apiRole.companyId,
    status: apiRole.status,
    statusDescription: apiRole.statusDescription,
    permissions: apiRole.permissions,
  };
}

export function rolesAdapter(apiRoles: RoleApi[]): Role[] {
  return apiRoles.map(roleAdapter);
}

