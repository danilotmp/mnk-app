/**
 * Tipos de API para Empresas
 */

import { BaseEntity } from '@/src/domains/shared/types';
import { CompanyAddress, CompanySettings, CompanySubscriptionPlan } from '../domain/company.types';

export interface CompanyApi extends BaseEntity {
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

