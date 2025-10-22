import { BaseTheme } from './base.theme';

// Tema oscuro - extiende el tema base
export interface DarkTheme extends BaseTheme {
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

export const darkTheme: DarkTheme = {
  ...require('./base.theme').baseTheme,
  colors: {
    // Colores de fondo
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    
    // Colores de texto
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    
    // Colores de borde
    border: '#475569',
    borderLight: '#64748B',
    
    // Colores de navegación
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#60A5FA',
    tint: '#60A5FA',
  },
};
