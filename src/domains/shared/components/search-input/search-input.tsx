/**
 * Componente SearchInput genérico multiplataforma
 * Input de búsqueda con icono y botón de limpiar
 */

import { InputWithFocus } from "@/components/ui/input-with-focus";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, TouchableOpacity, ViewStyle } from "react-native";
import { createSearchInputStyles } from "./search-input.styles";
import type { SearchInputProps } from "./search-input.types";

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Buscar...",
  disabled = false,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  returnKeyType = "search",
  onSubmitEditing,
  autoCapitalize = "none",
  autoCorrect = false,
  showClearButton = true,
}: SearchInputProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const styles = createSearchInputStyles(isMobile);

  // Estilos del contenedor combinando estilos base y personalizados
  const finalContainerStyle: ViewStyle[] = [
    styles.searchInputContainer,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    ...(Array.isArray(containerStyle)
      ? containerStyle
      : containerStyle
        ? [containerStyle]
        : []),
  ];

  // Estilos del input combinando estilos base y personalizados
  const finalInputStyle: ViewStyle[] = [
    styles.searchInput,
    { color: colors.text },
    ...(Array.isArray(inputStyle)
      ? inputStyle
      : inputStyle
        ? [inputStyle]
        : []),
  ];

  const hasValue = value && value.length > 0;

  return (
    <InputWithFocus
      containerStyle={finalContainerStyle}
      primaryColor={colors.primary}
      error={false}
    >
      <Ionicons
        name="search"
        size={20}
        color={colors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={finalInputStyle}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={!disabled}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {showClearButton && hasValue && (
        <TouchableOpacity
          onPress={() => onChangeText("")}
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={disabled}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </InputWithFocus>
  );
}
