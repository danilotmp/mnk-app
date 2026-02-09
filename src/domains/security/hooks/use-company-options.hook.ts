import { ApiError } from "@/src/infrastructure/api";
import { HTTP_STATUS } from "@/src/infrastructure/api/constants";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CompaniesService } from "@/src/features/security/companies";
import type {
    Company,
    CompanyFilters,
} from "@/src/features/security/companies/types/domain";

export interface UseCompanyOptionsParams {
  filters?: Partial<Omit<CompanyFilters, "page" | "limit">>;
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
  // Bandera para prevenir reintentos cuando hay cualquier error
  const hasErrorRef = useRef(false);
  const loadingRef = useRef(false); // Para prevenir llamadas simultáneas

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const buildFilters = useCallback((): Partial<CompanyFilters> => {
    return {
      search: filters?.search,
      code: filters?.code,
      name: filters?.name,
      email: filters?.email,
      status: includeInactive ? filters?.status : 1,
    };
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

    // Si hay un error previo (no de autenticación), no intentar de nuevo automáticamente
    if (hasErrorRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    hasErrorRef.current = false; // Resetear bandera de error al iniciar nueva llamada

    try {
      const currentFilters = buildFilters();
      const response = await CompaniesService.getCompanies(currentFilters);
      const items = Array.isArray(response.data) ? response.data : [];
      if (isMountedRef.current) {
        setCompanies(items);
        hasAuthErrorRef.current = false; // Resetear bandera en caso de éxito
        hasErrorRef.current = false; // Resetear bandera de error en caso de éxito
      }
    } catch (err: unknown) {
      const apiError = err as ApiError | Error;

      // Verificar si es un error de autenticación (401 Unauthorized o 403 Forbidden)
      const isAuthError =
        apiError instanceof ApiError &&
        (apiError.statusCode === HTTP_STATUS.UNAUTHORIZED ||
          apiError.statusCode === HTTP_STATUS.FORBIDDEN);

      if (isAuthError) {
        // Marcar que hay un error de autenticación para evitar reintentos
        hasAuthErrorRef.current = true;
        hasErrorRef.current = true; // También marcar error general
        if (isMountedRef.current) {
          const authError =
            apiError instanceof Error
              ? apiError
              : new Error("Token inválido o ausente");
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
      hasErrorRef.current = true; // Marcar que hay un error para evitar reintentos
      const finalError =
        apiError instanceof Error
          ? apiError
          : new Error("Error al obtener empresas");
      if (isMountedRef.current) {
        setError(finalError);
        // Mostrar error solo una vez
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
    // Resetear banderas de error al hacer refresh manual
    hasAuthErrorRef.current = false;
    hasErrorRef.current = false;
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
    // No ejecutar si hay un error activo (para evitar bucles infinitos)
    if (hasErrorRef.current) {
      return;
    }
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Remover fetchCompanies de las dependencias para evitar bucles

  return useMemo(
    () => ({
      companies,
      loading,
      error,
      refresh,
    }),
    [companies, loading, error, refresh],
  );
}
