/**
 * Hook para acceder y gestionar la sesión del usuario
 * Maneja tokens, información de usuario y sincronización multi-tab
 */

import { useMultiCompany } from '@/src/domains/shared/hooks';
import { MultiCompanyUser } from '@/src/domains/shared/types';
import { authService } from '@/src/infrastructure/services/auth.service';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { sessionManager } from '../session-manager';

/**
 * Información de sesión
 */
interface SessionInfo {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: MultiCompanyUser | null;
}

/**
 * Hook para gestionar la sesión del usuario
 */
export function useSession() {
  const { user, setUserContext, clearContext } = useMultiCompany();
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrating, setIsHydrating] = useState(true);

  /**
   * Rehidratar sesión al cargar la app
   */
  const rehydrateSession = useCallback(async () => {
    try {
      setIsHydrating(true);
      
      // Verificar tokens usando apiClient (usa el storage adapter existente)
      const { apiClient } = await import('@/src/infrastructure/api/api.client');
      const tokens = await apiClient.getTokens();
      
      if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
        // No hay sesión guardada
        setIsHydrating(false);
        setIsLoading(false);
        return;
      }

      // Verificar si hay datos de usuario guardados
      const savedUser = await sessionManager.getItem<MultiCompanyUser>('user', 'current');
      
      if (savedUser) {
        // Restaurar usuario desde cache
        setUserContext(savedUser);
        setIsHydrating(false);
        setIsLoading(false);
        return; // Ya tenemos usuario, no necesitamos consultar el servidor inmediatamente
      }

      // Si no hay usuario guardado, intentar obtener del servidor
      try {
        const userProfile = await authService.getProfile();
        if (userProfile) {
          // Mapear usuario si es necesario
          const { mapApiUserToMultiCompanyUser } = await import('@/src/infrastructure/services/user-mapper.service');
          const mappedUser = mapApiUserToMultiCompanyUser(userProfile);
          setUserContext(mappedUser);
          // Guardar usuario
          await sessionManager.setItem('user', 'current', mappedUser, {
            ttl: 30 * 60 * 1000, // 30 minutos
          });
        }
      } catch (error) {
        // Si falla obtener perfil, puede que el token haya expirado
        // Dejar que el usuario se vuelva a autenticar
        await sessionManager.clearAll();
        clearContext();
      }

      setIsHydrating(false);
      setIsLoading(false);
    } catch (error) {
      setIsHydrating(false);
      setIsLoading(false);
    }
  }, [setUserContext, clearContext]);

  /**
   * Sincronizar con otras pestañas (solo web)
   */
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsLoading(false);
      return;
    }

    // Rehidratar al montar
    rehydrateSession();

    // Escuchar cambios de storage en otras pestañas SOLAMENTE
    // IMPORTANTE: Los cambios con skipBroadcast no disparan este evento,
    // así que solo recibimos cambios de otras pestañas
    const cleanup = sessionManager.onStorageChange((namespace, key, action) => {
      if (namespace === 'auth' && (key === 'accessToken' || key === 'refreshToken')) {
        if (action === 'remove') {
          // Otra pestaña hizo logout
          clearContext();
        } else {
          // Otra pestaña hizo login - rehidratar
          rehydrateSession();
        }
      }
      
      // IMPORTANTE: Solo actualizar si el usuario realmente cambió
      // Comparar con el usuario actual para evitar actualizaciones innecesarias
      if (namespace === 'user' && key === 'current' && action === 'set') {
        sessionManager.getItem<MultiCompanyUser>('user', 'current').then((savedUser) => {
          if (savedUser) {
            // Solo actualizar si es diferente al usuario actual
            // Esto evita bucles infinitos cuando se guarda desde la misma pestaña
            const currentUserId = user?.id;
            const currentBranchId = user?.currentBranchId;
            const savedUserId = savedUser.id;
            const savedBranchId = savedUser.currentBranchId;
            
            // Solo actualizar si realmente cambió algo
            if (currentUserId !== savedUserId || currentBranchId !== savedBranchId) {
              setUserContext(savedUser);
            }
          }
        });
      }
    });

    return cleanup;
  }, [rehydrateSession, clearContext, setUserContext]);

  /**
   * Guardar sesión después de login exitoso
   * Nota: Los tokens ya están guardados por apiClient.setTokens en authService.login
   * Este método guarda el usuario en la sesión y verifica que los tokens estén guardados
   */
  const saveSession = useCallback(async (user: MultiCompanyUser) => {
    try {
      // Verificar que los tokens estén guardados (deben estar guardados por authService.login)
      const { apiClient } = await import('@/src/infrastructure/api/api.client');
      const tokens = await apiClient.getTokens();
      
      if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
        // Si no hay tokens, no guardamos la sesión
        // Esto puede pasar si el login falló parcialmente
        return;
      }

      // Guardar usuario en la sesión
      await sessionManager.setItem('user', 'current', user, {
        ttl: 30 * 60 * 1000, // 30 minutos
      });

      await sessionManager.setItem('user', 'full', user, {
        ttl: 30 * 60 * 1000,
      });

      setUserContext(user);
    } catch (error) {
      // Fallar silenciosamente
    }
  }, [setUserContext]);

  /**
   * Limpiar sesión (logout)
   */
  const clearSession = useCallback(async () => {
    try {
      // Limpiar tokens del apiClient
      const { apiClient } = await import('@/src/infrastructure/api/api.client');
      await apiClient.clearTokens();
      
      // Limpiar datos de sesión
      await sessionManager.clearAll();
      clearContext();
    } catch (error) {
      // Fallar silenciosamente
    }
  }, [clearContext]);

  return {
    isAuthenticated: !!user,
    isLoading: isLoading || isHydrating,
    user,
    saveSession,
    clearSession,
    rehydrateSession,
  };
}

