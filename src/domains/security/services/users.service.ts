/**
 * Servicio para administración de Usuarios
 * Consume endpoints del backend para CRUD de usuarios
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import {
  PaginatedResponse,
  SecurityUser,
  UserFilters,
  UserUpdatePayload,
} from '../types';

export class UsersService {
  private static readonly BASE_ENDPOINT = '/seguridades/usuarios';

  /**
   * Validar si un string es un UUID válido
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Obtener lista de usuarios con paginación
   * 
   * El backend acepta page y limit como query parameters y los transforma automáticamente
   * de string a número. Los parámetros son opcionales; si no se envían, se usan valores
   * por defecto (page=1, limit=10). El límite máximo es 100.
   */
  static async getUsers(
    filters: UserFilters = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<SecurityUser>> {
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
      // Solo agregar companyId si es un UUID válido
      if (filters.companyId && this.isValidUUID(filters.companyId)) {
        queryParams.append('companyId', filters.companyId);
      }
      if (filters.roleId) {
        queryParams.append('roleId', filters.roleId);
      }
      if (filters.branchId) {
        queryParams.append('branchId', filters.branchId);
      }

      const endpoint = `${this.BASE_ENDPOINT}?${queryParams.toString()}`;
      
      const response = await apiClient.request<PaginatedResponse<SecurityUser>>({
        endpoint,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        // El backend devuelve la estructura: { data: [...], meta: {...} }
        // Verificar que response.data tenga la estructura correcta de PaginatedResponse
        const paginatedData = response.data as any;
        
        // Si response.data ya tiene data y meta, devolverlo directamente
        if (paginatedData.data && paginatedData.meta) {
          return paginatedData as PaginatedResponse<SecurityUser>;
        }
        
        // Si response.data es un array (respuesta sin paginación), construir la estructura
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
        
        // Caso por defecto: asumir que response.data es el PaginatedResponse completo
        return paginatedData as PaginatedResponse<SecurityUser>;
      }

      throw new Error(response.result?.description || 'Error al obtener usuarios');
    } catch (error: any) {
      // Preservar detalles del error para mostrar en el toast
      if (error.details || error.response?.result?.details) {
        error.details = error.details || error.response?.result?.details;
      }
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getUserById(id: string): Promise<SecurityUser> {
    try {
      const response = await apiClient.request<SecurityUser>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al obtener usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener usuario');
    }
  }

  /**
   * Obtener usuario completo por ID (incluye sucursales y roles)
   */
  static async getUserByIdComplete(id: string): Promise<SecurityUser> {
    try {
      const response = await apiClient.request<SecurityUser>({
        endpoint: `${this.BASE_ENDPOINT}/${id}/completo`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al obtener usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener usuario');
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async createUser(userData: Partial<SecurityUser>): Promise<SecurityUser> {
    try {
      const response = await apiClient.request<SecurityUser>({
        endpoint: this.BASE_ENDPOINT,
        method: 'POST',
        body: userData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al crear usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear usuario');
    }
  }

  /**
   * Crear usuario completo (datos básicos + rol + sucursales)
   * Usa el endpoint POST /completo para crear el usuario con todas las relaciones en una sola llamada
   */
  static async createUserComplete(userData: UserUpdatePayload): Promise<SecurityUser> {
    try {
      const response = await apiClient.request<SecurityUser>({
        endpoint: `${this.BASE_ENDPOINT}/completo`,
        method: 'POST',
        body: userData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al crear usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear usuario');
    }
  }

  /**
   * Actualizar usuario
   */
  static async updateUser(
    id: string,
    userData: Partial<SecurityUser>
  ): Promise<SecurityUser> {
    try {
      const response = await apiClient.request<SecurityUser>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'PUT',
        body: userData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al actualizar usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar usuario');
    }
  }

  /**
   * Actualizar usuario completo (datos básicos + rol + sucursales)
   */
  static async updateUserComplete(
    id: string,
    userData: UserUpdatePayload
  ): Promise<SecurityUser> {
    try {
      const response = await apiClient.request<SecurityUser>({
        endpoint: `${this.BASE_ENDPOINT}/${id}/completo`,
        method: 'PUT',
        body: userData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al actualizar usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar usuario');
    }
  }

  /**
   * Eliminar usuario (soft delete)
   */
  static async deleteUser(id: string): Promise<void> {
    try {
      const response = await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'DELETE',
      });

      if (response.result?.statusCode !== SUCCESS_STATUS_CODE) {
        throw new Error(response.result?.description || 'Error al eliminar usuario');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar usuario');
    }
  }

  /**
   * Activar/Desactivar usuario
   */
  static async toggleUserStatus(id: string, isActive: boolean): Promise<SecurityUser> {
    try {
      const response = await apiClient.request<SecurityUser>({
        endpoint: `${this.BASE_ENDPOINT}/${id}/toggle-status`,
        method: 'PATCH',
        body: { isActive },
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return response.data;
      }

      throw new Error(response.result?.description || 'Error al cambiar estado del usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al cambiar estado del usuario');
    }
  }
}

