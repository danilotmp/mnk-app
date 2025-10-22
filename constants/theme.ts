/**
 * Sistema de colores centralizado basado en la paleta de la imagen
 * Colores principales: Azules, Verdes y Naranjas
 */

import { Platform } from 'react-native';

// Colores base de la paleta
export const BrandColors = {
  // Azules
  blue: {
    50: '#E6F3FF',
    100: '#CCE7FF',
    200: '#99CFFF',
    300: '#66B7FF',
    400: '#339FFF',
    500: '#0087FF', // Azul principal
    600: '#006FCC',
    700: '#005799',
    800: '#003F66',
    900: '#002733',
  },
  // Verdes
  green: {
    50: '#E6F7E6',
    100: '#CCEFCC',
    200: '#99DF99',
    300: '#66CF66',
    400: '#33BF33',
    500: '#00AF00', // Verde principal
    600: '#008C00',
    700: '#006900',
    800: '#004600',
    900: '#002300',
  },
  // Naranjas
  orange: {
    50: '#FFF2E6',
    100: '#FFE5CC',
    200: '#FFCB99',
    300: '#FFB166',
    400: '#FF9733',
    500: '#FF7D00', // Naranja principal
    600: '#CC6400',
    700: '#994B00',
    800: '#663200',
    900: '#331900',
  },
  // Grises
  gray: {
    50: '#F8F9FA',
    100: '#F1F3F4',
    200: '#E8EAED',
    300: '#DADCE0',
    400: '#BDC1C6',
    500: '#9AA0A6',
    600: '#80868B',
    700: '#5F6368',
    800: '#3C4043',
    900: '#202124',
  },
  // Colores de estado
  status: {
    success: '#00AF00',
    warning: '#FF7D00',
    error: '#EA4335',
    info: '#0087FF',
  },
};

// Tema claro
export const LightTheme = {
  colors: {
    // Colores principales
    primary: BrandColors.blue[500],
    secondary: BrandColors.green[500],
    accent: BrandColors.orange[500],
    
    // Colores de fondo
    background: '#FFFFFF',
    surface: BrandColors.gray[50],
    surfaceVariant: BrandColors.gray[100],
    
    // Colores de texto
    text: BrandColors.gray[900],
    textSecondary: BrandColors.gray[700],
    textTertiary: BrandColors.gray[500],
    
    // Colores de borde
    border: BrandColors.gray[200],
    borderLight: BrandColors.gray[100],
    
    // Colores de estado
    success: BrandColors.status.success,
    warning: BrandColors.status.warning,
    error: BrandColors.status.error,
    info: BrandColors.status.info,
    
    // Colores de navegación
    tabIconDefault: BrandColors.gray[500],
    tabIconSelected: BrandColors.blue[500],
    tint: BrandColors.blue[500],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Tema oscuro
export const DarkTheme = {
  colors: {
    // Colores principales
    primary: BrandColors.blue[400],
    secondary: BrandColors.green[400],
    accent: BrandColors.orange[400],
    
    // Colores de fondo
    background: BrandColors.gray[900],
    surface: BrandColors.gray[800],
    surfaceVariant: BrandColors.gray[700],
    
    // Colores de texto
    text: BrandColors.gray[50],
    textSecondary: BrandColors.gray[300],
    textTertiary: BrandColors.gray[500],
    
    // Colores de borde
    border: BrandColors.gray[700],
    borderLight: BrandColors.gray[600],
    
    // Colores de estado
    success: BrandColors.status.success,
    warning: BrandColors.status.warning,
    error: BrandColors.status.error,
    info: BrandColors.status.info,
    
    // Colores de navegación
    tabIconDefault: BrandColors.gray[500],
    tabIconSelected: BrandColors.blue[400],
    tint: BrandColors.blue[400],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Exportar colores para compatibilidad
export const Colors = {
  light: LightTheme.colors,
  dark: DarkTheme.colors,
};

// Fuentes
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Tipografía
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};
