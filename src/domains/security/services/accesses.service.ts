/**
 * Servicio para administración de Accesos
 * Consume endpoints del backend para gestionar accesos de usuarios
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import {
    AccessFilters,
    PaginatedResponse,
    SecurityAccess,
} from '../types';

export class AccessesService {
  private static readonly BASE_ENDPOINT = '/seguridades/accesos';

  /**
   * Obtener lista de accesos con paginación
   * 
   * El backend acepta page y limit como query parameters y los transforma automáticamente
   * de string a número. Los parámetros son opcionales; si no se envían, se usan valores
   * por defecto (page=1, limit=10). El límite máximo es 100.
   */
  static async getAccesses(
    filters: AccessFilters = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<SecurityAccess>> {
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
      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }
      if (filters.companyId) {
        queryParams.append('companyId', filters.companyId);
      }
      if (filters.branchId) {
        queryParams.append('branchId', filters.branchId);
      }
      if (filters.roleId) {
        queryParams.append('roleId', filters.roleId);
      }
      if (filters.isActive !== undefined) {
        queryParams.append('isActive', filters.isActive.toString());
      }

      const endpoint = `${this.BASE_ENDPOINT}?${queryParams.toString()}`;
      
      const response = await apiClient.request<PaginatedResponse<SecurityAccess>>({
        endpoint,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        const paginatedData = response.data as any;
        
        if (paginatedData.data && paginatedData.meta) {
          return paginatedData as PaginatedResponse<SecurityAccess>;
        }
        
        if (Array.isArray(paginatedData)) {
          return {
            data: paginatedData,
            meta: {
              page: filters.page || 1,
              limit: filters.limit || 10,
              total: paginatedData.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          };
        }
        
        return paginatedData as PaginatedResponse<SecurityAccess>;
      }

      throw new Error(response.result?.description || 'Error al obtener accesos');
    } catch (error: any) {
      if (error.details || error.response?.result?.details) {
        error.details = error.details || error.response?.result?.details;
      }
      throw error;
    }
  }

  /**
   * Obtener acceso por ID
   */
  static async getAccessById(id: string): Promise<SecurityAccess> {
    try {
      const response = await apiClient.request<SecurityAccess>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al obtener acceso');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener acceso');
    }
  }

  /**
   * Obtener accesos de un usuario específico
   */
  static async getUserAccesses(userId: string): Promise<SecurityAccess[]> {
    try {
      const response = await apiClient.request<SecurityAccess[]>({
        endpoint: `${this.BASE_ENDPOINT}/usuario/${userId}`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al obtener accesos del usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener accesos del usuario');
    }
  }

  /**
   * Crear nuevo acceso
   */
  static async createAccess(accessData: Partial<SecurityAccess>): Promise<SecurityAccess> {
    try {
      const response = await apiClient.request<SecurityAccess>({
        endpoint: this.BASE_ENDPOINT,
        method: 'POST',
        body: accessData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al crear acceso');
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear acceso');
    }
  }

  /**
   * Actualizar acceso
   */
  static async updateAccess(
    id: string,
    accessData: Partial<SecurityAccess>
  ): Promise<SecurityAccess> {
    try {
      const response = await apiClient.request<SecurityAccess>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'PUT',
        body: accessData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al actualizar acceso');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar acceso');
    }
  }

  /**
   * Eliminar acceso
   */
  static async deleteAccess(id: string): Promise<void> {
    try {
      const response = await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'DELETE',
      });

      if (response.result?.statusCode !== SUCCESS_STATUS_CODE) {
        throw new Error(response.result?.description || 'Error al eliminar acceso');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar acceso');
    }
  }

  /**
   * Asignar permisos adicionales a un acceso
   */
  static async assignPermissionsToAccess(
    accessId: string,
    permissionIds: string[]
  ): Promise<SecurityAccess> {
    try {
      const response = await apiClient.request<SecurityAccess>({
        endpoint: `${this.BASE_ENDPOINT}/${accessId}/permisos`,
        method: 'POST',
        body: { permissionIds },
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al asignar permisos');
    } catch (error: any) {
      throw new Error(error.message || 'Error al asignar permisos');
    }
  }
}

