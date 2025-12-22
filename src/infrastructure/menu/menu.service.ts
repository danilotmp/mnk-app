/**
 * Servicio para obtener el menú dinámico desde el backend
 * 
 * Estrategia:
 * - Si el usuario está autenticado: Llama a /api/security/menu con token (devuelve público + privado según permisos)
 * - Si NO está autenticado: Usa menú por defecto con páginas públicas (no llama al servicio)
 */

import { apiClient } from '../api/api.client';
import { API_CONFIG } from '../api/config';
import { SUCCESS_STATUS_CODE } from '../api/constants';
import { MenuItem } from './types';

export class MenuService {
  /**
   * Obtener menú según permisos del usuario autenticado
   * Solo se debe llamar cuando el usuario está autenticado
   * El endpoint devuelve menú público + privado según el rol del usuario
   * 
   * IMPORTANTE: El roleId se obtiene automáticamente del token JWT (en el header Authorization).
   * NO se envía como parámetro de query. El backend debe extraer el roleId del token decodificado.
   * 
   * Garantiza que las páginas públicas siempre estén presentes,
   * incluso si el backend no las devuelve en el menú
   * 
   * @param language Idioma del menú (es, en, pt)
   * @param showAll Si es true, solicita todas las opciones disponibles del menú (envía showAll=true)
   * @param admin Si es true, solicita el menú para administración (envía admin=true, solo para pantalla de admin)
   * @returns Array de items del menú (merge del backend + páginas públicas)
   */
  static async getMenu(language: string = 'es', showAll: boolean = false, admin: boolean = false): Promise<MenuItem[]> {
    try {
      // El endpoint NO debe recibir roleId como parámetro.
      // El roleId se extrae del token JWT en el header Authorization por el backend.
      const queryParams = new URLSearchParams();
      if (admin) {
        queryParams.append('admin', 'true');
      } else if (showAll) {
        queryParams.append('showAll', 'true');
      }
      
      const endpoint = queryParams.toString() 
        ? `${API_CONFIG.ENDPOINTS.MENU}?${queryParams.toString()}`
        : API_CONFIG.ENDPOINTS.MENU;
      
      const response = await apiClient.request<MenuItem[]>({
        endpoint,
        method: 'GET',
        skipAuth: false, // Requiere autenticación (token se envía automáticamente por apiClient)
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        // Asegurar que las páginas públicas siempre estén presentes
        return this.ensurePublicPages(response.data);
      }

      throw new Error(response.result?.description || 'Error al obtener el menú');
    } catch (error: any) {
      // Si falla, retornar menú por defecto como fallback
      return this.getDefaultMenu();
    }
  }

  /**
   * Asegurar que las páginas públicas siempre estén presentes en el menú
   * Si el backend no las incluye, se agregan automáticamente
   * Evita duplicados comparando por `route`
   * 
   * Orden del menú resultante:
   * 1. Home (siempre al inicio)
   * 2. Menú autorizado del usuario (del backend)
   * 3. Resto de páginas públicas por defecto (Contacto, Explorar, etc.)
   * 
   * @param backendMenu Menú devuelto por el backend
   * @returns Menú con páginas públicas garantizadas y orden correcto
   */
  private static ensurePublicPages(backendMenu: MenuItem[]): MenuItem[] {
    const defaultMenu = this.getDefaultMenu();
    const publicRoutes = new Set(defaultMenu.map(item => item.route));

    // Separar Home del resto de páginas públicas
    const homeItem = defaultMenu.find(item => item.route === '/');
    const otherPublicItems = defaultMenu.filter(item => item.route !== '/');

    // Verificar qué páginas públicas ya están en el menú del backend
    const existingPublicRoutes = new Set<string>();
    const processMenu = (items: MenuItem[]) => {
      items.forEach(item => {
        if (item.route && publicRoutes.has(item.route)) {
          existingPublicRoutes.add(item.route);
        }
        // Revisar submenu recursivamente
        if (item.submenu) {
          processMenu(item.submenu);
        }
        // Revisar columns recursivamente
        if (item.columns) {
          item.columns.forEach(column => {
            if (column.items) {
              processMenu(column.items);
            }
          });
        }
      });
    };

    processMenu(backendMenu);

    // Construir el menú final en el orden correcto:
    // 1. Home (SIEMPRE al inicio, pero preservar los datos del backend si existe)
    const finalMenu: MenuItem[] = [];
    
    // Buscar Home en el backend para preservar sus datos (incluyendo isPublic)
    const backendHome = backendMenu.find(item => item.route === '/');
    if (backendHome) {
      // Si el backend ya tiene Home, usarlo (preserva isPublic y otros campos)
      finalMenu.push(backendHome);
    } else if (homeItem) {
      // Si no está en el backend, usar el por defecto
      finalMenu.push(homeItem);
    }

    // 2. Páginas públicas en el orden correcto (Productos antes de Contacto)
    // Insertar ANTES del menú del backend para garantizar el orden
    const finalMenuRoutes = new Set(finalMenu.map(item => item.route));
    
    // Insertar cada página pública en el orden definido: Productos, luego Contacto
    for (const publicItem of otherPublicItems) {
      if (!publicItem.route) continue;
      
      // Buscar si el backend ya tiene esta página pública
      const backendPublicItem = backendMenu.find(item => item.route === publicItem.route);
      
      if (backendPublicItem && !finalMenuRoutes.has(publicItem.route)) {
        // Si el backend tiene la página, usarla (preserva datos del backend)
        finalMenu.push(backendPublicItem);
        finalMenuRoutes.add(publicItem.route);
      } else if (!finalMenuRoutes.has(publicItem.route)) {
        // Si no está en el backend ni en el menú final, usar la por defecto
        finalMenu.push(publicItem);
        finalMenuRoutes.add(publicItem.route);
      }
    }

    // 3. Menú autorizado del backend (remover Home y páginas públicas ya agregadas)
    const backendMenuFiltered = backendMenu.filter(
      item => item.route !== '/' && !finalMenuRoutes.has(item.route || '')
    );
    finalMenu.push(...backendMenuFiltered);

    return finalMenu;
  }

  /**
   * Menú por defecto para usuarios no autenticados
   * Incluye solo páginas públicas de app/main
   * 
   * Las páginas públicas son:
   * - / (home)
   * - /capabilities (productos del sistema)
   * - /main/contact (contacto)
   */
  static getDefaultMenu(): MenuItem[] {
    return [
      {
        id: 'home',
        label: 'Inicio',
        route: '/',
        isPublic: true, // Página pública
      },
      {
        id: 'capabilities',
        label: 'Productos',
        route: '/capabilities',
        isPublic: true, // Página pública
      },
      {
        id: 'contact',
        label: 'Contacto',
        route: '/main/contact',
        isPublic: true, // Página pública
      },
    ];
  }

  /**
   * Obtener menú según estado de autenticación
   * 
   * @param language Idioma del menú
   * @param isAuthenticated Si el usuario está autenticado
   * @returns Array de items del menú
   */
  static async getMenuForUser(
    language: string = 'es',
    isAuthenticated: boolean,
    companyId?: string
  ): Promise<MenuItem[]> {
    if (isAuthenticated) {
      if (companyId) {
        return await this.getMenuForCompany(companyId, language);
      }
      return this.getDefaultMenu();
    } else {
      return this.getDefaultMenu();
    }
  }

  static async getMenuForRole(roleId: string, language: string = 'es', showAll: boolean = false): Promise<MenuItem[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('roleId', roleId);
      if (showAll) {
        queryParams.append('showAll', 'true');
      }
      
      const response = await apiClient.request<MenuItem[]>({
        endpoint: `${API_CONFIG.ENDPOINTS.MENU}?${queryParams.toString()}`,
        method: 'GET',
        skipAuth: false,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return this.ensurePublicPages(response.data);
      }

      throw new Error(response.result?.description || 'Error al obtener el menú del rol');
    } catch (error: any) {
      return this.getDefaultMenu();
    }
  }

  static async getMenuForCompany(companyId: string, language: string = 'es', showAll: boolean = false): Promise<MenuItem[]> {
    try {
      if (!companyId) {
        throw new Error('companyId es requerido');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('companyId', companyId);
      if (showAll) {
        queryParams.append('showAll', 'true');
      }
      
      const response = await apiClient.request<MenuItem[]>({
        endpoint: `${API_CONFIG.ENDPOINTS.MENU}?${queryParams.toString()}`,
        method: 'GET',
        skipAuth: false,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return this.ensurePublicPages(response.data);
      }

      throw new Error(response.result?.description || 'Error al obtener el menú de la empresa');
    } catch (error: any) {
      // Si es un error 401 (token no disponible), lanzar el error en lugar de devolver menú por defecto
      if (error?.statusCode === 401 || error?.message?.includes('Token') || error?.message?.includes('auth token')) {
        console.error('Error de autenticación al obtener el menú:', error);
        throw error;
      }
      // Para otros errores, devolver menú por defecto
      return this.getDefaultMenu();
    }
  }

  /**
   * Sincronización masiva de items del menú
   * Envía todo el árbol del menú y el backend detecta qué crear, actualizar o eliminar
   * 
   * @param items Array completo de items del menú (árbol completo)
   * @returns Respuesta con items procesados y resumen de cambios
   */
  static async syncMenuItems(items: MenuItem[]): Promise<{
    data: {
      items: MenuItem[];
      summary: {
        total: number;
        created: number;
        updated: number;
        activated: number;
      };
    };
    result: {
      statusCode: number;
      description: string;
      details?: any;
    };
  }> {
    try {
      // Validar que items no esté vacío
      if (!items || items.length === 0) {
        throw new Error('No hay items para sincronizar');
      }

      const body = { items };
      
      const response = await apiClient.request<{
        items: MenuItem[];
        summary: {
          total: number;
          created: number;
          updated: number;
          activated: number;
        };
      }>({
        endpoint: API_CONFIG.ENDPOINTS.MENU_SYNC,
        method: 'PUT',
        skipAuth: false,
        body,
      });

      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
        return {
          data: response.data,
          result: response.result,
        };
      }

      throw new Error(response.result?.description || 'Error al sincronizar el menú');
    } catch (error: any) {
      console.error('Error al sincronizar menú:', error);
      throw error;
    }
  }
}
