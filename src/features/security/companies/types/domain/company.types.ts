/**
 * Tipos de dominio para Empresas
 */

import { BaseEntity, PaginationParams } from '@/src/domains/shared/types';

export interface Company extends BaseEntity {
  code: string;
  name: string;
  email: string;
  description?: string;
  phone?: string;
  address?: CompanyAddress;
  settings?: CompanySettings;
  subscriptionPlan?: CompanySubscriptionPlan;
  status: number;
  statusDescription: string;
}

export interface CompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface CompanySettings {
  timezone?: string;
  currency?: string;
  language?: string;
  dateFormat?: string;
  features?: string[];
  [key: string]: unknown;
}

export interface CompanySubscriptionPlan {
  id?: string;
  plan?: string;
  name?: string;
  features?: string[];
  maxUsers?: number;
  maxBranches?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface CompanyFilters extends PaginationParams {
  search?: string;
  code?: string;
  name?: string;
  email?: string;
  status?: number;
}

export interface CompanyPayload {
  code?: string;
  name?: string;
  email?: string;
  description?: string;
  phone?: string;
  address?: CompanyAddress;
  settings?: CompanySettings;
  subscriptionPlan?: CompanySubscriptionPlan;
  isActive?: boolean;
}

