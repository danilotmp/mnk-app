/**
 * Estilos del componente IconInput
 */

import { Platform, StyleSheet } from "react-native";
import type { IconInputTheme } from "./icon-input.types";

export const createIconInputStyles = (theme: IconInputTheme) => {
  const { colors, shadows } = theme;
  return StyleSheet.create({
    container: {
      position: "relative",
    },
    inputGroup: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      minHeight: 48,
      overflow: "visible",
    },
    inputGroupError: {
      borderColor: colors.error,
    },
    familySelector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
      minWidth: 120,
      borderRightWidth: 0,
    },
    familyText: {
      flex: 1,
      marginRight: 8,
      fontSize: 14,
    },
    separator: {
      width: 1,
      height: 24,
      marginVertical: 8,
    },
    iconInputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 8,
      minWidth: 0,
      borderWidth: 0,
      backgroundColor: "transparent",
    },
    iconPreview: {
      marginRight: 4,
    },
    input: {
      flex: 1,
      fontSize: 14,
      padding: 0,
      margin: 0,
      minWidth: 0,
      borderWidth: 0,
      borderColor: "transparent",
      backgroundColor: "transparent",
      ...(Platform.OS === "web" &&
        ({
          outlineStyle: "none",
          outlineWidth: 0,
          outlineColor: "transparent",
          border: "none",
          boxShadow: "none",
        } as any)),
    },
    disabled: {
      opacity: 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay || "rgba(0, 0, 0, 0.3)",
    },
    modalContent: {
      position: "absolute",
      borderRadius: 8,
      maxHeight: 200,
      ...Platform.select({
        web: {
          boxShadow: shadows.md
            ? `0px ${shadows.md.shadowOffset.height}px ${shadows.md.shadowRadius}px rgba(0, 0, 0, ${shadows.md.shadowOpacity})`
            : "0px 4px 8px rgba(0, 0, 0, 0.25)",
        },
        default: shadows.md || {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        },
      }),
    },
    dropdown: {
      borderRadius: 8,
      borderWidth: 1,
      maxHeight: 200,
      backgroundColor: colors.background,
      overflow: "hidden",
      opacity: 1,
    },
    dropdownScroll: {
      maxHeight: 200,
      backgroundColor: colors.background,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "40",
    },
    dropdownItemText: {
      flex: 1,
      fontSize: 14,
    },
  });
};
