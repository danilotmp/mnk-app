/**
 * Estilos del modal de Promociones
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
    filterInputBackground: string;
    error: string;
    contrastText: string;
    success: string;
  };
  spacing: { xs: number; sm: number; md: number; lg: number };
  borderRadius: { sm: number; md: number; lg: number };
}

export function createPromotionsModalStyles(theme: Theme) {
  const { colors, spacing, borderRadius } = theme;
  return StyleSheet.create({
    content: { gap: spacing.md },
    promoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
    },
    promoInfo: { flex: 1, minWidth: 0 },
    promoName: { fontSize: 14, fontWeight: "600", color: colors.text },
    promoDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    promoActions: { flexDirection: "row", gap: 4 },
    actionBtn: { padding: 6 },
    emptyState: { alignItems: "center", paddingVertical: spacing.lg, gap: spacing.sm },
    formRow: { gap: 12 },
    formInputContainer: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 48,
    },
    formInputText: { fontSize: 14, padding: 0, minHeight: 24 },
    formFieldsRow: { flexDirection: "row", gap: spacing.sm },
    formField: { flex: 1 },
    formActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.sm },
    statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  });
}
