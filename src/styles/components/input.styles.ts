import { StyleSheet } from "react-native";
import { Size } from "../../domains/shared/types";
import { BaseTheme } from "../themes/base.theme";

type ThemeWithColors = BaseTheme & { colors: Record<string, string> };

// Variantes de input
export type InputVariant = "outlined" | "filled" | "underlined";
export type InputState = "normal" | "focused" | "error" | "disabled";

// Estilos específicos para el componente Input
export const createInputStyles = (theme: ThemeWithColors) => {
  return StyleSheet.create({
    // Contenedor base del input
    container: {
      position: "relative",
    },

    // Input base
    input: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.md,
      lineHeight: theme.typography.lineHeight.md,
      color: theme.colors.text,
    },

    // Tamaños
    size: {
      xs: {
        height: 32,
        paddingHorizontal: theme.spacing.sm,
        fontSize: theme.typography.fontSize.xs,
      },
      sm: {
        height: 36,
        paddingHorizontal: theme.spacing.sm,
        fontSize: theme.typography.fontSize.sm,
      },
      md: {
        height: 40,
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
      },
      lg: {
        height: 48,
        paddingHorizontal: theme.spacing.lg,
        fontSize: theme.typography.fontSize.lg,
      },
      xl: {
        height: 56,
        paddingHorizontal: theme.spacing.xl,
        fontSize: theme.typography.fontSize.xl,
      },
      xxl: {
        height: 64,
        paddingHorizontal: theme.spacing.xxl,
        fontSize: theme.typography.fontSize.xxl,
      },
    },

    // Variantes: mismo color de fondo que el control de email (surface) en Light y Dark
    variant: {
      outlined: {
        borderWidth: theme.borders.width.sm,
        borderRadius: theme.borders.radius.md,
        backgroundColor: theme.colors.surface,
      },
      filled: {
        borderWidth: 0,
        borderRadius: theme.borders.radius.md,
        backgroundColor: theme.colors.surface,
      },
      underlined: {
        borderWidth: 0,
        borderBottomWidth: theme.borders.width.sm,
        borderRadius: 0,
        backgroundColor: "transparent",
      },
    },

    // Estados: normal/focused/error mismo fondo; disabled = variación (opacidad) del mismo color
    state: {
      normal: {
        borderColor: theme.colors.border,
      },
      focused: {
        borderColor: theme.brand.primary,
        borderWidth: theme.borders.width.md,
      },
      error: {
        borderColor: theme.status.error,
        borderWidth: theme.borders.width.md,
      },
      disabled: {
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surface,
        opacity: 0.65,
      },
    },

    // Label
    label: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },

    // Label flotante
    floatingLabel: {
      position: "absolute",
      left: theme.spacing.md,
      top: -theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.xs,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.brand.primary,
    },

    // Helper text
    helperText: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textTertiary,
      marginTop: theme.spacing.xs,
    },

    // Error text
    errorText: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.xs,
      color: theme.status.error,
      marginTop: theme.spacing.xs,
    },

    // Icono
    icon: {
      position: "absolute",
      right: theme.spacing.md,
      top: "50%",
      transform: [{ translateY: -12 }],
    },

    // Icono izquierdo
    leftIcon: {
      position: "absolute",
      left: theme.spacing.md,
      top: "50%",
      transform: [{ translateY: -12 }],
    },
  });
};

// Función helper para obtener estilos específicos
export const getInputStyle = (
  theme: ThemeWithColors,
  variant: InputVariant,
  size: Size = "md",
  state: InputState = "normal",
) => {
  const styles = createInputStyles(theme);

  return {
    ...styles.input,
    ...styles.size[size],
    ...styles.variant[variant],
    ...styles.state[state],
  };
};
