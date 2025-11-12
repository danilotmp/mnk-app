/**
 * Tipos del dominio de Seguridades
 * Incluye Usuarios, Roles, Permisos y Accesos
 */

import { BaseEntity, PaginationParams } from '../../shared/types';

export type { PaginatedResponse, PaginationMeta } from '../../shared/types';

/**
 * Usuario del sistema
 */
export interface SecurityUser extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  
  // Sistema de estados
  status: number; // -1: Deleted, 0: Inactive, 1: Active, 2: Pending, 3: Suspended
  statusDescription: string; // Descripción traducida del estado (viene del backend)
  
  lastLoginAt?: Date;
  lastLogin?: string;
  companyId: string;
  roleId?: string; // Para compatibilidad con formularios
  roles?: Array<{
    id: string;
    name: string;
    displayName: string;
    description?: string;
    assignedAt: string;
  }>; // Array de roles que viene del backend
  branchIds?: string[]; // Sucursales a las que tiene acceso (para formularios)
  currentBranchId?: string;
  availableBranches?: Array<{
    id: string;
    code: string;
    name: string;
    branchId?: string; // Para compatibilidad con algunas respuestas
    branchCode?: string; // Para compatibilidad con algunas respuestas
  }>;
}

export interface UserUpdatePayload {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyId?: string;
  roleId?: string;
  branchIds?: string[];
  status?: number; // Sistema de estados
}

/**
 * Rol del sistema
 */
export interface SecurityRole extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  isSystem: boolean; // Roles del sistema no se pueden eliminar
  
  // Sistema de estados
  status: number;
  statusDescription: string;
  
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
  
  // Sistema de estados
  status: number;
  statusDescription: string;
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
  
  // Sistema de estados
  status: number;
  statusDescription: string;
  
  grantedBy: string; // Usuario que otorgó el acceso
  grantedAt: Date;
}

/**
 * Relación Rol-Permiso
 */
export interface RolePermission extends BaseEntity {
  roleId: string;
  permissionId: string;
  
  // Sistema de estados
  status: number;
  statusDescription: string;
}

/**
 * Filtros comunes
 */
export interface UserFilters extends PaginationParams {
  search?: string;
  status?: number; // Filtrar por estado: -1, 0, 1, 2, 3
  companyId?: string;
  roleId?: string;
  branchId?: string;
}

export interface RoleFilters extends PaginationParams {
  search?: string;
  status?: number;
  isSystem?: boolean;
}

export interface PermissionFilters extends PaginationParams {
  search?: string;
  status?: number;
  module?: string;
  action?: string;
}

export interface AccessFilters extends PaginationParams {
  search?: string;
  userId?: string;
  companyId?: string;
  branchId?: string;
  roleId?: string;
  status?: number;
}

/**
 * Empresas
 */
export interface SecurityCompany extends BaseEntity {
  code: string;
  name: string;
  email: string;
  description?: string;
  phone?: string;
  address?: CompanyAddress;
  settings?: CompanySettings;
  subscriptionPlan?: CompanySubscriptionPlan;
  
  // Sistema de estados
  status: number;
  statusDescription: string;
}

export interface CompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface CompanySettings {
  timezone?: string;
  currency?: string;
  language?: string;
  dateFormat?: string;
  features?: string[];
  [key: string]: unknown;
}

export interface CompanySubscriptionPlan {
  id?: string;
  plan?: string;
  name?: string;
  features?: string[];
  maxUsers?: number;
  maxBranches?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface CompanyFilters extends PaginationParams {
  search?: string;
  code?: string;
  name?: string;
  email?: string;
  status?: number;
}

export interface CompanyPayload {
  code?: string;
  name?: string;
  email?: string;
  description?: string;
  phone?: string;
  address?: CompanyAddress;
  settings?: CompanySettings;
  subscriptionPlan?: CompanySubscriptionPlan;
  isActive?: boolean;
}

/**
 * Sucursales
 */
export type BranchType = 'headquarters' | 'branch' | 'warehouse' | 'store';

export interface SecurityBranch extends BaseEntity {
  companyId: string;
  code: string;
  name: string;
  type?: BranchType;
  description?: string;
  address?: CompanyAddress;
  contactInfo?: BranchContactInfo;
  settings?: BranchSettings;
  
  // Sistema de estados
  status: number;
  statusDescription: string;
  
  company?: Pick<SecurityCompany, 'id' | 'code' | 'name'>;
}

export interface BranchContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  [key: string]: unknown;
}

export interface BranchSettings {
  timezone?: string;
  workingHours?: Record<string, BranchDaySchedule>;
  openHours?: string;
  maxCapacity?: number;
  services?: string[];
  features?: string[];
  [key: string]: unknown;
}

export interface BranchDaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface BranchFilters extends PaginationParams {
  search?: string;
  companyId?: string;
  code?: string;
  name?: string;
  type?: BranchType;
  status?: number;
}

export interface BranchPayload {
  companyId?: string;
  code?: string;
  name?: string;
  type?: BranchType;
  description?: string;
  address?: CompanyAddress;
  contactInfo?: BranchContactInfo;
  settings?: BranchSettings;
  isActive?: boolean;
}

