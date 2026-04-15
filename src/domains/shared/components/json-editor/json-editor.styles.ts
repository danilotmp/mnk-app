/**
 * Estilos para el componente JsonEditor
 */

import { StyleSheet } from "react-native";

export interface JsonEditorTheme {
  colors: {
    text: string;
    textSecondary: string;
    border: string;
    filterInputBackground: string;
    primary: string;
    surfaceVariant: string;
  };
  borderRadius: { md: number };
}

export const createJsonEditorStyles = (theme: JsonEditorTheme) =>
  StyleSheet.create({
    container: {
      gap: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      fontWeight: "500",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    formatButton: {
      color: theme.colors.primary,
      fontWeight: "500",
    },
    editorContainer: {
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.filterInputBackground,
      flexDirection: "row",
      overflow: "hidden",
    },
    lineNumbers: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "flex-end",
      minWidth: 32,
    },
    lineNumber: {
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textSecondary + "60",
      fontFamily: "monospace",
    },
    textInput: {
      flex: 1,
      padding: 12,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: "monospace",
      color: theme.colors.text,
      textAlignVertical: "top",
      outlineStyle: "none",
      outlineWidth: 0,
      borderWidth: 0,
    } as any,
  });
