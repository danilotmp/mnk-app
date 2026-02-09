/**
 * Tipos para el componente AccessGuard
 */

import { ReactNode } from 'react';

export interface AccessGuardProps {
  children: ReactNode;
  /**
   * Código de permiso requerido
   */
  permission?: string;
  /**
   * Lista de permisos (requiere TODOS)
   */
  permissions?: string[];
  /**
   * Lista de permisos (requiere AL MENOS UNO)
   */
  anyPermission?: string[];
  /**
   * Módulo y acción requeridos
   */
  moduleAccess?: {
    module: string;
    action: string;
  };
  /**
   * Componente a mostrar si no tiene acceso
   */
  fallback?: ReactNode;
  /**
   * Si es true, no muestra nada cuando no tiene acceso
   * Si es false, muestra el fallback
   */
  hideOnDenied?: boolean;
}

