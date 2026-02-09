import { useTheme as useAppTheme } from "@/hooks/use-theme";
import { ComponentVariant, Size } from "@/src/domains/shared/types";
import { useTheme } from "@/src/hooks/use-theme.hook";
import {
    getButtonStyle,
    getButtonTextColor,
} from "@/src/styles/components/button.styles";
import React from "react";
import { TextStyle, TouchableOpacity, ViewStyle } from "react-native";
import { ThemedText } from "../themed-text";

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ComponentVariant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
  textStyle,
  children,
}: ButtonProps) {
  const { theme, componentStyles } = useTheme();
  const { colors: appColors } = useAppTheme();
  // Usar el mismo tema que el resto de la app (selector light/dark) para el color primario
  const themeWithAppPrimary = {
    ...theme,
    brand: { ...theme.brand, primary: appColors.primary },
    colors: { ...theme.colors, primary: appColors.primary },
  };

  const buttonStyle = getButtonStyle(
    themeWithAppPrimary,
    variant,
    size,
    disabled,
  );
  const textColor = getButtonTextColor(themeWithAppPrimary, variant, disabled);

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {children}
      {title && title.length > 0 && (
        <ThemedText
          style={[
            {
              color: textColor,
              fontFamily: theme.typography.fontFamily.primary,
              fontWeight: theme.typography.fontWeight.medium,
            },
            textStyle,
          ]}
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}
