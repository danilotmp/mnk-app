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
export { PermissionsCarousel } from './permissions-carousel/permissions-carousel';

