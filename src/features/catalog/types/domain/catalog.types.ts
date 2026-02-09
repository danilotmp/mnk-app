/**
 * Tipos de dominio para Catálogos
 */

import { BaseEntity, PaginationParams } from '@/src/domains/shared/types';

export interface Catalog extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  tableName?: string;
  status: number;
  statusDescription: string;
  items?: CatalogItem[];
}

export interface CatalogItem extends BaseEntity {
  catalogId: string;
  code: string;
  value: string;
  description?: string;
  order?: number;
  metadata?: Record<string, any>;
  status: number;
  statusDescription: string;
  catalog?: Pick<Catalog, 'id' | 'code' | 'name'>;
}

export interface CatalogFilters extends PaginationParams {
  search?: string;
  code?: string;
  name?: string;
  status?: number;
}

export interface CatalogItemFilters extends PaginationParams {
  search?: string;
  catalogId?: string;
  code?: string;
  value?: string;
  status?: number;
}

export interface CatalogPayload {
  code?: string;
  name?: string;
  description?: string;
  tableName?: string;
  status?: number;
}

export interface CatalogItemPayload {
  catalogId?: string;
  code?: string;
  value?: string;
  description?: string;
  order?: number;
  metadata?: Record<string, any>;
  status?: number;
}

