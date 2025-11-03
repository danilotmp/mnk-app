/**
 * Servicio para obtener el menú dinámico desde el backend
 * 
 * Estrategia:
 * - Si el usuario está autenticado: Llama a /api/seguridades/menu con token (devuelve público + privado según permisos)
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
   * @returns Array de items del menú (merge del backend + páginas públicas)
   */
  static async getMenu(language: string = 'es'): Promise<MenuItem[]> {
    try {
      // El endpoint NO debe recibir roleId como parámetro.
      // El roleId se extrae del token JWT en el header Authorization por el backend.
      const response = await apiClient.request<MenuItem[]>({
        endpoint: API_CONFIG.ENDPOINTS.MENU,
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
   * @param backendMenu Menú devuelto por el backend
   * @returns Menú con páginas públicas garantizadas
   */
  private static ensurePublicPages(backendMenu: MenuItem[]): MenuItem[] {
    const defaultMenu = this.getDefaultMenu();
    const publicRoutes = new Set(defaultMenu.map(item => item.route));

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

    // Agregar páginas públicas que faltan al inicio del menú
    const missingPublicPages = defaultMenu.filter(
      item => item.route && !existingPublicRoutes.has(item.route)
    );

    // Si faltan páginas públicas, agregarlas al inicio
    if (missingPublicPages.length > 0) {
      return [...missingPublicPages, ...backendMenu];
    }

    // Si todas las páginas públicas ya están, retornar el menú del backend tal cual
    return backendMenu;
  }

  /**
   * Menú por defecto para usuarios no autenticados
   * Incluye solo páginas públicas de app/main
   * 
   * Las páginas públicas son:
   * - / (home)
   * - /main/explore (explorar)
   * - /main/contact (contacto)
   */
  static getDefaultMenu(): MenuItem[] {
    return [
      {
        id: 'home',
        label: 'Inicio',
        route: '/',
      },
      {
        id: 'explore',
        label: 'Explorar',
        route: '/main/explore',
      },
      {
        id: 'contact',
        label: 'Contacto',
        route: '/main/contact',
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
    isAuthenticated: boolean
  ): Promise<MenuItem[]> {
    if (isAuthenticated) {
      // Usuario autenticado: llamar al servicio (devuelve público + privado según permisos)
      return await this.getMenu(language);
    } else {
      // Usuario no autenticado: usar menú por defecto (no llamar al servicio)
      return this.getDefaultMenu();
    }
  }
}
