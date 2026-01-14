/**
 * Tipos para el componente HorizontalMenu
 */

export interface MenuItem {
  id: string;
  label: string;
  route?: string;
  onPress?: () => void;
  icon?: string;
  description?: string;
  submenu?: MenuItem[];
  columns?: MenuColumn[];
  isPublic?: boolean; // Indica si el item es público (visible sin autenticación)
}

export interface MenuColumn {
  title: string;
  items: MenuItem[];
}

export interface HorizontalMenuProps {
  items: MenuItem[];
  onItemPress?: (item: MenuItem) => void;
}
