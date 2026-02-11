/**
 * Hook que obtiene las opciones de tipo de sucursal desde el servicio de Catálogos
 * (CatalogService.queryCatalog → POST /catalogs/query) con código BRANCH_TYPE.
 * Reutiliza el mismo servicio que usa el wizard (TIMEZONES, INDUSTRIES, etc.).
 */

import { CatalogService } from "@/src/domains/catalog";
import { useCompany } from "@/src/domains/shared";
import { useEffect, useState } from "react";
import type { BranchType } from "../types";
import { BRANCH_TYPE_CATALOG_CODE } from "../utils/branch-type.utils";

const VALID_BRANCH_TYPES: BranchType[] = [
  "headquarters",
  "branch",
  "warehouse",
  "store",
];

export interface BranchTypeOption {
  label: string;
  value: BranchType;
}

async function fetchBranchTypeOptions(
  companyId: string | null | undefined,
): Promise<BranchTypeOption[]> {
  try {
    const response = await CatalogService.queryCatalog(
      BRANCH_TYPE_CATALOG_CODE,
      companyId ?? null,
      false,
    );
    const details = response.details ?? [];
    const options: BranchTypeOption[] = details
      .filter((entry) => {
        const code = (entry.code || "").toLowerCase() as BranchType;
        const isActive = entry.status === undefined || entry.status === 1;
        return isActive && VALID_BRANCH_TYPES.includes(code);
      })
      .map((entry) => ({
        label: entry.name ?? entry.code ?? "",
        value: (entry.code?.toLowerCase() ?? "branch") as BranchType,
      }))
      .sort(
        (a, b) =>
          VALID_BRANCH_TYPES.indexOf(a.value) -
          VALID_BRANCH_TYPES.indexOf(b.value),
      );
    return options;
  } catch {
    return [];
  }
}

export function useBranchTypeOptions() {
  const { company } = useCompany();
  const [options, setOptions] = useState<BranchTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchBranchTypeOptions(company?.id ?? null)
      .then((data) => {
        if (!cancelled) {
          setOptions(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [company?.id]);

  return {
    options,
    loading,
    error,
  };
}
