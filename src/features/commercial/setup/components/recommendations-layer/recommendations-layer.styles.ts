/**
 * Estilos del componente RecommendationsLayer (Capa Recomendaciones).
 * Patrón: component-name.styles.ts — estilos separados del JSX.
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  alert: {
    marginBottom: 16,
  },
  formContainer: {
    gap: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  sectionCard: {
    padding: 0,
    paddingBottom: 20,
    //gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
  },
  listContainer: {
    gap: 12,
    marginTop: 8,
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recommendationType: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recommendationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relatedOffering: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  badgeActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusOptionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButton: {
    padding: 4,
    marginLeft: 8,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  formCard: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
  },
  radioGroupContainer: {
    marginTop: 8,
  },
  radioGroupRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  radioOptionHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabelHorizontal: {
    marginLeft: 12,
    flex: 1,
  },
  selectContainer: {
    gap: 8,
    marginTop: 8,
  },
  selectOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
  },
  textArea: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  switchRow: {
    marginTop: 8,
  },
  addButton: {
    marginTop: 8,
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
  imageOverlayButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageOverlayRow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  imagePlaceholder: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  imagePlaceholderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  formImageOffersWrap: {
    flex: 1,
    minWidth: 220,
  },
  formRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 20,
    marginTop: 20,
    width: "100%",
  },
  formRowWrapInline: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 20,
    marginTop: 20,
  },
});
