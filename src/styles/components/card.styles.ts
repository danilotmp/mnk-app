import { StyleSheet } from "react-native";
import { Size } from "../../domains/shared/types";
import { BaseTheme } from "../themes/base.theme";

type ThemeWithColors = BaseTheme & { colors: Record<string, string> };

// Variantes de tarjeta
export type CardVariant = "elevated" | "outlined" | "filled" | "flat";

// Estilos específicos para el componente Card
export const createCardStyles = (theme: ThemeWithColors) => {
  return StyleSheet.create({
    // Estilos base de la tarjeta
    base: {
      borderRadius: theme.borders.radius.lg,
      backgroundColor: theme.colors.surface,
    },

    // Variantes
    variant: {
      elevated: {
        ...theme.shadows.md,
        backgroundColor: theme.colors.surface,
      },
      outlined: {
        borderWidth: theme.borders.width.sm,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
      filled: {
        backgroundColor: theme.colors.surfaceVariant,
      },
      flat: {
        backgroundColor: "transparent",
        borderWidth: 0,
      },
    },

    // Padding por tamaño
    padding: {
      none: {
        padding: 0,
      },
      xs: {
        padding: theme.spacing.xs,
      },
      sm: {
        padding: theme.spacing.sm,
      },
      md: {
        padding: theme.spacing.md,
      },
      lg: {
        padding: theme.spacing.lg,
      },
      xl: {
        padding: theme.spacing.xl,
      },
      xxl: {
        padding: theme.spacing.xxl,
      },
    },

    // Bordes redondeados por tamaño
    borderRadius: {
      none: {
        borderRadius: 0,
      },
      xs: {
        borderRadius: theme.borders.radius.xs,
      },
      sm: {
        borderRadius: theme.borders.radius.sm,
      },
      md: {
        borderRadius: theme.borders.radius.md,
      },
      lg: {
        borderRadius: theme.borders.radius.lg,
      },
      xl: {
        borderRadius: theme.borders.radius.xl,
      },
      xxl: {
        borderRadius: theme.borders.radius.xxl,
      },
    },

    // Estados
    state: {
      normal: {
        opacity: 1,
      },
      pressed: {
        opacity: 0.95,
      },
      disabled: {
        opacity: 0.6,
      },
    },
  });
};

// Función helper para obtener estilos específicos
export const getCardStyle = (
  theme: ThemeWithColors,
  variant: CardVariant,
  padding: Size = "md",
  borderRadius: Size = "lg",
) => {
  const styles = createCardStyles(theme);

  return {
    ...styles.base,
    ...styles.variant[variant],
    ...styles.padding[padding],
    ...styles.borderRadius[borderRadius],
  };
};
