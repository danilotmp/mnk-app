/**
 * Tipos de API para Roles
 */

import { BaseEntity } from '@/src/domains/shared/types';
import { SecurityPermission } from '@/src/domains/security/types';

export interface RoleApi extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  companyId?: string;
  status: number;
  statusDescription: string;
  permissions: SecurityPermission[];
}

