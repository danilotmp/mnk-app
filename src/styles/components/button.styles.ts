import { StyleSheet } from "react-native";
import { ComponentVariant, Size } from "../../domains/shared/types";
import { BaseTheme } from "../themes/base.theme";

// Estilos específicos para el componente Button
export const createButtonStyles = (theme: BaseTheme) => {
  return StyleSheet.create({
    // Estilos base del botón
    base: {
      borderRadius: theme.borders.radius.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      fontFamily: theme.typography.fontFamily.primary,
    },

    // Tamaños
    size: {
      xs: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        minHeight: 28,
        fontSize: theme.typography.fontSize.xs,
      },
      sm: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        minHeight: 32,
        fontSize: theme.typography.fontSize.sm,
      },
      md: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 40,
        fontSize: theme.typography.fontSize.md,
      },
      lg: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        minHeight: 48,
        fontSize: theme.typography.fontSize.lg,
      },
      xl: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        minHeight: 56,
        fontSize: theme.typography.fontSize.xl,
      },
      xxl: {
        paddingHorizontal: theme.spacing.xxl,
        paddingVertical: theme.spacing.xl,
        minHeight: 64,
        fontSize: theme.typography.fontSize.xxl,
      },
    },

    // Variantes de color
    variant: {
      primary: {
        backgroundColor: theme.brand.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: theme.brand.secondary,
        borderWidth: 0,
      },
      accent: {
        backgroundColor: theme.brand.accent,
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: theme.borders.width.sm,
        borderColor: theme.brand.primary,
      },
      ghost: {
        backgroundColor: "transparent",
        borderWidth: 0,
      },
      filled: {
        backgroundColor: theme.brand.neutral,
        borderWidth: 0,
      },
    },

    // Estados
    state: {
      enabled: {
        opacity: 1,
      },
      disabled: {
        opacity: 0.5,
      },
      pressed: {
        opacity: 0.8,
      },
    },

    // Sombras por variante
    shadow: {
      primary: theme.shadows.sm,
      secondary: theme.shadows.sm,
      accent: theme.shadows.sm,
      outlined: {},
      ghost: {},
      filled: theme.shadows.sm,
    },

    // Colores de texto por variante
    textColor: {
      primary: "#FFFFFF",
      secondary: "#FFFFFF",
      accent: "#FFFFFF",
      outlined: theme.brand.primary,
      ghost: theme.brand.primary,
      filled: "#FFFFFF",
    },
  });
};

// Función helper para obtener estilos específicos
export const getButtonStyle = (
  theme: BaseTheme,
  variant: ComponentVariant,
  size: Size,
  disabled: boolean = false,
) => {
  const styles = createButtonStyles(theme);

  return {
    ...styles.base,
    ...styles.size[size],
    ...styles.variant[variant],
    ...(disabled ? styles.state.disabled : styles.state.enabled),
    ...styles.shadow[variant],
  };
};

// Función helper para obtener color de texto
export const getButtonTextColor = (
  theme: BaseTheme,
  variant: ComponentVariant,
  disabled: boolean = false,
) => {
  const styles = createButtonStyles(theme);

  if (disabled) {
    return theme.colors?.textTertiary;
  }

  return styles.textColor[variant];
};
