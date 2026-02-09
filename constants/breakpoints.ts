/**
 * Breakpoints para diseño responsive
 * Usar con useWindowDimensions() de react-native
 */

export const BREAKPOINTS = {
  // Mobile: 0 - 639px
  mobile: 640,
  
  // Tablet: 640 - 1023px
  tablet: 1024,
  
  // Desktop: 1024px+
  desktop: 1024,
  
  // Large Desktop: 1440px+
  lg: 1440,
  
  // Extra Large Desktop: 1920px+
  xl: 1920,
} as const;

/**
 * Helper para detectar el tipo de dispositivo basado en el ancho
 */
export const getDeviceType = (width: number) => {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile';
  } else if (width < BREAKPOINTS.tablet) {
    return 'tablet';
  } else if (width < BREAKPOINTS.lg) {
    return 'desktop';
  } else if (width < BREAKPOINTS.xl) {
    return 'lg';
  } else {
    return 'xl';
  }
};

/**
 * Helper para verificar si es mobile
 */
export const isMobileDevice = (width: number): boolean => {
  return width < BREAKPOINTS.mobile;
};

/**
 * Helper para verificar si es tablet
 */
export const isTabletDevice = (width: number): boolean => {
  return width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
};

/**
 * Helper para verificar si es desktop
 */
export const isDesktopDevice = (width: number): boolean => {
  return width >= BREAKPOINTS.tablet;
};

/**
 * Hook helper para usar en componentes
 * Ejemplo de uso:
 * 
 * import { useWindowDimensions } from 'react-native';
 * import { isMobileDevice } from '@/constants/breakpoints';
 * 
 * const { width } = useWindowDimensions();
 * const isMobile = isMobileDevice(width);
 */

