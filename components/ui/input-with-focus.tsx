/**
 * Componente wrapper para inputs que maneja el estado de focus correctamente
 * Extraído de login-modal.tsx para reutilización
 */

import React, { useState } from 'react';
import { Platform, TextInput, View, ViewStyle } from 'react-native';

interface InputWithFocusProps {
  children: React.ReactNode;
  containerStyle: ViewStyle | ViewStyle[];
  primaryColor: string;
  error?: boolean;
}

export function InputWithFocus({ children, containerStyle, primaryColor, error }: InputWithFocusProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  // Clonar children para agregar props de focus
  const childrenWithFocus = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === TextInput) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onFocus: (e: any) => {
          setIsFocused(true);
          if (child.props.onFocus) {
            child.props.onFocus(e);
          }
        },
        onBlur: (e: any) => {
          setIsFocused(false);
          if (child.props.onBlur) {
            child.props.onBlur(e);
          }
        },
        // Eliminar completamente el outline en web para evitar el cuadrado negro/blanco
        style: [
          child.props.style,
          Platform.OS === 'web' && {
            outline: 'none',
            outlineStyle: 'none',
            outlineWidth: 0,
            outlineColor: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none',
          },
        ],
      });
    }
    return child;
  });

  // Extraer borderWidth y borderColor del containerStyle para mantener consistencia
  const baseBorderWidth = (Array.isArray(containerStyle) 
    ? containerStyle[0]?.borderWidth 
    : containerStyle?.borderWidth) || 1;
  const baseBorderColor = error 
    ? (Array.isArray(containerStyle) 
      ? containerStyle[0]?.borderColor 
      : containerStyle?.borderColor)
    : (isFocused ? primaryColor : (Array.isArray(containerStyle) 
      ? containerStyle[0]?.borderColor 
      : containerStyle?.borderColor));

  return (
    <View
      style={[
        containerStyle,
        {
          borderColor: baseBorderColor,
          borderWidth: isFocused && !error ? 2 : baseBorderWidth,
        },
      ]}
    >
      {childrenWithFocus}
    </View>
  );
}

