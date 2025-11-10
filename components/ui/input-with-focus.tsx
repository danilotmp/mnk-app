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
      const originalStyle = child.props.style;
      const webStyle = Platform.OS === 'web' ? {
        outline: 'none',
        outlineStyle: 'none',
        outlineWidth: 0,
        outlineColor: 'transparent',
        WebkitAppearance: 'none',
        appearance: 'none',
      } : {};
      
      // Extraer las props críticas ANTES de hacer el spread
      const originalOnChangeText = child.props.onChangeText;
      const originalOnFocus = child.props.onFocus;
      const originalOnBlur = child.props.onBlur;
      const originalValue = child.props.value;
      const originalPlaceholder = child.props.placeholder;
      const originalPlaceholderTextColor = child.props.placeholderTextColor;
      const originalReturnKeyType = child.props.returnKeyType;
      const originalOnSubmitEditing = child.props.onSubmitEditing;
      
      // Crear objeto de props preservando TODO explícitamente
      const newProps: any = {};
      
      // Primero copiar todas las props originales
      Object.keys(child.props).forEach((key) => {
        newProps[key] = child.props[key as keyof typeof child.props];
      });
      
      // CRÍTICO: Asegurar que onChangeText se preserve explícitamente
      // Esto es crítico porque React Native necesita esta función para actualizar el valor
      newProps.onChangeText = originalOnChangeText;
      newProps.value = originalValue;
      newProps.placeholder = originalPlaceholder;
      newProps.placeholderTextColor = originalPlaceholderTextColor;
      newProps.returnKeyType = originalReturnKeyType;
      newProps.onSubmitEditing = originalOnSubmitEditing;
      
      // Sobrescribir solo onFocus y onBlur para manejar el estado de focus
      newProps.onFocus = (e: any) => {
        setIsFocused(true);
        if (originalOnFocus) {
          originalOnFocus(e);
        }
      };
      
      newProps.onBlur = (e: any) => {
        setIsFocused(false);
        if (originalOnBlur) {
          originalOnBlur(e);
        }
      };
      
      // Aplicar estilos web para eliminar outline nativo
      newProps.style = [
        originalStyle,
        webStyle,
      ].filter(Boolean);
      
      return React.cloneElement(child as React.ReactElement<any>, newProps);
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
      {childrenWithFocus && React.Children.map(childrenWithFocus, (child) => {
        // Solo renderizar elementos válidos de React para evitar "Unexpected text node"
        if (React.isValidElement(child)) {
          return child;
        }
        return null;
      })}
    </View>
  );
}
