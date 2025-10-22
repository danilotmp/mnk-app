import { StyleSheet } from 'react-native';
import { Size } from '../../domains/shared/types';
import { BaseTheme } from '../themes/base.theme';

// Variantes de input
export type InputVariant = 'outlined' | 'filled' | 'underlined';
export type InputState = 'normal' | 'focused' | 'error' | 'disabled';

// Estilos específicos para el componente Input
export const createInputStyles = (theme: BaseTheme) => {
  return StyleSheet.create({
    // Contenedor base del input
    container: {
      position: 'relative',
    },

    // Input base
    input: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.md,
      lineHeight: theme.typography.lineHeight.md,
      color: theme.colors?.text || '#1F2937',
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

    // Variantes
    variant: {
      outlined: {
        borderWidth: theme.borders.width.sm,
        borderRadius: theme.borders.radius.md,
        backgroundColor: theme.colors?.background || '#FFFFFF',
      },
      filled: {
        borderWidth: 0,
        borderRadius: theme.borders.radius.md,
        backgroundColor: theme.colors?.surfaceVariant || '#F1F3F4',
      },
      underlined: {
        borderWidth: 0,
        borderBottomWidth: theme.borders.width.sm,
        borderRadius: 0,
        backgroundColor: 'transparent',
      },
    },

    // Estados
    state: {
      normal: {
        borderColor: theme.colors?.border || '#E5E7EB',
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
        borderColor: theme.colors?.borderLight || '#F3F4F6',
        backgroundColor: theme.colors?.surfaceVariant || '#F1F3F4',
        opacity: 0.6,
      },
    },

    // Label
    label: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors?.textSecondary || '#6B7280',
      marginBottom: theme.spacing.xs,
    },

    // Label flotante
    floatingLabel: {
      position: 'absolute',
      left: theme.spacing.md,
      top: -theme.spacing.xs,
      backgroundColor: theme.colors?.background || '#FFFFFF',
      paddingHorizontal: theme.spacing.xs,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.brand.primary,
    },

    // Helper text
    helperText: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors?.textTertiary || '#9CA3AF',
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
      position: 'absolute',
      right: theme.spacing.md,
      top: '50%',
      transform: [{ translateY: -12 }],
    },

    // Icono izquierdo
    leftIcon: {
      position: 'absolute',
      left: theme.spacing.md,
      top: '50%',
      transform: [{ translateY: -12 }],
    },
  });
};

// Función helper para obtener estilos específicos
export const getInputStyle = (
  theme: BaseTheme,
  variant: InputVariant,
  size: Size = 'md',
  state: InputState = 'normal'
) => {
  const styles = createInputStyles(theme);
  
  return {
    ...styles.input,
    ...styles.size[size],
    ...styles.variant[variant],
    ...styles.state[state],
  };
};
