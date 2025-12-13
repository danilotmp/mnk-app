/**
 * Configuración centralizada de la API
 * Ahora usa valores de app.config.ts para mantener todo centralizado
 */

import { APP_CONFIG } from '@/src/config/app.config';

export const API_CONFIG = {
  // URL base del backend (desde configuración centralizada)
  BASE_URL: APP_CONFIG.API.BASE_URL,
  
  // Claves de almacenamiento
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    LANGUAGE: 'language',
    USER_CONTEXT: 'userContext',
  },
  
  // Configuración de tokens (desde configuración centralizada)
  TOKENS: {
    ACCESS_TOKEN_DURATION: APP_CONFIG.AUTH.ACCESS_TOKEN_DURATION,
    REFRESH_TOKEN_DURATION: APP_CONFIG.AUTH.REFRESH_TOKEN_DURATION,
    TOKEN_REFRESH_THRESHOLD: APP_CONFIG.AUTH.TOKEN_REFRESH_THRESHOLD,
  },
  
  // Timeout para requests (desde configuración centralizada)
  TIMEOUT: APP_CONFIG.API.TIMEOUT,
  
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
  private storage: any;
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

