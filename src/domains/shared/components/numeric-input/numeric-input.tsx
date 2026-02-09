/**
 * Componente NumericInput genérico multiplataforma
 * Envuelve InputWithFocus con configuración específica para números
 */

import { ThemedText } from '@/components/themed-text';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, ViewStyle } from 'react-native';
import { createNumericInputStyles } from './numeric-input.styles';
import type { NumericInputProps } from './numeric-input.types';

export function NumericInput({
  value,
  onChangeText,
  placeholder = '0',
  error = false,
  errorMessage,
  disabled = false,
  required = false,
  maxLength,
  min,
  max,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  returnKeyType,
  onSubmitEditing,
  letterSpacing,
}: NumericInputProps) {
  const { colors } = useTheme();
  const styles = createNumericInputStyles();

  const handleChange = (text: string) => {
    // Solo permitir números
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Aplicar maxLength si está definido
    const limitedValue = maxLength ? numericValue.substring(0, maxLength) : numericValue;
    
    // Validar min/max si están definidos
    if (limitedValue === '') {
      onChangeText('');
      return;
    }
    
    const numValue = parseInt(limitedValue, 10);
    if (min !== undefined && numValue < min) {
      return; // No actualizar si es menor al mínimo
    }
    if (max !== undefined && numValue > max) {
      return; // No actualizar si es mayor al máximo
    }
    
    onChangeText(limitedValue);
  };

  const finalContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    {
      backgroundColor: colors.surface,
      borderColor: error ? colors.error : colors.border,
    },
    ...(Array.isArray(containerStyle) ? containerStyle : containerStyle ? [containerStyle] : []),
  ];

  const finalInputStyle: ViewStyle[] = [
    styles.input,
    { color: colors.text },
    letterSpacing !== undefined && { letterSpacing },
    ...(Array.isArray(inputStyle) ? inputStyle : inputStyle ? [inputStyle] : []),
  ];

  return (
    <>
      <InputWithFocus
        containerStyle={finalContainerStyle}
        primaryColor={colors.primary}
        error={error}
      >
        <Ionicons name="calculator-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={finalInputStyle}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          editable={!disabled}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      </InputWithFocus>
      {error && errorMessage && (
        <ThemedText type="caption" variant="error" style={styles.errorText}>
          {errorMessage}
        </ThemedText>
      )}
    </>
  );
}
