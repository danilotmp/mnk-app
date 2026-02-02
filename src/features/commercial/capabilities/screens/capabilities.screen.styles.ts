/**
 * Estilos de la pantalla de Productos (Capabilities).
 * Usa solo tokens globales: typography.pageTitle/pageSubtitle/pageBody, pageLayout, spacing, colors, borderRadius.
 * Estandarizado igual que Home.
 */

import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from "react-native";

export interface CapabilitiesScreenTheme {
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
    h5: { fontSize: number; lineHeight: number; fontWeight: string };
  };
  pageLayout: {
    titleSubtitleGap: number;
    titleSubtitleGapMobile: number;
    subtitleContentGap: number;
    subtitleContentGapMobile: number;
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

export interface CapabilitiesScreenStyles {
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  scrollContentMobile: ViewStyle;
  contentWrapper: ViewStyle;
  header: ViewStyle;
  headerMobile: ViewStyle;
  titleRow: ViewStyle;
  titleIcon: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  productsGrid: ViewStyle;
  productsGridMobile: ViewStyle;
  productCard: ViewStyle;
  productCardMobile: ViewStyle;
  productCardDisabled: ViewStyle;
  cardImageContainer: ViewStyle;
  cardImageContainerMobile: ViewStyle;
  cardImage: ImageStyle;
  iconContainer: ViewStyle;
  cardContent: ViewStyle;
  cardTitle: TextStyle;
  cardTitleMobile: TextStyle;
  cardDescription: TextStyle;
  cardFooter: ViewStyle;
  badge: ViewStyle;
  conceptsSection: ViewStyle;
  conceptsSectionMobile: ViewStyle;
  conceptsGrid: ViewStyle;
  conceptsGridMobile: ViewStyle;
  conceptCard: ViewStyle;
  conceptCardMobile: ViewStyle;
  conceptVisual: ViewStyle;
  conceptTitle: TextStyle;
  conceptDescription: TextStyle;
  processStepsRow: ViewStyle;
  processStepNode: ViewStyle;
  processStepLine: ViewStyle;
  flexWaveRow: ViewStyle;
  flexWaveBar: ViewStyle;
  coupleRow: ViewStyle;
  coupleNode: ViewStyle;
  coupleLineWrap: ViewStyle;
  coupleLineBase: ViewStyle;
  coupleLineGlow: ViewStyle;
}

export function createCapabilitiesScreenStyles(
  t: CapabilitiesScreenTheme,
  isMobile: boolean,
): CapabilitiesScreenStyles {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.pageLayout.headerTitleGap,
      paddingBottom: t.spacing.xxl,
    },
    scrollContentMobile: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.pageLayout.headerTitleGapMobile,
      paddingBottom: t.spacing.md,
    },
    contentWrapper: {
      maxWidth: 1400,
      alignSelf: "center",
      width: "100%",
    },
    header: {
      marginBottom: t.pageLayout.subtitleContentGap,
      gap: t.spacing.sm,
    },
    headerMobile: {
      marginBottom: t.pageLayout.subtitleContentGapMobile,
      gap: t.spacing.xs,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
    },
    titleIcon: {
      flexShrink: 0,
    },
    title: {
      marginBottom: t.spacing.xs,
    },
    subtitle: {
      marginTop: t.spacing.xs,
      paddingLeft: isMobile
        ? t.pageLayout.iconTitleMobile + t.spacing.sm
        : t.pageLayout.iconTitle + t.spacing.sm,
    },
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: t.spacing.md,
      marginBottom: t.spacing.lg,
    },
    productsGridMobile: {
      gap: t.spacing.sm,
      marginBottom: t.spacing.md,
      alignItems: "center",
    },
    productCard: {
      padding: t.spacing.lg,
      gap: t.spacing.md,
    },
    productCardMobile: {
      padding: t.spacing.sm,
      gap: t.spacing.sm,
    },
    productCardDisabled: {
      opacity: 0.6,
    },
    cardImageContainer: {
      width: "100%",
      height: 160,
      borderRadius: t.borderRadius.md,
      overflow: "hidden",
      marginBottom: t.spacing.sm,
    },
    cardImageContainerMobile: {
      height: 140,
      borderRadius: t.borderRadius.sm,
      marginBottom: t.spacing.xs,
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    iconContainer: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: t.borderRadius.md,
    },
    cardContent: {
      gap: t.spacing.sm,
    },
    cardTitle: {
      marginBottom: t.spacing.xs,
    },
    cardTitleMobile: {
      marginBottom: t.spacing.xs,
    },
    cardDescription: {
      marginBottom: t.spacing.sm,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: t.spacing.sm,
    },
    badge: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.borderRadius.md,
    },
    conceptsSection: {
      maxWidth: 1400,
      alignSelf: "center",
      width: "100%",
      marginTop: t.spacing.xxl,
      paddingTop: t.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    conceptsSectionMobile: {
      marginTop: t.spacing.md,
      paddingTop: t.spacing.sm,
    },
    conceptsGrid: {
      flexDirection: "row",
      flexWrap: "nowrap",
      gap: t.spacing.md,
    },
    conceptsGridMobile: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: t.spacing.sm,
      width: "100%",
    },
    conceptCard: {
      flex: 1,
      minWidth: 0,
      padding: t.spacing.md,
      borderRadius: t.borderRadius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: "center",
    },
    conceptCardMobile: {
      flex: 1,
      minWidth: "47%",
    },
    conceptVisual: {
      width: "100%",
      height: 56,
      marginBottom: t.spacing.sm,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    processStepsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: t.spacing.xs,
    },
    processStepNode: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    processStepLine: {
      width: 20,
      height: 3,
      borderRadius: 2,
    },
    flexWaveRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 10,
      height: 40,
    },
    flexWaveBar: {
      width: 10,
      height: 24,
      borderRadius: 5,
    },
    coupleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    coupleNode: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
    coupleLineWrap: {
      width: 36,
      height: 4,
      position: "relative" as const,
      justifyContent: "center",
    },
    coupleLineBase: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      height: 3,
      borderRadius: 2,
    },
    coupleLineGlow: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      height: 3,
      borderRadius: 2,
    },
    conceptTitle: {
      ...(t.typography.h5 as TextStyle),
      marginBottom: 6,
      textAlign: "center",
    },
    conceptDescription: {
      textAlign: "center",
    },
  }) as CapabilitiesScreenStyles;
}
