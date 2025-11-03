/**
 * Estilos para la página de lista de usuarios
 */

import { StyleSheet } from 'react-native';

export const createUsersListStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
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
      gap: 8,
      alignItems: 'center',
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
    },
    dataTableContainer: {
      width: '100%',
      flex: 1,
    },
  });

