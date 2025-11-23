/**
 * Servicio de negocio para Usuarios (SSOT - Single Source of Truth)
 * Gestiona la lógica de negocio y orquesta las llamadas a la API
 * Usa adaptadores para transformar datos de API a modelos de dominio
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import { PaginatedResponse } from '@/src/domains/shared/types';
import { userAdapter, usersAdapter } from '../adapters';
import { User, UserFilters, UserUpdatePayload } from '../types/domain';
import { UserApi } from '../types/api';

export class UsersService {
  private static readonly BASE_ENDPOINT = '/security/users';

  /**
   * Validar si un string es un UUID válido
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Obtener lista de usuarios con paginación
   * Transforma automáticamente los datos de API a modelos de dominio
   */
  static async getUsers(
    filters: UserFilters = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<User>> {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar parámetros de paginación
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
      
      const response = await apiClient.request<PaginatedResponse<UserApi>>({
        endpoint,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        const paginatedData = response.data as any;
        
        // Si response.data ya tiene data y meta, transformar los datos
        if (paginatedData.data && paginatedData.meta) {
          return {
            data: usersAdapter(paginatedData.data),
            meta: paginatedData.meta,
          };
        }
        
        // Si response.data es un array, construir la estructura
        if (Array.isArray(paginatedData)) {
          return {
            data: usersAdapter(paginatedData),
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
        
        // Caso por defecto
        return {
          data: usersAdapter(Array.isArray(paginatedData) ? paginatedData : [paginatedData]),
          meta: paginatedData.meta || {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      throw new Error(response.result?.description || 'Error al obtener usuarios');
    } catch (error: any) {
      if (error.details || error.response?.result?.details) {
        error.details = error.details || error.response?.result?.details;
      }
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   * Transforma automáticamente los datos de API a modelo de dominio
   */
  static async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.request<UserApi>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return userAdapter(response.data);
      }

      throw new Error(response.result?.description || 'Error al obtener usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener usuario');
    }
  }

  /**
   * Obtener usuario completo por ID (incluye sucursales y roles)
   */
  static async getUserByIdComplete(id: string): Promise<User> {
    try {
      const response = await apiClient.request<UserApi>({
        endpoint: `${this.BASE_ENDPOINT}/${id}/complete`,
        method: 'GET',
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return userAdapter(response.data);
      }

      throw new Error(response.result?.description || 'Error al obtener usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener usuario');
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async createUser(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.request<UserApi>({
        endpoint: this.BASE_ENDPOINT,
        method: 'POST',
        body: userData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return userAdapter(response.data);
      }

      const errorPayload = new Error(
        response.result?.description || 'Error al crear usuario'
      );
      (errorPayload as any).result = response.result;
      (errorPayload as any).details = response.result?.details;

      throw errorPayload;
    } catch (error: any) {
      if (error?.result || error?.details) {
        throw error;
      }

      const genericError = new Error(
        error?.message || error?.result?.description || 'Error al crear usuario'
      );
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;

      throw genericError;
    }
  }

  /**
   * Actualizar usuario
   */
  static async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<User> {
    try {
      const response = await apiClient.request<UserApi>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: 'PUT',
        body: userData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return userAdapter(response.data);
      }

      const errorPayload = new Error(
        response.result?.description || 'Error al actualizar usuario'
      );
      (errorPayload as any).result = response.result;
      (errorPayload as any).details = response.result?.details;

      throw errorPayload;
    } catch (error: any) {
      if (error?.result || error?.details) {
        throw error;
      }

      const genericError = new Error(
        error?.message || error?.result?.description || 'Error al actualizar usuario'
      );
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;

      throw genericError;
    }
  }

  /**
   * Actualizar usuario completo (datos básicos + rol + sucursales)
   */
  static async updateUserComplete(
    id: string,
    userData: UserUpdatePayload
  ): Promise<User> {
    try {
      const response = await apiClient.request<UserApi>({
        endpoint: `${this.BASE_ENDPOINT}/${id}/complete`,
        method: 'PUT',
        body: userData,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return userAdapter(response.data);
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
        const errorPayload = new Error(
          response.result?.description || 'Error al eliminar usuario'
        );
        (errorPayload as any).result = response.result;
        (errorPayload as any).details = response.result?.details;
        throw errorPayload;
      }
    } catch (error: any) {
      if (error?.result || error?.details) {
        throw error;
      }

      const genericError = new Error(
        error?.message || error?.result?.description || 'Error al eliminar usuario'
      );
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;

      throw genericError;
    }
  }

  /**
   * Activar/Desactivar usuario
   */
  static async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    try {
      const response = await apiClient.request<UserApi>({
        endpoint: `${this.BASE_ENDPOINT}/${id}/toggle-status`,
        method: 'PATCH',
        body: { isActive },
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return userAdapter(response.data);
      }

      throw new Error(response.result?.description || 'Error al cambiar estado del usuario');
    } catch (error: any) {
      throw new Error(error.message || 'Error al cambiar estado del usuario');
    }
  }
}

