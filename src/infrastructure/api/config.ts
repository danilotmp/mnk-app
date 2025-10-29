/**
 * Configuración centralizada de la API
 */

export const API_CONFIG = {
  // URL base del backend (desde variables de entorno o configuración)
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  
  // Claves de almacenamiento
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    LANGUAGE: 'language',
    USER_CONTEXT: 'userContext',
  },
  
  // Configuración de tokens
  TOKENS: {
    ACCESS_TOKEN_DURATION: 15 * 60 * 1000, // 15 minutos
    REFRESH_TOKEN_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 días
  },
  
  // Timeout para requests
  TIMEOUT: 30000, // 30 segundos
  
  // Endpoints
  ENDPOINTS: {
    LOGIN: '/seguridades/login',
    REGISTER: '/seguridades/register',
    REFRESH_TOKEN: '/seguridades/refresh-token',
    LOGOUT: '/seguridades/logout',
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

