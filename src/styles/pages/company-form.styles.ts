/**
 * Estilos para formularios de empresa (crear/editar)
 */

import { StyleSheet } from 'react-native';

export const createCompanyFormStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 8,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
    },
    formCard: {
      padding: 24,
      gap: 18,
    },
    inputGroup: {
      gap: 8,
    },
    inlineInputs: {
      flexDirection: 'row',
      gap: 16,
    },
    inlineInput: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
    },
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
      fontSize: 14,
    },
    textArea: {
      minHeight: 96,
      paddingTop: 12,
      paddingBottom: 12,
    },
    errorText: {
      marginTop: 4,
      fontSize: 12,
    },
    switchGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    switchLabel: {
      flex: 1,
      gap: 4,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
    },
    submitButton: {
      flex: 1,
    },
  });


