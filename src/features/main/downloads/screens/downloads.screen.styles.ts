/**
 * Estilos de la pantalla de Descargas.
 */

import { StyleSheet, TextStyle, ViewStyle } from "react-native";

export interface DownloadsScreenTheme {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    surface?: string;
  };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  typography: {
    pageTitle: TextStyle;
    pageTitleMobile: TextStyle;
    pageSubtitle: TextStyle;
    pageBody: TextStyle;
    pageBodyMobile: TextStyle;
    h5: TextStyle;
  };
  pageLayout: {
    iconTitle: number;
    iconTitleMobile: number;
    headerTitleGap: number;
    headerTitleGapMobile: number;
    subtitleContentGap: number;
    subtitleContentGapMobile: number;
  };
  borderRadius: { sm: number; md: number; lg: number };
}

export function createDownloadsScreenStyles(
  t: DownloadsScreenTheme,
  isMobile: boolean,
) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
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
      maxWidth: 900,
      alignSelf: "center",
      width: "100%",
      minWidth: 0,
    },
    header: {
      marginBottom: isMobile
        ? t.pageLayout.subtitleContentGapMobile
        : t.pageLayout.subtitleContentGap,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
    },
    headerIconContainer: {
      backgroundColor: t.colors.primary + "18",
      borderRadius: t.borderRadius.lg,
      padding: t.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...t.typography.pageTitle,
      color: t.colors.text,
      marginBottom: t.spacing.xs,
    },
    titleMobile: {
      ...t.typography.pageTitleMobile,
      color: t.colors.text,
      marginBottom: t.spacing.xs,
    },
    subtitle: {
      ...t.typography.pageSubtitle,
      color: t.colors.textSecondary,
      marginTop: t.spacing.xs,
    },
    sectionTitle: {
      ...t.typography.h5,
      color: t.colors.text,
      marginBottom: t.spacing.md,
      marginTop: t.spacing.lg,
    },
    cardsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: t.spacing.md,
      marginTop: t.spacing.sm,
    },
    cardsGridMobile: {
      flexDirection: "column",
      gap: t.spacing.sm,
    },
    downloadCard: {
      flex: 1,
      minWidth: 240,
      maxWidth: 320,
      padding: t.spacing.lg,
      borderRadius: t.borderRadius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    downloadCardMobile: {
      minWidth: "100%",
      maxWidth: "100%",
    },
    downloadCardTitle: {
      ...t.typography.h5,
      color: t.colors.text,
      marginBottom: t.spacing.xs,
    },
    downloadCardDescription: {
      ...t.typography.pageBody,
      color: t.colors.textSecondary,
      marginBottom: t.spacing.md,
    },
    downloadCardDescriptionMobile: {
      ...t.typography.pageBodyMobile,
    },
    downloadButton: {
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.borderRadius.md,
      backgroundColor: t.colors.primary,
      alignSelf: "flex-start",
    },
    downloadButtonDisabled: {
      opacity: 0.6,
    },
    downloadButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 14,
    },
    installersNote: {
      ...t.typography.pageBody,
      color: t.colors.textSecondary,
      marginTop: t.spacing.md,
      fontStyle: "italic",
    },
  });
}
