import { BrandColors, DarkTheme, LightTheme } from './theme';

// Configuración del tema que se puede modificar fácilmente
export const ThemeConfig = {
  // Configuración de colores principales
  primaryColor: BrandColors.blue[500],
  secondaryColor: BrandColors.green[500],
  accentColor: BrandColors.orange[500],
  
  // Configuración de colores de estado
  successColor: BrandColors.status.success,
  warningColor: BrandColors.status.warning,
  errorColor: BrandColors.status.error,
  infoColor: BrandColors.status.info,
  
  // Configuración de espaciado
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Configuración de bordes redondeados
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Configuración de sombras
  shadowConfig: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  // Configuración de tipografía
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 36,
      '6xl': 48,
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Configuración de breakpoints (para responsive design)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // Configuración de animaciones
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      linear: 'linear',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  
  // Configuración de z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// Función para obtener un color específico
export const getColor = (colorPath: string, theme: 'light' | 'dark' = 'light') => {
  const themeColors = theme === 'light' ? LightTheme.colors : DarkTheme.colors;
  
  // Mapeo de rutas de color a valores del tema
  const colorMap: Record<string, string> = {
    'primary': themeColors.primary,
    'secondary': themeColors.secondary,
    'accent': themeColors.accent,
    'background': themeColors.background,
    'surface': themeColors.surface,
    'text': themeColors.text,
    'textSecondary': themeColors.textSecondary,
    'border': themeColors.border,
    'success': themeColors.success,
    'warning': themeColors.warning,
    'error': themeColors.error,
    'info': themeColors.info,
  };
  
  return colorMap[colorPath] || themeColors.text;
};

// Función para obtener espaciado
export const getSpacing = (size: keyof typeof ThemeConfig.spacing) => {
  return ThemeConfig.spacing[size];
};

// Función para obtener radio de borde
export const getBorderRadius = (size: keyof typeof ThemeConfig.borderRadius) => {
  return ThemeConfig.borderRadius[size];
};

// Función para obtener sombra
export const getShadow = (size: keyof typeof ThemeConfig.shadowConfig) => {
  return ThemeConfig.shadowConfig[size];
};
