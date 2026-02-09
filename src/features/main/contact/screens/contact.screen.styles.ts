/**
 * Estilos de la pantalla de Contacto (Contact).
 * Usa solo tokens globales: typography.pageTitle/pageSubtitle/pageBody, pageLayout, spacing, colors, borderRadius.
 * Estandarizado igual que Home y Capabilities.
 */

import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from "react-native";

export interface ContactScreenTheme {
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
    pageBody: { fontSize: number; lineHeight: number };
    pageBodyMobile: { fontSize: number; lineHeight: number };
    h4: { fontSize: number; lineHeight: number; fontWeight: string };
  };
  pageLayout: {
    titleSubtitleGap: number;
    titleSubtitleGapMobile: number;
    subtitleContentGap: number;
    subtitleContentGapMobile: number;
    headerTitleGap: number;
    headerTitleGapMobile: number;
    iconTitle: number;
    iconTitleMobile: number;
    iconSubtitle: number;
    iconSubtitleMobile: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface ContactScreenStyles {
  container: ViewStyle;
  scrollContent: ViewStyle;
  scrollContentMobile: ViewStyle;
  contactSection: ViewStyle;
  twoColumns: ViewStyle;
  twoColumnsMobile: ViewStyle;
  leftColumn: ViewStyle;
  headerSection: ViewStyle;
  headerRow: ViewStyle;
  headerIconContainer: ViewStyle;
  headerIcon: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  matrixCardWrapper: ViewStyle;
  matrixCardWrapperMobile: ViewStyle;
  matrixIconBlock: ViewStyle;
  matrixCardContent: ViewStyle;
  matrixTitleRow: ViewStyle;
  matrixTitleSpacer: ViewStyle;
  locationName: TextStyle;
  matrixRow: ViewStyle;
  matrixRowFirst: ViewStyle;
  matrixRowRight: ViewStyle;
  contactText: TextStyle;
  contactTextRight: TextStyle;
  mapCardWrapper: ViewStyle;
  mapCardWrapperMobile: ViewStyle;
  mapContainer: ViewStyle;
  mapContainerMobile: ViewStyle;
  mapWebView: ImageStyle;
  commSection: ViewStyle;
  commSectionMobile: ViewStyle;
  commSectionTitle: TextStyle;
  commGrid: ViewStyle;
  commGridMobile: ViewStyle;
  commCard: ViewStyle;
  commVisual: ViewStyle;
  llamadasRow: ViewStyle;
  llamadasWave: ViewStyle;
  emailEnvelope: ViewStyle;
  emailFlap: ViewStyle;
  emailLetter: ViewStyle;
  mapaPin: ViewStyle;
  mapaPinPoint: ViewStyle;
  mapaPinHead: ViewStyle;
  commCardTitle: TextStyle;
  commCardDesc: TextStyle;
}

export function createContactScreenStyles(
  t: ContactScreenTheme,
  isMobile: boolean,
): ContactScreenStyles {
  return StyleSheet.create({
    container: {
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
    contactSection: {
      padding: t.spacing.lg,
      marginBottom: t.spacing.lg,
      maxWidth: 1400,
      alignSelf: "center",
      width: "100%",
    },
    twoColumns: {
      flexDirection: "row",
      gap: t.spacing.lg,
      alignItems: "flex-start",
    },
    twoColumnsMobile: {
      flexDirection: "column",
      gap: t.spacing.lg,
    },
    leftColumn: {
      flex: 1,
    },
    headerSection: {
      alignItems: "flex-start",
      marginBottom: t.pageLayout.subtitleContentGap,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: t.spacing.sm,
      flexWrap: "nowrap",
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
      marginTop: 0,
      marginBottom: 0,
      textAlign: "left",
      flex: 1,
      color: t.colors.pageTitleColor ?? t.colors.text,
    },
    subtitle: {
      marginTop: t.spacing.sm,
      textAlign: "left",
      paddingLeft: isMobile
        ? t.pageLayout.iconTitleMobile + t.spacing.sm + t.spacing.sm + t.spacing.sm
        : t.pageLayout.iconTitle + t.spacing.sm + t.spacing.sm + t.spacing.sm,
    },
    matrixCardWrapper: {
      width: "70%",
      alignSelf: "flex-start",
      marginTop: t.spacing.xl + t.spacing.md, // 45px
      borderRadius: t.borderRadius.xl,
      paddingTop: t.spacing.xl,
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.lg,
      minHeight: 140,
      position: "relative",
      shadowColor: t.colors.shadow ?? "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    matrixCardWrapperMobile: {
      width: "100%",
    },
    matrixIconBlock: {
      position: "absolute",
      top: -14,
      left: t.spacing.lg,
      width: 56,
      height: 56,
      borderRadius: t.borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    matrixCardContent: {
      gap: t.spacing.sm,
    },
    matrixTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: -33,
      gap: t.spacing.sm,
    },
    matrixTitleSpacer: {
      width: 56,
      flexShrink: 0,
    },
    locationName: {
      marginTop: 0,
      marginBottom: t.spacing.xs,
    },
    matrixRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    matrixRowFirst: {
      marginTop: t.spacing.md,
    },
    matrixRowRight: {
      alignSelf: "stretch",
      justifyContent: "flex-end",
    },
    contactText: {
      flex: 1,
    },
    contactTextRight: {
      textAlign: "right",
    },
    mapCardWrapper: {
      width: 624,
      borderRadius: t.borderRadius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: "hidden",
      shadowColor: t.colors.shadow ?? "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
    },
    mapCardWrapperMobile: {
      width: "100%",
    },
    mapContainer: {
      width: "100%",
      height: 400,
      minHeight: 400,
      borderRadius: t.borderRadius.xl,
      overflow: "hidden",
      backgroundColor: t.colors.borderLight ?? t.colors.surface,
    },
    mapContainerMobile: {
      height: 280,
      minHeight: 280,
    },
    mapWebView: {
      width: "100%",
      height: "100%",
    },
    commSection: {
      maxWidth: 1400,
      alignSelf: "center",
      width: "100%",
      marginTop: t.spacing.xl,
      paddingTop: t.spacing.lg + t.spacing.xs, // 28px
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.xl + t.spacing.md, // 40px
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    commSectionMobile: {
      marginTop: t.spacing.lg,
      paddingTop: t.spacing.lg,
      paddingHorizontal: t.spacing.md,
    },
    commSectionTitle: {
      marginBottom: t.spacing.lg,
      textAlign: "center",
      fontWeight: "600",
    },
    commGrid: {
      flexDirection: "row",
      flexWrap: "nowrap",
      gap: t.spacing.md,
    },
    commGridMobile: {
      flexWrap: "wrap",
      gap: t.spacing.sm,
    },
    commCard: {
      flex: 1,
      minWidth: 0,
      padding: t.spacing.md,
      borderRadius: t.borderRadius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: "center",
    },
    commVisual: {
      width: "100%",
      height: 52,
      marginBottom: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    llamadasRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
    },
    llamadasWave: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    emailEnvelope: {
      width: 44,
      height: 32,
      borderWidth: 1,
      borderTopWidth: 0,
      borderRadius: t.borderRadius.xs,
      position: "relative",
      overflow: "hidden",
    },
    emailFlap: {
      position: "absolute",
      top: -1,
      left: -1,
      width: 0,
      height: 0,
      borderLeftWidth: 23,
      borderRightWidth: 23,
      borderBottomWidth: 14,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
    },
    emailLetter: {
      position: "absolute",
      left: t.spacing.sm,
      top: t.spacing.xs,
      width: 26,
      height: 10,
      borderRadius: 2,
    },
    mapaPin: {
      alignItems: "center",
    },
    mapaPinPoint: {
      width: 0,
      height: 0,
      marginTop: -2,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 12,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
    },
    mapaPinHead: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    commCardTitle: {
      marginBottom: t.spacing.xs,
      fontWeight: "600",
      textAlign: "center",
    },
    commCardDesc: {
      textAlign: "center",
    },
  }) as ContactScreenStyles;
}
