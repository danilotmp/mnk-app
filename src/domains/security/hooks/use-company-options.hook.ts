import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { ApiError } from '@/src/infrastructure/api';
import { HTTP_STATUS } from '@/src/infrastructure/api/constants';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CompaniesService } from '../services';
import { CompanyFilters, SecurityCompany } from '../types';

const DEFAULT_LIMIT = 100;

export interface UseCompanyOptionsParams {
  filters?: Partial<CompanyFilters>;
  autoFetch?: boolean;
  includeInactive?: boolean;
  immediate?: boolean;
}

export interface UseCompanyOptionsResult {
  companies: SecurityCompany[];
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
  const [companies, setCompanies] = useState<SecurityCompany[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

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
    setLoading(true);
    setError(null);

    try {
      const currentFilters = buildFilters();
      const response = await CompaniesService.getCompanies(currentFilters);
      const items = Array.isArray(response.data) ? response.data : [];
      if (isMountedRef.current) {
        setCompanies(items);
      }
    } catch (err: unknown) {
      const apiError = err as ApiError | Error;

      if (apiError instanceof ApiError && apiError.statusCode === HTTP_STATUS.FORBIDDEN) {
        try {
          const fallbackCompanies = await CompaniesService.getMyCompanies();
          if (isMountedRef.current) {
            setCompanies(fallbackCompanies);
          }
        } catch (fallbackError) {
          if (isMountedRef.current) {
            const fallbackErr = fallbackError instanceof Error ? fallbackError : new Error('Error al obtener empresas');
            setError(fallbackErr);
            alert.showError(fallbackErr.message);
          }
        }
      } else {
        const finalError = apiError instanceof Error ? apiError : new Error('Error al obtener empresas');
        if (isMountedRef.current) {
          setError(finalError);
          alert.showError(finalError.message);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [alert, buildFilters]);

  const refresh = useCallback(async () => {
    await fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (!autoFetch) {
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


