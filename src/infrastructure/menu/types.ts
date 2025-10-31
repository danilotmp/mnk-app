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
  columns?: MenuColumn[];
  submenu?: MenuSubItem[];
}

/**
 * Columna del menú (para mega menus)
 */
export interface MenuColumn {
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

