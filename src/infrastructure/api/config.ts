/**
 * Configuración centralizada de la API
 * Usa AppConfig como única fuente de verdad
 */

import { AppConfig } from '@/src/config';

export const API_CONFIG = {
  // URL base del backend (desde configuración centralizada)
  BASE_URL: AppConfig.api.baseUrl,
  
  // Claves de almacenamiento
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    LANGUAGE: 'language',
    USER_CONTEXT: 'userContext',
  },
  
  // Configuración de tokens (desde configuración centralizada)
  TOKENS: {
    ACCESS_TOKEN_DURATION: AppConfig.auth.accessTokenDuration,
    REFRESH_TOKEN_DURATION: AppConfig.auth.refreshTokenDuration,
    TOKEN_REFRESH_THRESHOLD: AppConfig.auth.tokenRefreshThreshold,
  },
  
  // Timeout para requests (desde configuración centralizada)
  TIMEOUT: AppConfig.api.timeout,
  
  // Endpoints
  ENDPOINTS: {
    LOGIN: '/security/auth/login',
    REGISTER: '/security/auth/register',
    REFRESH_TOKEN: '/security/auth/refresh-token',
    LOGOUT: '/security/auth/logout',
    PROFILE: '/security/profile',
    CURRENT_USER: '/users/me',
    MENU: '/security/menu', // Endpoint único: con token devuelve público+privado, sin token no se llama
    MENU_SYNC: '/security/admin/menu-items/sync', // Endpoint para sincronización masiva del menú
    ACCESS_CHECK: '/security/access',
  },
};

/**
 * Clase de configuración de la API
 */
export class ApiConfig {
  private static instance: ApiConfig;
  
  private baseUrl: string;
  private readonly storage: any;
  private currentLanguage: string = 'es';
  private userContext: any = null;
  
  private constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }
  
  static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }
  
  getBaseUrl(): string {
    return this.baseUrl;
  }
  
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
  
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }
  
  setCurrentLanguage(language: string): void {
    this.currentLanguage = language;
  }
  
  getUserContext(): any {
    return this.userContext;
  }
  
  setUserContext(context: any): void {
    this.userContext = context;
  }
}

