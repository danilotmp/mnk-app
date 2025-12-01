/**
 * Hook para acceder y gestionar la sesión del usuario
 * Maneja tokens, información de usuario y sincronización multi-tab
 */

import { useMultiCompany } from '@/src/domains/shared/hooks';
import { MultiCompanyUser } from '@/src/domains/shared/types';
import { UserResponse } from '@/src/domains/shared/types/api/user-response.types';
import { UserSessionService } from '@/src/domains/shared/services/user-session.service';
import { authService } from '@/src/infrastructure/services/auth.service';
import { mapUserResponseToMultiCompanyUser } from '@/src/infrastructure/services/user-mapper.service';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const isHydratingRef = React.useRef(false);
  const userRef = React.useRef(user);
  
  // Mantener userRef actualizado
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  /**
   * Rehidratar sesión al cargar la app
   */
  const rehydrateSession = useCallback(async () => {
    // Evitar múltiples ejecuciones simultáneas
    if (isHydratingRef.current) {
      return;
    }

    try {
      isHydratingRef.current = true;
      setIsHydrating(true);
      
      // Verificar tokens usando apiClient (usa el storage adapter existente)
      const { apiClient } = await import('@/src/infrastructure/api/api.client');
      const tokens = await apiClient.getTokens();
      
      if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
        // No hay sesión guardada
        setIsHydrating(false);
        setIsLoading(false);
        isHydratingRef.current = false;
        return;
      }

      // Verificar si hay datos de usuario guardados (UserResponse)
      const userSessionService = UserSessionService.getInstance();
      const savedUser = await userSessionService.getUser();
      
      if (savedUser) {
        // Inicializar contexto (currentCompanyId, currentBranchId, menu) si no están inicializados
        const userContextService = (await import('@/src/domains/shared/services/user-context.service')).UserContextService.getInstance();
        await userContextService.initializeContext();
        
        // Mapear UserResponse a MultiCompanyUser para el contexto
        const mappedUser = mapUserResponseToMultiCompanyUser(savedUser);
        // Esperar a que setUserContext termine antes de continuar
        await setUserContext(mappedUser);
        setIsHydrating(false);
        setIsLoading(false);
        isHydratingRef.current = false;
        return; // Ya tenemos usuario, no necesitamos consultar el servidor inmediatamente
      }

      // Si no hay usuario guardado, intentar obtener del servidor
      try {
        const userProfile = await authService.getProfile() as UserResponse;
        if (userProfile) {
          // Guardar UserResponse en session storage con skipBroadcast para evitar bucles
          await sessionManager.setItem('user', 'current', userProfile, {
            ttl: 30 * 60 * 1000,
            skipBroadcast: true,
          });
          
          // Inicializar currentCompanyId y currentBranchId si no existen
          const userContextService = (await import('@/src/domains/shared/services/user-context.service')).UserContextService.getInstance();
          await userContextService.initializeContext();
          
          // Mapear UserResponse a MultiCompanyUser para el contexto
          const mappedUser = mapUserResponseToMultiCompanyUser(userProfile);
          // Esperar a que setUserContext termine antes de continuar
          await setUserContext(mappedUser);
        }
      } catch (error) {
        // Si falla obtener perfil, puede que el token haya expirado
        // Dejar que el usuario se vuelva a autenticar
        await sessionManager.clearAll();
        clearContext();
      }

      setIsHydrating(false);
      setIsLoading(false);
      isHydratingRef.current = false;
    } catch (error) {
      setIsHydrating(false);
      setIsLoading(false);
      isHydratingRef.current = false;
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

    let mounted = true;

    // Rehidratar al montar solo una vez
    if (!isHydratingRef.current && mounted) {
      rehydrateSession();
    }

    // Escuchar cambios de storage en otras pestañas SOLAMENTE
    // IMPORTANTE: Los cambios con skipBroadcast no disparan este evento,
    // así que solo recibimos cambios de otras pestañas
    const cleanup = sessionManager.onStorageChange((namespace, key, action) => {
      if (!mounted) return;

      if (namespace === 'auth' && (key === 'accessToken' || key === 'refreshToken')) {
        if (action === 'remove') {
          // Otra pestaña hizo logout
          clearContext();
        } else if (!isHydratingRef.current) {
          // Otra pestaña hizo login - rehidratar solo si no estamos hidratando
          rehydrateSession();
        }
      }
      
      // IMPORTANTE: Solo actualizar si el usuario realmente cambió
      // Comparar con el usuario actual para evitar actualizaciones innecesarias
      if (namespace === 'user' && key === 'current' && action === 'set' && !isHydratingRef.current) {
        UserSessionService.getInstance().getUser().then((savedUser) => {
          if (!mounted || !savedUser || isHydratingRef.current) return;

          // Solo actualizar si es diferente al usuario actual y no estamos hidratando
          // Esto evita bucles infinitos cuando se guarda desde la misma pestaña
          const currentUser = userRef.current;
          const currentUserId = currentUser?.id;
          const savedUserId = savedUser.id;
          
          // Solo actualizar si realmente cambió el usuario (por ID)
          // Los cambios de company/branch se manejan por separado
          if (currentUserId !== savedUserId) {
            const mappedUser = mapUserResponseToMultiCompanyUser(savedUser);
            setUserContext(mappedUser).catch(() => {
              // Ignorar errores en actualizaciones desde otras pestañas
            });
          }
        });
      }
      
      // Escuchar cambios en currentCompanyId y currentBranchId para actualizar el contexto
      if (namespace === 'user' && (key === 'currentCompanyId' || key === 'currentBranchId') && action === 'set' && !isHydratingRef.current) {
        UserSessionService.getInstance().getUser().then(async (savedUser) => {
          if (!mounted || !savedUser || isHydratingRef.current) return;
          const mappedUser = mapUserResponseToMultiCompanyUser(savedUser);
          try {
            await setUserContext(mappedUser);
          } catch (error) {
            // Ignorar errores
          }
        });
      }
    });

    return () => {
      mounted = false;
      cleanup();
    };
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

      // Guardar usuario en la sesión usando UserSessionService (centralizado)
      const { UserSessionService } = await import('@/src/domains/shared/services/user-session.service');
      const userSessionService = UserSessionService.getInstance();
      await userSessionService.saveUser(user);

      // Mapear UserResponse a MultiCompanyUser para el contexto
      const { mapUserResponseToMultiCompanyUser } = await import('@/src/infrastructure/services/user-mapper.service');
      const mappedUser = mapUserResponseToMultiCompanyUser(user);
      await setUserContext(mappedUser);
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

