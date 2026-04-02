/**
 * Estilos del componente AttributesEditor
 * Patrón: createStyles(colors) - estilos centralizados
 */

import { StyleSheet } from "react-native";
import type { AttributesEditorTheme } from "./attributes-editor.types";

export const createAttributesEditorStyles = (theme: AttributesEditorTheme, compact = false) => {
  const { colors } = theme;
  return StyleSheet.create({
    container: {
      gap: compact ? 6 : 8,
    },
    label: {
      fontWeight: "600",
      marginBottom: 4,
      paddingLeft: compact ? 4 : 0,
    },
    listContainer: {
      gap: compact ? 14 : 8,
      minHeight: compact ? 0 : 80,
      position: "relative" as const,
    },
    row: {
      flexDirection: compact ? "column" : "row",
      alignItems: compact ? "stretch" : "center",
      gap: compact ? 4 : 8,
      width: "100%",
    },
    rowInputs: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingLeft: compact ? 16 : 0,
      flex: 1,
    },
    keyInput: {
      flex: compact ? 1 : 1,
      minWidth: 0,
      borderRadius: 8,
      paddingHorizontal: compact ? 12 : 12,
      paddingVertical: compact ? 12 : 10,
    },
    keyInputFocused: {},
    keyInputText: {
      flex: 1,
      minWidth: 0,
      fontSize: compact ? 13 : 14,
      fontWeight: "500",
      padding: 0,
    },
    valueInput: {
      flex: compact ? 3 : 4,
      minWidth: 0,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: compact ? 12 : 12,
      paddingVertical: compact ? 12 : 10,
    },
    valueInputText: {
      flex: 1,
      minWidth: 0,
      fontSize: compact ? 13 : 14,
      padding: 0,
    },
    removeButton: {
      padding: compact ? 6 : 8,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      minWidth: compact ? 32 : 40,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: compact ? 7 : 10,
      paddingHorizontal: compact ? 10 : 12,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: "dashed",
    },
    emptyState: {
      paddingVertical: compact ? 12 : 16,
      paddingHorizontal: compact ? 10 : 12,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: "dashed",
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: compact ? 13 : 14,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "nowrap",
      paddingLeft: compact ? 16 : 0,
      marginTop: 6,
    },
    suggestionsScroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    suggestionsContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    suggestionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: compact ? 6 : 8,
      paddingHorizontal: compact ? 8 : 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    suggestionText: {
      fontSize: compact ? 12 : 13,
    },
    scrollArrow: {
      padding: 4,
      justifyContent: "center",
      alignItems: "center",
    },
  });
};
