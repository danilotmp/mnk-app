/**
 * Estilos del modal de Condiciones
 */

import { StyleSheet } from "react-native";

interface Theme {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    borderLight: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    error: string;
    contrastText: string;
  };
  spacing: { xs: number; sm: number; md: number; lg: number };
  borderRadius: { sm: number; md: number; lg: number };
}

export function createConditionsModalStyles(theme: Theme) {
  const { colors, spacing, borderRadius } = theme;
  return StyleSheet.create({
    content: {
      gap: spacing.md,
    },
    conditionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
    },
    conditionText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    conditionActions: {
      flexDirection: "row",
      gap: 4,
    },
    actionBtn: {
      padding: 6,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    formRow: {
      gap: 12,
    },
    formInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      minHeight: 44,
    },
    formInputContainer: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 48,
    },
    formInputText: {
      fontSize: 14,
      padding: 0,
      minHeight: 24,
    },
    formActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    offeringToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
    },
  });
}
