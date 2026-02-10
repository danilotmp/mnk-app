/**
 * Tipos e interfaces para el sistema de menú dinámico
 * Basado en la documentación de integración del backend
 */

/**
 * Item de menú individual
 */
export interface MenuItem {
  id: string;
  label: string;
  route?: string;
  description?: string;
  icon?: string; // Nombre del icono (formato: "Familia:Nombre" o solo "Nombre" para Ionicons)
  isPublic?: boolean; // Si es true, es una opción pública (opción por defecto)
  status?: number; // -1=Eliminado, 0=Inactivo, 1=Activo, 2=Pendiente
  statusDescription?: string; // Descripción del estado (ej: "Pendiente", "Activo", etc.)
  columns?: MenuColumn[];
  submenu?: MenuSubItem[];
}

/**
 * Columna del menú (para mega menus).
 * id = GUID del ítem grupo; menuId = identificador del nodo (ej. "system-root", "notifications-root").
 * Ambos se envían en el sync para que el backend reconozca el ítem existente.
 */
export interface MenuColumn {
  id?: string;
  menuId?: string;
  title: string;
  items: MenuSubItem[];
}

/**
 * Sub-item del menú
 */
export interface MenuSubItem {
  id: string;
  label: string;
  route: string;
  description?: string;
  icon?: string; // Nombre del icono de Ionicons (solo para opciones de último nivel)
  isPublic?: boolean; // Si es true, es una opción pública (opción por defecto)
  status?: number; // -1=Eliminado, 0=Inactivo, 1=Activo, 2=Pendiente
  statusDescription?: string; // Descripción del estado (ej: "Pendiente", "Activo", etc.)
}

/**
 * Respuesta del endpoint de menú
 */
export interface MenuResponse {
  data: MenuItem[];
  result: {
    statusCode: number;
    description: string;
    details: any;
  };
}
