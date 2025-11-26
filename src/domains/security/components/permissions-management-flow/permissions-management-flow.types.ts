import { MenuItem } from '@/src/infrastructure/menu/types';
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
   * Lista de permisos actuales del rol
   */
  permissions: SecurityPermission[];
  
  /**
   * ID del rol para el que se quiere mostrar/editar permisos (opcional)
   * Si se proporciona, se carga el menú del rol usando MenuService.getMenuForRole
   * Si no se proporciona, se carga el menú completo
   */
  roleId?: string;
  
  /**
   * Callback que se ejecuta cuando hay cambios en los permisos
   * @param changes Lista de cambios pendientes
   */
  onChanges?: (changes: PermissionChange[]) => void;
  
  /**
   * Valor de búsqueda para filtrar por label, route y description
   */
  searchValue?: string;
  
  /**
   * Módulo seleccionado para filtrar
   */
  selectedModule?: string;
  
  /**
   * Acción seleccionada para filtrar (view, create, edit, delete)
   */
  selectedAction?: string;
  
  /**
   * Si se muestran las opciones por defecto (isPublic = true)
   * Por defecto true
   */
  showDefaultOptions?: boolean;
  
  /**
   * Si mostrar todas las opciones del menú (showAll = true)
   * Por defecto false
   */
  showAll?: boolean;
  
  /**
   * Callback para exponer los menuItems cargados (para filtros)
   */
  onMenuItemsLoaded?: (menuItems: MenuItem[]) => void;
  
  /**
   * Permisos personalizados (isSystem = false) para mostrar iconos adicionales
   */
  customPermissions?: SecurityPermission[];
}

