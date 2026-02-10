/**
 * Tipos de dominio para Usuarios
 * Modelos de negocio puros, independientes de la API
 */

import { BaseEntity, PaginationParams } from "@/src/domains/shared/types";

/**
 * Usuario del sistema (Modelo de Dominio)
 */
export interface User extends BaseEntity {
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
  companies?: Array<{
    id: string;
    code?: string;
    name?: string;
    branches?: Array<{
      id: string;
      code: string;
      name: string;
    }>;
    roles?: Array<{
      id: string;
      code: string;
      name: string;
      description?: string;
      isSystem?: boolean;
    }>;
  }>;
}

/**
 * Payload para crear usuario
 */
export interface UserCreatePayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId?: string; // Mantener para compatibilidad, pero se prefiere companies[].roleIds[]
  status?: number; // Estado: -1=Eliminado, 0=Inactivo, 1=Activo, 2=Pendiente, 3=Suspendido
  companies?: Array<{
    id: string;
    branchIds: string[]; // Array de UUIDs de sucursales
    roleIds?: string[]; // Array de UUIDs de roles (nuevo: roles por empresa)
  }>;
}

/**
 * Payload para actualizar usuario
 */
export interface UserUpdatePayload {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string; // Mantener para compatibilidad, pero se prefiere companies[].roleIds[]
  status?: number; // Estado: -1=Eliminado, 0=Inactivo, 1=Activo, 2=Pendiente
  companies?: Array<{
    id: string;
    branchIds: string[]; // Array de UUIDs de sucursales
    roleIds?: string[]; // Array de UUIDs de roles (nuevo: roles por empresa)
  }>;
}

/**
 * Filtros para búsqueda de usuarios
 */
export interface UserFilters extends PaginationParams {
  search?: string;
  status?: number; // Filtrar por estado: -1, 0, 1, 2, 3
  /** Opcional. Si no se envía, el backend usa la empresa del usuario autenticado (super admin sin filtro). */
  companyId?: string;
  roleId?: string;
  branchId?: string;
}
