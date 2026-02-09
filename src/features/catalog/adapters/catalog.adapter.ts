/**
 * Adaptadores para transformar datos de API a modelos de dominio para Catálogos
 */

import { Catalog, CatalogItem } from '../types/domain/catalog.types';
import { CatalogApi, CatalogItemApi } from '../types/api/catalog-api.types';

export function catalogAdapter(apiCatalog: CatalogApi): Catalog {
  return {
    id: apiCatalog.id,
    createdAt: apiCatalog.createdAt,
    updatedAt: apiCatalog.updatedAt,
    code: apiCatalog.code,
    name: apiCatalog.name,
    description: apiCatalog.description,
    tableName: apiCatalog.tableName,
    status: apiCatalog.status,
    statusDescription: apiCatalog.statusDescription,
    items: apiCatalog.items,
  };
}

export function catalogsAdapter(apiCatalogs: CatalogApi[]): Catalog[] {
  return apiCatalogs.map(catalogAdapter);
}

export function catalogItemAdapter(apiItem: CatalogItemApi): CatalogItem {
  return {
    id: apiItem.id,
    createdAt: apiItem.createdAt,
    updatedAt: apiItem.updatedAt,
    catalogId: apiItem.catalogId,
    code: apiItem.code,
    value: apiItem.value,
    description: apiItem.description,
    order: apiItem.order,
    metadata: apiItem.metadata,
    status: apiItem.status,
    statusDescription: apiItem.statusDescription,
    catalog: apiItem.catalog,
  };
}

export function catalogItemsAdapter(apiItems: CatalogItemApi[]): CatalogItem[] {
  return apiItems.map(catalogItemAdapter);
}

