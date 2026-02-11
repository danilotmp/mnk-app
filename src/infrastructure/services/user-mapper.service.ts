/**
 * Servicio para mapear datos de usuario del API al formato MultiCompanyUser
 * Actualizado para usar la nueva estructura UserResponse del backend
 */

import {
  Branch,
  BranchAccess,
  CompanyInfo,
  MultiCompanyUser,
  Role,
  UserPreferences,
} from "@/src/domains/shared/types";
import { UserResponse } from "@/src/domains/shared/types/api/user-response.types";
import { inferBranchType } from "@/src/features/security/branches/utils/branch-type.utils";

/**
 * Mapea UserResponse (nueva estructura del backend) a MultiCompanyUser (estructura interna)
 */
export function mapUserResponseToMultiCompanyUser(
  userResponse: UserResponse,
): MultiCompanyUser {
  const now = new Date();

  // Mapear companies: UserResponse.companies[] → MultiCompanyUser.companies[]
  const companiesArray = Array.isArray(userResponse.companies)
    ? userResponse.companies
    : [];

  const companies: CompanyInfo[] = companiesArray.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    status: 1,
    isDefault: c.id === userResponse.companyIdDefault,
  }));

  // Mapear branches: Extraer branches anidados de cada empresa
  // LOGS SESSION STORAGE: Aquí se agregará el log del mapeo de branches

  const availableBranches: BranchAccess[] = [];

  // Iterar sobre cada empresa y extraer sus branches
  for (const company of companiesArray) {
    if (company.branches && Array.isArray(company.branches)) {
      for (const branch of company.branches) {
        // Crear objeto Branch completo con todos los campos requeridos
        // companyId viene del contexto de la empresa padre
        // type se infiere del código
        const branchObj: Branch = {
          id: branch.id,
          code: branch.code,
          name: branch.name,
          type: inferBranchType(branch.code) as any, // Inferir tipo desde el código
          companyId: company.id, // Usar id de la empresa padre
          address: {
            street: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
          },
          contactInfo: {
            phone: "",
            email: "",
          },
          settings: {
            timezone: "America/Guayaquil",
            workingHours: {
              monday: { isOpen: false },
              tuesday: { isOpen: false },
              wednesday: { isOpen: false },
              thursday: { isOpen: false },
              friday: { isOpen: false },
              saturday: { isOpen: false },
              sunday: { isOpen: false },
            },
            services: [],
            features: [],
          },
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        const branchAccess: BranchAccess = {
          branchId: branch.id,
          branch: branchObj,
        };
        availableBranches.push(branchAccess);
      }
    }
  }

  // Mapear roles: UserResponse.companies[].roles[] → MultiCompanyUser.roles[]
  const roles: Role[] = [];
  for (const company of companiesArray) {
    if (company.roles && Array.isArray(company.roles)) {
      for (const roleInfo of company.roles) {
        roles.push({
          id: roleInfo.id,
          code: roleInfo.code,
          name: roleInfo.name,
          description: roleInfo.description,
          permissions: [],
          isSystem: roleInfo.isSystem,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  const mappedUser = {
    id: userResponse.id,
    email: userResponse.email,
    firstName: userResponse.firstName,
    lastName: userResponse.lastName,
    phone: userResponse.phone,
    avatar: undefined,
    isEmailVerified: false,
    companyIdDefault: userResponse.companyIdDefault,
    companies: companies,
    currentBranchId: userResponse.branchIdDefault || "",
    branches: availableBranches, // Mantener mismo nombre que el backend
    roles: roles,
    permissions: [],
    preferences: getDefaultUserPreferences(),
    createdAt: now,
    updatedAt: now,
  };

  // LOGS SESSION STORAGE: Aquí se agregará el log del usuario mapeado antes de guardar en session storage

  return mappedUser;
}

/**
 * Mapea la respuesta del API de login (datos mínimos) a MultiCompanyUser
 * Compatibilidad temporal para el login que aún puede devolver estructura antigua
 */
export function mapApiUserToMultiCompanyUser(apiUser: any): MultiCompanyUser {
  // Si ya es UserResponse, usar el mapeo directo
  if (
    apiUser.companies &&
    Array.isArray(apiUser.companies) &&
    apiUser.companyIdDefault
  ) {
    return mapUserResponseToMultiCompanyUser(apiUser as UserResponse);
  }

  // Mapeo legacy para compatibilidad
  const now = new Date();
  const companyIdDefault = apiUser.companyIdDefault || apiUser.companyId || "";

  let companies: CompanyInfo[] = [];
  if (apiUser.companies && apiUser.companies.length > 0) {
    companies = apiUser.companies.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      status: c.status || 1,
      isDefault: c.isDefault || c.id === companyIdDefault,
    }));
  } else if (companyIdDefault) {
    companies = [
      {
        id: companyIdDefault,
        code: apiUser.companyCode || "",
        name: "",
        status: 1,
        isDefault: true,
      },
    ];
  }

  return {
    id: apiUser.id || "",
    email: apiUser.email || "",
    firstName: apiUser.firstName || "",
    lastName: apiUser.lastName || "",
    phone: apiUser.phone,
    avatar: apiUser.avatar,
    isEmailVerified: apiUser.isEmailVerified ?? false,
    companyIdDefault: companyIdDefault,
    companies: companies,
    currentBranchId: apiUser.currentBranchId || apiUser.branchIdDefault || "",
    branches: apiUser.branches || apiUser.availableBranches || [], // Compatibilidad con estructura antigua
    roles: apiUser.userRoles || apiUser.roles || [],
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
    language: "es",
    timezone: "America/Guayaquil",
    theme: "auto",
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
