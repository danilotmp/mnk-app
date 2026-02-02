/**
 * Estilos de la pantalla de lista de empresas (Security > Companies).
 * Usa solo tokens globales: typography.pageTitle/pageSubtitle, pageLayout, spacing, colors, borderRadius.
 * Estandarizado igual que Users, Roles, Permissions.
 */

import { StyleSheet, TextStyle, ViewStyle } from "react-native";

export interface CompaniesListScreenTheme {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    surface: string;
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
  };
  pageLayout: {
    headerTitleGap: number;
    headerTitleGapMobile: number;
    subtitleContentGap: number;
    subtitleContentGapMobile: number;
    iconTitle: number;
    iconTitleMobile: number;
    iconSubtitle: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface CompaniesListScreenStyles {
  container: ViewStyle;
  content: ViewStyle;
  contentMobile: ViewStyle;
  header: ViewStyle;
  headerTitle: ViewStyle;
  headerRow: ViewStyle;
  headerIcon: ViewStyle;
  title: TextStyle;
  titleMobile: TextStyle;
  subtitle: TextStyle;
  statusBadge: ViewStyle;
  actionsContainer: ViewStyle;
  actionButton: ViewStyle;
  dataTableContainer: ViewStyle;
}

export function createCompaniesListScreenStyles(
  t: CompaniesListScreenTheme,
  isMobile: boolean,
): CompaniesListScreenStyles {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: t.spacing.md,
      paddingTop: t.pageLayout.headerTitleGap,
      paddingBottom: t.spacing.md,
      gap: t.spacing.md,
      minHeight: 0,
    },
    contentMobile: {
      paddingTop: t.pageLayout.headerTitleGapMobile,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: t.spacing.md,
      flexShrink: 0,
      marginBottom: isMobile
        ? t.pageLayout.subtitleContentGapMobile
        : t.pageLayout.subtitleContentGap,
    },
    headerTitle: {
      flex: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
    },
    headerIcon: {
      flexShrink: 0,
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
    statusBadge: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: 12,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: isMobile ? t.spacing.xs : t.spacing.sm,
      alignItems: "center",
    },
    actionButton: {
      padding: t.spacing.sm,
      borderRadius: t.borderRadius.sm,
    },
    dataTableContainer: {
      width: "100%",
      flex: 1,
      minHeight: 0,
    },
  }) as CompaniesListScreenStyles;
}
