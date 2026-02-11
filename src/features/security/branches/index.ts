// Exportar screens
export { BranchesListScreen } from "./screens";

// Exportar componentes
export { BranchCreateForm, BranchEditForm } from "./components";
export type { BranchCreateFormProps, BranchEditFormProps } from "./components";

// Exportar hooks
export { useBranchTypeOptions } from "./hooks";
export type { BranchTypeOption } from "./hooks";

// Exportar servicios
export { BranchesService } from "./services";

// Exportar tipos
export type { BranchApi } from "./types/api";
export type { Branch, BranchFilters, BranchPayload } from "./types/domain";

// Exportar utilidades (inferBranchType, código de catálogo)
export {
    BRANCH_TYPE_CATALOG_CODE,
    inferBranchType
} from "./utils/branch-type.utils";

// Exportar adaptadores
export { branchAdapter, branchesAdapter } from "./adapters";
