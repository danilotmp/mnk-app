/**
 * Estilos de la pantalla de inicio.
 * Usa solo tokens globales: typography.pageTitle/pageTitleMobile, pageSubtitle, pageBody, pageLayout, spacing, colors, borderRadius.
 */

import { StyleSheet, TextStyle, ViewStyle } from "react-native";

export interface HomeScreenTheme {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    primaryLight: string;
    border: string;
    surface?: string;
    surfaceVariant?: string;
    shadow?: string;
    pageTitleColor?: string;
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
    body1: { fontSize: number; lineHeight: number };
    body2: { fontSize: number; lineHeight: number };
    h5: { fontSize: number; lineHeight: number; fontWeight: string };
    caption: { fontSize: number; lineHeight: number };
  };
  pageLayout: {
    titleSubtitleGap: number;
    titleSubtitleGapMobile: number;
    headerTitleGap: number;
    headerTitleGapMobile: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

/** Tipado explícito para que View reciba ViewStyle y Text reciba TextStyle. */
export interface HomeScreenStyles {
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  scrollContentMobile: ViewStyle;
  heroContainer: ViewStyle;
  heroContainerMobile: ViewStyle;
  textColumn: ViewStyle;
  textColumnMobile: ViewStyle;
  textColumnDesktop: ViewStyle;
  mainTitleRow: ViewStyle;
  mainTitleRowMobile: ViewStyle;
  mainTitleIconContainer: ViewStyle;
  mainTitleIcon: TextStyle;
  mainTitle: TextStyle;
  mainTitleMobile: TextStyle;
  description: TextStyle;
  descriptionMobile: TextStyle;
  featuresList: ViewStyle;
  featureItem: ViewStyle;
  featureTitle: TextStyle;
  featureDescription: TextStyle;
  featureDescriptionMobile: TextStyle;
  keyPoints: ViewStyle;
  keyPoint: TextStyle;
  keyPointMobile: TextStyle;
  videoColumn: ViewStyle;
  videoColumnMobile: ViewStyle;
  videoColumnDesktop: ViewStyle;
  videoContainer: ViewStyle;
  videoWeb: ViewStyle;
  videoNative: ViewStyle;
  strengthsSection: ViewStyle;
  strengthsSectionMobile: ViewStyle;
  strengthsGrid: ViewStyle;
  strengthsGridMobile: ViewStyle;
  strengthCard: ViewStyle;
  strengthCardMobile: ViewStyle;
  strengthIconWrap: ViewStyle;
  strengthCardTitle: TextStyle;
  strengthCardDescription: TextStyle;
  strengthCardDescriptionMobile: TextStyle;
}

export function createHomeScreenStyles(t: HomeScreenTheme): HomeScreenStyles {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: t.spacing.lg,
      paddingTop: t.pageLayout.headerTitleGap,
      paddingBottom: t.spacing.xxl,
    },
    scrollContentMobile: {
      paddingTop: t.pageLayout.headerTitleGapMobile,
      paddingBottom: t.spacing.md,
    },
    heroContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      maxWidth: 1400,
      alignSelf: "center",
      width: "100%",
      gap: t.spacing.lg,
    },
    heroContainerMobile: {
      flexDirection: "column",
      alignItems: "stretch",
    },
    textColumn: {
      flex: 1,
      paddingRight: t.spacing.lg,
    },
    textColumnMobile: {
      paddingRight: 0,
      marginBottom: t.spacing.xl,
    },
    textColumnDesktop: {
      maxWidth: 600,
    },
    mainTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: t.spacing.sm,
      marginBottom: t.pageLayout.titleSubtitleGap,
    },
    mainTitleRowMobile: {
      marginBottom: t.pageLayout.titleSubtitleGapMobile,
    },
    mainTitleIconContainer: {
      backgroundColor: "rgba(0, 135, 255, 0.09)", // Color más tenue del icono
      borderRadius: t.borderRadius.lg,
      padding: t.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    mainTitleIcon: {
      flexShrink: 0,
    },
    mainTitle: {
      marginBottom: 0,
      textAlign: "justify",
      flex: 1,
      ...t.typography.pageTitle,
      color: t.colors.pageTitleColor ?? t.colors.text,
    },
    mainTitleMobile: {
      marginBottom: 0,
      textAlign: "justify",
      ...t.typography.pageTitleMobile,
      color: t.colors.pageTitleColor ?? t.colors.text,
    },
    description: {
      ...(t.typography.pageSubtitle as TextStyle),
      marginBottom: t.pageLayout.subtitleContentGap,
      textAlign: "justify",
    },
    descriptionMobile: {
      ...(t.typography.pageSubtitleMobile as TextStyle),
      marginBottom: t.pageLayout.subtitleContentGapMobile,
      textAlign: "justify",
    },
    featuresList: {
      marginBottom: t.spacing.xl,
    },
    featureItem: {
      marginBottom: t.spacing.lg,
    },
    featureTitle: {
      ...(t.typography.h5 as TextStyle),
    },
    featureDescription: {
      ...(t.typography.pageBody as TextStyle),
      textAlign: "justify",
    },
    featureDescriptionMobile: {
      ...(t.typography.pageBodyMobile as TextStyle),
      textAlign: "justify",
    },
    keyPoints: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: t.spacing.md,
    },
    keyPoint: {
      ...(t.typography.pageBody as TextStyle),
    },
    keyPointMobile: {
      ...(t.typography.pageBodyMobile as TextStyle),
    },
    videoColumn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    videoColumnMobile: {
      width: "100%",
      marginTop: t.spacing.lg,
      marginBottom: t.spacing.xl,
    },
    videoColumnDesktop: {
      maxWidth: 600,
    },
    videoContainer: {
      width: "100%",
      maxWidth: 624,
      borderRadius: t.borderRadius.xl,
      overflow: "hidden",
      backgroundColor: t.colors.surface,
      shadowColor: t.colors.shadow ?? "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    videoWeb: {
      width: "100%",
      height: "auto",
    },
    videoNative: {
      width: "100%",
      aspectRatio: 624 / 480,
    },
    strengthsSection: {
      maxWidth: 1400,
      alignSelf: "center",
      width: "100%",
      marginTop: t.spacing.xxl,
      paddingTop: t.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    strengthsSectionMobile: {
      marginTop: t.spacing.md,
      paddingTop: t.spacing.sm,
    },
    strengthsGrid: {
      flexDirection: "row",
      flexWrap: "nowrap",
      gap: t.spacing.md,
    },
    strengthsGridMobile: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: t.spacing.sm,
      width: "100%",
    },
    strengthCard: {
      flex: 1,
      minWidth: 0,
      padding: t.spacing.md,
      borderRadius: t.borderRadius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: "flex-start",
    },
    strengthCardMobile: {
      flex: 1,
      minWidth: "47%",
    },
    strengthIconWrap: {
      width: 48,
      height: 48,
      borderRadius: t.borderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: t.spacing.sm,
    },
    strengthCardTitle: {
      ...(t.typography.h5 as TextStyle),
      marginBottom: 6,
    },
    strengthCardDescription: {
      ...(t.typography.pageBody as TextStyle),
      textAlign: "left",
    },
    strengthCardDescriptionMobile: {
      ...(t.typography.pageBodyMobile as TextStyle),
      textAlign: "left",
    },
  }) as HomeScreenStyles;
}
