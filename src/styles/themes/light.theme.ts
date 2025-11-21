import { baseTheme, BaseTheme } from './base.theme';

// Tema claro - extiende el tema base
export interface LightTheme extends BaseTheme {
  colors: {
    // Colores de fondo
    background: string;
    surface: string;
    surfaceVariant: string;
    
    // Colores de texto
    text: string;
    textSecondary: string;
    textTertiary: string;
    
    // Colores de borde
    border: string;
    borderLight: string;
    
    // Colores de navegación
    tabIconDefault: string;
    tabIconSelected: string;
    tint: string;
  };
}

export const lightTheme: LightTheme = {
  ...require('./base.theme').baseTheme,
  colors: {
    // Colores de fondo
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceVariant: '#F1F3F4',
    
    // Colores de texto
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    // Colores de borde
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    // Colores de navegación
    tabIconDefault: '#9CA3AF',
    tabIconSelected: baseTheme.brand.primary,//'#0087FF',
    tint: baseTheme.brand.primary,//'#0087FF',
  },
};
