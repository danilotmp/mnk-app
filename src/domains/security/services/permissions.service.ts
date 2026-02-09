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
  private static readonly BASE_ENDPOINT = '/security/permissions';

  /**
   * Obtener lista de permisos con paginación
   * 
   * El backend acepta page y limit como query parameters y los transforma automáticamente
   * de string a número. Los parámetros son opcionales; si no se envían, se usan valores
   * por defecto (page=1, limit=10). El límite máximo es 100.
   */
  static async getPermissions(
    filters: PermissionFilters = {}
  ): Promise<PaginatedResponse<SecurityPermission>> {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar parámetros de paginación solo si se proporcionan
      // Si no se proporcionan, el backend usará valores por defecto
      if (filters.page !== undefined) {
        const page = Math.max(1, filters.page);
        queryParams.append('page', page.toString());
      }
      if (filters.limit !== undefined) {
        const limit = Math.min(100, Math.max(1, filters.limit));
        queryParams.append('limit', limit.toString());
      }
      
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
        
        // Función helper para normalizar menuItemIds
        const normalizePermission = (permission: any): SecurityPermission => {
          // Normalizar menuItemIds - el backend puede devolverlo con diferentes nombres o estructuras
          // Siempre intentar normalizar, incluso si ya existe menuItemIds
          if (permission.menuItems && Array.isArray(permission.menuItems) && permission.menuItems.length > 0) {
            // Si viene como array de objetos, extraer los IDs
            const extractedIds = permission.menuItems.map((item: any) => item.id || item).filter((id: any) => id != null);
            if (extractedIds.length > 0) {
              permission.menuItemIds = extractedIds;
            }
          } else if (permission.MenuItemIds && Array.isArray(permission.MenuItemIds) && permission.MenuItemIds.length > 0) {
            // Si viene como MenuItemIds (con mayúscula)
            permission.menuItemIds = permission.MenuItemIds;
          } else if (!permission.menuItemIds || !Array.isArray(permission.menuItemIds)) {
            // Si no hay ninguna variante, usar array vacío
            permission.menuItemIds = [];
          }
          
          // Asegurar que menuItemIds sea un array válido
          if (!Array.isArray(permission.menuItemIds)) {
            permission.menuItemIds = [];
          }
          
          return permission as SecurityPermission;
        };
        
        if (paginatedData.data && paginatedData.meta) {
          // Normalizar cada permiso en la lista
          paginatedData.data = paginatedData.data.map(normalizePermission);
          return paginatedData as PaginatedResponse<SecurityPermission>;
        }
        
        if (Array.isArray(paginatedData)) {
          // Normalizar cada permiso en la lista
          const normalizedData = paginatedData.map(normalizePermission);
          return {
            data: normalizedData,
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
        const permission = response.data as any;
        
        // Normalizar menuItemIds - el backend puede devolverlo con diferentes nombres o estructuras
        if (!permission.menuItemIds || (Array.isArray(permission.menuItemIds) && permission.menuItemIds.length === 0)) {
          // Intentar diferentes variantes del nombre
          if (permission.MenuItemIds && Array.isArray(permission.MenuItemIds) && permission.MenuItemIds.length > 0) {
            permission.menuItemIds = permission.MenuItemIds;
          } else if (permission.menuItems && Array.isArray(permission.menuItems)) {
            // Si viene como array de objetos, extraer los IDs
            permission.menuItemIds = permission.menuItems.map((item: any) => item.id || item).filter((id: any) => id != null);
          } else {
            // Si no hay ninguna variante, usar array vacío
            permission.menuItemIds = [];
          }
        }
        
        // Asegurar que menuItemIds sea un array válido
        if (!Array.isArray(permission.menuItemIds)) {
          permission.menuItemIds = [];
        }
        
        return permission as SecurityPermission;
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
        endpoint: `${this.BASE_ENDPOINT}/by-module`,
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

  /**
   * Actualizar permisos masivamente
   * Recibe una lista de cambios de permisos por ruta
   */
  static async updatePermissionsBulk(changes: Array<{ route: string; view: boolean; create: boolean; edit: boolean; delete: boolean }>): Promise<void> {
    try {
      const response = await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/bulk`,
        method: 'PUT',
        body: { changes },
      });

      if (response.result?.statusCode !== SUCCESS_STATUS_CODE) {
        throw new Error(response.result?.description || 'Error al actualizar permisos masivamente');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar permisos masivamente');
    }
  }
}

