/**
 * Componente PhoneInput genérico multiplataforma
 * Envuelve InputWithFocus con configuración específica para teléfono
 */

import { ThemedText } from "@/components/themed-text";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, ViewStyle } from "react-native";
import { createPhoneInputStyles } from "./phone-input.styles";
import type { PhoneInputProps } from "./phone-input.types";

export function PhoneInput({
  value,
  onChangeText,
  placeholder = "Teléfono",
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
  maxLength,
}: PhoneInputProps) {
  const { colors } = useTheme();
  const styles = createPhoneInputStyles();

  const finalContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    {
      backgroundColor: colors.surface,
      borderColor: error ? colors.error : colors.border,
    },
    ...(Array.isArray(containerStyle)
      ? containerStyle
      : containerStyle
        ? [containerStyle]
        : []),
  ];

  const finalInputStyle: ViewStyle[] = [
    styles.input,
    { color: colors.text },
    ...(Array.isArray(inputStyle)
      ? inputStyle
      : inputStyle
        ? [inputStyle]
        : []),
  ];

  return (
    <>
      <InputWithFocus
        containerStyle={finalContainerStyle}
        primaryColor={colors.primary}
        error={error}
      >
        <Ionicons
          name="call-outline"
          size={20}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={finalInputStyle}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
          textContentType="telephoneNumber"
          editable={!disabled}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
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
