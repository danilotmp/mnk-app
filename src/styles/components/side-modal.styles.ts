/**
 * Estilos para el modal lateral
 */

import { BaseTheme } from '@/constants/theme';
import { Platform, StyleSheet } from 'react-native';

export const createSideModalStyles = (colors: BaseTheme['colors'], isMobile: boolean = false) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.surfaceVariant || colors.surface || '#1E293B', // Usar surfaceVariant en modo dark para evitar transparencia
      ...Platform.select({
        web: {
          boxShadow: '-2px 0px 10px rgba(0, 0, 0, 0.25)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: {
            width: -2,
            height: 0,
          },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 10,
        },
      }),
      // Bordes redondeados siempre en el lado izquierdo
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      overflow: 'hidden',
      flexDirection: 'column', // Para que header, content y footer se apilen verticalmente
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 25,
      borderBottomWidth: 1,
      gap: 16,
      flexShrink: 0, // Header no se comprime
    },
    headerTitle: {
      flex: 1,
    },
    title: {
      marginBottom: 4,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
    },
    scrollView: {
      flex: 1, // Toma el espacio disponible entre header y footer
    },
    scrollContent: {
      padding: 0,
      paddingBottom: 0,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: 25,
      borderTopWidth: 1,
      gap: 12,
      flexShrink: 0, // Footer no se comprime
    },
  });

