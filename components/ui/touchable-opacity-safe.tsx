/**
 * Wrapper seguro para TouchableOpacity que maneja pointerEvents correctamente
 * Mueve pointerEvents de props a style para evitar advertencias de deprecación
 */

import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

export interface TouchableOpacitySafeProps extends Omit<TouchableOpacityProps, 'pointerEvents' | 'style'> {
  style?: ViewStyle | (ViewStyle | undefined)[];
  pointerEvents?: ViewStyle['pointerEvents'];
}

/**
 * TouchableOpacity que maneja pointerEvents correctamente
 * Extrae pointerEvents de props y lo mueve a style
 */
export function TouchableOpacitySafe({
  style,
  pointerEvents,
  ...otherProps
}: TouchableOpacitySafeProps) {
  // Asegurarse de que pointerEvents no esté en otherProps
  const { pointerEvents: _, ...restProps } = otherProps as any;
  
  const finalStyle = [
    Array.isArray(style) ? style : style,
    pointerEvents ? { pointerEvents } : null,
  ].filter(Boolean) as ViewStyle[];

  return <TouchableOpacity style={finalStyle} {...restProps} />;
}

