import Constants from 'expo-constants';
import { baseTheme } from '../styles/themes/base.theme';

/**
 * Configuración principal centralizada de la aplicación
 * Única fuente de verdad para toda la configuración
 */
export const AppConfig = {
  // Información de la aplicación
  app: {
    name: Constants.expoConfig?.name || 'AIBox',
    version: Constants.expoConfig?.version || '1.0.0',
    description: 'Aplicación React Native',
    environment: process.env.NODE_ENV || 'development',
  },

  // Configuración de API (backend en puerto 15000; fuente: app.json extra.apiBaseUrl o EXPO_PUBLIC_API_BASE_URL)
  api: {
    baseUrl: (() => {
      if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_BASE_URL) {
        return process.env.EXPO_PUBLIC_API_BASE_URL;
      }
      const base = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:15000/api';
      if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost') {
        try {
          const u = new URL(base);
          u.hostname = window.location.hostname;
          return u.toString();
        } catch {
          return base;
        }
      }
      return base;
    })(),
    timeout: Constants.expoConfig?.extra?.apiTimeout || 30000, // 30 segundos
    retries: 3,
  },

  // Configuración de Autenticación
  auth: {
    // Tiempo de expiración del access token (en milisegundos)
    accessTokenDuration: Constants.expoConfig?.extra?.accessTokenDuration || 
                       15 * 60 * 1000, // 15 minutos
    // Tiempo de expiración del refresh token (en milisegundos)
    refreshTokenDuration: Constants.expoConfig?.extra?.refreshTokenDuration || 
                        7 * 24 * 60 * 60 * 1000, // 7 días
    // Tiempo antes de expirar para refrescar automáticamente (en milisegundos)
    tokenRefreshThreshold: Constants.expoConfig?.extra?.tokenRefreshThreshold || 
                          5 * 60 * 1000, // 5 minutos antes de expirar
  },

  // Configuración de Cache
  cache: {
    // Tiempo de expiración de cache de datos de usuario (en milisegundos)
    userDataCacheDuration: Constants.expoConfig?.extra?.userDataCacheDuration || 
                          30 * 60 * 1000, // 30 minutos
    // Tiempo de expiración de cache de configuración (en milisegundos)
    configCacheDuration: Constants.expoConfig?.extra?.configCacheDuration || 
                        24 * 60 * 60 * 1000, // 24 horas
    // Tiempo de expiración de cache de listas y catálogos (en milisegundos)
    catalogCacheDuration: Constants.expoConfig?.extra?.catalogCacheDuration || 
                         60 * 60 * 1000, // 1 hora
  },

  // Configuración de temas
  themes: {
    default: 'light',
    available: ['light', 'dark', 'auto'],
    persist: true, // Persistir la selección del usuario
  },

  // Configuración de plataforma
  platform: {
    supported: ['ios', 'android', 'web'],
    default: 'web',
  },

  // Configuración de almacenamiento
  storage: {
    theme: 'theme_preference',
    user: 'user_data',
    settings: 'app_settings',
  },

  // Configuración de estilos
  styles: {
    enableAnimations: true,
    enableShadows: true,
    enableRoundedCorners: true,
  },

  // Configuración de desarrollo
  development: {
    enableLogging: __DEV__,
    enableDebugMode: __DEV__,
    enableHotReload: __DEV__,
  },

  // Configuración de menú de navegación
  navigation: {
    // Tipo de menú: 'horizontal' | 'vertical' | 'mix'
    // - 'horizontal': Menú horizontal en el header (comportamiento actual)
    // - 'vertical': Menú vertical estilo Azure DevOps en el lado izquierdo
    // - 'mix': Menú horizontal para opciones públicas + menú vertical para opciones privadas
    // Nota: El menú horizontal siempre se muestra antes del login.
    // Después del login, se aplica la configuración aquí definida.
    menuType: process.env.EXPO_PUBLIC_MENU_TYPE || 'mix',
    // Ancho del menú vertical cuando está expandido (en píxeles)
    verticalMenuExpandedWidth: 280,
    // Ancho del menú vertical cuando está colapsado (solo iconos)
    verticalMenuCollapsedWidth: 48,
    // Color de las opciones activas/seleccionadas en el menú
    // Puede ser cualquier color válido (hexadecimal, nombre de color, etc.)
    // Ejemplos: '#ff3366', '#0087FF', 'red', 'blue', 'rgb(255, 51, 102)', etc.
    // Recomendados: 'red' (#ff3366) o 'blue' (colors.primary)
    // - 'red': Se convertirá automáticamente a '#ff3366' (usado en menú horizontal)
    // - 'blue': Se convertirá automáticamente a colors.primary (usado en menú vertical)
    activeItemColor: process.env.EXPO_PUBLIC_MENU_ACTIVE_COLOR || 'blue',
  },

  // URLs externas
  externalUrls: {
    // URL de la documentación de iconos de Expo
    iconsDocumentation: process.env.EXPO_PUBLIC_ICONS_DOCUMENTATION_URL || 
                       Constants.expoConfig?.extra?.iconsDocumentationUrl || 
                       'https://icons.expo.fyi/Index',
  },

  // Configuración del chat
  chat: {
    // Intervalo de polling para refrescar la lista de contactos (ms)
    contactsPollingInterval: 15000,
    // Intervalo de polling para refrescar los mensajes del chat activo (ms)
    messagesPollingInterval: 10000,
    // Habilitar sonido de notificación al recibir mensajes
    enableNotificationSound: true,
  },
};

// Re-export: Nombres predefinidos de directrices del sistema (IA).
// Ubicación: src/config/system-guidelines.config.ts
export { INTERACTIVE_ELEMENTS_HELP, SYSTEM_GUIDELINE_NAMES } from './system-guidelines.config';

// Configuración específica por plataforma
export const PlatformConfig = {
  ios: {
    statusBarStyle: 'dark-content',
    safeAreaInsets: true,
  },
  android: {
    statusBarStyle: 'dark-content',
    navigationBarColor: '#FFFFFF',
  },
  web: {
    viewport: 'width=device-width, initial-scale=1',
    themeColor: baseTheme.brand.primary,//'#0087FF',
  },
};
