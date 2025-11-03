/**
 * Estilos para el componente DataTable
 * Reestructurado para mejor distribución de columnas
 */

import { StyleSheet } from 'react-native';

export const createDataTableStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      width: '100%',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      marginTop: 16,
    },
    header: {
      borderBottomWidth: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    headerCell: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRightWidth: 1,
      justifyContent: 'center',
      minHeight: 48,
    },
    headerCellCenter: {
      alignItems: 'center',
    },
    headerCellRight: {
      alignItems: 'flex-end',
    },
    headerText: {
      fontSize: 14,
      fontWeight: '600',
    },
    body: {
      maxHeight: 600,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderBottomWidth: 1,
      minHeight: 56,
    },
    stripedRow: {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    cell: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRightWidth: 1,
      justifyContent: 'center',
      minHeight: 56,
    },
    cellCenter: {
      alignItems: 'center',
    },
    cellRight: {
      alignItems: 'flex-end',
    },
    cellText: {
      fontSize: 14,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      flexWrap: 'wrap',
      gap: 16,
    },
    paginationInfo: {
      flex: 1,
      minWidth: 150,
    },
    paginationControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    },
    limitSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    limitLabel: {
      fontSize: 14,
    },
    limitOptions: {
      flexDirection: 'row',
      gap: 4,
    },
    limitOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      minWidth: 40,
      alignItems: 'center',
    },
    pageButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pageButton: {
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 36,
      minHeight: 36,
    },
    pageButtonDisabled: {
      opacity: 0.5,
    },
    pageIndicator: {
      paddingHorizontal: 12,
      minWidth: 100,
      alignItems: 'center',
    },
  });
