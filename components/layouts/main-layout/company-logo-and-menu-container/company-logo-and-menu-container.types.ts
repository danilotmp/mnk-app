/**
 * Tipos para el componente CompanyLogoAndMenuContainer
 */

import { MenuItem } from '@/components/navigation';
import { CompanyInfo } from '@/src/domains/shared/types/multi-company.types';

export interface CompanyLogoAndMenuContainerProps {
  companyName: string;
  companySubtitle?: string; // Subtítulo que muestra el nombre de la empresa o "Artificial Intelligence Box"
  companyNameClickable: boolean;
  onCompanyNamePress: () => void;
  menuItems: MenuItem[];
  onMenuItemPress: (item: MenuItem) => void;
  titleWidth: number;
  onTitleLayout: (width: number) => void;
  showCompanyDropdown: boolean;
  canSwitchCompany: boolean;
  availableCompanies: CompanyInfo[];
  onCompanySelect: (company: CompanyInfo) => Promise<void>;
  colors: any;
}
