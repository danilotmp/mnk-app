/**
 * Estilos del componente AttributesEditor
 * Patrón: createStyles(colors) - estilos centralizados
 */

import { StyleSheet } from "react-native";
import type { AttributesEditorTheme } from "./attributes-editor.types";

export const createAttributesEditorStyles = (theme: AttributesEditorTheme) => {
  const { colors } = theme;
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      fontWeight: "600",
      marginBottom: 4,
    },
    listContainer: {
      gap: 8,
      minHeight: 80,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    keyInput: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    keyInputText: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      padding: 0,
    },
    valueInput: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    valueInputText: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      padding: 0,
    },
    removeButton: {
      padding: 8,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 40,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: "dashed",
      alignSelf: "flex-start",
    },
    emptyState: {
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: "dashed",
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: 14,
    },
  });
};
