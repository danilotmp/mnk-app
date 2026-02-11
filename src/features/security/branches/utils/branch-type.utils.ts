/**
 * Utilidades compartidas para tipos de sucursal.
 * La lista de opciones (Casa matriz, Sucursal, etc.) viene del catálogo BRANCH_TYPE vía CatalogService.queryCatalog.
 */

import type { BranchType } from "../types";

/** Código del catálogo de tipos de sucursal en el backend (Catálogos). */
export const BRANCH_TYPE_CATALOG_CODE = "BRANCH_TYPE";

/**
 * Infiere el tipo de sucursal a partir del código (p. ej. cuando el API no devuelve type).
 */
export function inferBranchType(code: string): BranchType {
  const upperCode = code.toUpperCase();
  if (
    upperCode.includes("HQ") ||
    upperCode.includes("HEADQUARTERS") ||
    upperCode.includes("CASA MATRIZ")
  ) {
    return "headquarters";
  }
  if (
    upperCode.includes("WAREHOUSE") ||
    upperCode.includes("ALMACEN") ||
    upperCode.includes("BODEGA")
  ) {
    return "warehouse";
  }
  if (
    upperCode.includes("STORE") ||
    upperCode.includes("TIENDA") ||
    upperCode.includes("LOCAL")
  ) {
    return "store";
  }
  return "branch";
}
