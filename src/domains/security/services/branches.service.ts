/**
 * Servicio para administración de Sucursales
 * Incluye endpoints administrativos y utilidades de contexto
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';

import {
  BranchFilters,
  BranchPayload,
  PaginatedResponse,
  SecurityBranch,
} from '../types';

type BackendPagination = {
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number;
  totalPages?: number;
};

interface BackendPaginatedBranches {
  items?: SecurityBranch[];
  data?: SecurityBranch[];
  pagination?: BackendPagination;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export class BranchesService {
  private static readonly BASE_ENDPOINT = '/seguridades/admin/sucursales';
  private static readonly CONTEXT_ENDPOINT = '/auth/me/branches';
  private static readonly BY_COMPANY_ENDPOINT = '/seguridades/admin/sucursales/empresa';

  static async getBranches(
    filters: BranchFilters = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<SecurityBranch>> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = queryParams ? `${this.BASE_ENDPOINT}?${queryParams}` : this.BASE_ENDPOINT;

    const response = await apiClient.request<BackendPaginatedBranches>({
      endpoint,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return this.normalizePaginatedResponse(response.data, filters);
    }

    throw new Error(response.result?.description || 'Error al obtener sucursales');
  }

  static async getBranchesByCompany(companyId: string): Promise<SecurityBranch[]> {
    const response = await apiClient.request<SecurityBranch[] | BackendPaginatedBranches>({
      endpoint: `${this.BY_COMPANY_ENDPOINT}/${companyId}`,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      const payload = response.data;
      if (Array.isArray(payload)) {
        return payload;
      }
      if (Array.isArray(payload.items)) {
        return payload.items;
      }
      if (Array.isArray(payload.data)) {
        return payload.data;
      }
      return [];
    }

    throw new Error(response.result?.description || 'Error al obtener sucursales de la empresa');
  }

  static async getBranchById(id: string): Promise<SecurityBranch> {
    const response = await apiClient.request<SecurityBranch>({
      endpoint: `${this.BASE_ENDPOINT}/${id}`,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return response.data;
    }

    throw new Error(response.result?.description || 'Error al obtener la sucursal');
  }

  static async createBranch(payload: BranchPayload): Promise<SecurityBranch> {
    const response = await apiClient.request<SecurityBranch>({
      endpoint: this.BASE_ENDPOINT,
      method: 'POST',
      body: payload,
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return response.data;
    }

    throw new Error(response.result?.description || 'Error al crear la sucursal');
  }

  static async updateBranch(id: string, payload: BranchPayload): Promise<SecurityBranch> {
    const response = await apiClient.request<SecurityBranch>({
      endpoint: `${this.BASE_ENDPOINT}/${id}`,
      method: 'PUT',
      body: payload,
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return response.data;
    }

    throw new Error(response.result?.description || 'Error al actualizar la sucursal');
  }

  static async deleteBranch(id: string): Promise<void> {
    const response = await apiClient.request<void>({
      endpoint: `${this.BASE_ENDPOINT}/${id}`,
      method: 'DELETE',
    });

    if (response.result?.statusCode !== SUCCESS_STATUS_CODE) {
      throw new Error(response.result?.description || 'Error al eliminar la sucursal');
    }
  }

  static async getMyBranches(): Promise<SecurityBranch[]> {
    const response = await apiClient.request<SecurityBranch[] | BackendPaginatedBranches>({
      endpoint: this.CONTEXT_ENDPOINT,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      const payload = response.data;
      if (Array.isArray(payload)) {
        return payload;
      }
      if (Array.isArray(payload.items)) {
        return payload.items;
      }
      if (Array.isArray(payload.data)) {
        return payload.data;
      }
      return [];
    }

    throw new Error(response.result?.description || 'Error al obtener las sucursales del usuario');
  }

  private static buildQueryParams(filters: BranchFilters): string {
    const params = new URLSearchParams();

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters.limit ?? 10));

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters.search?.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters.companyId?.trim()) {
      params.append('companyId', filters.companyId.trim());
    }
    if (filters.code?.trim()) {
      params.append('code', filters.code.trim());
    }
    if (filters.name?.trim()) {
      params.append('name', filters.name.trim());
    }
    if (filters.type) {
      params.append('type', filters.type);
    }
    if (typeof filters.status === 'number') {
      params.append('status', String(filters.status));
    }

    return params.toString();
  }

  private static normalizePaginatedResponse(
    raw: BackendPaginatedBranches,
    filters: BranchFilters
  ): PaginatedResponse<SecurityBranch> {
    if ((raw as PaginatedResponse<SecurityBranch>).data && (raw as PaginatedResponse<SecurityBranch>).meta) {
      return raw as PaginatedResponse<SecurityBranch>;
    }

    if (Array.isArray(raw.items)) {
      return this.buildFromItems(raw.items, raw.pagination, filters);
    }

    if (Array.isArray(raw.data)) {
      return this.buildFromItems(raw.data, raw.pagination, filters);
    }

    if (Array.isArray(raw as unknown as SecurityBranch[])) {
      const list = raw as unknown as SecurityBranch[];
      return this.buildFromItems(list, undefined, filters);
    }

    throw new Error('Estructura de paginación de sucursales no reconocida');
  }

  private static buildFromItems(
    items: SecurityBranch[],
    pagination: BackendPagination | undefined,
    filters: BranchFilters
  ): PaginatedResponse<SecurityBranch> {
    const page = pagination?.currentPage ?? filters.page ?? 1;
    const limit = (pagination?.itemsPerPage ?? filters.limit ?? items.length) || 10;
    const total = pagination?.totalItems ?? items.length;
    const totalPages =
      pagination?.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}


