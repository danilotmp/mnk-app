/**
 * Estilos del componente WhatsAppConnectionLayer.
 * Patrón: component-name.styles.ts — estilos separados del JSX.
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  formContainer: {
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 16,
  },
  tableContainer: {
    marginTop: 24,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
  },
  qrBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  n8nCell: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  /** Icono + etiqueta compacta; padding suficiente para área táctil */
  flowDownloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: "100%",
  },
  flowDownloadButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalContent: {
    padding: 20,
    gap: 20,
    width: "100%",
    alignSelf: "stretch",
  },
  inputGroup: {
    gap: 8,
    width: "100%",
    alignSelf: "stretch",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
  },
  modalFooterActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  estadoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 24,
    marginBottom: 16,
  },
  estadoLabel: {
    fontWeight: "600",
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  qrInstructions: {
    lineHeight: 20,
    textAlign: "left",
  },
  qrImageContainer: {
    alignSelf: "center",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  continueButtonContainer: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  continueButton: {
    width: "100%",
  },
  skipButton: {
    width: "100%",
  },
});
