/**
 * Estilos del Wizard de Configuración Comercial (Commercial Setup).
 * Usa solo tokens globales: typography.pageTitle/pageSubtitle/pageBody, pageLayout, spacing, colors, borderRadius.
 * Estandarizado igual que Home, Capabilities y Contact.
 */

import { StyleSheet, TextStyle, ViewStyle } from "react-native";

export interface CommercialSetupScreenTheme {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    pageTitle: { fontSize: number; lineHeight: number; fontWeight: string };
    pageTitleMobile: {
      fontSize: number;
      lineHeight: number;
      fontWeight: string;
    };
    pageSubtitle: { fontSize: number; lineHeight: number };
    pageSubtitleMobile: { fontSize: number; lineHeight: number };
    pageBody: { fontSize: number; lineHeight: number };
    pageBodyMobile: { fontSize: number; lineHeight: number };
  };
  pageLayout: {
    headerTitleGap: number;
    headerTitleGapMobile: number;
    subtitleContentGap: number;
    subtitleContentGapMobile: number;
    iconTitle: number;
    iconTitleMobile: number;
    iconSubtitle: number;
    iconSubtitleMobile: number;
    titleSubtitleGap: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface CommercialSetupScreenStyles {
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  scrollContentMobile: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerContent: ViewStyle;
  titleRow: ViewStyle;
  titleIcon: ViewStyle;
  title: TextStyle;
  titleMobile: TextStyle;
  subtitle: TextStyle;
  stepperCard: ViewStyle;
  contentCard: ViewStyle;
  contentHeaderRow: ViewStyle;
  contentHeaderRowMobile: ViewStyle;
  contentHeaderRowNoMargin: ViewStyle;
  contentHeaderCol: ViewStyle;
  /** Subtítulo de la capa actual en el wizard (ej. "Contexto Institucional", "Ofertas"). */
  layerSubtitle: TextStyle;
  layerSubtitleMobile: TextStyle;
  contentDescription: TextStyle;
  descriptionBlock: TextStyle;
  filterWrapper: ViewStyle;
  filterWrapperMobile: ViewStyle;
  buttonWrapper: ViewStyle;
  buttonWrapperMobile: ViewStyle;
  layerContent: ViewStyle;
  layerContentNoPadding: ViewStyle;
  infoCard: ViewStyle;
  infoContent: ViewStyle;
  infoText: ViewStyle;
  infoTitle: TextStyle;
}

export function createCommercialSetupScreenStyles(
  t: CommercialSetupScreenTheme,
  isMobile: boolean,
): CommercialSetupScreenStyles {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: t.spacing.md,
      paddingTop: t.pageLayout.headerTitleGap,
      paddingBottom: t.spacing.xl,
    },
    scrollContentMobile: {
      paddingTop: t.pageLayout.headerTitleGapMobile,
      paddingBottom: t.spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: t.pageLayout.subtitleContentGap,
      gap: t.spacing.sm,
    },
    backButton: {
      padding: t.spacing.sm,
      marginTop: -t.spacing.sm,
      marginLeft: -t.spacing.sm,
    },
    headerContent: {
      flex: 1,
      // Mismo estándar que Administración de Usuarios: espacio título–subtítulo vía title marginBottom
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
    },
    titleIcon: {
      marginRight: 0,
    },
    title: {
      ...(t.typography.pageTitle as TextStyle),
      marginBottom: t.spacing.xs,
    },
    titleMobile: {
      ...(t.typography.pageTitleMobile as TextStyle),
      marginBottom: t.spacing.xs,
    },
    subtitle: {
      ...(t.typography.pageSubtitle as TextStyle),
      color: t.colors.textSecondary,
      paddingLeft: isMobile
        ? t.pageLayout.iconTitleMobile + t.spacing.sm
        : t.pageLayout.iconTitle + t.spacing.sm,
    },
    stepperCard: {
      padding: t.spacing.md,
      marginBottom: 0,
    },
    contentCard: {
      padding: t.spacing.lg,
      marginBottom: t.spacing.md,
      gap: t.spacing.md,
    },
    contentHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: t.spacing.md,
      gap: 0,
    },
    contentHeaderRowMobile: {
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: t.spacing.md,
      gap: t.spacing.md,
    },
    contentHeaderRowNoMargin: {
      marginBottom: 0,
    },
    contentHeaderCol: {
      flex: 1,
      alignItems: "flex-start",
    },
    /** Subtítulo del wizard en web: nombre de la capa (Contexto Institucional, Ofertas, etc.). Más grande en desktop. */
    layerSubtitle: {
      ...(t.typography.pageSubtitle as TextStyle),
      fontSize: 22,
      lineHeight: 30,
      fontWeight: "600",
      marginBottom: 0,
    },
    /** Subtítulo del wizard en móvil: más grande para legibilidad. */
    layerSubtitleMobile: {
      ...(t.typography.pageSubtitleMobile as TextStyle),
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      marginBottom: 0,
    },
    contentDescription: {
      ...(t.typography.pageBody as TextStyle),
      marginTop: t.pageLayout.titleSubtitleGap ?? t.spacing.lg,
      marginBottom: t.spacing.md,
      color: t.colors.textSecondary,
    },
    descriptionBlock: {
      marginTop: t.spacing.sm,
    },
    filterWrapper: {
      flex: 1,
      marginLeft: t.spacing.md,
      maxWidth: 400,
    },
    filterWrapperMobile: {
      marginLeft: 0,
      marginTop: 0,
      maxWidth: "100%",
      width: "100%",
    },
    buttonWrapper: {
      flex: 0,
      marginLeft: t.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 220,
    },
    buttonWrapperMobile: {
      marginLeft: 0,
      marginTop: 0,
      alignItems: "stretch",
      justifyContent: "center",
      minWidth: "100%",
      width: "100%",
    },
    layerContent: {
      minHeight: 200,
    },
    layerContentNoPadding: {
      paddingTop: 0,
      marginTop: 0,
    },
    infoCard: {
      padding: t.spacing.md,
    },
    infoContent: {
      flexDirection: "row",
      gap: t.spacing.sm,
    },
    infoText: {
      flex: 1,
      gap: t.spacing.xs,
    },
    infoTitle: {
      ...(t.typography.pageBody as TextStyle),
      fontWeight: "600",
      marginBottom: t.spacing.xs,
    },
  }) as CommercialSetupScreenStyles;
}
