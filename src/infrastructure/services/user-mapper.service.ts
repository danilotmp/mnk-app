/**
 * Servicio para mapear datos de usuario del API al formato MultiCompanyUser
 * Basado en la estructura real del API según Swagger y Postman
 */

import { MultiCompanyUser, UserPreferences } from '@/src/domains/shared/types';

/**
 * Estructura real de la respuesta del login API
 * Actualizada según cambios del backend: companyId → companyIdDefault, agregado companies array
 */
export interface ApiLoginUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyIdDefault?: string; // Renombrado de companyId
  companyId?: string; // Mantener por compatibilidad temporal
  companies?: Array<{ // Array de empresas del usuario
    id: string;
    code: string;
    name: string;
    status: number;
    isDefault: boolean;
  }>;
  // Campos opcionales que pueden venir del perfil
  phone?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  companyCode?: string; // Mantener por compatibilidad temporal
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
 * Actualizado para usar companyIdDefault y companies array
 */
export function mapApiUserToMultiCompanyUser(
  apiUser: ApiLoginUserResponse | Partial<ApiLoginUserResponse>
): MultiCompanyUser {
  const now = new Date();
  // Determinar companyIdDefault: usar companyIdDefault si existe, sino companyId (compatibilidad temporal)
  const companyIdDefault = apiUser.companyIdDefault || apiUser.companyId || '';
  
  // Obtener companies array: usar companies si existe, sino crear uno desde companyIdDefault/companyId
  let companies: Array<{ id: string; code: string; name: string; status: number; isDefault: boolean }> = [];
  if (apiUser.companies && apiUser.companies.length > 0) {
    companies = apiUser.companies;
  } else if (companyIdDefault) {
    // Si no hay companies array pero hay companyIdDefault, crear uno básico (compatibilidad temporal)
    companies = [{
      id: companyIdDefault,
      code: apiUser.companyCode || '',
      name: '', // Se completará desde el servicio
      status: 1,
      isDefault: true,
    }];
  }
  
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
    // companyIdDefault: usar el nuevo campo, con fallback a companyId para compatibilidad
    companyIdDefault: companyIdDefault,
    // companies array: usar el array del API o uno creado desde companyIdDefault
    companies: companies,
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

