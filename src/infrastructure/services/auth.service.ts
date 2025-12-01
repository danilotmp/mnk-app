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
    companyIdDefault?: string; // Renombrado de companyId
    companies?: Array<{ // Array de empresas del usuario
      id: string;
      code: string;
      name: string;
      status: number;
      isDefault: boolean;
    }>;
    companyCode?: string; // Mantener por compatibilidad temporal
    currentBranchId?: string; // ID de la sucursal actual
    availableBranches?: Array<any>; // Array de sucursales disponibles (puede ser Branch[] o BranchAccess[])
  };
}

export class AuthService {
  private config: ApiConfig;

  constructor() {
    this.config = ApiConfig.getInstance();
  }

  /**
   * Inicia sesión y guarda los tokens automáticamente
   * El código de empresa viene en la respuesta del API, no se requiere en el login
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.request<AuthResponse>({
        endpoint: API_CONFIG.ENDPOINTS.LOGIN,
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password,
        },
        skipAuth: true, // No requiere autenticación
      });

      // Guardar tokens automáticamente
      if (response.data.accessToken && response.data.refreshToken) {
        await apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
      }

      // Configurar contexto de usuario si está disponible
      // Solo los campos básicos vienen en el login: id, email, firstName, lastName, companyIdDefault
      // companyCode y otros campos vienen del perfil
      if (response.data.user) {
        // Obtener companyCode desde companies array si está disponible
        const defaultCompany = response.data.user.companies?.find(c => c.isDefault);
        const companyCode = defaultCompany?.code || response.data.user.companyCode;
        
        this.config.setUserContext({
          userId: response.data.user.id,
          // companyCode puede no venir del login, solo del perfil
          companyCode: companyCode,
          companyId: response.data.user.companyIdDefault || response.data.user.companyId, // Mantener compatibilidad temporal
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
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
    // El register puede retornar diferentes campos, pero siempre incluye id y companyIdDefault
    if (response.data.user) {
      // Obtener companyCode desde companies array si está disponible
      const defaultCompany = response.data.user.companies?.find(c => c.isDefault);
      const companyCode = defaultCompany?.code || response.data.user.companyCode;
      
      this.config.setUserContext({
        userId: response.data.user.id,
        // companyCode puede no venir del register, solo se usa si existe
        companyCode: companyCode,
        companyId: response.data.user.companyIdDefault || response.data.user.companyId, // Mantener compatibilidad temporal
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
   * Obtiene los datos del usuario actual después del login
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await apiClient.request({
        endpoint: API_CONFIG.ENDPOINTS.CURRENT_USER,
        method: 'GET',
      });

      // Configurar contexto de usuario
      if (response.data) {
        // Obtener companyCode desde companies array si está disponible
        const defaultCompany = response.data.companies?.find((c: any) => c.isDefault);
        const companyCode = defaultCompany?.code || response.data.companyCode;
        
        this.config.setUserContext({
          userId: response.data.id,
          companyCode: companyCode,
          companyId: response.data.companyIdDefault || response.data.companyId, // Mantener compatibilidad temporal
        });
      }

      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene el perfil completo del usuario desde /security/profile
   * El backend devuelve: { data: { user: {...} }, result: {...} }
   * Necesitamos extraer response.data.user
   */
  async getProfile(): Promise<any> {
    try {
      const response = await apiClient.request({
        endpoint: API_CONFIG.ENDPOINTS.PROFILE,
        method: 'GET',
      });

      // El backend devuelve { data: { user: {...} }, result: {...} }
      // response.data es { user: {...} }, necesitamos response.data.user
      const userProfile = response.data?.user || response.data;
      
      // LOGS SESSION STORAGE: Aquí se agregará el log de la respuesta del servicio profile

      if (userProfile) {
        // Obtener companyCode desde companies array si está disponible
        const defaultCompany = userProfile.companies?.find((c: any) => c.isDefault);
        const companyCode = defaultCompany?.code || userProfile.companyCode;
        
        this.config.setUserContext({
          userId: userProfile.id,
          companyCode: companyCode,
          companyId: userProfile.companyIdDefault || userProfile.companyId, // Mantener compatibilidad temporal
        });
      }

      return userProfile;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Instancia singleton del servicio de autenticación
 */
export const authService = new AuthService();

