import { StyleSheet } from 'react-native';
import { BaseTheme } from '../themes/base.theme';

// Variantes de tabla
export type TableVariant = 'bordered' | 'striped' | 'hover' | 'compact';
export type TableSize = 'sm' | 'md' | 'lg';

// Estilos específicos para el componente Table
export const createTableStyles = (theme: BaseTheme) => {
  return StyleSheet.create({
    // Contenedor de la tabla
    container: {
      backgroundColor: theme.colors?.surface || '#F8F9FA',
      borderRadius: theme.borders.radius.lg,
      overflow: 'hidden',
    },

    // Tabla base
    table: {
      width: '100%',
    },

    // Encabezado de la tabla
    header: {
      backgroundColor: theme.colors?.surfaceVariant || '#F1F3F4',
      borderBottomWidth: theme.borders.width.sm,
      borderBottomColor: theme.colors?.border || '#E5E7EB',
    },

    // Fila del encabezado
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    // Celda del encabezado
    headerCell: {
      flex: 1,
      padding: theme.spacing.md,
      borderRightWidth: theme.borders.width.xs,
      borderRightColor: theme.colors?.border || '#E5E7EB',
    },

    // Texto del encabezado
    headerText: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors?.text || '#1F2937',
      textAlign: 'left',
    },

    // Cuerpo de la tabla
    body: {
      backgroundColor: theme.colors?.background || '#FFFFFF',
    },

    // Fila de datos
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: theme.borders.width.xs,
      borderBottomColor: theme.colors?.borderLight || '#F3F4F6',
    },

    // Fila alternada (para striped)
    stripedRow: {
      backgroundColor: theme.colors?.surfaceVariant || '#F1F3F4',
    },

    // Fila hover (para hover)
    hoverRow: {
      backgroundColor: theme.colors?.surface || '#F8F9FA',
    },

    // Celda de datos
    cell: {
      flex: 1,
      padding: theme.spacing.md,
      borderRightWidth: theme.borders.width.xs,
      borderRightColor: theme.colors?.border || '#E5E7EB',
    },

    // Texto de la celda
    cellText: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors?.text || '#1F2937',
    },

    // Tamaños de tabla
    size: {
      sm: {
        headerCell: {
          padding: theme.spacing.sm,
        },
        cell: {
          padding: theme.spacing.sm,
        },
        headerText: {
          fontSize: theme.typography.fontSize.xs,
        },
        cellText: {
          fontSize: theme.typography.fontSize.xs,
        },
      },
      md: {
        headerCell: {
          padding: theme.spacing.md,
        },
        cell: {
          padding: theme.spacing.md,
        },
        headerText: {
          fontSize: theme.typography.fontSize.sm,
        },
        cellText: {
          fontSize: theme.typography.fontSize.sm,
        },
      },
      lg: {
        headerCell: {
          padding: theme.spacing.lg,
        },
        cell: {
          padding: theme.spacing.lg,
        },
        headerText: {
          fontSize: theme.typography.fontSize.md,
        },
        cellText: {
          fontSize: theme.typography.fontSize.md,
        },
      },
    },

    // Variantes
    variant: {
      bordered: {
        borderWidth: theme.borders.width.sm,
        borderColor: theme.colors?.border || '#E5E7EB',
      },
      striped: {
        // Se aplica a nivel de fila
      },
      hover: {
        // Se aplica a nivel de fila
      },
      compact: {
        headerCell: {
          padding: theme.spacing.sm,
        },
        cell: {
          padding: theme.spacing.sm,
        },
      },
    },

    // Estados
    state: {
      normal: {
        opacity: 1,
      },
      loading: {
        opacity: 0.6,
      },
      empty: {
        opacity: 0.8,
      },
    },

    // Paginación
    pagination: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderTopWidth: theme.borders.width.sm,
      borderTopColor: theme.colors?.border || '#E5E7EB',
      backgroundColor: theme.colors?.surface || '#F8F9FA',
    },

    // Información de paginación
    paginationInfo: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors?.textSecondary || '#6B7280',
    },

    // Controles de paginación
    paginationControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
  });
};

// Función helper para obtener estilos específicos
export const getTableStyle = (
  theme: BaseTheme,
  variant: TableVariant,
  size: TableSize = 'md'
) => {
  const styles = createTableStyles(theme);
  
  return {
    ...styles.container,
    ...styles.variant[variant],
  };
};
