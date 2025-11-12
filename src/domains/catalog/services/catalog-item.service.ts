/**
 * Servicio para gestión de Items de Catálogo (Detalles)
 */

import { apiClient } from '@/src/infrastructure/api/api-client';
import { CatalogItem, CatalogItemFilters, CatalogItemPayload } from '../types';
import { PaginatedResponse } from '@/src/domains/shared/types';

export class CatalogItemService {
  private static readonly BASE_ENDPOINT = '/seguridades/catalogos-items';

  /**
   * Obtener lista de items de catálogo
   */
  static async getCatalogItems(filters: CatalogItemFilters): Promise<PaginatedResponse<CatalogItem>> {
    try {
      const response = await apiClient.request<PaginatedResponse<CatalogItem>>({
        endpoint: this.BASE_ENDPOINT,
        method: 'GET',
        params: filters,
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener items de catálogo');
    }
  }

  /**
   * Obtener items por catálogo padre
   */
  static async getItemsByCatalog(catalogId: string): Promise<CatalogItem[]> {
    try {
      const response = await this.getCatalogItems({
        page: 1,
        limit: 1000,
        catalogId,
        status: 1, // Solo activos por defecto
      });
      return response.data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener items del catálogo');
    }
  }

  /**
   * Obtener un item de catálogo por ID
   */
  static async getCatalogItemById(id: string): Promise<CatalogItem> {
    try {
      const response = await apiClient.request<{ data: CatalogItem }>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'GET',
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener item de catálogo');
    }
  }

  /**
   * Crear un item de catálogo
   */
  static async createCatalogItem(data: CatalogItemPayload): Promise<CatalogItem> {
    try {
      const response = await apiClient.request<{ data: CatalogItem }>({
        endpoint: this.BASE_ENDPOINT,
        method: 'POST',
        body: data,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear item de catálogo');
    }
  }

  /**
   * Actualizar un item de catálogo
   */
  static async updateCatalogItem(id: string, data: CatalogItemPayload): Promise<CatalogItem> {
    try {
      const response = await apiClient.request<{ data: CatalogItem }>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'PUT',
        body: data,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar item de catálogo');
    }
  }

  /**
   * Eliminar un item de catálogo (soft delete, cambia status a -1)
   */
  static async deleteCatalogItem(id: string): Promise<void> {
    try {
      await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'DELETE',
      });
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar item de catálogo');
    }
  }

  /**
   * Reordenar items de un catálogo
   */
  static async reorderItems(catalogId: string, itemIds: string[]): Promise<void> {
    try {
      await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/reorder`,
        method: 'POST',
        body: {
          catalogId,
          itemIds,
        },
      });
    } catch (error: any) {
      throw new Error(error.message || 'Error al reordenar items');
    }
  }
}

