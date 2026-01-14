/**
 * Tipos para el componente VerticalMenu
 */

import { MenuItem } from '../horizontal-menu/horizontal-menu.types';

export interface VerticalMenuProps {
  items: MenuItem[];
  onItemPress?: (item: MenuItem) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onExpandedChange?: (isExpanded: boolean) => void; // Callback para notificar cambios en el estado de expansión (incluye hover)
}
