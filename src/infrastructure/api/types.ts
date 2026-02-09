/**
 * Tipos genéricos para la capa de API
 * Estructura centralizada para todas las respuestas del backend
 */

/**
 * Estructura estándar de respuesta del backend
 */
export interface ApiResponse<T = any> {
  data: T;
  result: {
    statusCode: number;
    description: string;
    details: any;
  };
}

/**
 * Tipos de lenguaje soportados - importado de i18n
 */

/**
 * Tokens de autenticación
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Configuración de headers para requests
 */
export interface RequestHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'Accept-Language'?: string;
  'company-code'?: string;
  'user-id'?: string;
  'app-source'?: 'mobile' | 'web' | 'legacy';
  [key: string]: string | undefined;
}

/**
 * Configuración de request
 */
export interface RequestConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Partial<RequestHeaders>;
  skipAuth?: boolean;
}

/**
 * Almacenamiento genérico para tokens
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Datos del usuario autenticado (para headers)
 */
export interface UserContext {
  companyId?: string;
  userId?: string;
  companyCode?: string;
}

