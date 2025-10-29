/**
 * Servicio de autenticación
 * Implementa el patrón de servicio usando el ApiClient centralizado
 */

import { apiClient } from '../api/api.client';
import { API_CONFIG, ApiConfig } from '../api/config';
import { ApiResponse } from '../api/types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyCode?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyCode?: string;
  };
}

export class AuthService {
  private config: ApiConfig;

  constructor() {
    this.config = ApiConfig.getInstance();
  }

  /**
   * Inicia sesión y guarda los tokens automáticamente
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.request<AuthResponse>({
      endpoint: API_CONFIG.ENDPOINTS.LOGIN,
      method: 'POST',
      body: credentials,
      skipAuth: true, // No requiere autenticación
    });

    // Guardar tokens automáticamente
    if (response.data.accessToken && response.data.refreshToken) {
      await apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    // Configurar contexto de usuario si está disponible
    if (response.data.user) {
      this.config.setUserContext({
        userId: response.data.user.id,
        companyCode: response.data.user.companyCode,
      });
    }

    return response;
  }

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.request<AuthResponse>({
      endpoint: API_CONFIG.ENDPOINTS.REGISTER,
      method: 'POST',
      body: data,
      skipAuth: true, // No requiere autenticación
    });

    // Guardar tokens automáticamente
    if (response.data.accessToken && response.data.refreshToken) {
      await apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    // Configurar contexto de usuario
    if (response.data.user) {
      this.config.setUserContext({
        userId: response.data.user.id,
        companyCode: response.data.user.companyCode,
      });
    }

    return response;
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    await apiClient.logout();
    this.config.setUserContext(null);
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    return await apiClient.isAuthenticated();
  }

  /**
   * Obtiene los datos del usuario actual
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await apiClient.request({
        endpoint: '/usuarios/me',
        method: 'GET',
      });

      // Configurar contexto de usuario
      if (response.data) {
        this.config.setUserContext({
          userId: response.data.id,
          companyCode: response.data.companyCode,
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }
}

/**
 * Instancia singleton del servicio de autenticación
 */
export const authService = new AuthService();

