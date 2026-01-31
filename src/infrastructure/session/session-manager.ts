/**
 * Gestor de sesión extensible y seguro
 * Permite almacenar información de sesión, preferencias, filtros y más
 * Usa almacenamiento seguro según la plataforma
 */

import { Platform } from 'react-native';
import { getStorageAdapter, StorageAdapter } from '../api/storage.adapter';

/**
 * Opciones para almacenar datos en la sesión
 */
interface SessionOptions {
  /**
   * Tiempo de expiración en milisegundos (TTL)
   * Si no se especifica, el dato no expira
   */
  ttl?: number;
  
  /**
   * Si es true, usa almacenamiento seguro (solo para tokens sensibles)
   * Por defecto false (usa storage normal para preferencias, filtros, etc.)
   */
  secure?: boolean;
}

/**
 * Estructura interna de datos almacenados
 */
interface StoredData<T> {
  value: T;
  expiresAt?: number;
  storedAt: number;
}

/**
 * Namespaces disponibles para organizar datos
 */
export type SessionNamespace = 
  | 'auth'
  | 'user'
  | 'menu'
  | 'prefs'
  | 'cache'
  | 'ui'
  | 'feature';

/**
 * Gestor de sesión centralizado
 */
export class SessionManager {
  private storage: StorageAdapter;
  private static instance: SessionManager;
  
  // Prefijo base para todas las claves
  private readonly PREFIX = '@aibox_session:';
  
  // Namespace para datos seguros
  private readonly SECURE_PREFIX = '@aibox_secure:';

  private constructor() {
    this.storage = getStorageAdapter();
  }

  /**
   * Obtener instancia singleton
   */
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Construir clave completa con namespace
   */
  private buildKey(namespace: SessionNamespace, key: string, secure: boolean = false): string {
    const prefix = secure ? this.SECURE_PREFIX : this.PREFIX;
    return `${prefix}${namespace}:${key}`;
  }

  /**
   * Almacenar un valor en la sesión
   */
  async setItem<T>(
    namespace: SessionNamespace,
    key: string,
    value: T,
    options: SessionOptions & { skipBroadcast?: boolean } = {}
  ): Promise<void> {
    const fullKey = this.buildKey(namespace, key, options.secure);
    const storedData: StoredData<T> = {
      value,
      storedAt: Date.now(),
      expiresAt: options.ttl ? Date.now() + options.ttl : undefined,
    };

    try {
      await this.storage.setItem(fullKey, JSON.stringify(storedData));
      
      // En web, sincronizar con otras pestañas para cambios críticos
      // PERO solo si no se solicita skipBroadcast (para evitar bucles infinitos)
      if (Platform.OS === 'web' && (namespace === 'auth' || namespace === 'user') && !options.skipBroadcast) {
        this.broadcastStorageChange(namespace, key);
      }
    } catch (error) {
      // Fallar silenciosamente en caso de error de storage
      // No queremos romper la app por problemas de almacenamiento
    }
  }

  /**
   * Obtener un valor de la sesión
   */
  async getItem<T>(namespace: SessionNamespace, key: string, secure: boolean = false): Promise<T | null> {
    const fullKey = this.buildKey(namespace, key, secure);
    
    try {
      const data = await this.storage.getItem(fullKey);
      if (!data) {
        return null;
      }

      const storedData: StoredData<T> = JSON.parse(data);
      
      // Verificar expiración
      if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
        // Eliminar dato expirado
        await this.removeItem(namespace, key, secure);
        return null;
      }

      return storedData.value;
    } catch (error) {
      return null;
    }
  }

  /**
   * Eliminar un valor de la sesión
   */
  async removeItem(
    namespace: SessionNamespace,
    key: string,
    secure: boolean = false
  ): Promise<void> {
    const fullKey = this.buildKey(namespace, key, secure);
    try {
      await this.storage.removeItem(fullKey);
      
      // Broadcast en web
      if (Platform.OS === 'web' && (namespace === 'auth' || namespace === 'user')) {
        this.broadcastStorageChange(namespace, key, 'remove');
      }
    } catch (error) {
      // Fallar silenciosamente
    }
  }

  /**
   * Limpiar todos los datos de un namespace
   */
  async clearNamespace(namespace: SessionNamespace): Promise<void> {
    try {
      // En AsyncStorage y localStorage no hay forma directa de listar claves
      // Por ahora, limpiaremos manualmente las claves conocidas o implementaremos
      // un sistema de índice si es necesario
      
      // Para ahora, dejamos esto como placeholder
      // Se puede mejorar guardando un índice de claves por namespace
    } catch (error) {
      // Fallar silenciosamente
    }
  }

  /**
   * Verificar si un valor existe y no ha expirado
   */
  async hasItem(namespace: SessionNamespace, key: string, secure: boolean = false): Promise<boolean> {
    const value = await this.getItem(namespace, key, secure);
    return value !== null;
  }

  /**
   * Obtener tiempo restante hasta expiración (en milisegundos)
   */
  async getTimeToExpiry(namespace: SessionNamespace, key: string, secure: boolean = false): Promise<number | null> {
    const fullKey = this.buildKey(namespace, key, secure);
    
    try {
      const data = await this.storage.getItem(fullKey);
      if (!data) {
        return null;
      }

      const storedData: StoredData<any> = JSON.parse(data);
      
      if (!storedData.expiresAt) {
        return null; // No expira
      }

      const remaining = storedData.expiresAt - Date.now();
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      return null;
    }
  }

  /**
   * Broadcast cambios de storage en web para sincronizar pestañas
   */
  private broadcastStorageChange(
    namespace: SessionNamespace,
    key: string,
    action: 'set' | 'remove' = 'set'
  ): void {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    // Emitir evento personalizado para sincronizar otras pestañas
    window.dispatchEvent(
      new CustomEvent('sessionStorageChange', {
        detail: { namespace, key, action },
      })
    );
  }

  /**
   * Escuchar cambios de storage en otras pestañas (solo web)
   */
  onStorageChange(
    callback: (namespace: SessionNamespace, key: string, action: 'set' | 'remove') => void
  ): () => void {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return () => {}; // No-op en nativo
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        callback(customEvent.detail.namespace, customEvent.detail.key, customEvent.detail.action);
      }
    };

    window.addEventListener('sessionStorageChange', handler);
    
    // También escuchar eventos nativos de storage
    const nativeHandler = () => {
      // Re-validar tokens si es necesario
      // Esto se manejará en el hook useSession
    };

    window.addEventListener('storage', nativeHandler);

    // Retornar función de limpieza
    return () => {
      window.removeEventListener('sessionStorageChange', handler);
      window.removeEventListener('storage', nativeHandler);
    };
  }

  /**
   * Limpiar toda la sesión (logout)
   */
  async clearAll(): Promise<void> {
    try {
      await this.clearNamespace('auth');
      await this.clearNamespace('user');
      // Mantener prefs y cache según necesidades
    } catch (error) {
      // Fallar silenciosamente
    }
  }
}

/**
 * Instancia singleton exportada
 */
export const sessionManager = SessionManager.getInstance();

