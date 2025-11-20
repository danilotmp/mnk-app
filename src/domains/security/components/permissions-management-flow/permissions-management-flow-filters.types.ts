import { MenuItem } from '@/src/infrastructure/menu/types';

/**
 * Props del componente PermissionsFlowFilters
 */
export interface PermissionsFlowFiltersProps {
  /**
   * Items del menú para extraer módulos disponibles
   */
  menuItems: MenuItem[];

  /**
   * Valor del campo de búsqueda
   */
  searchValue: string;

  /**
   * Callback cuando cambia el valor de búsqueda
   */
  onSearchChange: (value: string) => void;

  /**
   * Módulo seleccionado (label del item padre)
   */
  selectedModule: string;

  /**
   * Callback cuando cambia el módulo seleccionado
   */
  onModuleChange: (module: string) => void;

  /**
   * Acción seleccionada (view, create, edit, delete)
   */
  selectedAction: string;

  /**
   * Callback cuando cambia la acción seleccionada
   */
  onActionChange: (action: string) => void;

  /**
   * Callback para limpiar todos los filtros
   */
  onClearFilters: () => void;
}

