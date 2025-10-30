/**
 * Hook para almacenar estado en la sesión con TTL
 * Útil para filtros, selecciones, preferencias de UI, etc.
 */

import { useCallback, useEffect, useState } from 'react';
import { sessionManager, SessionNamespace } from '../session-manager';

/**
 * Opciones para el estado cacheado
 */
interface CachedStateOptions {
  /**
   * Namespace donde guardar el dato
   */
  namespace?: SessionNamespace;
  
  /**
   * Tiempo de expiración en milisegundos
   */
  ttl?: number;
  
  /**
   * Si es true, restaura el valor guardado al montar el componente
   */
  persist?: boolean;
}

/**
 * Hook para guardar estado en la sesión
 * Similar a useState pero persiste automáticamente
 */
export function useCachedState<T>(
  key: string,
  initialValue: T,
  options: CachedStateOptions = {}
): [T, (value: T | ((prev: T) => T)) => Promise<void>] {
  const {
    namespace = 'ui',
    ttl,
    persist = true,
  } = options;

  const [state, setState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(!persist);

  /**
   * Cargar valor guardado al montar
   */
  useEffect(() => {
    if (!persist || isLoaded) {
      return;
    }

    sessionManager.getItem<T>(namespace, key).then((savedValue) => {
      if (savedValue !== null) {
        setState(savedValue);
      }
      setIsLoaded(true);
    });
  }, [namespace, key, persist, isLoaded]);

  /**
   * Guardar valor actualizado
   */
  const updateState = useCallback(async (value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function' 
      ? (value as (prev: T) => T)(state)
      : value;

    setState(newValue);

    // Guardar en sesión
    try {
      await sessionManager.setItem(namespace, key, newValue, { ttl });
    } catch (error) {
      // Fallar silenciosamente
    }
  }, [namespace, key, ttl, state]);

  return [state, updateState];
}

/**
 * Hook simplificado para guardar filtros/selecciones
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => Promise<void>] {
  return useCachedState(key, initialValue, {
    namespace: 'ui',
    persist: true,
  });
}

/**
 * Hook para datos en cache con expiración
 */
export function useCachedData<T>(
  key: string,
  initialValue: T,
  ttl: number
): [T, (value: T | ((prev: T) => T)) => Promise<void>, number | null] {
  const [state, updateState] = useCachedState(key, initialValue, {
    namespace: 'cache',
    ttl,
    persist: true,
  });

  const [timeToExpiry, setTimeToExpiry] = useState<number | null>(null);

  useEffect(() => {
    const updateExpiry = async () => {
      const remaining = await sessionManager.getTimeToExpiry('cache', key);
      setTimeToExpiry(remaining);
    };

    updateExpiry();
    const interval = setInterval(updateExpiry, 1000); // Actualizar cada segundo

    return () => clearInterval(interval);
  }, [key]);

  return [state, updateState, timeToExpiry];
}

