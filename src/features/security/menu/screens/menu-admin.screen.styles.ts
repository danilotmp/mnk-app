/**
 * Estilos para la pantalla de administración del menú
 */

import { StyleSheet } from 'react-native';

export const createMenuAdminStyles = (colors: any) =>
  StyleSheet.create({
    publicToggleContainer: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    publicToggleLabel: {
      minWidth: 60,
    },
    publicToggleSwitch: {
      width: 43,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      padding: 3,
      justifyContent: 'center',
      position: 'relative',
    },
    publicToggleThumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
    formRow: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
    },
    formField: {
      flex: 1,
      minWidth: 180,
    },
    formFieldWide: {
      flex: 2,
      minWidth: 180,
    },
    formLabel: {
      marginBottom: 8,
    },
    descriptionInput: {
      borderWidth: 1,
      borderRadius: 8,
      minHeight: 105,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'flex-end',
    },
    selectOptions: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 8, // Padding derecho para permitir scroll completo
    },
    selectOption: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      maxHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0, // Evitar que se compriman
    },
  });

