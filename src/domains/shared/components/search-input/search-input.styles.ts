/**
 * Estilos para el componente SearchInput
 */

import { StyleSheet } from 'react-native';

export const createSearchInputStyles = () =>
  StyleSheet.create({
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
    },
    searchIcon: {
      marginRight: 4,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    clearButton: {
      padding: 4,
    },
  });
