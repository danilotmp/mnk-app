/**
 * Cliente API centralizado con gestión automática de tokens
 * Implementa la estructura genérica header-data-result
 */

import { API_CONFIG, ApiConfig } from './config';
import { HTTP_STATUS, SUCCESS_STATUS_CODE } from './constants';
import { getStorageAdapter } from './storage.adapter';
import { ApiResponse, RequestConfig, RequestHeaders, StorageAdapter, Tokens } from './types';

export class ApiClient {
  private storage: StorageAdapter;
  private config: ApiConfig;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{ resolve: (value: any) => void; reject: (reason: any) => void; config: RequestConfig }> = [];

  constructor() {
    this.storage = getStorageAdapter();
    this.config = ApiConfig.getInstance();
  }

  /**
   * Realiza un request al backend con gestión automática de tokens
   */
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // Detectar si el body es FormData
      const isFormData = config.body instanceof FormData;

      // Construir headers automáticamente
      const headers = await this.buildHeaders(config.headers, config.skipAuth, isFormData);

      // Convertir RequestHeaders a formato compatible con fetch
      const fetchHeaders: Record<string, string> = {};
      Object.keys(headers).forEach((key) => {
        const value = headers[key as keyof typeof headers];
        if (value !== undefined && value !== null) {
          fetchHeaders[key] = String(value);
        }
      });

      // Construir URL completa
      const fullUrl = `${this.config.getBaseUrl()}${config.endpoint}`;

      // Preparar body: FormData se envía directamente, otros se convierten a JSON
      let body: any = undefined;
      if (config.body) {
        if (isFormData) {
          body = config.body; // FormData se envía directamente
        } else {
          body = JSON.stringify(config.body);
        }
      }

      // Realizar el request
      const response = await fetch(fullUrl, {
        method: config.method,
        headers: fetchHeaders,
        body: body,
      });

      // Si el token expiró (401), intentar refrescar y reintentar
      if (response.status === HTTP_STATUS.UNAUTHORIZED && !config.skipAuth) {
        return await this.handleUnauthorized(config);
      }

      // Parsear respuesta
      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch (parseError) {
        // Si no se puede parsear el JSON, es un error del servidor
        throw new ApiError(
          'Error al procesar la respuesta del servidor',
          response.status,
          parseError instanceof Error ? parseError.message : parseError
        );
      }

      // IMPORTANTE: Según el estándar del backend:
      // - Header HTTP puede ser 200 (OK) o 201 (Created) para operaciones exitosas
      // - result.statusCode en el body siempre es 200 para éxito
      // - Solo debemos validar result.statusCode === 200 para determinar éxito
      // - Los errores tienen result.statusCode diferente a 200 (401, 403, 404, etc.)
      
      // Validar si result.statusCode es 200 (éxito)
      // Si no es 200, es un error y lanzar ApiError
      if (data.result?.statusCode !== SUCCESS_STATUS_CODE) {
        // Si es un error 401 y no estamos en una ruta pública, redirigir al home
        if (data.result?.statusCode === HTTP_STATUS.UNAUTHORIZED && !config.skipAuth) {
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isPrivateRoute = currentPath !== '/' && 
                                  !currentPath.startsWith('/auth') && 
                                  !currentPath.startsWith('/main');
            const isAdminRoute = currentPath.includes('/security') || 
                                currentPath.includes('/admin');
            
            if (isPrivateRoute || isAdminRoute) {
              // Limpiar tokens antes de redirigir
              await this.clearTokens();
              // Redirigir al home
              window.location.href = '/';
            }
          }
        }
        
