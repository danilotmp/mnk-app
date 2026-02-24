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
  modalContent: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
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
