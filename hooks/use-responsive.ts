import {
    BREAKPOINTS,
    getDeviceType,
    isDesktopDevice,
    isMobileDevice,
    isTabletDevice
} from '@/constants/breakpoints';
import { useWindowDimensions } from 'react-native';

/**
 * Hook para manejar diseño responsive
 * 
 * Ejemplo de uso:
 * ```tsx
 * const { isMobile, isTablet, isDesktop, width, deviceType } = useResponsive();
 * 
 * return (
 *   <View>
 *     {isMobile && <MobileComponent />}
 *     {isTablet && <TabletComponent />}
 *     {isDesktop && <DesktopComponent />}
 *   </View>
 * );
 * ```
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  const deviceType = getDeviceType(width);
  const isMobile = isMobileDevice(width);
  const isTablet = isTabletDevice(width);
  const isDesktop = isDesktopDevice(width);

  // Helpers adicionales
  const isSmallMobile = width < 375; // iPhone SE y menores
  const isLargeDesktop = width >= BREAKPOINTS.lg;
  const isXLDesktop = width >= BREAKPOINTS.xl;

  // Orientación
  const isPortrait = height > width;
  const isLandscape = width > height;

  return {
    // Dimensiones
    width,
    height,
    
    // Tipo de dispositivo
    deviceType,
    
    // Breakpoints principales
    isMobile,
    isTablet,
    isDesktop,
    
    // Breakpoints adicionales
    isSmallMobile,
    isLargeDesktop,
    isXLDesktop,
    
    // Orientación
    isPortrait,
    isLandscape,
    
    // Constantes de breakpoints (por si se necesitan)
    breakpoints: BREAKPOINTS,
  };
}

/**
 * Hook simplificado solo para detectar mobile
 */
export function useIsMobile() {
  const { width } = useWindowDimensions();
  return isMobileDevice(width);
}

/**
 * Hook simplificado solo para detectar tablet
 */
export function useIsTablet() {
  const { width } = useWindowDimensions();
  return isTabletDevice(width);
}

/**
 * Hook simplificado solo para detectar desktop
 */
export function useIsDesktop() {
  const { width } = useWindowDimensions();
  return isDesktopDevice(width);
}

