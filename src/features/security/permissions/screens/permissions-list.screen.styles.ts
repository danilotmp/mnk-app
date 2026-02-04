/**
 * Estilos de la pantalla de lista de permisos (Security > Permissions).
 * Usa solo tokens globales: typography.pageTitle/pageSubtitle, pageLayout, spacing, colors, borderRadius.
 * Estandarizado igual que Users y Roles.
 */

import { StyleSheet, TextStyle, ViewStyle } from "react-native";

export interface PermissionsListScreenTheme {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    primaryLight: string;
    border: string;
    surface: string;
    surfaceVariant?: string;
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

export interface PermissionsListScreenStyles {
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
  selectorsContainer: ViewStyle;
  actionsContainer: ViewStyle;
  actionButton: ViewStyle;
  dataTableContainer: ViewStyle;
  footer: ViewStyle;
}

export function createPermissionsListScreenStyles(
  t: PermissionsListScreenTheme,
  isMobile: boolean,
): PermissionsListScreenStyles {
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
    headerIconContainer: {
      backgroundColor: "rgba(0, 135, 255, 0.09)", // Color más tenue del icono
      borderRadius: t.borderRadius.lg,
      padding: t.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    headerIcon: {
      flexShrink: 0,
    },
    title: {
      ...(t.typography.pageTitle as TextStyle),
      marginBottom: t.spacing.xs,
      color: t.colors.pageTitleColor ?? t.colors.text,
    },
    titleMobile: {
      ...(t.typography.pageTitleMobile as TextStyle),
      marginBottom: t.spacing.xs,
      color: t.colors.pageTitleColor ?? t.colors.text,
    },
    subtitle: {
      ...(t.typography.pageSubtitle as TextStyle),
      color: t.colors.textSecondary,
      paddingLeft: isMobile
        ? t.pageLayout.iconTitleMobile + t.spacing.sm + t.spacing.sm + t.spacing.sm
        : t.pageLayout.iconTitle + t.spacing.sm + t.spacing.sm + t.spacing.sm,
    },
    selectorsContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      flexShrink: 0,
      gap: t.spacing.md,
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
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      borderTopWidth: 1,
      flexShrink: 0,
    },
  }) as PermissionsListScreenStyles;
}
