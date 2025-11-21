/**
 * Tipos para el componente PermissionsFlowFilters
 */

import { MenuItem } from '@/src/infrastructure/menu/types';

export interface PermissionsFlowFiltersProps {
  menuItems: MenuItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedModule: string;
  onModuleChange: (module: string) => void;
  selectedAction: string;
  onActionChange: (action: string) => void;
  showDefaultOptions: boolean;
  onShowDefaultOptionsChange: (show: boolean) => void;
  showAll?: boolean;
  onShowAllChange?: (show: boolean) => void;
  onClearFilters: () => void;
}
