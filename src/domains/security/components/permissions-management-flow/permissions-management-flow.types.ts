import { SecurityPermission } from '../../types';

/**
 * Cambio de permiso para una ruta específica
 */
export interface PermissionChange {
  route: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

/**
 * Props del componente PermissionsManagementFlow
 */
export interface PermissionsManagementFlowProps {
  /**
   * Lista de permisos actuales
   */
  permissions: SecurityPermission[];
  
  /**
   * Callback que se ejecuta cuando hay cambios en los permisos
   * @param changes Lista de cambios pendientes
   */
  onChanges?: (changes: PermissionChange[]) => void;
}

