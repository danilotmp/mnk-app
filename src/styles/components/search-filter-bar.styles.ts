/**
 * Estilos para el componente SearchFilterBar
 */

import { StyleSheet } from 'react-native';

export const createSearchFilterBarStyles = () =>
  StyleSheet.create({
    container: {
      padding: 16,
      gap: 16,
    },
    searchContainer: {
      width: '100%',
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
    },
    filtersContainer: {
      width: '100%',
    },
    filtersContent: {
      gap: 16,
      paddingRight: 16,
    },
    filterItem: {
      minWidth: 200,
      gap: 8,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    selectContainer: {
      minHeight: 40,
    },
    selectOptions: {
      flexDirection: 'row',
      gap: 8,
      padding: 4,
    },
    selectOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
    },
    textInput: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      fontSize: 14,
    },
    booleanOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    booleanOption: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
    },
    clearContainer: {
      alignItems: 'flex-end',
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    clearText: {
      fontSize: 14,
    },
  });

