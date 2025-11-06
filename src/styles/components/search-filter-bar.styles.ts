/**
 * Estilos para el componente SearchFilterBar
 */

import { StyleSheet } from 'react-native';

export const createSearchFilterBarStyles = (isMobile: boolean = false) =>
  StyleSheet.create({
    container: {
      padding: 0,
      paddingHorizontal: 0,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 16,
    },
    searchAndHintContainer: {
      width: '100%',
      gap: 5,
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
      paddingHorizontal: 20,
    },
    filtersContent: {
      gap: isMobile ? 12 : 16,
      paddingRight: isMobile ? 0 : 16,
    },
    filtersContentVertical: {
      gap: isMobile ? 12 : 16,
      width: '100%',
    },
    filterItem: {
      minWidth: isMobile ? '100%' : 200,
      gap: isMobile ? 6 : 8,
    },
    filterLabel: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '500',
    },
    selectContainer: {
      minHeight: isMobile ? 36 : 40,
    },
    selectOptions: {
      flexDirection: 'row',
      gap: isMobile ? 6 : 8,
      padding: 4,
    },
    selectOption: {
      paddingHorizontal: isMobile ? 10 : 12,
      paddingVertical: isMobile ? 5 : 6,
      borderRadius: 6,
      borderWidth: 1,
    },
    textInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isMobile ? 10 : 12,
      paddingVertical: isMobile ? 6 : 8,
      borderRadius: 6,
      borderWidth: 1,
      gap: 8,
    },
    textInput: {
      flex: 1,
      fontSize: isMobile ? 14 : 14,
    },
    clearFilterButton: {
      padding: 4,
      marginLeft: 4,
    },
    booleanOptions: {
      flexDirection: 'row',
      gap: isMobile ? 6 : 8,
    },
    booleanOption: {
      flex: 1,
      paddingVertical: isMobile ? 6 : 8,
      paddingHorizontal: isMobile ? 10 : 12,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
      minHeight: isMobile ? 36 : 40,
    },
    clearContainer: {
      alignItems: isMobile ? 'center' : 'flex-end',
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isMobile ? 6 : 8,
      paddingVertical: isMobile ? 6 : 8,
    },
    clearText: {
      fontSize: isMobile ? 13 : 14,
    },
    hintContainer: {
      paddingLeft: isMobile ? 5 : 35,
      paddingRight: isMobile ? 12 : 16,
      paddingTop: 5,
    },
    hintText: {
      fontSize: isMobile ? 12 : 13,
    },
  });

