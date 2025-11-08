/**
 * Estilos para la página de lista de empresas
 */

import { StyleSheet } from 'react-native';

export const createCompaniesListStyles = (isMobile: boolean = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
      gap: 16,
      minHeight: 0,
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
    actionsContainer: {
      flexDirection: 'row',
      gap: isMobile ? 4 : 8,
      alignItems: 'center',
    },
    dataTableContainer: {
      width: '100%',
      flex: 1,
      minHeight: 0,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
  });


