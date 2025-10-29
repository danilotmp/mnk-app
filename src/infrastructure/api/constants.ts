/**
 * Constantes centralizadas para la capa de API
 * Códigos HTTP, mensajes de error, etc.
 */

/**
 * Códigos de estado HTTP estandarizados
 */
export const HTTP_STATUS = {
  // Success codes
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client error codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server error codes
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Código de éxito estándar para respuestas del API
 */
export const SUCCESS_STATUS_CODE = HTTP_STATUS.OK;

/**
 * Verifica si un código de estado es exitoso (2xx)
 */
export function isSuccessStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Verifica si un código de estado es un error del cliente (4xx)
 */
export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Verifica si un código de estado es un error del servidor (5xx)
 */
export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Map de códigos de estado a mensajes de error genéricos
 */
export const STATUS_CODE_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.BAD_REQUEST]: 'errors.badRequest',
  [HTTP_STATUS.UNAUTHORIZED]: 'errors.unauthorized',
  [HTTP_STATUS.FORBIDDEN]: 'errors.forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'errors.notFound',
  [HTTP_STATUS.CONFLICT]: 'errors.conflict',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'errors.unprocessableEntity',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'errors.tooManyRequests',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'errors.serverError',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'errors.serviceUnavailable',
};

