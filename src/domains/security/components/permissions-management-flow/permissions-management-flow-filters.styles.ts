/**
 * Estilos para el componente PermissionsFlowFilters
 */

import { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const createPermissionsFlowFiltersStyles = (
  colors: ThemeColors,
  isMobile: boolean = false
) =>
  StyleSheet.create({
    container: {
      padding: 0,
      paddingHorizontal: 0,
      paddingBottom: 16,
      gap: 16,
    },
    searchContainer: {
      width: '100%',
      flexDirection: 'row',
      gap: isMobile ? 8 : 12,
      alignItems: 'center',
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 10 : 12,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: isMobile ? 14 : 16,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: isMobile ? 6 : 8,
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 10 : 12,
      borderRadius: 8,
      minHeight: isMobile ? 40 : 44,
      minWidth: isMobile ? 40 : 44,
    },
    expandButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
    },
    filtersContainer: {
      width: '100%',
      paddingHorizontal: isMobile ? 10 : 20,
      gap: isMobile ? 12 : 16,
    },
    filterSection: {
      gap: isMobile ? 6 : 8,
    },
    filterLabel: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '500',
    },
    filterOptionsContainer: {
      flexDirection: 'row',
      gap: isMobile ? 6 : 8,
      padding: 4,
    },
    filterOption: {
      paddingHorizontal: isMobile ? 10 : 12,
      paddingVertical: isMobile ? 5 : 6,
      borderRadius: 6,
      borderWidth: 1,
      minHeight: isMobile ? 36 : 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearContainer: {
      alignItems: isMobile ? 'center' : 'flex-end',
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isMobile ? 6 : 8,
      paddingVertical: 0,
    },
    clearText: {
      fontSize: isMobile ? 13 : 14,
    },
  });

