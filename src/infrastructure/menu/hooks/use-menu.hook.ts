/**
 * Hook para obtener y gestionar el menú dinámico
 * Se actualiza automáticamente según el estado de autenticación y el idioma
 */

import { useLanguage } from '@/src/infrastructure/i18n/language.context';
import { useSession } from '@/src/infrastructure/session';
import { useCallback, useEffect, useState } from 'react';
import { MenuService } from '../menu.service';
import { MenuItem } from '../types';

/**
 * Hook para obtener el menú dinámico
 */
export function useMenu() {
  const { isAuthenticated, isLoading: isSessionLoading } = useSession();
  const { language: currentLanguage } = useLanguage();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar menú desde el backend o usar menú por defecto
   */
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener menú según estado de autenticación
      // Si está autenticado: llama al servicio /api/security/menu (devuelve público + privado según permisos)
      // Si NO está autenticado: usa menú por defecto con páginas públicas (no llama al servicio)
      const menuItems = await MenuService.getMenuForUser(
        currentLanguage,
        isAuthenticated
      );

      setMenu(menuItems);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el menú');
      // En caso de error, usar menú por defecto
      setMenu(MenuService.getDefaultMenu());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentLanguage]);

  /**
   * Efecto para cargar el menú cuando cambia el estado de autenticación o el idioma
   */
  useEffect(() => {
    // Esperar a que la sesión termine de cargar
    if (isSessionLoading) {
      return;
    }

    fetchMenu();
  }, [isAuthenticated, currentLanguage, isSessionLoading, fetchMenu]);

  /**
   * Refrescar el menú manualmente
   */
  const refetch = useCallback(() => {
    fetchMenu();
  }, [fetchMenu]);

  return {
    menu,
    loading,
    error,
    refetch,
  };
}

