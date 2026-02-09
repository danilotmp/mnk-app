/**
 * Estilos para la página de lista de usuarios
 */

import { StyleSheet } from 'react-native';

export const createUsersListStyles = (isMobile: boolean = false) =>
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
    footerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      gap: 4,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
      maxWidth: 120,
    },
  });

