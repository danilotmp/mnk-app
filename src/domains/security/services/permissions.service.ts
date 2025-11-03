/**
 * Servicio para administración de Permisos
 * Consume endpoints del backend para CRUD de permisos
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import {
    PaginatedResponse,
    PermissionFilters,
    SecurityPermission,
} from '../types';

export class PermissionsService {
  private static readonly BASE_ENDPOINT = '/seguridades/permisos';

  /**
   * Obtener lista de permisos con paginación
   * 
   * El backend acepta page y limit como query parameters y los transforma automáticamente
   * de string a número. Los parámetros son opcionales; si no se envían, se usan valores
   * por defecto (page=1, limit=10). El límite máximo es 100.
   */
  static async getPermissions(
    filters: PermissionFilters = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<SecurityPermission>> {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar parámetros de paginación (el backend los transforma automáticamente)
      // Validar límite máximo de 100
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(100, Math.max(1, filters.limit || 10));
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      if (filters.isActive !== undefined) {
        queryParams.append('isActive', filters.isActive.toString());
      }
      if (filters.module) {
        queryParams.append('module', filters.module);
      }
      if (filters.action) {
        queryParams.append('action', filters.action);
      }

      const endpoint = `${this.BASE_ENDPOINT}?${queryParams.toString()}`;
      
      const response = await apiClient.request<PaginatedResponse<SecurityPermission>>({
        endpoint,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        const paginatedData = response.data as any;
        
        if (paginatedData.data && paginatedData.pagination) {
          return paginatedData as PaginatedResponse<SecurityPermission>;
        }
        
        if (Array.isArray(paginatedData)) {
          return {
            data: paginatedData,
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 10,
              total: paginatedData.length,
              totalPages: 1,
            },
          };
        }
        
        return paginatedData as PaginatedResponse<SecurityPermission>;
      }

      throw new Error(response.result?.description || 'Error al obtener permisos');
    } catch (error: any) {
      if (error.details || error.response?.result?.details) {
        error.details = error.details || error.response?.result?.details;
      }
      throw error;
    }
  }

  /**
   * Obtener permiso por ID
   */
  static async getPermissionById(id: string): Promise<SecurityPermission> {
    try {
      const response = await apiClient.request<SecurityPermission>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al obtener permiso');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener permiso');
    }
  }

  /**
   * Crear nuevo permiso
   */
  static async createPermission(
    permissionData: Partial<SecurityPermission>
  ): Promise<SecurityPermission> {
    try {
      const response = await apiClient.request<SecurityPermission>({
        endpoint: this.BASE_ENDPOINT,
        method: 'POST',
        body: permissionData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al crear permiso');
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear permiso');
    }
  }

  /**
   * Actualizar permiso
   */
  static async updatePermission(
    id: string,
    permissionData: Partial<SecurityPermission>
  ): Promise<SecurityPermission> {
    try {
      const response = await apiClient.request<SecurityPermission>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'PUT',
        body: permissionData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al actualizar permiso');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar permiso');
    }
  }

  /**
   * Eliminar permiso
   */
  static async deletePermission(id: string): Promise<void> {
    try {
      const response = await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'DELETE',
      });

      if (response.result?.statusCode !== SUCCESS_STATUS_CODE) {
        throw new Error(response.result?.description || 'Error al eliminar permiso');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar permiso');
    }
  }

  /**
   * Obtener permisos agrupados por módulo
   */
  static async getPermissionsByModule(): Promise<Record<string, SecurityPermission[]>> {
    try {
      const response = await apiClient.request<Record<string, SecurityPermission[]>>({
        endpoint: `${this.BASE_ENDPOINT}/por-modulo`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al obtener permisos por módulo');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener permisos por módulo');
    }
  }
}

