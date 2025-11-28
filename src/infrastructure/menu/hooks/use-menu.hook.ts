/**
 * Hook para obtener y gestionar el menú dinámico
 * Se actualiza automáticamente según el estado de autenticación y el idioma
 */

import { useLanguage } from '@/src/infrastructure/i18n/language.context';
import { useSession } from '@/src/infrastructure/session';
import { useEffect, useRef, useState } from 'react';
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
  
  // Usar refs para evitar bucles infinitos
  const isAuthenticatedRef = useRef(isAuthenticated);
  const currentLanguageRef = useRef(currentLanguage);
  
  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    currentLanguageRef.current = currentLanguage;
  }, [isAuthenticated, currentLanguage]);

  /**
   * Efecto para cargar el menú cuando cambia el estado de autenticación o el idioma
   */
  useEffect(() => {
    // Esperar a que la sesión termine de cargar
    if (isSessionLoading) {
      return;
    }

    let cancelled = false;

    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener menú según estado de autenticación
        // Si está autenticado: llama al servicio /api/security/menu (devuelve público + privado según permisos)
        // Si NO está autenticado: usa menú por defecto con páginas públicas (no llama al servicio)
        const menuItems = await MenuService.getMenuForUser(
          currentLanguageRef.current,
          isAuthenticatedRef.current
        );

        if (!cancelled) {
          setMenu(menuItems);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Error al cargar el menú');
          // En caso de error, usar menú por defecto
          setMenu(MenuService.getDefaultMenu());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMenu();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentLanguage, isSessionLoading]);

  /**
   * Refrescar el menú manualmente
   */
  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const menuItems = await MenuService.getMenuForUser(
        currentLanguageRef.current,
        isAuthenticatedRef.current
      );

      setMenu(menuItems);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el menú');
      setMenu(MenuService.getDefaultMenu());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar el menú para un rol específico
   */
  const refetchForRole = async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const menuItems = await MenuService.getMenuForRole(
        roleId,
        currentLanguageRef.current
      );

      setMenu(menuItems);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el menú del rol');
      setMenu(MenuService.getDefaultMenu());
    } finally {
      setLoading(false);
    }
  };

  return {
    menu,
    loading,
    error,
    refetch,
    refetchForRole,
  };
}

