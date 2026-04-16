/**
 * Estilos para la pantalla de listado de órdenes de Chat IA
 */

import { StyleSheet } from "react-native";

type ThemeSlice = {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    borderLight: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    success: string;
    warning: string;
    error: string;
    contrastText: string;
  };
  spacing: { xs: number; sm: number; md: number; lg: number };
  borderRadius: { sm: number; md: number; lg: number };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
};

export function createOrdersListScreenStyles(
  theme: ThemeSlice,
  isMobile: boolean,
) {
  const { colors, spacing, borderRadius, shadows } = theme;
  const pad = isMobile ? spacing.md : spacing.lg;

  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: spacing.lg * 2 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: pad,
      paddingTop: spacing.md,
      marginBottom: spacing.md,
    },
    backButton: { padding: spacing.sm },
    titleBlock: { flex: 1, minWidth: 0 },
    pageTitle: {
      fontSize: isMobile ? 22 : 26,
      fontWeight: "700",
      color: colors.text,
    },
    pageSubtitle: {
      marginTop: 2,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // KPI cards
    kpiRow: {
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: pad,
      marginBottom: spacing.md,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: spacing.md,
      ...shadows.sm,
    },
    kpiLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    kpiValue: {
      fontSize: isMobile ? 28 : 34,
      fontWeight: "700",
      color: colors.primary,
      fontVariant: ["tabular-nums"],
    },

    // Barra de búsqueda
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: pad,
      marginBottom: spacing.md,
    },
    searchInput: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 42,
      gap: 8,
    },
    searchTextInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 0,
    },
    exportButton: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    // Lista de cards
    listContainer: {
      paddingHorizontal: pad,
      gap: spacing.md,
    },

    // Card de orden
    orderCard: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: spacing.md,
      ...shadows.sm,
    },
    orderCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    orderCardName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    orderCardDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    orderCardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    orderCardRowLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    orderCardRowValue: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.text,
    },
    orderCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    detailButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary + "18",
      borderRadius: borderRadius.md,
      paddingVertical: 10,
      gap: 6,
    },
    detailButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },

    // Badge de estado
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // Detalle modal
    detailSectionTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: spacing.sm + 2,
    },
    detailSectionTitleText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    detailCard: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
      padding: isMobile ? spacing.md : spacing.lg,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },

    // Hero del detalle (status + total)
    detailHero: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.lg,
      padding: isMobile ? spacing.md : spacing.lg,
    },
    detailHeroRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    detailHeroOrderId: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginTop: spacing.sm,
    },
    detailHeroDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    detailHeroTotalLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      textAlign: "right",
    },
    detailHeroTotalValue: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.primary,
      fontVariant: ["tabular-nums"],
    },

    // Producto
    productRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    productName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    productCode: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    productPriceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    productPrice: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    productOriginalPrice: {
      fontSize: 13,
      color: colors.textSecondary,
      textDecorationLine: "line-through",
    },
    promotionBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.warning + "20",
    },
    promotionBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.warning,
    },

    // Paginación
    paginationRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: pad,
    },
    paginationButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paginationButtonDisabled: {
      opacity: 0.4,
    },
    paginationText: {
      fontSize: 13,
      color: colors.textSecondary,
    },

    // Empty / loading
    centerMessage: {
      padding: spacing.lg * 2,
      alignItems: "center",
      gap: spacing.sm,
    },

    // Footer del modal
    modalFooter: {
      flexDirection: "row",
      gap: spacing.sm,
    },
  });
}
