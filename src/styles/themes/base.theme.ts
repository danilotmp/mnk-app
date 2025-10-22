import { Platform } from 'react-native';
import { Size } from '../../domains/shared/types';

// Tema base con colores primarios y configuración fundamental
export interface BaseTheme {
  // Colores primarios de la marca
  brand: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };

  // Colores de estado
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Configuración de espaciado base
  spacing: Record<Size, number>;

  // Configuración de tipografía base
  typography: {
    fontFamily: {
      primary: string;
      secondary: string;
      mono: string;
    };
    fontSize: Record<Size, number>;
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: Record<Size, number>;
  };

  // Configuración de bordes base
  borders: {
    radius: Record<Size, number>;
    width: Record<Size, number>;
  };

  // Configuración de sombras base
  shadows: {
    sm: any;
    md: any;
    lg: any;
  };

  // Configuración de z-index base
  zIndex: {
    dropdown: number;
    sticky: number;
    fixed: number;
    modal: number;
    popover: number;
    tooltip: number;
  };

  // Configuración de animaciones base
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

// Tema base por defecto
export const baseTheme: BaseTheme = {
  brand: {
    primary: '#0087FF',
    secondary: '#00AF00',
    accent: '#FF7D00',
    neutral: '#6B7280',
  },
  status: {
    success: '#00AF00',
    warning: '#FF7D00',
    error: '#EF4444',
    info: '#0087FF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: {
      primary: Platform.select({
        ios: 'System',
        android: 'Roboto',
        web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }) || 'System',
      secondary: Platform.select({
        ios: 'Georgia',
        android: 'serif',
        web: 'Georgia, "Times New Roman", serif',
      }) || 'serif',
      mono: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        web: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }) || 'monospace',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
    },
  },
  borders: {
    radius: {
      xs: 2,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      xxl: 24,
    },
    width: {
      xs: 0.5,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      xxl: 6,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
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
};
