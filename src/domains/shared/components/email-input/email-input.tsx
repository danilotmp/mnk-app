/**
 * Componente EmailInput genérico multiplataforma
 * Envuelve InputWithFocus con configuración específica para email
 */

import { ThemedText } from '@/components/themed-text';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, ViewStyle } from 'react-native';
import { createEmailInputStyles } from './email-input.styles';
import type { EmailInputProps } from './email-input.types';

/**
 * Validar formato de email
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailInput({
  value,
  onChangeText,
  placeholder = 'Email',
  error: externalError = false,
  errorMessage: externalErrorMessage,
  disabled = false,
  required = false,
  validate = true,
  invalidEmailMessage = 'Email inválido',
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  returnKeyType,
  onSubmitEditing,
}: EmailInputProps) {
  const { colors } = useTheme();
  const styles = createEmailInputStyles();
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenBlurred, setHasBeenBlurred] = useState(false);

  // Validar email si está habilitada la validación
  const isValidEmail = !validate || !value || value.trim() === '' || EMAIL_REGEX.test(value.trim());
  const showValidationError = validate && hasBeenBlurred && value.trim() !== '' && !isValidEmail;
  const hasError = externalError || showValidationError;
  const errorMessage = externalErrorMessage || (showValidationError ? invalidEmailMessage : undefined);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenBlurred(true);
    if (onBlur) {
      onBlur();
    }
  };

  // Estilos del contenedor combinando estilos base y personalizados
  const finalContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    {
      backgroundColor: colors.surface,
      borderColor: hasError ? colors.error : colors.border,
    },
    ...(Array.isArray(containerStyle) ? containerStyle : containerStyle ? [containerStyle] : []),
  ];

  // Estilos del input combinando estilos base y personalizados
  const finalInputStyle: ViewStyle[] = [
    styles.input,
    { color: colors.text },
    ...(Array.isArray(inputStyle) ? inputStyle : inputStyle ? [inputStyle] : []),
  ];

  return (
    <>
      <InputWithFocus
        containerStyle={finalContainerStyle}
        primaryColor={colors.primary}
        error={hasError}
      >
        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={finalInputStyle}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      </InputWithFocus>
      {hasError && errorMessage && (
        <ThemedText type="caption" variant="error" style={styles.errorText}>
          {errorMessage}
        </ThemedText>
      )}
    </>
  );
}
