/**
 * Estilos para la pantalla de administración del menú
 */

import { Platform, StyleSheet } from 'react-native';

export const createMenuAdminStyles = (colors: any) => {
  return StyleSheet.create({
    // Estilos del formulario público
    publicToggleContainer: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    publicToggleLabel: {
      minWidth: 60,
    },
    publicToggleSwitch: {
      width: 43,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      padding: 3,
      justifyContent: 'center',
      position: 'relative',
    },
    publicToggleThumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
    
    // Estilos del formulario de edición
    formRow: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
    },
    formField: {
      flex: 1,
      minWidth: 180,
    },
    formFieldWide: {
      flex: 2,
      minWidth: 180,
    },
    formLabel: {
      marginBottom: 8,
    },
    descriptionInput: {
      borderWidth: 1,
      borderRadius: 8,
      minHeight: 105,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'flex-end',
    },
    selectOptions: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 8, // Padding derecho para permitir scroll completo
    },
    selectOption: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      maxHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0, // Evitar que se compriman
    },
    
    // Estilos del item del menú
    itemContainerBase: {
      marginBottom: 8,
    },
    itemTitleContainerBase: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      width: '100%',
      marginBottom: 0,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    expandCollapseButton: {
      marginRight: 8,
    },
    expandCollapsePlaceholder: {
      width: 28,
    },
    dragHandle: {
      marginRight: 8,
      padding: 4,
      ...(Platform.OS === 'web' && {
        cursor: 'grab',
      }),
    },
    itemRow: {
      flex: 1,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    itemIconButton: {
      padding: 4,
    },
    itemNameButton: {
      flex: 2,
      minWidth: 200,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modifiedIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    itemNameText: {
      fontWeight: '600',
      color: colors.text,
    },
    itemRouteButton: {
      flex: 2,
      minWidth: 200,
    },
    itemRouteText: {
      fontStyle: 'italic',
    },
    itemStatusButton: {
      flex: 1,
      minWidth: 100,
      alignItems: 'center',
      marginRight: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    pendingChildIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#f59e0b', // Color tomate igual que pendiente
    },
    itemActionsContainer: {
      flexDirection: 'row',
      marginLeft: 'auto',
      gap: 8,
    },
    itemActionButton: {
      padding: 4,
    },
    
    // Estilos del drop zone
    dropZoneBase: {
      marginTop: 4,
      padding: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropZoneText: {
      color: colors.primary,
      fontWeight: '600',
    },
    
    // Estilos del formulario de edición
    editFormContainer: {
      width: '100%',
      backgroundColor: 'transparent', // Se sobrescribe con colors.surface
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: 'transparent', // Se sobrescribe con colors.primary
      padding: 12,
      gap: 12,
      marginTop: -1,
      zIndex: 0,
    },
    editFormRow: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
    },
    editFormField: {
      flex: 1,
      minWidth: 180,
    },
    editFormFieldWide: {
      flex: 2,
      minWidth: 180,
    },
    editFormLabel: {
      marginBottom: 8,
      color: colors.text,
    },
    editFormLabelRequired: {
      color: colors.error,
    },
    iconInputContainer: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
    },
    iconInputWrapper: {
      flex: 1,
    },
    iconDocumentationButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 48,
    },
    validationError: {
      color: colors.error,
      marginTop: 4,
    },
    textInput: {
      padding: 12,
      color: colors.text,
    },
    textInputContainerBase: {
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    textInputContainerError: {
      borderColor: colors.error,
    },
    textInputContainerNormal: {
      borderColor: colors.border,
    },
    textInputContainerMultiline: {
      minHeight: 105,
    },
    
    // Estilos del botón de agregar agrupamiento
    addGroupingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginBottom: 8,
    },
    addGroupingText: {
      marginLeft: 8,
      color: colors.primary,
    },
    
    // Estilos de columnas
    columnContainerBase: {
      marginBottom: 16,
      padding: 12,
      borderRadius: 8,
    },
    columnContainerDragOver: {
      backgroundColor: colors.primary + '20',
    },
    columnContainerNormal: {
      backgroundColor: colors.surfaceVariant,
    },
    columnContainerDragging: {
      opacity: 0.5,
    },
    columnHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    columnDragHandle: {
      marginRight: 8,
      padding: 4,
      ...(Platform.OS === 'web' && {
        cursor: 'grab',
      }),
    },
    columnTitleEditContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    columnTitleInput: {
      flex: 1,
      padding: 8,
      backgroundColor: colors.background,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.primary,
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    columnTitleButton: {
      padding: 4,
    },
    columnTitleButtonText: {
      fontWeight: '600',
      color: colors.text,
    },
    columnItemsContainer: {
      marginTop: 8,
    },
    
    // Estilos del header de búsqueda
    headerContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    searchContainer: {
      flex: 1,
      position: 'relative',
    },
    searchIcon: {
      position: 'absolute',
      left: 12,
      top: 14,
      zIndex: 1,
    },
    searchClearButton: {
      position: 'absolute',
      right: 12,
      top: 14,
      zIndex: 1,
      padding: 4,
    },
    searchInputContainerBase: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      paddingLeft: 40,
    },
    searchInputContainerWithValue: {
      paddingRight: 40,
    },
    searchInputContainerEmpty: {
      paddingRight: 12,
    },
    searchInput: {
      padding: 12,
      color: colors.text,
    },
    
    // Estilos de acciones guardar/cancelar
    saveCancelActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });
};

