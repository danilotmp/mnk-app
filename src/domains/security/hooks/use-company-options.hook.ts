import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { ApiError } from '@/src/infrastructure/api';
import { HTTP_STATUS } from '@/src/infrastructure/api/constants';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CompaniesService } from '@/src/features/security/companies';
import type { Company, CompanyFilters } from '@/src/features/security/companies/types/domain';

const DEFAULT_LIMIT = 100;

export interface UseCompanyOptionsParams {
  filters?: Partial<CompanyFilters>;
  autoFetch?: boolean;
  includeInactive?: boolean;
  immediate?: boolean;
}

export interface UseCompanyOptionsResult {
  companies: Company[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useCompanyOptions({
  filters,
  autoFetch = true,
  includeInactive = false,
  immediate = true,
}: UseCompanyOptionsParams = {}): UseCompanyOptionsResult {
  const alert = useAlert();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  // Bandera para prevenir reintentos cuando hay un error de autenticación
  const hasAuthErrorRef = useRef(false);
  const loadingRef = useRef(false); // Para prevenir llamadas simultáneas

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const buildFilters = useCallback((): CompanyFilters => {
    const baseFilters: CompanyFilters = {
      page: 1,
      limit: DEFAULT_LIMIT,
      search: filters?.search,
      code: filters?.code,
      name: filters?.name,
      email: filters?.email,
      status: includeInactive ? filters?.status : 1, // ✅ CAMBIADO: status=1 (Activo) en lugar de isActive=true
    };

    return baseFilters;
  }, [filters, includeInactive]);

  const fetchCompanies = useCallback(async () => {
    // Prevenir llamadas simultáneas
    if (loadingRef.current) {
      return;
    }

    // Si hay un error de autenticación previo, no intentar de nuevo
    if (hasAuthErrorRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const currentFilters = buildFilters();
      const response = await CompaniesService.getCompanies(currentFilters);
      const items = Array.isArray(response.data) ? response.data : [];
      if (isMountedRef.current) {
        setCompanies(items);
        hasAuthErrorRef.current = false; // Resetear bandera en caso de éxito
      }
    } catch (err: unknown) {
      const apiError = err as ApiError | Error;

      // Verificar si es un error de autenticación (401 Unauthorized o 403 Forbidden)
      const isAuthError = apiError instanceof ApiError && 
        (apiError.statusCode === HTTP_STATUS.UNAUTHORIZED || 
         apiError.statusCode === HTTP_STATUS.FORBIDDEN);

      if (isAuthError) {
        // Marcar que hay un error de autenticación para evitar reintentos
        hasAuthErrorRef.current = true;
        if (isMountedRef.current) {
          const authError = apiError instanceof Error ? apiError : new Error('Token inválido o ausente');
          setError(authError);
          // No mostrar error en toast si es de autenticación (el logout ya lo maneja)
          // alert.showError(authError.message);
        }
        loadingRef.current = false;
        if (isMountedRef.current) {
          setLoading(false);
        }
        return; // Terminar aquí, no reintentar
      }

      // Otros errores (no de autenticación)
      const finalError = apiError instanceof Error ? apiError : new Error('Error al obtener empresas');
      if (isMountedRef.current) {
        setError(finalError);
        alert.showError(finalError.message);
      }
    } finally {
      loadingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [alert, buildFilters]);

  const refresh = useCallback(async () => {
    // Resetear bandera de error de autenticación al hacer refresh manual
    hasAuthErrorRef.current = false;
    await fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }
    // No ejecutar si hay un error de autenticación activo
    if (hasAuthErrorRef.current) {
      return;
    }
    fetchCompanies();
  }, [autoFetch, fetchCompanies]);

  return useMemo(
    () => ({
      companies,
      loading,
      error,
      refresh,
    }),
    [companies, loading, error, refresh]
  );
}


