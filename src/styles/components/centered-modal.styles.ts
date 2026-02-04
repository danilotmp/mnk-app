/**
 * Estilos para el modal centrado (CenteredModal).
 * Usa tokens de ModalLayout del tema para estandarizar con modales de administración
 * (Seleccionar Permiso, selector de ítems de menú, etc.).
 */

import { LightTheme, ModalLayout as ModalLayoutType } from "@/constants/theme";
import { Platform, StyleSheet } from "react-native";

export interface CenteredModalTheme {
  colors: (typeof LightTheme)["colors"];
  modalLayout: typeof ModalLayoutType;
}

export const createCenteredModalStyles = (
  { colors, modalLayout }: CenteredModalTheme,
  isMobile: boolean,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      backgroundColor: colors.surfaceVariant ?? colors.surface,
      borderRadius: 16,
      overflow: "hidden",
      ...Platform.select({
        web: {
          boxShadow: `0px 4px 8px ${colors.shadow ?? "#000"}4d`,
        },
        default: {
          shadowColor: colors.shadow ?? "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
      }),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: isMobile
        ? modalLayout.headerPaddingMobile
        : modalLayout.headerPadding,
      paddingVertical: isMobile
        ? modalLayout.headerPaddingMobile
        : modalLayout.headerPadding,
      borderBottomWidth: 1,
      gap: modalLayout.headerGap,
    },
    headerTitle: {
      flex: 1,
    },
    title: {
      marginBottom: modalLayout.titleSubtitleGap,
    },
    closeButton: {
      padding: modalLayout.closeButtonPadding,
      borderRadius: modalLayout.closeButtonBorderRadius,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: isMobile
        ? modalLayout.contentPaddingCenteredMobile
        : modalLayout.contentPaddingCentered,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      padding: isMobile
        ? modalLayout.headerPaddingMobile
        : modalLayout.footerPadding,
      borderTopWidth: 1,
      gap: modalLayout.footerGap,
    },
    /** Contenedor del topAlert (encima del título). */
    topAlertContainer: {
      paddingHorizontal: isMobile
        ? modalLayout.headerPaddingMobile
        : modalLayout.headerPadding,
      paddingTop: isMobile
        ? modalLayout.headerPaddingMobile
        : modalLayout.headerPadding,
    },
  });
