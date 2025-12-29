/**
 * Servicio para gestión de Catálogos (Cabeceras)
 */

import { PaginatedResponse } from '@/src/domains/shared/types';
import { mapObject } from '@/src/domains/shared/utils/object-mapper';
import { apiClient } from '@/src/infrastructure/api/api.client';
import { Catalog, CatalogFilters, CatalogPayload, CatalogQueryPayload, CatalogQueryResponse } from '../types';

// Helper para construir querystring
const buildQuery = (base: string, params?: Record<string, any>): string => {
  if (!params) return base;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${base}?${qs}` : base;
};

export class CatalogService {
  private static readonly BASE_ENDPOINT = '/seguridades/catalogos';

  /**
   * Obtener lista de catálogos
   */
  static async getCatalogs(filters: CatalogFilters): Promise<PaginatedResponse<Catalog>> {
    try {
      const response = await apiClient.request<PaginatedResponse<Catalog>>({
        endpoint: this.BASE_ENDPOINT,
        method: 'GET',
        params: filters,
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener catálogos');
    }
  }

  /**
   * Obtener un catálogo por ID
   */
  static async getCatalogById(id: string): Promise<Catalog> {
    try {
      const response = await apiClient.request<{ data: Catalog }>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'GET',
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener catálogo');
    }
  }

  /**
   * Crear un catálogo
   */
  static async createCatalog(data: CatalogPayload): Promise<Catalog> {
    try {
      const response = await apiClient.request<{ data: Catalog }>({
        endpoint: this.BASE_ENDPOINT,
        method: 'POST',
        body: data,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear catálogo');
    }
  }

  /**
   * Actualizar un catálogo
   */
  static async updateCatalog(id: string, data: CatalogPayload): Promise<Catalog> {
    try {
      const response = await apiClient.request<{ data: Catalog }>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'PUT',
        body: data,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar catálogo');
    }
  }

  /**
   * Eliminar un catálogo (soft delete, cambia status a -1)
   */
  static async deleteCatalog(id: string): Promise<void> {
    try {
      await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'DELETE',
      });
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar catálogo');
    }
  }

  /**
   * Obtener catálogos activos (helper para dropdowns)
   */
  static async getActiveCatalogs(): Promise<Catalog[]> {
    try {
      const response = await this.getCatalogs({
        page: 1,
        limit: 1000,
        status: 1, // Solo activos
      });
      return response.data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener catálogos activos');
    }
  }

  /**
   * Consultar catálogo por código
   * POST /api/catalogs/query?companyId=uuid&admin=false
   * 
   * @param code Código del catálogo a consultar (ej: "INDUSTRIES")
   * @param companyId ID de la empresa
   * @param admin Si es true, incluye datos administrativos
   * @returns Respuesta con el catálogo y sus detalles
   */
  static async queryCatalog(
    code: string,
    companyId: string,
    admin: boolean = false
  ): Promise<CatalogQueryResponse> {
    try {
      const endpoint = buildQuery('/catalogs/query', { 
        companyId, 
        admin: admin.toString() 
      });
      
      const payload: CatalogQueryPayload = { code };
      const response = await apiClient.post<CatalogQueryResponse>(endpoint, payload);
      
      // Usar mapper para auto-mapear campos con mismo nombre
      // El backend devuelve details (no entries), y el mapper lo maneja automáticamente
      return mapObject<CatalogQueryResponse>(response.data, {
        deep: true, // Mapear recursivamente details
      }) as CatalogQueryResponse;
    } catch (error: any) {
      throw new Error(error.message || 'Error al consultar catálogo');
    }
  }
}

