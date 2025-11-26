/**
 * Configuración centralizada de la aplicación
 * Valores configurables que pueden venir de app.json o variables de entorno
 */

import Constants from 'expo-constants';

/**
 * Configuración de la aplicación cargada desde app.json y variables de entorno
 */
export const APP_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 
             Constants.expoConfig?.extra?.apiBaseUrl || 
             'http://localhost:3000/api',
    TIMEOUT: Constants.expoConfig?.extra?.apiTimeout || 30000, // 30 segundos por defecto
  },

  // Authentication Configuration
  AUTH: {
    // Tiempo de expiración del access token (en milisegundos)
    ACCESS_TOKEN_DURATION: Constants.expoConfig?.extra?.accessTokenDuration || 
                          15 * 60 * 1000, // 15 minutos
    
    // Tiempo de expiración del refresh token (en milisegundos)
    REFRESH_TOKEN_DURATION: Constants.expoConfig?.extra?.refreshTokenDuration || 
                           7 * 24 * 60 * 60 * 1000, // 7 días
    
    // Tiempo antes de expirar para refrescar automáticamente (en milisegundos)
    TOKEN_REFRESH_THRESHOLD: Constants.expoConfig?.extra?.tokenRefreshThreshold || 
                            5 * 60 * 1000, // 5 minutos antes de expirar
  },

  // Cache Configuration
  CACHE: {
    // Tiempo de expiración de cache de datos de usuario (en milisegundos)
    USER_DATA_CACHE_DURATION: Constants.expoConfig?.extra?.userDataCacheDuration || 
                              30 * 60 * 1000, // 30 minutos
    
    // Tiempo de expiración de cache de configuración (en milisegundos)
    CONFIG_CACHE_DURATION: Constants.expoConfig?.extra?.configCacheDuration || 
                          24 * 60 * 60 * 1000, // 24 horas
    
    // Tiempo de expiración de cache de listas y catálogos (en milisegundos)
    CATALOG_CACHE_DURATION: Constants.expoConfig?.extra?.catalogCacheDuration || 
                           60 * 60 * 1000, // 1 hora
  },

  // App Information
  APP: {
    NAME: Constants.expoConfig?.name || 'mnk-app',
    VERSION: Constants.expoConfig?.version || '1.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
  },

  // External URLs
  EXTERNAL_URLS: {
    // URL de la documentación de iconos de Expo
    ICONS_DOCUMENTATION: process.env.EXPO_PUBLIC_ICONS_DOCUMENTATION_URL || 
                        Constants.expoConfig?.extra?.iconsDocumentationUrl || 
                        'https://icons.expo.fyi/Index',
  },
};

/**
 * Helper para obtener valores de configuración de forma segura
 */
export function getConfig<T>(path: string, defaultValue: T): T {
  const keys = path.split('.');
  let value: any = APP_CONFIG;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      return defaultValue;
    }
  }
  
  return value as T;
}

