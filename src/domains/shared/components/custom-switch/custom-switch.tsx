/**
 * Componente de switch personalizado moderno
 * Reemplaza el Switch nativo de React Native con un diseño más moderno
 */

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Platform, TouchableOpacity, View } from "react-native";
import { createCustomSwitchStyles } from "./custom-switch.styles";
import type { CustomSwitchProps } from "./custom-switch.types";

export function CustomSwitch({
  value,
  onValueChange,
  label,
  disabled = false,
}: CustomSwitchProps) {
  const { colors } = useTheme();
  const styles = createCustomSwitchStyles(colors);

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {label}
        </ThemedText>
      )}
      <TouchableOpacity
        style={[
          styles.switch,
          {
            backgroundColor: value ? colors.primary : colors.border + "80",
            borderColor: value ? colors.primary : colors.border,
            opacity: disabled ? 0.5 : 1,
            ...(Platform.OS === "web"
              ? {
                  ...(value
                    ? {
                        boxShadow: `0 0 0 2px ${colors.primary}40, 0 0 12px ${colors.primary}40`,
                      }
                    : {}),
                  transition: "all 0.25s ease",
                }
              : {}),
          },
        ]}
        onPress={() => !disabled && onValueChange(!value)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <View
          style={[
            styles.thumb,
            {
              transform: [{ translateX: value ? 16 : 0 }],
              backgroundColor: colors.contrastText,
              ...(Platform.OS === "web"
                ? {
                    transition: "transform 0.25s ease",
                  }
                : {}),
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}
