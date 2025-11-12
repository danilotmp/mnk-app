/**
 * Tipos para el módulo de Catálogos
 * Sistema multi-tabla para catálogos dinámicos
 */

import { BaseEntity, PaginationParams } from '../../shared/types';

/**
 * Catálogo (Cabecera)
 * Representa un tipo de catálogo (Ej: "Tipos de Documento", "Estados Civiles", etc.)
 */
export interface Catalog extends BaseEntity {
  code: string; // Código único del catálogo (ej: "DOC_TYPES")
  name: string; // Nombre del catálogo
  description?: string;
  tableName?: string; // Nombre de tabla asociada (opcional)
  
  // Sistema de estados
  status: number;
  statusDescription: string;
  
  // Relaciones
  items?: CatalogItem[]; // Items que pertenecen a este catálogo
}

/**
 * Item de Catálogo (Detalle)
 * Representa un valor específico dentro de un catálogo
 */
export interface CatalogItem extends BaseEntity {
  catalogId: string; // ID del catálogo padre
  code: string; // Código único del item (ej: "DNI", "PASSPORT")
  value: string; // Valor/nombre del item
  description?: string;
  order?: number; // Orden de visualización
  metadata?: Record<string, any>; // Datos adicionales en JSON
  
  // Sistema de estados
  status: number;
  statusDescription: string;
  
  // Relación inversa
  catalog?: Pick<Catalog, 'id' | 'code' | 'name'>;
}

/**
 * Filtros para Catálogos
 */
export interface CatalogFilters extends PaginationParams {
  search?: string;
  code?: string;
  name?: string;
  status?: number;
}

/**
 * Filtros para Items de Catálogo
 */
export interface CatalogItemFilters extends PaginationParams {
  search?: string;
  catalogId?: string; // Filtrar por catálogo padre
  code?: string;
  value?: string;
  status?: number;
}

/**
 * Payload para crear/actualizar Catálogo
 */
export interface CatalogPayload {
  code?: string;
  name?: string;
  description?: string;
  tableName?: string;
  status?: number;
}

/**
 * Payload para crear/actualizar Item de Catálogo
 */
export interface CatalogItemPayload {
  catalogId?: string;
  code?: string;
  value?: string;
  description?: string;
  order?: number;
  metadata?: Record<string, any>;
  status?: number;
}

