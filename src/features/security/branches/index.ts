// Exportar screens
export { BranchesListScreen } from './screens';

// Exportar componentes
export { BranchCreateForm, BranchEditForm } from './components';
export type { BranchCreateFormProps, BranchEditFormProps } from './components';

// Exportar servicios
export { BranchesService } from './services';

// Exportar tipos
export type { Branch, BranchFilters, BranchPayload } from './types/domain';
export type { BranchApi } from './types/api';

// Exportar adaptadores
export { branchAdapter, branchesAdapter } from './adapters';
