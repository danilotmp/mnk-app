/**
 * Tipos de API para Sucursales
 */

import { BaseEntity } from '@/src/domains/shared/types';
import { BranchType, BranchContactInfo, BranchSettings } from '../domain/branch.types';
import { CompanyAddress } from '@/src/features/security/companies/types/domain/company.types';

export interface BranchApi extends BaseEntity {
  companyId: string;
  code: string;
  name: string;
  type?: BranchType;
  description?: string;
  address?: CompanyAddress;
  contactInfo?: BranchContactInfo;
  settings?: BranchSettings;
  status: number;
  statusDescription: string;
  company?: {
    id: string;
    code: string;
    name: string;
  };
}

