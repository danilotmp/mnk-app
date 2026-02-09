/**
 * Utilidades para extraer información de errores del backend
 * Centraliza la lógica de extracción de mensajes y detalles de errores
 */

/**
 * Convierte un valor a string seguro para mostrar en UI (nunca "[object Object]").
 * Si es un objeto con claves conocidas (error, userId, message), prioriza mensajes legibles.
 */
function detailToString(raw: any): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        typeof item === "string"
          ? item
          : (item?.message ?? detailToString(item)),
      )
      .filter(Boolean)
      .join("\n");
  }
  if (typeof raw === "object") {
    const msg = raw.message;
    if (typeof msg === "string") return msg;
    if (typeof raw.error === "string") return raw.error;
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return "";
    }
  }
  return String(raw);
}

/**
 * Extrae el detalle de un error del backend
 * Maneja diferentes estructuras: result.details, error.details, details como string o objeto.
 * Estructura típica del API (ej. login 401): result.details = { error?, userId?, message? }.
 * Siempre devuelve string o undefined (nunca un objeto).
 */
export function extractErrorDetail(error: any): string | undefined {
  if (!error) return undefined;

  const backendResult = error?.result;
  const rawDetails = error?.details ?? backendResult?.details;

  if (!rawDetails) return undefined;

  if (typeof rawDetails === "string") return rawDetails;

  if (rawDetails?.message !== undefined) {
    const message = rawDetails.message;
    if (Array.isArray(message)) {
      return message
        .map((item) =>
          typeof item === "string"
            ? item
            : (item?.message ?? detailToString(item)),
        )
        .filter(Boolean)
        .join("\n");
    }
    return detailToString(message);
  }

  if (Array.isArray(rawDetails)) {
    return rawDetails
      .map((item) =>
        typeof item === "string"
          ? item
          : (item?.message ?? detailToString(item)),
      )
      .filter(Boolean)
      .join("\n");
  }

  if (typeof rawDetails === "object") {
    const str = detailToString(rawDetails);
    return str || undefined;
  }

  return undefined;
}

/**
 * Extrae el mensaje de error del backend
 */
export function extractErrorMessage(
  error: any,
  defaultMessage: string = "Error desconocido",
): string {
  if (!error) return defaultMessage;

  // ApiError tiene message directamente (heredado de Error)
  // Error del backend tiene result.description
  const backendResult = error?.result;
  const description = backendResult?.description;

  // Si description es un array, unir los elementos
  if (Array.isArray(description)) {
    return description
      .map((item) => (typeof item === "string" ? item : String(item)))
      .filter(Boolean)
      .join(" ");
  }

  // Si description es un string, devolverlo directamente
  if (typeof description === "string") {
    return description;
  }

  // Fallback a error.message o defaultMessage (nunca devolver un objeto; React no puede renderizarlo)
  const fallback = error?.message ?? defaultMessage;
  if (typeof fallback === "string") return fallback;
  try {
    return typeof fallback === "object" && fallback !== null
      ? JSON.stringify(fallback)
      : String(fallback);
  } catch {
    return defaultMessage;
  }
}

/**
 * Extrae tanto el mensaje como el detalle de un error del backend
 */
export function extractErrorInfo(
  error: any,
  defaultMessage: string = "Error desconocido",
): {
  message: string;
  detail?: string;
} {
  return {
    message: extractErrorMessage(error, defaultMessage),
    detail: extractErrorDetail(error),
  };
}
