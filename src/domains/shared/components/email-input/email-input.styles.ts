/**
 * Estilos para el componente EmailInput
 */

import { StyleSheet } from 'react-native';

export const createEmailInputStyles = () =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
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
      fontSize: 12,
    },
  });
