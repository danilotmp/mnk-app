/**
 * Hook para obtener y gestionar el menú dinámico
 * Se actualiza automáticamente según el estado de autenticación y el idioma
 */

import { useLanguage } from '@/src/infrastructure/i18n/language.context';
import { useSession } from '@/src/infrastructure/session';
import { UserSessionService } from '@/src/domains/shared/services/user-session.service';
import { useEffect, useRef, useState } from 'react';
import { MenuService } from '../menu.service';
import { MenuItem } from '../types';

/**
 * Hook para obtener el menú dinámico
 */
export function useMenu() {
  const { isAuthenticated, isLoading: isSessionLoading, user } = useSession();
  const { language: currentLanguage } = useLanguage();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userSessionService = UserSessionService.getInstance();
  
  const isAuthenticatedRef = useRef(isAuthenticated);
  const currentLanguageRef = useRef(currentLanguage);
  
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

        if (isAuthenticatedRef.current && user) {
          // Verificar que el token esté disponible antes de hacer la llamada
          const { apiClient } = await import('@/src/infrastructure/api/api.client');
          const tokens = await apiClient.getTokens();
          if (!tokens || !tokens.accessToken) {
            // Si no hay token, usar menú por defecto
            const menuItems = MenuService.getDefaultMenu();
            if (!cancelled) {
              setMenu(menuItems);
              setLoading(false);
            }
            return;
          }

          const savedMenu = await userSessionService.getMenu();
          if (savedMenu && savedMenu.length > 0) {
            if (!cancelled) {
              setMenu(savedMenu);
              setLoading(false);
            }
            return;
          }

          const currentCompanyId = await userSessionService.getCurrentCompany() || user.companyIdDefault;
          if (currentCompanyId) {
            try {
              const menuItems = await MenuService.getMenuForCompany(currentCompanyId, currentLanguageRef.current);
              await userSessionService.setMenu(menuItems, true);
              if (!cancelled) {
                setMenu(menuItems);
              }
            } catch (menuError: any) {
              // Si falla obtener el menú, usar el menú por defecto
              console.warn('Error al obtener el menú, usando menú por defecto:', menuError);
              const menuItems = MenuService.getDefaultMenu();
              if (!cancelled) {
                setMenu(menuItems);
              }
            }
            return;
          }
        }

        const menuItems = MenuService.getDefaultMenu();
        if (!cancelled) {
          setMenu(menuItems);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Error al cargar el menú');
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
  }, [isAuthenticated, currentLanguage, isSessionLoading, user]);

  /**
   * Refrescar el menú manualmente
   * Siempre usa el currentCompanyId de session storage, no user.companyIdDefault
   */
  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAuthenticatedRef.current && user) {
        // Siempre obtener currentCompanyId de session storage (puede haber cambiado)
        const currentCompanyId = await userSessionService.getCurrentCompany();
        
        // LOGS SESSION STORAGE: Aquí se agregarán los logs del companyId usado
        
        if (!currentCompanyId) {
          // Si no hay currentCompanyId en session storage, usar el default del usuario
          const defaultCompanyId = user.companyIdDefault;
          if (defaultCompanyId) {
            // Guardar el default como currentCompanyId si no existe
            await userSessionService.setCurrentCompany(defaultCompanyId, true);
            // LOGS SESSION STORAGE: Aquí se agregará el log cuando se use defaultCompanyId
            const menuItems = await MenuService.getMenuForCompany(defaultCompanyId, currentLanguageRef.current);
            await userSessionService.setMenu(menuItems, true);
            setMenu(menuItems);
            return;
          }
        } else {
          // Usar el currentCompanyId de session storage (puede ser diferente al default)
          // LOGS SESSION STORAGE: Aquí se agregará el log cuando se use currentCompanyId de session storage
          const menuItems = await MenuService.getMenuForCompany(currentCompanyId, currentLanguageRef.current);
          await userSessionService.setMenu(menuItems, true);
          setMenu(menuItems);
          return;
        }
      }

      const menuItems = MenuService.getDefaultMenu();
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

