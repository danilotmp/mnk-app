/**
 * Componentes del dominio de Seguridades
 * NOTA: Los componentes de users, roles, companies y branches han sido migrados a src/features/security/
 * Estos componentes se mantienen temporalmente para compatibilidad con componentes que aún no se han migrado
 */

// Componentes de Permisos (aún no migrados)
export { PermissionCreateForm } from './permission-create-form/permission-create-form';
export type { PermissionCreateFormProps } from './permission-create-form/permission-create-form.types';
export { PermissionEditForm } from './permission-edit-form/permission-edit-form';
export type { PermissionEditFormProps } from './permission-edit-form/permission-edit-form.types';

// Componentes de Roles (aún no migrados completamente)
export { RolePermissionsModal } from './role-permissions-modal/role-permissions-modal';
export type { RolePermissionsModalProps } from './role-permissions-modal/role-permissions-modal.types';
export { PermissionFlow } from './role-permissions-flow';
export type { PermissionFlowProps } from './role-permissions-flow/role-permissions-flow.types';
export { PermissionsManagementFlow, PermissionsFlowFilters } from './permissions-management-flow';
export type { PermissionsManagementFlowProps, PermissionChange, PermissionsFlowFiltersProps } from './permissions-management-flow';

// Los siguientes componentes han sido migrados a src/features/security/
// export { CompanyCreateForm } from './company-create-form/company-create-form'; // → src/features/security/companies
// export { CompanyEditForm } from './company-edit-form/company-edit-form'; // → src/features/security/companies
// export { BranchCreateForm } from './branch-create-form/branch-create-form'; // → src/features/security/branches
// export { BranchEditForm } from './branch-edit-form/branch-edit-form'; // → src/features/security/branches
// export { RoleCreateForm } from './role-create-form/role-create-form'; // → src/features/security/roles
// export { RoleEditForm } from './role-edit-form/role-edit-form'; // → src/features/security/roles
// export { UserCreateForm } from './user-create-form/user-create-form'; // → src/features/security/users
// export { UserEditForm } from './user-edit-form/user-edit-form'; // → src/features/security/users
