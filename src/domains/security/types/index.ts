/**
 * Tipos del dominio de Seguridades
 * Incluye Usuarios, Roles, Permisos y Accesos
 */

import { BaseEntity, PaginationParams } from '../../shared/types';

/**
 * Usuario del sistema
 */
export interface SecurityUser extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  companyId: string;
  roleId: string;
  branchIds?: string[]; // Sucursales a las que tiene acceso
}

/**
 * Rol del sistema
 */
export interface SecurityRole extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  isSystem: boolean; // Roles del sistema no se pueden eliminar
  isActive: boolean;
  permissions: SecurityPermission[];
}

/**
 * Permiso del sistema
 */
export interface SecurityPermission extends BaseEntity {
  name: string;
  code: string; // Ej: 'users.view', 'admin.manage'
  module: string; // Ej: 'admin', 'users', 'reports'
  action: string; // Ej: 'view', 'create', 'edit', 'delete'
  description?: string;
  isActive: boolean;
}

/**
 * Acceso de usuario (relación usuario-empresa-sucursal-permisos)
 */
export interface SecurityAccess extends BaseEntity {
  userId: string;
  companyId: string;
  branchId?: string; // Si es null, acceso a toda la empresa
  roleId: string;
  permissions: string[]; // IDs de permisos adicionales
  isActive: boolean;
  grantedBy: string; // Usuario que otorgó el acceso
  grantedAt: Date;
}

/**
 * Relación Rol-Permiso
 */
export interface RolePermission extends BaseEntity {
  roleId: string;
  permissionId: string;
  isActive: boolean;
}

/**
 * Filtros comunes
 */
export interface UserFilters extends PaginationParams {
  search?: string;
  isActive?: boolean;
  companyId?: string;
  roleId?: string;
  branchId?: string;
}

export interface RoleFilters extends PaginationParams {
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface PermissionFilters extends PaginationParams {
  search?: string;
  isActive?: boolean;
  module?: string;
  action?: string;
}

export interface AccessFilters extends PaginationParams {
  search?: string;
  userId?: string;
  companyId?: string;
  branchId?: string;
  roleId?: string;
  isActive?: boolean;
}

