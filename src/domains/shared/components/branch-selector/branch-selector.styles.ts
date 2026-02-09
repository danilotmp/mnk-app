/**
 * Estilos para el componente BranchSelector
 */

import { StyleSheet } from "react-native";

export interface BranchSelectorTheme {
  colors: {
    overlay: string;
    surfaceVariant?: string;
    surface?: string;
  };
}

export const createBranchSelectorStyles = (theme?: BranchSelectorTheme) =>
  StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    button: {
      padding: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    branchName: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme?.colors.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme?.colors?.surfaceVariant ?? theme?.colors?.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "70%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    branchItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    branchInfo: {
      flex: 1,
    },
    loadingContainer: {
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      marginTop: 16,
    },
  });
