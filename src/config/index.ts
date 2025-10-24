// Configuración principal de la aplicación
export const AppConfig = {
  // Información de la aplicación
  app: {
    name: 'MNK',
    version: '1.0.0',
    description: 'Aplicación React Native con arquitectura DDD',
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

  // Configuración de API
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
    timeout: 10000,
    retries: 3,
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
};

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
    themeColor: '#0087FF',
  },
};
