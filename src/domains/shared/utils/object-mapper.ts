/**
 * Mapper genérico para transformar objetos de API a modelos de dominio
 * Auto-mapea campos con el mismo nombre y permite mapeos personalizados
 */

export interface MappingConfig {
  /**
   * Mapeos personalizados: { campoOrigen: 'campoDestino' }
   * Ejemplo: { 'business_context_id': 'companyId' }
   */
  fieldMappings?: Record<string, string>;
  
  /**
   * Valores por defecto si no existen en origen
   * Ejemplo: { companyId: 'default-id' }
   */
  defaultValues?: Record<string, any>;
  
  /**
   * Campos a ignorar del origen
   * Ejemplo: ['internalId', 'metadata']
   */
  excludeFields?: string[];
  
  /**
   * Si true, mapea recursivamente objetos anidados
   * Por defecto: true
   */
  deep?: boolean;
}

/**
 * Mapea un objeto fuente a un tipo destino
 * Auto-mapea campos con el mismo nombre
 * 
 * @param source Objeto fuente (respuesta del API)
 * @param config Configuración de mapeo opcional
 * @returns Objeto mapeado
 */
export function mapObject<T extends Record<string, any>>(
  source: any,
  config?: MappingConfig
): Partial<T> {
  if (!source || typeof source !== 'object') {
    return {} as Partial<T>;
  }

  const {
    fieldMappings = {},
    defaultValues = {},
    excludeFields = [],
    deep = true,
  } = config || {};

  const result: any = {};

  // Aplicar valores por defecto primero
  Object.keys(defaultValues).forEach(key => {
    result[key] = defaultValues[key];
  });

  // Mapear campos del origen
  Object.keys(source).forEach(sourceKey => {
    // Ignorar campos excluidos
    if (excludeFields.includes(sourceKey)) {
      return;
    }

    // Verificar si hay mapeo personalizado
    const targetKey = fieldMappings[sourceKey] || sourceKey;
    const sourceValue = source[sourceKey];

    // Si deep es true y el valor es un objeto/array, mapear recursivamente
    if (deep && sourceValue !== null && sourceValue !== undefined) {
      if (Array.isArray(sourceValue)) {
        // Para arrays, mapear cada elemento si es objeto
        result[targetKey] = sourceValue.map(item => 
          typeof item === 'object' && item !== null 
            ? mapObject(item, config) 
            : item
        );
      } else if (typeof sourceValue === 'object') {
        // Para objetos, mapear recursivamente
        result[targetKey] = mapObject(sourceValue, config);
      } else {
        // Valores primitivos
        result[targetKey] = sourceValue;
      }
    } else {
      // Sin mapeo profundo, copiar directamente
      result[targetKey] = sourceValue;
    }
  });

  return result as Partial<T>;
}

/**
 * Mapea un array de objetos fuente a un array de tipo destino
 * 
 * @param source Array de objetos fuente
 * @param config Configuración de mapeo opcional
 * @returns Array de objetos mapeados
 */
export function mapArray<T extends Record<string, any>>(
  source: any[],
  config?: MappingConfig
): Partial<T>[] {
  if (!Array.isArray(source)) {
    return [];
  }

  return source.map(item => mapObject<T>(item, config));
}

/**
 * Mapea un objeto fuente a un tipo destino con validación de campos requeridos
 * Útil cuando necesitas asegurar que ciertos campos existen
 * 
 * @param source Objeto fuente
 * @param requiredFields Campos requeridos que deben existir
 * @param config Configuración de mapeo opcional
 * @returns Objeto mapeado
 * @throws Error si faltan campos requeridos
 */
export function mapObjectWithValidation<T extends Record<string, any>>(
  source: any,
  requiredFields: string[],
  config?: MappingConfig
): Partial<T> {
  const mapped = mapObject<T>(source, config);
  
  const missingFields = requiredFields.filter(field => 
    !(field in mapped) || mapped[field] === undefined || mapped[field] === null
  );
  
  if (missingFields.length > 0) {
    throw new Error(
      `Campos requeridos faltantes después del mapeo: ${missingFields.join(', ')}`
    );
  }
  
  return mapped;
}




