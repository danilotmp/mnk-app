/**
 * @deprecated Este archivo se mantiene solo para compatibilidad hacia atrás.
 * Por favor, usa AppConfig desde '@/src/config' en su lugar.
 * 
 * Este archivo re-exporta la configuración desde AppConfig para mantener
 * compatibilidad con código existente que usa APP_CONFIG.
 */

import { AppConfig } from './index';

/**
 * Configuración de la aplicación (compatibilidad hacia atrás)
 * @deprecated Usa AppConfig desde '@/src/config' en su lugar
 */
export const APP_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: AppConfig.api.baseUrl,
    TIMEOUT: AppConfig.api.timeout,
  },

  // Authentication Configuration
  AUTH: {
    ACCESS_TOKEN_DURATION: AppConfig.auth.accessTokenDuration,
    REFRESH_TOKEN_DURATION: AppConfig.auth.refreshTokenDuration,
    TOKEN_REFRESH_THRESHOLD: AppConfig.auth.tokenRefreshThreshold,
  },

  // Cache Configuration
  CACHE: {
    USER_DATA_CACHE_DURATION: AppConfig.cache.userDataCacheDuration,
    CONFIG_CACHE_DURATION: AppConfig.cache.configCacheDuration,
    CATALOG_CACHE_DURATION: AppConfig.cache.catalogCacheDuration,
  },

  // App Information
  APP: {
    NAME: AppConfig.app.name,
    VERSION: AppConfig.app.version,
    ENVIRONMENT: AppConfig.app.environment,
  },

  // External URLs
  EXTERNAL_URLS: {
    ICONS_DOCUMENTATION: AppConfig.externalUrls.iconsDocumentation,
  },
};

/**
 * Helper para obtener valores de configuración de forma segura
 * @deprecated Usa AppConfig directamente en su lugar
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

