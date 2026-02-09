/**
 * Tipos para el componente PermissionsFlowFilters
 */

import { SecurityPermission } from "@/src/domains/security/types";
import { MenuItem } from "@/src/infrastructure/menu/types";

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
  /** Si false, se oculta el botón del ojo (Mostrar más opciones / Vista previa). Solo super admin. */
  showSuperAdminControls?: boolean;
  customPermissions?: SecurityPermission[]; // Permisos personalizados (isSystem = false)
  onClearFilters: () => void;
}
