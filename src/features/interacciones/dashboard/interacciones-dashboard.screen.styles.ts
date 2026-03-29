import { StyleSheet } from "react-native";

type ThemeSlice = {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    borderLight: string;
    background: string;
    surfaceVariant: string;
  };
  spacing: { md: number; lg: number; sm: number };
  borderRadius: { md: number; lg: number };
  shadows: { sm: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number } };
};

export function createInteraccionesDashboardStyles(
  theme: ThemeSlice,
  isMobile: boolean,
) {
  const { colors, spacing, borderRadius, shadows } = theme;
  const pad = isMobile ? spacing.md : spacing.lg;

  return StyleSheet.create({
    scrollContent: {
      paddingBottom: spacing.lg * 2,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    pageTitle: {
      fontSize: isMobile ? 22 : 26,
      fontWeight: "700",
      color: colors.text,
    },
    pageSubtitle: {
      marginTop: 4,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    /** Fila 2: selectores ~60%; tarjetas numéricas KPI ~40%. */
    heroRow: {
      flexDirection: isMobile ? "column" : "row",
      alignItems: "stretch",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    heroColumnFilters: {
      flex: isMobile ? undefined : 3,
      width: isMobile ? "100%" : undefined,
      minWidth: 0,
    },
    /** Columna derecha: dona (fila 1) o KPI (fila 2). */
    heroColumnChart: {
      flex: isMobile ? undefined : 2,
      width: isMobile ? "100%" : undefined,
      minWidth: 0,
    },
    /** Fila 1: barras por instancia ~60%; distribución (torta) ~40%. */
    kpiChartRow: {
      flexDirection: isMobile ? "column" : "row",
      alignItems: "stretch",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    kpiChartColumnMetrics: {
      flex: isMobile ? undefined : 3,
      width: isMobile ? "100%" : undefined,
      minWidth: 0,
    },
    kpiChartColumnKpis: {
      flex: isMobile ? undefined : 2,
      width: isMobile ? "100%" : undefined,
      minWidth: 0,
    },
    kpiGridCompact: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      alignContent: "flex-start",
    },
    kpiCardCompact: {
      width: "47%",
      minWidth: 0,
      flexGrow: 1,
      maxWidth: "48%",
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: isMobile ? spacing.sm : spacing.md,
      paddingVertical: isMobile ? spacing.sm : spacing.md + 4,
      ...shadows.sm,
    },
    /** Números grandes para lectura a distancia (pantalla / proyector). */
    kpiValueCompact: {
      fontSize: isMobile ? 26 : 36,
      fontWeight: "700",
      color: colors.primary,
      fontVariant: ["tabular-nums"],
      letterSpacing: isMobile ? 0 : 0.5,
    },
    kpiLabelCompact: {
      marginTop: isMobile ? 6 : 8,
      fontSize: isMobile ? 13 : 15,
      color: colors.textSecondary,
      lineHeight: isMobile ? 18 : 20,
      fontWeight: "600",
    },
    chartCard: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: pad,
      ...shadows.sm,
    },
    filterCard: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: pad,
      ...shadows.sm,
    },
    monthCarouselRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flex: 1,
      minWidth: 0,
      minHeight: 44,
    },
    monthCarouselArrow: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      flexShrink: 0,
    },
    monthCarouselClip: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
    },
    periodLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    periodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 44,
    },
    yearDropdownTrigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      flexShrink: 0,
      maxWidth: isMobile ? 160 : 200,
    },
    yearDropdownLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      minWidth: 0,
    },
    monthChipsScroll: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    monthChipsRow: {
      flexDirection: "row",
      flexWrap: "nowrap",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
    },
    monthChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    monthChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "18",
    },
    monthChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    monthChipTextSelected: {
      color: colors.primary,
    },
    instanceChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: spacing.sm,
    },
    sectionCard: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: pad,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    /** Tarjeta del gráfico por instancia: menos aire arriba para subir el chart. */
    sectionCardMetrics: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: pad,
      paddingBottom: pad,
      paddingTop: Math.max(spacing.sm, pad - 10),
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.md,
    },
    sectionTitleMetricsTight: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    centerMessage: {
      padding: spacing.lg,
      alignItems: "center",
    },
    /** Pie de periodo encima del gráfico de barras (Detalle por instancia). */
    barChartPeriodFootnote: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    yearModalRoot: {
      flex: 1,
    },
    yearModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    yearModalCenterWrap: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      pointerEvents: "box-none",
    },
    yearModalSheet: {
      marginHorizontal: isMobile ? spacing.md : spacing.lg * 2,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.background,
      paddingVertical: spacing.sm,
      maxHeight: 360,
      ...shadows.sm,
    },
    yearModalTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    yearModalOption: {
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    yearModalOptionSelected: {
      backgroundColor: colors.surfaceVariant,
    },
    yearModalOptionText: {
      fontSize: 15,
      color: colors.text,
    },
  });
}
