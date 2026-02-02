/**
 * Estilos para formularios de permiso (crear/editar).
 * Usa tokens de ModalLayout y spacing del tema para estandarizar con modales de administración
 * (Roles, Users) y con Crear/Editar Permiso.
 */

import { ModalLayout } from "@/constants/theme";
import { StyleSheet } from "react-native";

export interface PermissionFormTheme {
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  modalLayout: typeof ModalLayout;
  borderRadius: { sm: number; md: number };
}

export const createPermissionFormStyles = (t: PermissionFormTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    loadingText: {
      marginTop: t.spacing.md,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      padding: t.spacing.md,
      gap: t.spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.modalLayout.headerGap,
      marginBottom: t.spacing.sm,
    },
    backButton: {
      padding: t.modalLayout.closeButtonPadding,
    },
    headerTitle: {
      flex: 1,
    },
    title: {
      marginBottom: t.modalLayout.titleSubtitleGap,
    },
    formHeader: {
      marginBottom: t.spacing.md,
    },
    formHeaderTexts: {
      gap: t.spacing.xs,
    },
    formFooter: {
      flexDirection: "row",
      gap: t.modalLayout.footerGap,
      marginTop: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      paddingBottom: t.spacing.md,
    },
    /** Card del formulario: mismo padding que cabecera del modal. */
    formCard: {
      padding: t.modalLayout.headerPadding,
      gap: 20,
    },
    inputGroup: {
      gap: t.spacing.sm,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: t.spacing.md,
      paddingVertical: 12,
      borderRadius: t.borderRadius.md,
      borderWidth: 1,
      gap: t.spacing.sm,
    },
    inputIcon: {
      marginRight: t.spacing.xs,
    },
    input: {
      flex: 1,
      fontSize: 14,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 12,
      paddingBottom: 12,
    },
    errorText: {
      marginTop: t.spacing.xs,
      fontSize: 12,
    },
    selectContainer: {
      borderRadius: t.borderRadius.md,
      borderWidth: 1,
      padding: t.spacing.sm,
      minHeight: 48,
    },
    selectOptions: {
      flexDirection: "row",
      gap: t.spacing.sm,
    },
    selectOption: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderRadius: t.borderRadius.sm,
      borderWidth: 1,
      minHeight: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    switchGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    switchLabel: {
      flex: 1,
    },
    actions: {
      flexDirection: "row",
      gap: t.modalLayout.footerGap,
      marginTop: t.spacing.sm,
    },
    cancelButton: {
      flex: 1,
    },
    submitButton: {
      flex: 1,
    },
  });
