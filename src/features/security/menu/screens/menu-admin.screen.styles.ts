/**
 * Estilos para la pantalla de administración del menú (Security > Menu).
 * Usa tokens globales: typography.pageTitle/pageSubtitle, pageLayout, spacing, colors, borderRadius.
 * Estandarizado igual que Users, Roles, Permissions, Companies, Branches.
 */

import { Platform, StyleSheet, TextStyle, ViewStyle } from "react-native";

export interface MenuAdminScreenTheme {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    surface: string;
    surfaceVariant?: string;
    background: string;
    success: string;
    error: string;
    warning: string;
    suspended?: string;
    contrastText: string;
  };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
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
  };
  borderRadius: { sm: number; md: number; lg: number };
}

export function createMenuAdminStyles(
  t: MenuAdminScreenTheme,
  isMobile: boolean,
) {
  const c = t.colors;
  const s = t.spacing;
  const r = t.borderRadius;
  return StyleSheet.create({
    // Cabecera de página (icono + título + subtítulo)
    container: { flex: 1 } as ViewStyle,
    content: {
      flex: 1,
      paddingTop: t.pageLayout.headerTitleGap,
      paddingHorizontal: s.md,
      paddingBottom: s.md,
    } as ViewStyle,
    contentMobile: {
      paddingTop: t.pageLayout.headerTitleGapMobile,
      paddingHorizontal: s.sm,
    } as ViewStyle,
    pageHeader: {
      marginBottom: isMobile
        ? t.pageLayout.subtitleContentGapMobile
        : t.pageLayout.subtitleContentGap,
    } as ViewStyle,
    pageHeaderTitle: { flex: 1 } as ViewStyle,
    pageHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: s.sm,
    } as ViewStyle,
    pageHeaderIcon: { flexShrink: 0 } as ViewStyle,
    pageTitle: {
      ...(t.typography.pageTitle as TextStyle),
      marginBottom: s.xs,
    } as TextStyle,
    pageTitleMobile: {
      ...(t.typography.pageTitleMobile as TextStyle),
      marginBottom: s.xs,
    } as TextStyle,
    pageSubtitle: {
      ...(t.typography.pageSubtitle as TextStyle),
      color: c.textSecondary,
      paddingLeft: isMobile
        ? t.pageLayout.iconTitleMobile + s.sm
        : t.pageLayout.iconTitle + s.sm,
    } as TextStyle,
    scrollContent: {
      paddingVertical: 16,
      paddingHorizontal: 0,
    } as ViewStyle,
    scrollContentMobile: {} as ViewStyle,

    // Barra de búsqueda y acciones (toolbar)
    toolbarContainer: {
      paddingVertical: 16,
      paddingHorizontal: 0,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    } as ViewStyle,
    toolbarContainerMobile: {} as ViewStyle,
    toolbarRow: {
      flexDirection: "row",
      gap: s.sm,
      alignItems: "center",
    } as ViewStyle,
    toolbarRowMobile: {
      gap: s.md,
    } as ViewStyle,

    // Estilos del formulario público
    publicToggleContainer: {
      marginTop: s.md,
      flexDirection: "row",
      alignItems: "center",
      gap: s.sm,
    } as ViewStyle,
    publicToggleContainerMobile: {} as ViewStyle,
    publicToggleLabel: {
      minWidth: 60,
    },
    publicToggleSwitch: {
      width: 43,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      padding: 3,
      justifyContent: "center",
      position: "relative",
    },
    publicToggleThumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },

    formRow: {
      flexDirection: "row",
      gap: s.sm,
      flexWrap: "wrap",
    } as ViewStyle,
    formField: {
      flex: 1,
      minWidth: 180,
    } as ViewStyle,
    formFieldWide: {
      flex: 2,
      minWidth: 180,
    } as ViewStyle,
    formLabel: {
      marginBottom: s.sm,
    } as ViewStyle,
    descriptionInput: {
      borderWidth: 1,
      borderRadius: r.md,
      minHeight: 105,
    } as ViewStyle,
    actionButtons: {
      flexDirection: "row",
      gap: s.sm,
      justifyContent: "flex-end",
    } as ViewStyle,
    selectOptions: {
      flexDirection: "row",
      gap: s.sm,
      paddingRight: s.sm,
    } as ViewStyle,
    selectOption: {
      paddingHorizontal: 10,
      paddingVertical: s.xs,
      borderRadius: r.sm,
      borderWidth: 1,
      maxHeight: 40,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    } as ViewStyle,

    itemContainerBase: {
      marginBottom: s.sm,
    } as ViewStyle,
    itemTitleContainerBase: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: s.md,
      paddingHorizontal: s.sm,
      borderRadius: r.md,
      borderWidth: 1,
      width: "100%",
      marginBottom: 0,
      borderTopLeftRadius: r.md,
      borderTopRightRadius: r.md,
    } as ViewStyle,
    itemTitleContainerBaseMobile: {
      paddingVertical: s.md,
      paddingHorizontal: s.xs,
    } as ViewStyle,
    expandCollapseButton: {
      marginRight: s.sm,
    } as ViewStyle,
    expandCollapsePlaceholder: {
      width: 28,
    } as ViewStyle,
    dragHandle: {
      marginRight: s.sm,
      padding: s.xs,
      ...(Platform.OS === "web" && {
        cursor: "grab",
      }),
    } as ViewStyle,
    itemRow: {
      flex: 1,
      flexDirection: "row",
      gap: s.sm,
      alignItems: "center",
      flexWrap: "wrap",
    } as ViewStyle,
    itemRowMobile: {
      gap: s.md,
    } as ViewStyle,
    itemIconButton: {
      padding: s.xs,
    } as ViewStyle,
    itemNameButton: {
      flex: 2,
      minWidth: 200,
      flexDirection: "row",
      alignItems: "center",
      gap: s.sm,
    } as ViewStyle,
    itemNameButtonMobile: {
      minWidth: 0,
      flex: 1,
    } as ViewStyle,
    modifiedIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.success,
    } as ViewStyle,
    itemNameText: {
      fontWeight: "600",
      color: c.text,
    } as TextStyle,
    itemRouteButton: {
      flex: 2,
      minWidth: 200,
    } as ViewStyle,
    itemRouteButtonMobile: {
      minWidth: 0,
      flex: 1,
    } as ViewStyle,
    itemRouteText: {
      fontStyle: "italic",
    } as TextStyle,
    itemStatusButton: {
      flex: 1,
      minWidth: 100,
      alignItems: "center",
      marginRight: s.sm,
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    } as ViewStyle,
    itemStatusButtonMobile: {
      minWidth: 70,
    } as ViewStyle,
    pendingChildIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.warning,
    } as ViewStyle,
    itemActionsContainer: {
      flexDirection: "row",
      marginLeft: "auto",
      gap: s.sm,
    } as ViewStyle,
    itemActionButton: {
      padding: s.xs,
    } as ViewStyle,

    dropZoneBase: {
      marginTop: s.xs,
      padding: s.sm,
      borderWidth: 2,
      borderStyle: "dashed",
      borderRadius: r.md,
      alignItems: "center",
      justifyContent: "center",
    } as ViewStyle,
    dropZoneText: {
      color: c.primary,
      fontWeight: "600",
    } as TextStyle,

    editFormContainer: {
      width: "100%",
      backgroundColor: "transparent",
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: r.md,
      borderBottomRightRadius: r.md,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: "transparent",
      padding: s.sm,
      gap: s.sm,
      marginTop: -1,
      zIndex: 0,
    } as ViewStyle,
    editFormRow: {
      flexDirection: "row",
      gap: s.sm,
      flexWrap: "wrap",
    } as ViewStyle,
    editFormRowMobile: {
      flexDirection: "column",
      gap: s.md,
    } as ViewStyle,
    editFormField: {
      flex: 1,
      minWidth: 180,
    } as ViewStyle,
    editFormFieldMobile: {
      minWidth: 0,
      width: "100%",
    } as ViewStyle,
    editFormFieldMobileWithTopMargin: {
      marginTop: s.md,
    } as ViewStyle,
    editFormFieldWide: {
      flex: 2,
      minWidth: 180,
    } as ViewStyle,
    editFormFieldWideMobile: {
      minWidth: 0,
      width: "100%",
    } as ViewStyle,
    editFormLabel: {
      marginBottom: s.sm,
      color: c.text,
    } as TextStyle,
    editFormLabelRequired: {
      color: c.error,
    } as TextStyle,
    iconInputContainer: {
      flexDirection: "row",
      gap: s.sm,
      alignItems: "flex-start",
    } as ViewStyle,
    iconInputWrapper: {
      flex: 1,
    } as ViewStyle,
    iconDocumentationButton: {
      backgroundColor: c.primary,
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      borderRadius: r.md,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 48,
    } as ViewStyle,
    validationError: {
      color: c.error,
      marginTop: s.xs,
    } as TextStyle,
    textInput: {
      paddingVertical: 0,
      paddingHorizontal: 0,
      fontSize: 14,
      color: c.text,
    } as TextStyle,
    textInputContainerBase: {
      borderWidth: 1,
      borderRadius: r.md,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 48,
    } as ViewStyle,
    textInputContainerError: {
      borderColor: c.error,
    } as ViewStyle,
    textInputContainerNormal: {
      borderColor: c.border,
    } as ViewStyle,
    textInputContainerMultiline: {
      minHeight: 105,
    } as ViewStyle,

    addGroupingButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: s.sm,
      backgroundColor: c.surface,
      borderRadius: r.md,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: "dashed",
      marginBottom: s.sm,
    } as ViewStyle,
    addGroupingText: {
      marginLeft: s.sm,
      color: c.primary,
    } as TextStyle,

    columnContainerBase: {
      marginBottom: s.md,
      padding: s.sm,
      borderRadius: r.md,
    } as ViewStyle,
    columnContainerDragOver: {
      backgroundColor: c.primary + "20",
    } as ViewStyle,
    columnContainerNormal: {
      backgroundColor: c.surfaceVariant || c.surface,
    } as ViewStyle,
    columnContainerDragging: {
      opacity: 0.5,
    } as ViewStyle,
    columnHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: s.sm,
      gap: s.sm,
    } as ViewStyle,
    columnDragHandle: {
      marginRight: s.sm,
      padding: s.xs,
      ...(Platform.OS === "web" && {
        cursor: "grab",
      }),
    } as ViewStyle,
    columnTitleEditContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: s.sm,
    } as ViewStyle,
    columnTitleInput: {
      flex: 1,
      padding: s.sm,
      backgroundColor: c.background,
      borderRadius: r.sm,
      borderWidth: 1,
      borderColor: c.primary,
      color: c.text,
      fontSize: 14,
      fontWeight: "600",
    } as TextStyle,
    columnTitleButton: {
      padding: s.xs,
    } as ViewStyle,
    columnTitleButtonText: {
      fontWeight: "600",
      color: c.text,
    } as TextStyle,
    columnItemsContainer: {
      marginTop: s.sm,
    } as ViewStyle,

    searchContainer: {
      flex: 1,
      position: "relative",
    } as ViewStyle,
    searchContainerMobile: {
      minWidth: 0,
    } as ViewStyle,
    searchIcon: {
      position: "absolute",
      left: s.sm,
      top: 14,
      zIndex: 1,
    } as ViewStyle,
    searchClearButton: {
      position: "absolute",
      right: s.sm,
      top: 14,
      zIndex: 1,
      padding: s.xs,
    } as ViewStyle,
    searchInputContainerBase: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: r.md,
      backgroundColor: c.surface,
      paddingLeft: 40,
      paddingRight: isMobile ? s.sm : s.md,
      minHeight: isMobile ? 40 : 44,
    } as ViewStyle,
    searchInputContainerWithValue: {
      paddingRight: 40,
    } as ViewStyle,
    searchInputContainerEmpty: {
      paddingRight: s.sm,
    } as ViewStyle,
    searchInput: {
      flex: 1,
      paddingVertical: 0,
      paddingHorizontal: 0,
      fontSize: isMobile ? 14 : 16,
      color: c.text,
    } as TextStyle,

    saveCancelActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: s.sm,
    } as ViewStyle,

    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      borderTopWidth: 1,
    } as ViewStyle,
    footerActions: {
      flexDirection: "row",
      gap: s.sm,
      alignItems: "center",
    } as ViewStyle,
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    } as ViewStyle,
    loadingText: {
      marginTop: s.md,
    } as ViewStyle,
    emptyContainer: {
      alignItems: "center",
      padding: 40,
    } as ViewStyle,
    emptyIcon: {} as ViewStyle,
  });
}
