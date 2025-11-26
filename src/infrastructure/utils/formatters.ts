/**
 * Utilidades para formateo de texto en formularios
 * Funciones reutilizables para transformar código y nombres
 */

/**
 * Convierte un texto a formato de código:
 * - Convierte a mayúsculas
 * - Reemplaza espacios por guiones bajos
 * 
 * @param text - Texto a convertir
 * @returns Texto formateado como código (ej: "mi codigo" -> "MI_CODIGO")
 * 
 * @example
 * ```ts
 * formatCode("mi codigo") // "MI_CODIGO"
 * formatCode("Mi Código") // "MI_CODIGO"
 * ```
 */
export function formatCode(text: string): string {
  return text.toUpperCase().replace(/\s+/g, '_');
}

/**
 * Convierte un texto a formato de nombre legible:
 * - Convierte guiones bajos a espacios
 * - Capitaliza la primera letra de cada palabra
 * - Preserva espacios entre palabras
 * 
 * @param text - Texto a convertir (puede contener guiones bajos)
 * @returns Texto formateado como nombre (ej: "MI_CODIGO" -> "Mi Codigo")
 * 
 * @example
 * ```ts
 * formatName("MI_CODIGO") // "Mi Codigo"
 * formatName("mi codigo") // "Mi Codigo"
 * formatName("mi_codigo_ejemplo") // "Mi Codigo Ejemplo"
 * ```
 */
export function formatName(text: string): string {
  // Reemplazar guiones bajos por espacios
  const textWithSpaces = text.replace(/_/g, ' ');
  
  // Convertir a formato nombre: primera letra mayúscula, resto minúsculas, espacios preservados
  return textWithSpaces
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word: string) => word.length > 0)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Procesa un valor de código y genera tanto el código formateado como el nombre correspondiente
 * Útil para formularios donde el código y el nombre se sincronizan automáticamente
 * 
 * @param inputValue - Valor ingresado por el usuario (puede contener espacios o guiones bajos)
 * @returns Objeto con código y nombre formateados
 * 
 * @example
 * ```ts
 * processCodeAndName("mi codigo") 
 * // { code: "MI_CODIGO", name: "Mi Codigo" }
 * ```
 */
export function processCodeAndName(inputValue: string): { code: string; name: string } {
  const code = formatCode(inputValue);
  const name = formatName(inputValue);
  
  return { code, name };
}