        throw new ApiError(
          data.result?.description || 'Error en la petición',
          data.result?.statusCode || response.status,
          data.result?.details
        );
      }

      // Devolver la respuesta tal como viene del API (con estructura data-result)
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error de conexión', 0, error);
    }
  }

  /**
   * Construye los headers automáticamente con información centralizada
   */
  private async buildHeaders(
    customHeaders?: Partial<RequestHeaders>,
    skipAuth?: boolean,
    isFormData?: boolean
  ): Promise<RequestHeaders> {
    const headers: RequestHeaders = {};

    // NO establecer Content-Type para FormData (el navegador lo hace automáticamente)
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Agregar Accept-Language
    headers['Accept-Language'] = this.config.getCurrentLanguage() as any;

    // Agregar Authorization si no se omite la autenticación
    if (!skipAuth) {
      const accessToken = await this.storage.getItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      if (!accessToken) {
        throw new ApiError('Token de autenticación no disponible', 401, 'No auth token');
      }
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Agregar información de multiempresa
    const userContext = this.config.getUserContext();
    if (userContext?.companyCode) {
      headers['company-code'] = userContext.companyCode;
    }
    if (userContext?.userId) {
      headers['user-id'] = userContext.userId;
    }

    // Identificar origen de la app
    headers['app-source'] = 'mobile';

    // Agregar headers personalizados
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    return headers;
  }

  /**
   * Maneja el error 401 (token expirado) refrescando el token y reintentando
   */
  private async handleUnauthorized<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    if (this.isRefreshing) {
      // Si ya se está refrescando, agregar a la cola
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, config });
      });
    }

    this.isRefreshing = true;

    try {
      // Intentar refrescar el token
      await this.refreshToken();

      // Procesar cola de requests pendientes
      this.processQueue();

      // Reintentar el request original
      return await this.request<T>(config);
    } catch (error) {
      // Si falla el refresh, limpiar y lanzar error
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];
      await this.clearTokens();
      
      // Redirigir al home si estamos en una ruta privada o de administración
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Verificar si estamos en una ruta privada (no es /, /auth, o rutas públicas)
        const isPrivateRoute = currentPath !== '/' && 
                              !currentPath.startsWith('/auth') && 
                              !currentPath.startsWith('/main');
        // Verificar si estamos en una ruta de administración
        const isAdminRoute = currentPath.includes('/security') || 
                            currentPath.includes('/admin');
        
        if (isPrivateRoute || isAdminRoute) {
          // Redirigir al home
          window.location.href = '/';
        }
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Token inválido o ausente',
        HTTP_STATUS.UNAUTHORIZED,
        error instanceof Error ? error.message : error
      );
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresca el token usando el refreshToken
   */
  private async refreshToken(): Promise<void> {
    const refreshToken = await this.storage.getItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.config.getBaseUrl()}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': this.config.getCurrentLanguage() as any,
      },
      body: JSON.stringify({ refreshToken }),
    });

    // Parsear respuesta antes de validar
    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Error al procesar la respuesta del servidor');
    }

    // Validar según el estándar: result.statusCode debe ser 200 para éxito
    // Header HTTP puede ser 200 o 201, pero result.statusCode siempre es 200 para éxito
    if (data.result?.statusCode !== SUCCESS_STATUS_CODE) {
      throw new Error(data.result?.description || 'Failed to refresh token');
    }

    // Guardar nuevos tokens
    await this.setTokens(data.data.accessToken, data.data.refreshToken);
  }

  /**
   * Procesa la cola de requests pendientes
   */
  private async processQueue(): Promise<void> {
    while (this.failedQueue.length > 0) {
      const { resolve, config } = this.failedQueue.shift()!;
      try {
        const result = await this.request(config);
        resolve(result);
      } catch (error) {
        resolve(Promise.reject(error));
      }
    }
  }

  /**
   * Guarda tokens en el almacenamiento
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.storage.setItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await this.storage.setItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  /**
   * Obtiene tokens del almacenamiento
   */
  async getTokens(): Promise<Tokens | null> {
    const accessToken = await this.storage.getItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await this.storage.getItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  /**
   * Limpia tokens del almacenamiento
   */
  async clearTokens(): Promise<void> {
    await this.storage.removeItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    await this.storage.removeItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens();
    return tokens !== null;
  }

  /**
   * Realiza logout limpiando tokens
   */
  async logout(): Promise<void> {
    try {
      await this.request({
        endpoint: API_CONFIG.ENDPOINTS.LOGOUT,
        method: 'POST',
      });
    } catch (error) {
      // Ignorar errores del servidor
    } finally {
      await this.clearTokens();
    }
  }

  /**
   * Helpers para métodos HTTP comunes
   */
  async get<T = any>(endpoint: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, endpoint, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, endpoint, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, endpoint, method: 'PUT', body });
  }

  async delete<T = any>(endpoint: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, endpoint, method: 'DELETE' });
  }
}

/**
 * Error personalizado para la API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Instancia singleton del cliente API
 */
export const apiClient = new ApiClient();

