/**
 * Utilidades para extraer información de errores del backend
 * Centraliza la lógica de extracción de mensajes y detalles de errores
 */

/**
 * Extrae el detalle de un error del backend
 * Maneja diferentes estructuras de error: result.details, details.message, etc.
 */
export function extractErrorDetail(error: any): string | undefined {
  if (!error) return undefined;
  
  // Intentar obtener details de diferentes estructuras
  // 1. ApiError tiene details directamente (error.details)
  // 2. Error del backend tiene result.details
  // 3. Error puede tener details directamente
  const backendResult = error?.result;
  const rawDetails = error?.details ?? backendResult?.details;
  
  if (!rawDetails) return undefined;
  
  // Si es un string, devolverlo directamente
  if (typeof rawDetails === 'string') {
    return rawDetails;
  }
  
  // Si es un objeto con message, manejar el message (puede ser string o array)
  if (rawDetails?.message) {
    const message = rawDetails.message;
    // Si message es un array, unir los mensajes con saltos de línea
    if (Array.isArray(message)) {
      return message
        .map((item) => (typeof item === 'string' ? item : item?.message || String(item)))
        .filter(Boolean)
        .join('\n');
    }
    // Si message es un string, devolverlo directamente
    return String(message);
  }
  
  // Si es un array, unir los mensajes
  if (Array.isArray(rawDetails)) {
    return rawDetails
      .map((item) => (typeof item === 'string' ? item : item?.message || String(item)))
      .filter(Boolean)
      .join('\n');
  }
  
  // Si es un objeto, intentar convertir a string
  if (typeof rawDetails === 'object') {
    try {
      return JSON.stringify(rawDetails, null, 2);
    } catch {
      return String(rawDetails);
    }
  }
  
  return undefined;
}

/**
 * Extrae el mensaje de error del backend
 */
export function extractErrorMessage(error: any, defaultMessage: string = 'Error desconocido'): string {
  if (!error) return defaultMessage;
  
  // ApiError tiene message directamente (heredado de Error)
  // Error del backend tiene result.description
  const backendResult = error?.result;
  return backendResult?.description || error?.message || defaultMessage;
}

/**
 * Extrae tanto el mensaje como el detalle de un error del backend
 */
export function extractErrorInfo(error: any, defaultMessage: string = 'Error desconocido'): {
  message: string;
  detail?: string;
} {
  return {
    message: extractErrorMessage(error, defaultMessage),
    detail: extractErrorDetail(error),
  };
}

