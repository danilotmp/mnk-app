import { apiClient, ApiError } from '@/src/infrastructure/api';
import { API_CONFIG } from '@/src/infrastructure/api/config';
import { HTTP_STATUS } from '@/src/infrastructure/api/constants';

interface AccessCheckResponse {
  data?: {
    allowed?: boolean;
    access?: boolean;
  } | null;
  result?: {
    statusCode?: number;
  };
}

export class AccessService {
  /**
   * Verifica si el usuario autenticado tiene acceso a la ruta especificada
   */
  static async checkRouteAccess(route: string): Promise<boolean> {
    if (!route) {
      return true;
    }

    try {
      const response = await apiClient.request<AccessCheckResponse>({
        endpoint: `${API_CONFIG.ENDPOINTS.ACCESS_CHECK}?route=${encodeURIComponent(route)}`,
        method: 'GET',
      });

      const data = response?.data;
      const allowedFromResponse = data && typeof (data as any).allowed === 'boolean'
        ? (data as any).allowed
        : undefined;
      const accessFromResponse = data && typeof (data as any).access === 'boolean'
        ? (data as any).access
        : undefined;

      if (typeof allowedFromResponse === 'boolean') {
        return allowedFromResponse;
      }

      if (typeof accessFromResponse === 'boolean') {
        return accessFromResponse;
      }

      const statusCode = response?.result?.statusCode;
      if (statusCode === HTTP_STATUS.FORBIDDEN || statusCode === HTTP_STATUS.UNAUTHORIZED) {
        return false;
      }

      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === HTTP_STATUS.FORBIDDEN || error.statusCode === HTTP_STATUS.UNAUTHORIZED) {
          return false;
        }
      }

      throw error;
    }
  }
}


