/**
 * Tipos de API para Catálogos
 */

import { BaseEntity } from '@/src/domains/shared/types';
import { CatalogItem } from '../domain/catalog.types';

export interface CatalogApi extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  tableName?: string;
  status: number;
  statusDescription: string;
  items?: CatalogItem[];
}

export interface CatalogItemApi extends BaseEntity {
  catalogId: string;
  code: string;
  value: string;
  description?: string;
  order?: number;
  metadata?: Record<string, any>;
  status: number;
  statusDescription: string;
  catalog?: {
    id: string;
    code: string;
    name: string;
  };
}

