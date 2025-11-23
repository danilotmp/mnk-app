// Exportar screens (Componentes contenedores)
export { RolesListScreen } from './screens';

// Exportar componentes
export { RoleCreateForm, RoleEditForm } from './components';
export type { RoleCreateFormProps, RoleEditFormProps } from './components';

// Exportar servicios
export { RolesService } from './services';
export type { PermissionOperation, BulkUpdateRolePermissionsRequest, BulkUpdateRolePermissionsResponse } from './services';

// Exportar tipos
export type { Role, RoleFilters } from './types/domain';
export type { RoleApi } from './types/api';

// Exportar adaptadores
export { roleAdapter, rolesAdapter } from './adapters';
