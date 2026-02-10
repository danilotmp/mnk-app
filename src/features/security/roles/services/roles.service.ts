/**
 * Servicio para administración de Roles
 * Consume endpoints del backend para CRUD de roles
 */

import { PaginatedResponse } from "@/src/domains/shared/types";
import { apiClient, ApiError } from "@/src/infrastructure/api/api.client";
import { SUCCESS_STATUS_CODE } from "@/src/infrastructure/api/constants";
import { roleAdapter, rolesAdapter } from "../adapters";
import { RoleApi } from "../types/api";
import { Role, RoleFilters } from "../types/domain";

export class RolesService {
  private static readonly BASE_ENDPOINT = "/security/roles";

  /**
   * Obtener lista de roles.
   * Solo incluye page/limit en la URL cuando se pasan (uso en tablas).
   * Para dropdowns/formularios invocar sin page/limit: getRoles({ status: 1 }) o getRoles({ companyId, status: 1 }).
   *
   * companyId es opcional:
   * - Si no se envía, el backend usa la empresa del usuario autenticado (token/BD).
   *   Usuario no super admin: siempre filtra por su empresa. Super admin: sin filtro (ve todo).
   * - Si se envía, el backend valida acceso y filtra por esa empresa (super admin puede navegar entre empresas).
   */
  static async getRoles(
    filters: Partial<RoleFilters> = {},
  ): Promise<PaginatedResponse<Role>> {
    try {
      const queryParams = new URLSearchParams();

      const hasPagination =
        filters.page !== undefined && filters.limit !== undefined;
      if (hasPagination) {
        const page = Math.max(1, filters.page ?? 1);
        const limit = Math.min(100, Math.max(1, filters.limit ?? 10));
        queryParams.append("page", page.toString());
        queryParams.append("limit", limit.toString());
      }

      if (filters.sortBy) {
        queryParams.append("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        queryParams.append("sortOrder", filters.sortOrder);
      }
      if (filters.search) {
        queryParams.append("search", filters.search);
      }
      if (filters.status !== undefined) {
        queryParams.append("status", filters.status.toString());
      }
      if (filters.isSystem !== undefined) {
        queryParams.append("isSystem", filters.isSystem ? "true" : "false");
      }
      // companyId opcional: si viene en filtros (ej. empresa actual del contexto) se envía para filtrar/navegar
      if (filters.companyId) {
        queryParams.append("companyId", filters.companyId);
      }

      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${this.BASE_ENDPOINT}?${queryString}`
        : this.BASE_ENDPOINT;

      const response = await apiClient.request<PaginatedResponse<RoleApi>>({
        endpoint,
        method: "GET",
      });

      if (
        response.result?.statusCode === SUCCESS_STATUS_CODE &&
        response.data
      ) {
        const paginatedData = response.data as any;

        if (paginatedData.data && paginatedData.meta) {
          return {
            data: rolesAdapter(paginatedData.data),
            meta: paginatedData.meta,
          };
        }

        if (Array.isArray(paginatedData)) {
          return {
            data: rolesAdapter(paginatedData),
            meta: {
              page: filters.page ?? 1,
              limit: filters.limit ?? 10,
              total: paginatedData.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          };
        }

        return {
          data: rolesAdapter(
            Array.isArray(paginatedData) ? paginatedData : [paginatedData],
          ),
          meta: paginatedData.meta || {
            page: filters.page ?? 1,
            limit: filters.limit ?? 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      throw new Error(response.result?.description || "Error al obtener roles");
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
  static async getRoleById(id: string): Promise<Role> {
    try {
      const response = await apiClient.request<RoleApi>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: "GET",
      });

      if (
        response.result?.statusCode === SUCCESS_STATUS_CODE &&
        response.data
      ) {
        return roleAdapter(response.data);
      }

      throw new Error(response.result?.description || "Error al obtener rol");
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error?.result || error?.details) {
        throw error;
      }
      const genericError = new Error(error?.message || "Error al obtener rol");
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;
      throw genericError;
    }
  }

  /**
   * Crear nuevo rol
   */
  static async createRole(roleData: Partial<Role>): Promise<Role> {
    try {
      const response = await apiClient.request<RoleApi>({
        endpoint: this.BASE_ENDPOINT,
        method: "POST",
        body: roleData,
      });

      if (
        response.result?.statusCode === SUCCESS_STATUS_CODE &&
        response.data
      ) {
        return roleAdapter(response.data);
      }

      throw new Error(response.result?.description || "Error al crear rol");
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error?.result || error?.details) {
        throw error;
      }
      const genericError = new Error(error?.message || "Error al crear rol");
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;
      throw genericError;
    }
  }

  /**
   * Actualizar rol
   */
  static async updateRole(id: string, roleData: Partial<Role>): Promise<Role> {
    try {
      const response = await apiClient.request<RoleApi>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: "PUT",
        body: roleData,
      });

      if (
        response.result?.statusCode === SUCCESS_STATUS_CODE &&
        response.data
      ) {
        return roleAdapter(response.data);
      }

      throw new Error(
        response.result?.description || "Error al actualizar rol",
      );
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error?.result || error?.details) {
        throw error;
      }
      const genericError = new Error(
        error?.message || "Error al actualizar rol",
      );
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;
      throw genericError;
    }
  }

  /**
   * Eliminar rol
   */
  static async deleteRole(id: string): Promise<void> {
    try {
      const response = await apiClient.request<void>({
        endpoint: `${this.BASE_ENDPOINT}/${id}`,
        method: "DELETE",
      });

      if (response.result?.statusCode !== SUCCESS_STATUS_CODE) {
        throw new Error(
          response.result?.description || "Error al eliminar rol",
        );
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error?.result || error?.details) {
        throw error;
      }
      const genericError = new Error(error?.message || "Error al eliminar rol");
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;
      throw genericError;
    }
  }

  /**
   * Asignar permisos a rol
   */
  static async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    try {
      const response = await apiClient.request<RoleApi>({
        endpoint: `${this.BASE_ENDPOINT}/${roleId}/permissions`,
        method: "POST",
        body: { permissionIds },
      });

      if (
        response.result?.statusCode === SUCCESS_STATUS_CODE &&
        response.data
      ) {
        return roleAdapter(response.data);
      }

      throw new Error(
        response.result?.description || "Error al asignar permisos",
      );
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error?.result || error?.details) {
        throw error;
      }
      const genericError = new Error(
        error?.message || "Error al asignar permisos",
      );
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;
      throw genericError;
    }
  }

  /**
   * Remover permisos de rol
   */
  static async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    try {
      const response = await apiClient.request<RoleApi>({
        endpoint: `${this.BASE_ENDPOINT}/${roleId}/permissions`,
        method: "DELETE",
        body: { permissionIds },
      });

      if (
        response.result?.statusCode === SUCCESS_STATUS_CODE &&
        response.data
      ) {
        return roleAdapter(response.data);
      }

      throw new Error(
        response.result?.description || "Error al remover permisos",
      );
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error?.result || error?.details) {
        throw error;
      }
      const genericError = new Error(
        error?.message || "Error al remover permisos",
      );
      (genericError as any).result = error?.result;
      (genericError as any).details = error?.details;
      throw genericError;
    }
  }

  /**
   * Actualización masiva de permisos de rol (transaccional)
   * Permite agregar o remover múltiples permisos de forma atómica
   *
   * @param roleId ID del rol
   * @param permissions Array de operaciones de permisos
   * @param companyId ID de la empresa (opcional, si no se envía usa la del usuario)
   * @returns Respuesta con el rol actualizado y resumen de operaciones
   */
  static async bulkUpdateRolePermissions(
    roleId: string,
    permissions: PermissionOperation[],
    companyId?: string,
  ): Promise<BulkUpdateRolePermissionsResponse> {
    try {
      const body: BulkUpdateRolePermissionsRequest = {
        roleId,
        permissions,
      };

      // Agregar companyId solo si se proporciona
      if (companyId) {
        body.companyId = companyId;
      }

      const response =
        await apiClient.request<BulkUpdateRolePermissionsResponse>({
          endpoint: `${this.BASE_ENDPOINT}/${roleId}/permissions/bulk`,
          method: "PUT",
          body,
        });

      if (
        response.result?.statusCode === SUCCESS_STATUS_CODE &&
        response.data
      ) {
        return response.data;
      }

      throw new Error(
        response.result?.description ||
          "Error al actualizar permisos masivamente",
      );
    } catch (error: any) {
      // Preservar detalles de error si existen
      if (error.response?.result?.details) {
        error.details = error.response.result.details;
      }
      throw error;
    }
  }
}

/**
 * Operación de permiso para actualización masiva
 */
export interface PermissionOperation {
  permissionId: string; // UUID del permiso genérico (view, create, edit, delete)
  menuItemId: string; // UUID del item del menú
  action: "add" | "remove"; // Acción a realizar
}

/**
 * Request para actualización masiva de permisos
 */
export interface BulkUpdateRolePermissionsRequest {
  roleId: string;
  companyId?: string; // Opcional: si no se envía, usa la empresa del usuario
  permissions: PermissionOperation[];
}

/**
 * Response de actualización masiva de permisos
 * El servicio retorna response.data directamente, que contiene role y summary
 */
export interface BulkUpdateRolePermissionsResponse {
  role: Role; // Rol actualizado con todos sus permisos
  summary: {
    total: number;
    added: number;
    removed: number;
  };
}
