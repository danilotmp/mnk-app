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
  
  // Refs para evitar re-renders innecesarios y llamadas duplicadas
  const isAuthenticatedRef = useRef(isAuthenticated);
  const currentLanguageRef = useRef(currentLanguage);
  const userIdRef = useRef<string | null>(null);
  const companyIdRef = useRef<string | null>(null);
  const languageRef = useRef<string>(currentLanguage);
  const isFetchingRef = useRef(false); // Flag para evitar llamadas simultáneas
  const lastFetchKeyRef = useRef<string>(''); // Key única para cada combinación que requiere fetch
  
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    currentLanguageRef.current = currentLanguage;
    languageRef.current = currentLanguage;
    
    // Limpiar refs y estado cuando el usuario cierra sesión
    if (!isAuthenticated) {
      userIdRef.current = null;
      companyIdRef.current = null;
      lastFetchKeyRef.current = '';
      isFetchingRef.current = false;
      setMenu([]);
      setError(null);
    }
  }, [isAuthenticated, currentLanguage]);

  /**
   * Efecto para cargar el menú cuando cambia el estado de autenticación o el idioma
   */
  useEffect(() => {
    // Esperar a que la sesión termine de cargar completamente
    // Esto incluye la hidratación del token después del login
    if (isSessionLoading) {
      return;
    }

    // Evitar llamadas duplicadas
    if (isFetchingRef.current) {
      return;
    }

    let cancelled = false;

    const fetchMenu = async () => {
      // Marcar que ya se está haciendo una llamada
      isFetchingRef.current = true;

      try {
        setLoading(true);
        setError(null);

        if (isAuthenticatedRef.current && user) {
          // IMPORTANTE: Obtener UserResponse directamente de session storage
          // para asegurar que siempre usamos el companyIdDefault correcto del login
          // El user del contexto puede estar desactualizado o no tener el companyIdDefault correcto
          const userResponse = await userSessionService.getUser();
          
          // Usar userId del UserResponse o del user del contexto como fallback
          const currentUserId = userResponse?.id || user.id || user.email || null;
          
          // IMPORTANTE: Respetar la última empresa seleccionada guardada en session storage
          // Solo usar companyIdDefault si NO hay un valor guardado en session storage
          // Esto permite que al hacer F5 se mantenga la última empresa seleccionada
          let currentCompanyId: string | null = null;
          
          // PRIORIDAD 1: currentCompanyId de session storage (última empresa seleccionada)
          // Esto respeta la selección del usuario incluso después de F5
          currentCompanyId = await userSessionService.getCurrentCompany();
          
          // PRIORIDAD 2: Si no hay valor en session storage, usar companyIdDefault del UserResponse
          // Esto solo aplica en el primer login o cuando no hay empresa guardada
          if (!currentCompanyId) {
            if (userResponse?.companyIdDefault) {
              currentCompanyId = userResponse.companyIdDefault;
              await userSessionService.setCurrentCompany(userResponse.companyIdDefault, true);
            } else if (user?.companyIdDefault) {
              // PRIORIDAD 3: companyIdDefault del user del contexto (fallback)
              currentCompanyId = user.companyIdDefault;
              await userSessionService.setCurrentCompany(user.companyIdDefault, true);
            }
          }
          
          // Si aún no hay companyId, no podemos cargar el menú
          if (!currentCompanyId) {
            const menuItems = MenuService.getDefaultMenu();
            if (!cancelled) {
              setMenu(menuItems);
              setLoading(false);
            }
            isFetchingRef.current = false;
            return;
          }
          
          // Crear una key única para esta combinación
          const fetchKey = `${currentUserId}-${currentCompanyId}-${languageRef.current}`;
          
          // Si la key cambió (nuevo usuario o nueva empresa después de logout/login), forzar la carga
          // Esto asegura que después de un logout/login se cargue el menú correctamente
          const isNewUserOrCompany = lastFetchKeyRef.current !== fetchKey;
          
          if (isNewUserOrCompany) {
            // Limpiar el menú anterior para forzar la recarga
            if (!cancelled) {
              setMenu([]);
            }
            // Actualizar refs inmediatamente para la nueva sesión
            userIdRef.current = currentUserId;
            companyIdRef.current = currentCompanyId;
            lastFetchKeyRef.current = fetchKey;
          } else {
            // Si la key no ha cambiado Y ya tenemos menú cargado, no hacer otra llamada
            // Pero solo si realmente tenemos datos (no durante la carga inicial) y no estamos cargando
            if (menu.length > 0 && !loading) {
              isFetchingRef.current = false;
              setLoading(false);
              return;
            }
          }
          
          // Esperar un pequeño delay para asegurar que el token esté completamente guardado
          // Esto es necesario después del login para evitar usar tokens desactualizados
          // El delay permite que el token se guarde completamente en el storage después del login
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Verificar que el token esté disponible y válido antes de hacer la llamada
          const { apiClient } = await import('@/src/infrastructure/api/api.client');
          const tokens = await apiClient.getTokens();
          
          if (!tokens || !tokens.accessToken) {
            // Si no hay token, usar menú por defecto
            const menuItems = MenuService.getDefaultMenu();
            if (!cancelled) {
              setMenu(menuItems);
              setLoading(false);
            }
            isFetchingRef.current = false;
            return;
          }

          if (currentCompanyId) {
            try {
              // Llamar al backend para obtener el menú según los permisos del usuario
              const menuItems = await MenuService.getMenuForCompany(currentCompanyId, currentLanguageRef.current);
              await userSessionService.setMenu(menuItems, true);
              if (!cancelled) {
                setMenu(menuItems);
              }
            } catch (menuError: any) {
              // Si falla obtener el menú, intentar usar el guardado como fallback
              console.warn('Error al obtener el menú del backend, intentando usar menú guardado:', menuError);
              const savedMenu = await userSessionService.getMenu();
              if (savedMenu && savedMenu.length > 0) {
                if (!cancelled) {
                  setMenu(savedMenu);
                }
              } else {
                // Si no hay menú guardado, usar menú por defecto
                const menuItems = MenuService.getDefaultMenu();
                if (!cancelled) {
                  setMenu(menuItems);
                }
              }
            }
            isFetchingRef.current = false;
            return;
          }
        }

        // Si no está autenticado, usar menú por defecto
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
        isFetchingRef.current = false;
      }
    };

    fetchMenu();

    return () => {
      cancelled = true;
      isFetchingRef.current = false;
    };
  }, [isAuthenticated, currentLanguage, isSessionLoading, user?.id, user?.email, user?.companyIdDefault]);

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

