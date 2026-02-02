/**
 * Estilos para el modal lateral (SideModal).
 * Usa tokens de ModalLayout del tema para estandarizar modales de administración
 * (Create User, Edit User, Roles, etc.).
 */

import { LightTheme, ModalLayout as ModalLayoutType } from "@/constants/theme";
import { Platform, StyleSheet } from "react-native";

export interface SideModalTheme {
  colors: (typeof LightTheme)["colors"];
  modalLayout: typeof ModalLayoutType;
}

export const createSideModalStyles = (
  { colors, modalLayout }: SideModalTheme,
  isMobile: boolean = false,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
      alignItems: "flex-end",
    },
    modalContainer: {
      backgroundColor: colors.surfaceVariant || colors.surface || "#1E293B", // Usar surfaceVariant en modo dark para evitar transparencia
      ...Platform.select({
        web: {
          boxShadow: "-2px 0px 10px rgba(0, 0, 0, 0.25)",
        },
        default: {
          shadowColor: "#000",
          shadowOffset: {
            width: -2,
            height: 0,
          },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 10,
        },
      }),
      // Bordes redondeados siempre en el lado izquierdo
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      overflow: "hidden",
      flexDirection: "column", // Para que header, content y footer se apilen verticalmente
    },
    /** Cabecera con título y subtítulo. Padding estándar de modales de administración. */
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: isMobile
        ? modalLayout.headerPaddingMobile
        : modalLayout.headerPadding,
      borderBottomWidth: 1,
      gap: modalLayout.headerGap,
      flexShrink: 0,
    },
    headerTitle: {
      flex: 1,
    },
    /** Título del modal (ej. "Create User"). Tamaño correcto en web y smartphone. */
    title: {
      marginBottom: modalLayout.titleSubtitleGap,
    },
    closeButton: {
      padding: modalLayout.closeButtonPadding,
      borderRadius: modalLayout.closeButtonBorderRadius,
    },
    scrollView: {
      flex: 1,
    },
    /** Área de contenido: mismo padding estándar en Users y Roles (Create/Edit). */
    scrollContent: {
      padding: isMobile
        ? modalLayout.contentPaddingMobile
        : modalLayout.contentPadding,
      paddingBottom: isMobile
        ? modalLayout.contentPaddingMobile
        : modalLayout.contentPadding,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      padding: modalLayout.footerPadding,
      borderTopWidth: 1,
      gap: modalLayout.footerGap,
      flexShrink: 0,
    },
  });
