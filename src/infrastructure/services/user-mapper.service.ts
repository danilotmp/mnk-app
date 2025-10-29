/**
 * Servicio para mapear datos de usuario del API al formato MultiCompanyUser
 * Basado en la estructura real del API según Swagger y Postman
 */

import { MultiCompanyUser, UserPreferences } from '@/src/domains/shared/types';

/**
 * Estructura real de la respuesta del login API
 * Según Swagger, solo incluye: id, email, firstName, lastName, companyId
 */
export interface ApiLoginUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  // Campos opcionales que pueden venir del perfil
  phone?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  companyCode?: string;
  currentBranchId?: string;
  availableBranches?: any[];
  roles?: any[];
  permissions?: any[];
  preferences?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Mapea la respuesta del API de login/profile a MultiCompanyUser
 * Solo usa los campos que realmente vienen del API
 */
export function mapApiUserToMultiCompanyUser(
  apiUser: ApiLoginUserResponse | Partial<ApiLoginUserResponse>
): MultiCompanyUser {
  const now = new Date();
  
  // Mapear solo los campos que existen en el API
  // Los campos faltantes se completarán con datos mock o valores por defecto
  return {
    id: apiUser.id || '',
    email: apiUser.email || '',
    firstName: apiUser.firstName || '',
    lastName: apiUser.lastName || '',
    phone: apiUser.phone,
    avatar: apiUser.avatar,
    isEmailVerified: apiUser.isEmailVerified ?? false,
    // companyId viene del login, pero puede no existir en datos mock
    companyId: apiUser.companyId || '',
    // Estos campos NO vienen del login, solo del perfil
    currentBranchId: apiUser.currentBranchId || '',
    availableBranches: apiUser.availableBranches || [],
    roles: apiUser.roles || [],
    permissions: apiUser.permissions || [],
    preferences: apiUser.preferences || getDefaultUserPreferences(),
    createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : now,
    updatedAt: apiUser.updatedAt ? new Date(apiUser.updatedAt) : now,
  };
}

/**
 * Obtiene preferencias por defecto para un usuario
 */
function getDefaultUserPreferences(): UserPreferences {
  return {
    language: 'es',
    timezone: 'America/Guayaquil',
    theme: 'auto',
    notifications: {
      email: true,
      push: true,
      sms: false,
      types: {
        security: true,
        updates: true,
        marketing: false,
        system: true,
      },
    },
  };
}

