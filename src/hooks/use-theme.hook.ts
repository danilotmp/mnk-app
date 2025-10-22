import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeService } from '../domains/shared/services/theme.service';
import { ColorScheme, ThemeVariant } from '../domains/shared/types';
import { createComponentStyles } from '../styles/components';
import { createGlobalStyles } from '../styles/global.styles';
import { createTheme } from '../styles/themes';

export function useTheme() {
  const systemColorScheme = useColorScheme() as ColorScheme;
  const themeService = ThemeService.getInstance();
  
  // Actualizar el esquema de color del sistema
  themeService.updateSystemColorScheme(systemColorScheme);
  
  const effectiveColorScheme = themeService.getEffectiveColorScheme();
  const currentTheme = themeService.getCurrentTheme();
  
  // Crear el tema basado en el esquema de color efectivo
  const theme = useMemo(() => {
    return createTheme(effectiveColorScheme);
  }, [effectiveColorScheme]);
  
  // Crear estilos globales
  const globalStyles = useMemo(() => {
    return createGlobalStyles(theme);
  }, [theme]);
  
  // Crear estilos de componentes
  const componentStyles = useMemo(() => {
    return createComponentStyles(theme);
  }, [theme]);
  
  return {
    // Tema actual
    theme,
    currentTheme,
    colorScheme: effectiveColorScheme,
    systemColorScheme,
    
    // Servicios
    themeService,
    
    // Estilos
    globalStyles,
    componentStyles,
    
    // Utilidades
    isDark: effectiveColorScheme === 'dark',
    isLight: effectiveColorScheme === 'light',
    
    // Métodos de utilidad
    setTheme: (variant: ThemeVariant) => themeService.setTheme(variant),
    getAvailableThemes: () => themeService.getAvailableThemes(),
    isThemeAvailable: (variant: ThemeVariant) => themeService.isThemeAvailable(variant),
  };
}
