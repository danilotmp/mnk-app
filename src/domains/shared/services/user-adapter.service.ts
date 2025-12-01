import { UserResponse } from '../types/api/user-response.types';
import { MultiCompanyUser } from '../types/multi-company.types';

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
      branches: (userResponse.branches || []).map(b => ({
        branchId: b.id,
        branch: {
          id: b.id,
          companyId: b.companyId,
          name: b.name,
          code: b.code,
          type: b.type as any,
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
        },
      })),
      roles: (userResponse.rolesByCompany || []).flatMap(rc => 
        rc.roles.map(r => ({
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


