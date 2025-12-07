import { UserResponse } from '../types/api/user-response.types';
import { MultiCompanyUser } from '../types/multi-company.types';

/**
 * Infiere el tipo de sucursal desde el código
 */
function inferBranchType(code: string): 'headquarters' | 'branch' | 'warehouse' | 'store' {
  const upperCode = code.toUpperCase();
  if (upperCode.includes('HQ') || upperCode.includes('HEADQUARTERS') || upperCode.includes('CASA MATRIZ')) {
    return 'headquarters';
  }
  if (upperCode.includes('WAREHOUSE') || upperCode.includes('ALMACEN') || upperCode.includes('BODEGA')) {
    return 'warehouse';
  }
  if (upperCode.includes('STORE') || upperCode.includes('TIENDA') || upperCode.includes('LOCAL')) {
    return 'store';
  }
  return 'branch';
}

export class UserAdapterService {
  static toMultiCompanyUser(userResponse: UserResponse): MultiCompanyUser {
    return {
      id: userResponse.id,
      email: userResponse.email,
      firstName: userResponse.firstName,
      lastName: userResponse.lastName,
      phone: userResponse.phone,
      isEmailVerified: false,
      companyIdDefault: userResponse.companyIdDefault,
      companies: userResponse.companies.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        status: 1,
        isDefault: c.id === userResponse.companyIdDefault,
      })),
      currentBranchId: userResponse.branchIdDefault || '',
      branches: userResponse.companies.flatMap(company => 
        (company.branches || []).map(branchInfo => {
          // Crear objeto Branch completo desde BranchInfo
          const branchObj = {
            id: branchInfo.id,
            code: branchInfo.code,
            name: branchInfo.name,
            type: inferBranchType(branchInfo.code) as any,
            companyId: company.id,
            address: {
              street: '',
              city: '',
              state: '',
              country: '',
              postalCode: '',
            },
            contactInfo: {
              phone: '',
              email: '',
            },
            settings: {
              timezone: 'America/Guayaquil',
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
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          return {
            branchId: branchInfo.id,
            branch: branchObj,
          };
        })
      ),
      roles: userResponse.companies.flatMap(company => 
        (company.roles || []).map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
          description: r.description,
          permissions: [],
          isSystem: r.isSystem,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      ),
      permissions: [],
      preferences: {
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
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}


