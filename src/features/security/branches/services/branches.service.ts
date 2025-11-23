/**
 * Servicio para administración de Sucursales
 * Incluye endpoints administrativos y utilidades de contexto
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';

import { PaginatedResponse } from '@/src/domains/shared/types';
import { branchAdapter, branchesAdapter } from '../adapters';
import { Branch, BranchFilters, BranchPayload } from '../types/domain';
import { BranchApi } from '../types/api';

type BackendPagination = {
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number;
  totalPages?: number;
};

interface BackendPaginatedBranches {
  items?: BranchApi[];
  data?: BranchApi[];
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
  private static readonly BASE_ENDPOINT = '/security/admin/branches';
  private static readonly CONTEXT_ENDPOINT = '/auth/me/branches';
  private static readonly BY_COMPANY_ENDPOINT = '/security/admin/branches/company';

  /**
   * Validar si un string es un UUID válido
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static async getBranches(
    filters: BranchFilters = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<Branch>> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = queryParams ? `${this.BASE_ENDPOINT}?${queryParams}` : this.BASE_ENDPOINT;

    const response = await apiClient.request<BackendPaginatedBranches>({
      endpoint,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      const normalized = this.normalizePaginatedResponse(response.data, filters);
      return {
        data: branchesAdapter(normalized.data),
        meta: normalized.meta,
      };
    }

    throw new Error(response.result?.description || 'Error al obtener sucursales');
  }

  static async getBranchesByCompany(companyId: string): Promise<Branch[]> {
    // Validar que companyId sea un UUID válido antes de hacer la llamada
    if (!this.isValidUUID(companyId)) {
      throw new Error(`ID de empresa inválido: ${companyId}. Se requiere un UUID válido.`);
    }

    const response = await apiClient.request<BranchApi[] | BackendPaginatedBranches>({
      endpoint: `${this.BY_COMPANY_ENDPOINT}/${companyId}`,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      const payload = response.data;
      if (Array.isArray(payload)) {
        return branchesAdapter(payload);
      }
      if (Array.isArray(payload.items)) {
        return branchesAdapter(payload.items);
      }
      if (Array.isArray(payload.data)) {
        return branchesAdapter(payload.data);
      }
      return [];
    }

    throw new Error(response.result?.description || 'Error al obtener sucursales de la empresa');
  }

  static async getBranchById(id: string): Promise<Branch> {
    const response = await apiClient.request<BranchApi>({
      endpoint: `${this.BASE_ENDPOINT}/${id}`,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return branchAdapter(response.data);
    }

    throw new Error(response.result?.description || 'Error al obtener la sucursal');
  }

  static async createBranch(payload: BranchPayload): Promise<Branch> {
    const response = await apiClient.request<BranchApi>({
      endpoint: this.BASE_ENDPOINT,
      method: 'POST',
      body: payload,
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return branchAdapter(response.data);
    }

    throw new Error(response.result?.description || 'Error al crear la sucursal');
  }

  static async updateBranch(id: string, payload: BranchPayload): Promise<Branch> {
    const response = await apiClient.request<BranchApi>({
      endpoint: `${this.BASE_ENDPOINT}/${id}`,
      method: 'PUT',
      body: payload,
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return branchAdapter(response.data);
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

  static async getMyBranches(): Promise<Branch[]> {
    const response = await apiClient.request<BranchApi[] | BackendPaginatedBranches>({
      endpoint: this.CONTEXT_ENDPOINT,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      const payload = response.data;
      if (Array.isArray(payload)) {
        return branchesAdapter(payload);
      }
      if (Array.isArray(payload.items)) {
        return branchesAdapter(payload.items);
      }
      if (Array.isArray(payload.data)) {
        return branchesAdapter(payload.data);
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
  ): PaginatedResponse<BranchApi> {
    if ((raw as PaginatedResponse<BranchApi>).data && (raw as PaginatedResponse<BranchApi>).meta) {
      return raw as PaginatedResponse<BranchApi>;
    }

    if (Array.isArray(raw.items)) {
      return this.buildFromItems(raw.items, raw.pagination, filters);
    }

    if (Array.isArray(raw.data)) {
      return this.buildFromItems(raw.data, raw.pagination, filters);
    }

    if (Array.isArray(raw as unknown as BranchApi[])) {
      const list = raw as unknown as BranchApi[];
      return this.buildFromItems(list, undefined, filters);
    }

    throw new Error('Estructura de paginación de sucursales no reconocida');
  }

  private static buildFromItems(
    items: BranchApi[],
    pagination: BackendPagination | undefined,
    filters: BranchFilters
  ): PaginatedResponse<BranchApi> {
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


