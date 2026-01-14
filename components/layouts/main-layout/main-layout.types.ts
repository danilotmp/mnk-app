/**
 * Tipos para el componente MainLayout
 */

import { ReactNode } from 'react';
import { MenuItem } from '@/components/navigation';

export interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showUserProfile?: boolean;
  showNavigation?: boolean;
  menuItems?: MenuItem[];
}
