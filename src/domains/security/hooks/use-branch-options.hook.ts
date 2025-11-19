import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { ApiError } from '@/src/infrastructure/api';
import { HTTP_STATUS } from '@/src/infrastructure/api/constants';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BranchesService } from '../services';
import { BranchFilters, SecurityBranch } from '../types';

const DEFAULT_LIMIT = 100;

/**
 * Validar si un string es un UUID válido
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export interface UseBranchOptionsParams {
  companyId?: string;
  autoFetch?: boolean;
  includeInactive?: boolean;
  immediate?: boolean;
  extraFilters?: Partial<BranchFilters>;
}

export interface UseBranchOptionsResult {
  branches: SecurityBranch[];
  loading: boolean;
  error: Error | null;
  refresh: (params?: { companyId?: string }) => Promise<void>;
  setFilters: (filters: Partial<BranchFilters>) => void;
}

export function useBranchOptions({
  companyId,
  autoFetch = true,
  includeInactive = false,
  immediate = true,
  extraFilters,
}: UseBranchOptionsParams = {}): UseBranchOptionsResult {
  const alert = useAlert();
  const [branches, setBranches] = useState<SecurityBranch[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setInternalFilters] = useState<Partial<BranchFilters>>(extraFilters ?? {});
  const isMountedRef = useRef(true);
  const cacheRef = useRef<Map<string, SecurityBranch[]>>(new Map());

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const buildFilters = useCallback(
    (targetCompanyId?: string): BranchFilters => {
      const resolvedCompanyId = targetCompanyId ?? companyId;
      const baseFilters: BranchFilters = {
        page: 1,
        limit: DEFAULT_LIMIT,
        companyId: resolvedCompanyId,
        search: filters.search,
        code: filters.code,
        name: filters.name,
        type: filters.type,
        status: includeInactive ? filters.status : 1, // ✅ CAMBIADO: status=1 (Activo) en lugar de isActive=true
      };
      return baseFilters;
    },
    [companyId, filters, includeInactive]
  );

  const fetchFromApi = useCallback(
    async (targetCompanyId?: string) => {
      // Validar que targetCompanyId sea un UUID válido si se proporciona
      if (targetCompanyId && !isValidUUID(targetCompanyId)) {
        // No hacer la llamada si el ID no es válido
        setBranches([]);
        return;
      }

      const cacheKey = targetCompanyId ?? 'all';

      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey) ?? [];
        setBranches(cached);
        return;
      }

      let items: SecurityBranch[] = [];
      if (targetCompanyId) {
        items = await BranchesService.getBranchesByCompany(targetCompanyId);
      } else {
        const currentFilters = buildFilters();
        const response = await BranchesService.getBranches(currentFilters);
        items = Array.isArray(response.data) ? response.data : [];
      }

      cacheRef.current.set(cacheKey, items);
      setBranches(items);
    },
    [buildFilters]
  );

  const fetchFromContext = useCallback(async () => {
    const myBranches = await BranchesService.getMyBranches();
    setBranches(myBranches);
  }, []);

  const fetchBranches = useCallback(
    async (targetCompanyId?: string) => {
      setLoading(true);
      setError(null);

      try {
        if (targetCompanyId) {
          await fetchFromApi(targetCompanyId);
        } else {
          await fetchFromApi();
        }
      } catch (err: unknown) {
        const apiError = err as ApiError | Error;
        if (apiError instanceof ApiError && apiError.statusCode === HTTP_STATUS.FORBIDDEN) {
          try {
            await fetchFromContext();
          } catch (fallbackError) {
            const finalError =
              fallbackError instanceof Error
                ? fallbackError
                : new Error('Error al obtener sucursales');
            setError(finalError);
            alert.showError(finalError.message);
          }
        } else {
          const finalError = apiError instanceof Error ? apiError : new Error('Error al obtener sucursales');
          setError(finalError);
          alert.showError(finalError.message);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [alert, fetchFromApi, fetchFromContext]
  );

  const refresh = useCallback(
    async ({ companyId: nextCompanyId }: { companyId?: string } = {}) => {
      const key = nextCompanyId ?? companyId ?? 'all';
      cacheRef.current.delete(key);
      await fetchBranches(nextCompanyId ?? companyId);
    },
    [companyId, fetchBranches]
  );

  useEffect(() => {
    if (!autoFetch) {
      return;
    }
    
    // Validar que companyId sea un UUID válido antes de hacer la llamada
    const targetCompanyId = companyId || filters.companyId;
    if (targetCompanyId && !isValidUUID(targetCompanyId)) {
      // No hacer la llamada automática si el ID no es válido
      return;
    }

    if (!companyId && filters.companyId) {
      fetchBranches(filters.companyId);
      return;
    }
    if (companyId) {
      fetchBranches(companyId);
    }
  }, [autoFetch, companyId, fetchBranches, filters.companyId]);

  const handleSetFilters = useCallback((newFilters: Partial<BranchFilters>) => {
    setInternalFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return useMemo(
    () => ({
      branches,
      loading,
      error,
      refresh,
      setFilters: handleSetFilters,
    }),
    [branches, loading, error, refresh, handleSetFilters]
  );
}


