/**
 * Componente PasswordInput genérico multiplataforma
 * Envuelve InputWithFocus con configuración específica para contraseña
 * Incluye botón para mostrar/ocultar contraseña
 */

import { ThemedText } from '@/components/themed-text';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, ViewStyle } from 'react-native';
import { createPasswordInputStyles } from './password-input.styles';
import type { PasswordInputProps } from './password-input.types';

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Contraseña',
  error = false,
  errorMessage,
  disabled = false,
  required = false,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  returnKeyType,
  onSubmitEditing,
}: PasswordInputProps) {
  const { colors } = useTheme();
  const styles = createPasswordInputStyles();
  const [showPassword, setShowPassword] = useState(false);

  // Estilos del contenedor combinando estilos base y personalizados
  const finalContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    {
      backgroundColor: colors.surface,
      borderColor: error ? colors.error : colors.border,
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
        error={error}
      >
        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={finalInputStyle}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          editable={!disabled}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.toggleButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={disabled}
        >
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </InputWithFocus>
      {error && errorMessage && (
        <ThemedText type="caption" variant="error" style={styles.errorText}>
          {errorMessage}
        </ThemedText>
      )}
    </>
  );
}
