/**
 * Estilos para la página de lista de permisos
 */

import { StyleSheet } from 'react-native';

export const createPermissionsListStyles = (isMobile: boolean = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingBottom: 16, // Padding inferior para separar la paginación del borde
      gap: 16,
      minHeight: 0, // Importante para que flex funcione correctamente
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
      flexShrink: 0, // El header no se comprime
    },
    headerTitle: {
      flex: 1,
    },
    title: {
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: isMobile ? 4 : 8,
      alignItems: 'center',
    },
    actionButton: {
      padding: isMobile ? 6 : 8,
      borderRadius: 6,
    },
    dataTableContainer: {
      width: '100%',
      flex: 1,
      minHeight: 0, // Importante para que el scroll interno funcione
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      flexShrink: 0,
    },
  });

