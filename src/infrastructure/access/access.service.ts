import { apiClient, ApiError } from "@/src/infrastructure/api";
import { API_CONFIG } from "@/src/infrastructure/api/config";
import { HTTP_STATUS } from "@/src/infrastructure/api/constants";

export interface RouteAccessResult {
  allowed: boolean;
  /** Mensaje del API cuando el acceso es denegado (ej. 403). Se debe mostrar en lugar del genérico "Acceso denegado". */
  message?: string;
}

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
   * Verifica si el usuario autenticado tiene acceso a la ruta especificada.
   * En 403 devuelve el mensaje del API para mostrarlo al usuario.
   */
  static async checkRouteAccess(route: string): Promise<RouteAccessResult> {
    if (!route) {
      return { allowed: true };
    }

    try {
      const response = await apiClient.request<AccessCheckResponse>({
        endpoint: `${API_CONFIG.ENDPOINTS.ACCESS_CHECK}?route=${encodeURIComponent(route)}`,
        method: "GET",
      });

      const data = response?.data;
      const allowedFromResponse =
        data && typeof (data as any).allowed === "boolean"
          ? (data as any).allowed
          : undefined;
      const accessFromResponse =
        data && typeof (data as any).access === "boolean"
          ? (data as any).access
          : undefined;

      if (typeof allowedFromResponse === "boolean") {
        return { allowed: allowedFromResponse };
      }

      if (typeof accessFromResponse === "boolean") {
        return { allowed: accessFromResponse };
      }

      const statusCode = response?.result?.statusCode;
      if (
        statusCode === HTTP_STATUS.FORBIDDEN ||
        statusCode === HTTP_STATUS.UNAUTHORIZED
      ) {
        return { allowed: false };
      }

      return { allowed: true };
    } catch (error) {
      if (error instanceof ApiError) {
        if (
          error.statusCode === HTTP_STATUS.FORBIDDEN ||
          error.statusCode === HTTP_STATUS.UNAUTHORIZED
        ) {
          return { allowed: false, message: error.message || undefined };
        }
      }

      throw error;
    }
  }
}
