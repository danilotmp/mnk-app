/**
 * Adaptador para transformar datos de API a modelos de dominio para Empresas
 */

import { Company } from '../types/domain/company.types';
import { CompanyApi } from '../types/api/company-api.types';

export function companyAdapter(apiCompany: CompanyApi): Company {
  return {
    id: apiCompany.id,
    createdAt: apiCompany.createdAt,
    updatedAt: apiCompany.updatedAt,
    code: apiCompany.code,
    name: apiCompany.name,
    email: apiCompany.email,
    description: apiCompany.description,
    phone: apiCompany.phone,
    address: apiCompany.address,
    settings: apiCompany.settings,
    subscriptionPlan: apiCompany.subscriptionPlan,
    status: apiCompany.status,
    statusDescription: apiCompany.statusDescription,
  };
}

export function companiesAdapter(apiCompanies: CompanyApi[]): Company[] {
  return apiCompanies.map(companyAdapter);
}

