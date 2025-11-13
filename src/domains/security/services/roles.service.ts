/**
 * Servicio para administración de Roles
 * Consume endpoints del backend para CRUD de roles
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import {
    PaginatedResponse,
    RoleFilters,
    SecurityRole
} from '../types';

export class RolesService {
  private static readonly BASE_ENDPOINT = '/seguridades/roles';

  /**
   * Obtener lista de roles con paginación
   * 
   * El backend acepta page y limit como query parameters y los transforma automáticamente
   * de string a número. Los parámetros son opcionales; si no se envían, se usan valores
   * por defecto (page=1, limit=10). El límite máximo es 100.
   */
  static async getRoles(
    filters: RoleFilters = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<SecurityRole>> {
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
      if (filters.status !== undefined) {
        queryParams.append('status', filters.status.toString());
      }
      if (filters.isSystem !== undefined) {
        queryParams.append('isSystem', filters.isSystem.toString());
      }

      const endpoint = `${this.BASE_ENDPOINT}?${queryParams.toString()}`;
      
      const response = await apiClient.request<PaginatedResponse<SecurityRole>>({
        endpoint,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        const paginatedData = response.data as any;
        
        if (paginatedData.data && paginatedData.meta) {
          return paginatedData as PaginatedResponse<SecurityRole>;
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
        
        return paginatedData as PaginatedResponse<SecurityRole>;
      }

      throw new Error(response.result?.description || 'Error al obtener roles');
    } catch (error: any) {
      if (error.details || error.response?.result?.details) {
        error.details = error.details || error.response?.result?.details;
      }
      throw error;
    }
  }

  /**
   * Obtener rol por ID
   */
  static async getRoleById(id: string): Promise<SecurityRole> {
    try {
      const response = await apiClient.request<SecurityRole>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al obtener rol');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener rol');
    }
  }

  /**
   * Crear nuevo rol
   */
  static async createRole(roleData: Partial<SecurityRole>): Promise<SecurityRole> {
    try {
      const response = await apiClient.request<SecurityRole>({
        endpoint: this.BASE_ENDPOINT,
        method: 'POST',
        body: roleData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al crear rol');
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear rol');
    }
  }

  /**
   * Actualizar rol
   */
  static async updateRole(
    id: string,
    roleData: Partial<SecurityRole>
  ): Promise<SecurityRole> {
    try {
      const response = await apiClient.request<SecurityRole>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'PUT',
        body: roleData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al actualizar rol');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar rol');
    }
  }

  /**
   * Eliminar rol
   */
  static async deleteRole(id: string): Promise<void> {
    try {
      const response = await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'DELETE',
      });

      if (response.result?.statusCode !== SUCCESS_STATUS_CODE) {
        throw new Error(response.result?.description || 'Error al eliminar rol');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar rol');
    }
  }

  /**
   * Asignar permisos a rol
   */
  static async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<SecurityRole> {
    try {
      const response = await apiClient.request<SecurityRole>({
        endpoint: `${this.BASE_ENDPOINT}/${roleId}/permisos`,
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

  /**
   * Remover permisos de rol
   */
  static async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<SecurityRole> {
    try {
      const response = await apiClient.request<SecurityRole>({
        endpoint: `${this.BASE_ENDPOINT}/${roleId}/permisos`,
        method: 'DELETE',
        body: { permissionIds },
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al remover permisos');
    } catch (error: any) {
      throw new Error(error.message || 'Error al remover permisos');
    }
  }
}

