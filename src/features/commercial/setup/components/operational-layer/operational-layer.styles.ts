/**
 * Estilos del componente OperationalLayer (Capa Ofertas).
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
  /** Mensaje bajo el spinner en estado de carga */
  loadingMessage: {
    marginTop: 16,
  },
  /** Contador "X registros" en la barra de descripción de la sección */
  sectionRecordsCount: {
    fontWeight: "600",
  },
  /** Título del precio en el modal de precios (moneda + monto) */
  priceModalTitle: {
    fontWeight: "600",
  },
  /** Input de archivo oculto (carga masiva web) */
  hiddenInput: {
    display: "none",
  },
  formContainer: {
    gap: 20,
  },
  sectionCard: {
    padding: 0,
    paddingBottom: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
  },
  sectionDescriptionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sectionDescription: {
    lineHeight: 20,
    flex: 1,
  },
  paginatedListContainer: {
    marginTop: 8,
    minHeight: 400,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: "column",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  /** Fila nombre+estado que cubre todo el ancho */
  listItemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 6,
  },
  /** Fila inferior: detalle a la izquierda, precio a la derecha */
  listItemDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  listItemDetailRowMobile: {
    flexDirection: "column",
    gap: 8,
  },
  listItemMobile: {
    alignItems: "flex-start",
  },
  listItemContent: {
    flex: 1,
  },
  /** Icono de tipo (producto/servicio) en la fila de oferta */
  listItemTypeIcon: {
    marginRight: 12,
  },
  /** Espacio a la izquierda del texto secundario en fila (ej. junto a icono) */
  listItemCaptionSpacer: {
    marginLeft: 8,
  },
  /** Márgenes horizontales del contenido del formulario expandido (fila de imagen + campos) */
  expandableFormRowMargins: {
    marginLeft: 20,
    marginRight: 20,
  },
  expandableFormRowMarginsMobile: {
    marginLeft: 10,
    marginRight: 10,
  },
  /** Contenedor con hijos alineados al final */
  alignEnd: {
    alignItems: "flex-end",
  },
  propertiesChipsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingRight: 8,
  },
  propertyChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 180,
  },
  propertyChipMore: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "600",
  },
  listItemContentMobile: {
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  listItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-end",
  },
  listItemRightMobile: {
    alignSelf: "flex-end",
  },
  formCard: {
    padding: 16,
    marginTop: 8,
    gap: 16,
  },
  accordionCard: {
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 16,
  },
  accordionCardMobile: {
    paddingHorizontal: 8,
  },
  saveAllContainer: {
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 12,
  },
  saveAllButton: {
    flex: 1,
  },
  cancelAllButton: {
    flex: 1,
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
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
    minHeight: 160,
  },
  textArea: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  rowContainerMobile: {
    flexDirection: "column",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
    minWidth: 0,
  },
  halfWidthMobile: {
    flex: 0,
    flexBasis: "auto",
    width: "100%",
  },
  codeFieldWidth: {
    flexBasis: "20%",
    flexGrow: 0,
    flexShrink: 0,
  },
  nameFieldWidth: {
    flexBasis: "80%",
    flexGrow: 1,
    flexShrink: 1,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
  },
  /** Fila que contiene tipo y estado - web: cubre todo el ancho restante */
  typeAndStatusRow: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    minWidth: 0,
    alignSelf: "stretch",
  },
  /** Fila imagen + tipo para móvil (una sola fila, centrados verticalmente) */
  imageAndTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  /** Selector de tipo - flex para cubrir ancho en web */
  typeSelectorFlex: {
    flex: 1,
    minWidth: 0,
  },
  statusOptionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  statusOptionsContainerMobile: {
    gap: 4,
  },
  /** En web: los botones de estado cubren el ancho disponible */
  statusOptionsContainerWeb: {
    flex: 1,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusOptionMobile: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  /** En web: cada opción de estado crece para cubrir el ancho */
  statusOptionWeb: {
    flex: 1,
  },
  radioGroup: {
    gap: 12,
    marginTop: 8,
  },
  radioOption: {
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
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  /** Espacio flexible que empuja los botones (Cancelar/Aceptar) a la derecha */
  formActionsSpacer: {
    flex: 1,
  },
  /** Contenedor flexible que puede encogerse (minWidth: 0 para truncar texto) */
  flexShrink: {
    flex: 1,
    minWidth: 0,
  },
  addButton: {
    marginTop: 8,
    marginRight: 8,
  },
  /** Icono o indicador a la izquierda del texto en botones de acción (Agregar Oferta, Carga masiva, etc.) */
  actionButtonLeadingIcon: {
    marginRight: 8,
  },
  addButtonMobile: {
    marginTop: 8,
    marginRight: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  actionButtonsMobile: {
    width: "100%",
    flexWrap: "nowrap",
    flexDirection: "column",
  },
  uploadButton: {
    marginTop: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  /** Texto junto al icono en cards de información (infoPackages, startWithFirstOffering, noResultsFilter) */
  infoCardText: {
    marginLeft: 8,
    flex: 1,
  },
  /** Etiqueta de formulario con margen superior (ej. Valid From, Valid To en modal precio) */
  formLabelWithTopSpacing: {
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  /** Texto secundario en modal de precios (Impuestos, Válido desde) */
  priceModalCaption: {
    marginTop: 4,
  },
  /** Overlay del modal de imagen ampliada */
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  /** Contenedor de la imagen en el modal */
  imageViewerContent: {
    maxWidth: "100%",
    maxHeight: "100%",
  },
  /** Imagen ampliada en el modal */
  imageViewerImage: {
    width: 320,
    height: 320,
    borderRadius: 12,
  },
  /** Botón cerrar del modal de imagen (top depende de Platform, se añade inline) */
  imageViewerCloseButton: {
    position: "absolute",
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonContainer: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  continueButton: {
    minWidth: 200,
    width: "100%",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  paginationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  paginationLeftSlot: {
    flex: 1,
  },
  paginationLeftSlotMobile: {
    flex: 0,
  },
  paginationRightSlot: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  itemsPerPageRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
  },
  itemsPerPageLabel: {
    marginRight: 8,
  },
  itemsPerPageSelectWrap: {
    height: 36,
    minWidth: 56,
    justifyContent: "center",
  },
  itemsPerPageTrigger: {
    height: 36,
    minHeight: 36,
    paddingVertical: 0,
    justifyContent: "center",
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationNumbers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paginationNumber: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
});
