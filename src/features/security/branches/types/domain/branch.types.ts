/**
 * Tipos de dominio para Sucursales
 */

import { BaseEntity, PaginationParams } from '@/src/domains/shared/types';
import { CompanyAddress } from '@/src/features/security/companies/types/domain/company.types';

export type BranchType = 'headquarters' | 'branch' | 'warehouse' | 'store';

export interface Branch extends BaseEntity {
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

export interface BranchContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  [key: string]: unknown;
}

export interface BranchSettings {
  timezone?: string;
  workingHours?: Record<string, BranchDaySchedule>;
  openHours?: string;
  maxCapacity?: number;
  services?: string[];
  features?: string[];
  [key: string]: unknown;
}

export interface BranchDaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface BranchFilters extends PaginationParams {
  search?: string;
  companyId?: string;
  code?: string;
  name?: string;
  type?: BranchType;
  status?: number;
}

export interface BranchPayload {
  companyId?: string;
  code?: string;
  name?: string;
  type?: BranchType;
  description?: string;
  address?: CompanyAddress;
  contactInfo?: BranchContactInfo;
  settings?: BranchSettings;
  status?: number;
}

