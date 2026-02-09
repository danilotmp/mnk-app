/**
 * Estilos para el componente NumericInput
 */

import { StyleSheet } from 'react-native';

export const createNumericInputStyles = () =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    inputIcon: {
      marginRight: 4,
    },
    input: {
      flex: 1,
      fontSize: 16,
    },
    errorText: {
      marginTop: 4,
    },
  });
