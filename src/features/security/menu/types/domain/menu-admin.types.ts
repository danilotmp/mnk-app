/**
 * Tipos para la administración del menú
 */

export interface MenuAdminItem {
  id: string;
  label: string;
  route?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
  status: number; // -1=Eliminado, 0=Inactivo, 1=Activo, 2=Pendiente
  order: number;
  submenu?: MenuAdminItem[];
  columns?: MenuAdminColumn[];
  parentId?: string; // ID del item padre si es un subitem
  level: number; // Nivel de anidación (0 = raíz, 1 = submenu, etc.)
}

export interface MenuAdminColumn {
  id: string;
  menuId?: string; // Identificador del nodo (ej. "system-root"); se envía en sync
  title: string;
  order: number;
  items: MenuAdminItem[];
  parentId: string; // ID del item padre
}

export interface MenuAdminFilters {
  search?: string;
  status?: number;
  isPublic?: boolean;
  module?: string;
}

export interface MenuAdminFormData {
  label: string;
  route?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
  status: number;
  order: number;
}
