/**
 * Estilos para formularios de sucursal (crear/editar).
 * Usa tokens de ModalLayout y spacing del tema para estandarizar con modales de administración
 * (Roles, Users, Permissions, Companies).
 */

import { ModalLayout } from "@/constants/theme";
import { StyleSheet } from "react-native";

export interface BranchFormTheme {
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  modalLayout: typeof ModalLayout;
  borderRadius: { sm: number; md: number };
}

export const createBranchFormStyles = (t: BranchFormTheme) =>
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
    headerTitle: {
      flex: 1,
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
      gap: 18,
    },
    inputGroup: {
      gap: t.spacing.sm,
    },
    inlineInputs: {
      flexDirection: "row",
      gap: t.spacing.md,
    },
    inlineInput: {
      flex: 1,
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
      minHeight: 96,
      paddingTop: 12,
      paddingBottom: 12,
    },
    selectContainer: {
      borderRadius: t.borderRadius.md,
      borderWidth: 1,
      padding: t.spacing.sm,
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
      gap: t.spacing.xs,
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
    errorText: {
      marginTop: t.spacing.xs,
      fontSize: 12,
    },
  });
