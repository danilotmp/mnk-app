/**
 * Estilos para formularios de usuario (crear/editar)
 * Compartidos entre user-create-form y user-edit-form
 */

import { StyleSheet } from 'react-native';

export const createUserFormStyles = () =>
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
    title: {
      marginBottom: 4,
    },
    formHeader: {
      marginBottom: 16,
    },
    formHeaderTexts: {
      gap: 4,
    },
    formFooter: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    formCard: {
      padding: 25,
      gap: 20,
    },
    inputGroup: {
      gap: 8,
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
    errorText: {
      marginTop: 4,
      fontSize: 12,
    },
    inlineInputs: {
      flexDirection: 'row',
      gap: 12,
    },
    inlineInput: {
      flex: 1,
      gap: 8,
    },
    inlineInputLeft: {
      marginRight: 6,
    },
    inlineInputRight: {
      marginLeft: 6,
    },
    selectContainer: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 8,
      minHeight: 48,
    },
    selectOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    selectOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    switchGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    switchLabel: {
      flex: 1,
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

