/**
 * Tipos de API para Autenticación
 */

import { BaseEntity } from '@/src/domains/shared/types';

export interface AuthUserApi extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
}

