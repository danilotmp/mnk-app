/**
 * Utilidades para manejar sombras de forma compatible entre web y móvil
 * Convierte shadow* props a boxShadow para web
 */

import { Platform } from 'react-native';

interface ShadowProps {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/**
 * Convierte shadow props de React Native a boxShadow para web
 */
export function getShadowStyle(shadow: ShadowProps): any {
  if (Platform.OS === 'web') {
    const {
      shadowColor = '#000',
      shadowOffset = { width: 0, height: 0 },
      shadowOpacity = 0,
      shadowRadius = 0,
    } = shadow;

    // Convertir rgba si shadowColor es un color con opacidad
    const color = shadowColor.includes('rgba')
      ? shadowColor
      : shadowColor.includes('#')
      ? shadowColor
      : `rgba(0, 0, 0, ${shadowOpacity})`;

    // Calcular boxShadow: offset-x offset-y blur-radius spread-radius color
    const boxShadow = `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px 0px ${color}`;

    return {
      boxShadow,
    };
  }

  // Para móvil, devolver las props originales
  return {
    shadowColor: shadow.shadowColor || '#000',
    shadowOffset: shadow.shadowOffset || { width: 0, height: 0 },
    shadowOpacity: shadow.shadowOpacity ?? 0,
    shadowRadius: shadow.shadowRadius ?? 0,
    elevation: shadow.elevation ?? 0,
  };
}

/**
 * Crea estilos de sombra compatibles con web y móvil
 */
export function createShadowStyle(
  shadowColor: string = '#000',
  shadowOffset: { width: number; height: number } = { width: 0, height: 0 },
  shadowOpacity: number = 0.25,
  shadowRadius: number = 8,
  elevation: number = 5
): any {
  return getShadowStyle({
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  });
}

