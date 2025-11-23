/**
 * Adaptador para transformar datos de API a modelos de dominio para Autenticación
 */

import { AuthUser } from '../types/domain/auth.types';
import { AuthUserApi } from '../types/api/auth-api.types';

export function authUserAdapter(apiUser: AuthUserApi): AuthUser {
  return {
    id: apiUser.id,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    avatar: apiUser.avatar,
    isEmailVerified: apiUser.isEmailVerified,
    lastLoginAt: apiUser.lastLoginAt,
  };
}

