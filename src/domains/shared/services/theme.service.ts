import { Platform } from 'react-native';
import { ColorScheme, ThemeVariant } from '../types';

// Servicio centralizado para manejo de temas
export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: ThemeVariant = 'auto';
  private systemColorScheme: ColorScheme = 'light';

  private constructor() {}

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  // Obtener el tema actual
  getCurrentTheme(): ThemeVariant {
    return this.currentTheme;
  }

  // Establecer el tema
  setTheme(theme: ThemeVariant): void {
    this.currentTheme = theme;
    // Aquí se podría implementar persistencia local
  }

  // Obtener el esquema de color efectivo
  getEffectiveColorScheme(): ColorScheme {
    if (this.currentTheme === 'auto') {
      return this.systemColorScheme;
    }
    return this.currentTheme;
  }

  // Actualizar el esquema de color del sistema
  updateSystemColorScheme(scheme: ColorScheme): void {
    this.systemColorScheme = scheme;
  }

  // Obtener configuración de tema para la plataforma actual
  getPlatformThemeConfig() {
    const platform = Platform.OS as 'ios' | 'android' | 'web';
    const colorScheme = this.getEffectiveColorScheme();
    
    return {
      platform,
      colorScheme,
      theme: this.currentTheme,
      isDark: colorScheme === 'dark',
      isLight: colorScheme === 'light',
    };
  }

  // Obtener todas las variantes de tema disponibles
  getAvailableThemes(): ThemeVariant[] {
    return ['light', 'dark', 'auto'];
  }

  // Verificar si el tema está disponible
  isThemeAvailable(theme: ThemeVariant): boolean {
    return this.getAvailableThemes().includes(theme);
  }
}
