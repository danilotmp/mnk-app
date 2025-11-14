/**
 * Estilos para el componente DataTable
 * Reestructurado para mejor distribución de columnas
 */

import { StyleSheet } from 'react-native';

export const createDataTableStyles = (isMobile: boolean = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      width: '100%',
      minHeight: 400,
      padding: 0,
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
    horizontalScrollContainer: {
      flex: 1,
      width: '100%',
      minHeight: 0, // Permite que el scroll funcione correctamente
    },
    horizontalScrollContent: {
      minWidth: '100%',
      flexGrow: 1,
    },
    tableWrapper: {
      flex: 1,
      minWidth: '100%',
      minHeight: 0, // Permite que el scroll funcione correctamente
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
      zIndex: 1, // Z-index bajo para que tooltips aparezcan por encima
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      minWidth: '100%',
      width: '100%',
    },
    headerCell: {
      paddingVertical: 12,
      paddingHorizontal: isMobile ? 12 : 16,
      borderRightWidth: 1,
      justifyContent: 'center',
      minHeight: 48,
      zIndex: 1, // Z-index bajo para que tooltips aparezcan por encima
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
      flex: 1,
      minHeight: 0, // Importante para que el scroll funcione correctamente
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderBottomWidth: 1,
      minHeight: 56,
      width: '100%',
    },
    stripedRow: {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    cell: {
      paddingVertical: 12,
      paddingHorizontal: isMobile ? 12 : 16,
      borderRightWidth: 1,
      justifyContent: 'center',
      minHeight: 56,
      // Permitir que las celdas crezcan según el contenido
      alignItems: 'stretch',
    },
    cellFirst: {
      paddingLeft: isMobile ? 16 : 16,
    },
    cellLast: {
      paddingRight: isMobile ? 16 : 16,
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
      justifyContent: isMobile ? 'space-between' : 'space-between',
      alignItems: 'center',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      padding: isMobile ? 8 : 16,
      paddingHorizontal: isMobile ? 8 : 16,
      borderTopWidth: 1,
      gap: isMobile ? 8 : 16,
      flexShrink: 0, // La paginación no se comprime
    },
    paginationInfo: {
      flex: 1,
      minWidth: isMobile ? 140 : 150,
    },
    paginationInfoMobile: {
      flexGrow: 1,
      width: '100%',
      marginBottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 10,
    },
    paginationControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isMobile ? 8 : 16,
      flexWrap: 'wrap',
      flexShrink: 1,
    },
    paginationControlsMobile: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
      flexGrow: 1,
      flexBasis: 'auto',
    },
    limitSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isMobile ? 4 : 8,
    },
    limitLabel: {
      fontSize: isMobile ? 12 : 14,
    },
    limitOptions: {
      flexDirection: 'row',
      gap: 4,
    },
    limitOption: {
      paddingHorizontal: isMobile ? 8 : 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      minWidth: isMobile ? 32 : 40,
      alignItems: 'center',
    },
    pageButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isMobile ? 4 : 8,
      flexShrink: 0,
    },
    pageButtonsMobile: {
      marginLeft: 'auto',
    },
    pageButton: {
      padding: isMobile ? 6 : 8,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: isMobile ? 32 : 36,
      minHeight: isMobile ? 32 : 36,
    },
    pageButtonDisabled: {
      opacity: 0.5,
    },
    pageIndicator: {
      paddingHorizontal: isMobile ? 8 : 12,
      minWidth: isMobile ? 80 : 100,
      alignItems: 'center',
    },
  });

