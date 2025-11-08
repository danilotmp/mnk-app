/**
 * Servicio para administración de Empresas
 * Incluye endpoints administrativos y de contexto (auth/me)
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';

import {
  CompanyFilters,
  CompanyPayload,
  PaginatedResponse,
  SecurityCompany,
} from '../types';

type BackendPagination = {
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number;
  totalPages?: number;
};

interface BackendPaginatedCompanies {
  items?: SecurityCompany[];
  data?: SecurityCompany[];
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

export class CompaniesService {
  private static readonly BASE_ENDPOINT = '/seguridades/admin/empresas';
  private static readonly CONTEXT_ENDPOINT = '/auth/me/companies';

  static async getCompanies(
    filters: CompanyFilters = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<SecurityCompany>> {
    const queryParams = this.buildQueryParams(filters);

    const endpoint = queryParams ? `${this.BASE_ENDPOINT}?${queryParams}` : this.BASE_ENDPOINT;

    const response = await apiClient.request<BackendPaginatedCompanies>({
      endpoint,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return this.normalizePaginatedResponse(response.data, filters);
    }

    throw new Error(response.result?.description || 'Error al obtener empresas');
  }

  static async getCompanyById(id: string): Promise<SecurityCompany> {
    const response = await apiClient.request<SecurityCompany>({
      endpoint: `${this.BASE_ENDPOINT}/${id}`,
      method: 'GET',
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return response.data;
    }

    throw new Error(response.result?.description || 'Error al obtener la empresa');
  }

  static async createCompany(payload: CompanyPayload): Promise<SecurityCompany> {
    const response = await apiClient.request<SecurityCompany>({
      endpoint: this.BASE_ENDPOINT,
      method: 'POST',
      body: payload,
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return response.data;
    }

    throw new Error(response.result?.description || 'Error al crear la empresa');
  }

  static async updateCompany(id: string, payload: CompanyPayload): Promise<SecurityCompany> {
    const response = await apiClient.request<SecurityCompany>({
      endpoint: `${this.BASE_ENDPOINT}/${id}`,
      method: 'PUT',
      body: payload,
    });

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return response.data;
    }

    throw new Error(response.result?.description || 'Error al actualizar la empresa');
  }

  static async deleteCompany(id: string): Promise<void> {
    const response = await apiClient.request<void>({
      endpoint: `${this.BASE_ENDPOINT}/${id}`,
      method: 'DELETE',
    });

    if (response.result?.statusCode !== SUCCESS_STATUS_CODE) {
      throw new Error(response.result?.description || 'Error al eliminar la empresa');
    }
  }

  static async getMyCompanies(): Promise<SecurityCompany[]> {
    const response = await apiClient.request<SecurityCompany[] | BackendPaginatedCompanies>({
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

    throw new Error(response.result?.description || 'Error al obtener las empresas del usuario');
  }

  private static buildQueryParams(filters: CompanyFilters): string {
    const params = new URLSearchParams();

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters.limit ?? 10));

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters.search?.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters.code?.trim()) {
      params.append('code', filters.code.trim());
    }
    if (filters.name?.trim()) {
      params.append('name', filters.name.trim());
    }
    if (filters.email?.trim()) {
      params.append('email', filters.email.trim());
    }
    if (typeof filters.isActive === 'boolean') {
      params.append('isActive', String(filters.isActive));
    }

    return params.toString();
  }

  private static normalizePaginatedResponse(
    raw: BackendPaginatedCompanies,
    filters: CompanyFilters
  ): PaginatedResponse<SecurityCompany> {
    if ((raw as PaginatedResponse<SecurityCompany>).data && (raw as PaginatedResponse<SecurityCompany>).meta) {
      return raw as PaginatedResponse<SecurityCompany>;
    }

    if (Array.isArray(raw.items)) {
      return this.buildFromItems(raw.items, raw.pagination, filters);
    }

    if (Array.isArray(raw.data)) {
      return this.buildFromItems(raw.data, raw.pagination, filters);
    }

    if (Array.isArray(raw as unknown as SecurityCompany[])) {
      const list = raw as unknown as SecurityCompany[];
      return this.buildFromItems(list, undefined, filters);
    }

    throw new Error('Estructura de paginación de empresas no reconocida');
  }

  private static buildFromItems(
    items: SecurityCompany[],
    pagination: BackendPagination | undefined,
    filters: CompanyFilters
  ): PaginatedResponse<SecurityCompany> {
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


