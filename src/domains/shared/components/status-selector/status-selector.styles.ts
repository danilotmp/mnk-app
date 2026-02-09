/**
 * Estilos para el componente StatusSelector
 */

import { StyleSheet } from 'react-native';

export const createStatusSelectorStyles = () =>
  StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
    },
    optionsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    option: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      minWidth: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionText: {
      fontSize: 12,
    },
  });
