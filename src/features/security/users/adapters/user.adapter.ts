/**
 * Adaptador para transformar datos de API a modelos de dominio
 * Función pura que transforma UserApi → User
 */

import { User } from '../types/domain/user.types';
import { UserApi } from '../types/api/user-api.types';

/**
 * Transforma un usuario de la API al modelo de dominio
 * 
 * @param apiUser Usuario tal como viene de la API
 * @returns Usuario en formato de dominio
 */
export function userAdapter(apiUser: UserApi): User {
  return {
    id: apiUser.id,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    phone: apiUser.phone,
    avatar: apiUser.avatar,
    isEmailVerified: apiUser.isEmailVerified,
    status: apiUser.status,
    statusDescription: apiUser.statusDescription,
    lastLoginAt: apiUser.lastLoginAt,
    lastLogin: apiUser.lastLogin,
    companyId: apiUser.companyId,
    roleId: apiUser.roleId,
    roles: apiUser.roles,
    branchIds: apiUser.branchIds,
    currentBranchId: apiUser.currentBranchId,
    availableBranches: apiUser.availableBranches,
    companies: apiUser.companies,
  };
}

/**
 * Transforma un array de usuarios de la API al modelo de dominio
 * 
 * @param apiUsers Array de usuarios de la API
 * @returns Array de usuarios en formato de dominio
 */
export function usersAdapter(apiUsers: UserApi[]): User[] {
  return apiUsers.map(userAdapter);
}

