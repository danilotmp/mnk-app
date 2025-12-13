/**
 * Estilos para la pantalla de administración del menú
 */

import { StyleSheet } from 'react-native';

export const createMenuAdminStyles = (colors: any) =>
  StyleSheet.create({
    publicToggleContainer: {
      marginTop: 16,
    },
    publicToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    publicToggleControls: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 30,
      gap: 8,
    },
    publicToggleSwitch: {
      transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
    },
    publicToggleText: {
      minWidth: 30,
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
  });

