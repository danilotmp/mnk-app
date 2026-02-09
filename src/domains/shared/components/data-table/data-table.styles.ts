/**
 * Estilos para el componente DataTable
 * Reestructurado para mejor distribución de columnas
 */

import { StyleSheet } from "react-native";
import type { DataTableTheme } from "./data-table.types";

const CONTAINER_BASE = {
  flex: 1,
  borderRadius: 10,
  width: "100%",
  minHeight: 400,
  padding: 0,
  paddingHorizontal: 0,
  paddingTop: 0,
  paddingBottom: 0,
} as const;

export const createDataTableStyles = (
  isMobile: boolean = false,
  theme?: DataTableTheme,
) =>
  StyleSheet.create({
    container: {
      ...CONTAINER_BASE,
      ...(theme
        ? {
            overflow: "visible" as const,
            borderWidth: 1,
            borderColor: theme.isDark
              ? theme.colors.surfaceVariant
              : theme.colors.borderLight,
            ...theme.shadows.lg,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 16,
            shadowOpacity: theme.isDark ? 0.35 : 0.15,
            elevation: 8,
          }
        : { overflow: "hidden" as const }),
    },
    horizontalScrollContainer: {
      flex: 1,
      width: "100%",
      minHeight: 0, // Permite que el scroll funcione correctamente
      borderRadius: 10, // Redondear esquinas del scroll para que respeten el borderRadius del contenedor
    },
    horizontalScrollContent: {
      minWidth: "100%",
      flexGrow: 1,
    },
    tableWrapper: {
      flex: 1,
      minWidth: "100%",
      minHeight: 0, // Permite que el scroll funcione correctamente
      borderRadius: 10, // Redondear esquinas internas para que respeten el borderRadius del contenedor
      overflow: "hidden", // Clippear contenido interno pero permitir sombra en el Card padre
    },
    loadingContainer: {
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      marginTop: 16,
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 400,
    },
    emptyText: {
      marginTop: 16,
    },
    header: {
      borderBottomWidth: 1,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      zIndex: 1,
      ...(theme && {
        backgroundColor: theme.colors.surfaceVariant,
        borderBottomColor: theme.colors.border,
        ...theme.shadows.sm,
      }),
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "stretch",
      minWidth: "100%",
      width: "100%",
    },
    headerCell: {
      paddingVertical: 12,
      paddingHorizontal: isMobile ? 12 : 16,
      justifyContent: "center",
      minHeight: 48,
      zIndex: 1,
    },
    headerCellInner: {
      flex: 1,
      marginVertical: 6,
      paddingHorizontal: 8,
      minHeight: 0,
      justifyContent: "center",
    },
    headerCellCenter: {
      alignItems: "center",
    },
    headerCellRight: {
      alignItems: "flex-end",
    },
    headerText: {
      fontSize: 14,
      fontWeight: "600",
    },
    body: {
      flex: 1,
      minHeight: 0, // Importante para que el scroll funcione correctamente
    },
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: 56,
      width: "100%",
    },
    stripedRow: {
      backgroundColor: theme?.colors.stripedRow,
    },
    cell: {
      paddingVertical: 12,
      paddingHorizontal: isMobile ? 12 : 16,
      justifyContent: "center",
      minHeight: 56,
      alignItems: "stretch",
    },
    cellInner: {
      flex: 1,
      marginVertical: 6,
      paddingHorizontal: 8,
      minHeight: 0,
      justifyContent: "center",
    },
    cellFirst: {
      paddingLeft: isMobile ? 16 : 16,
    },
    cellLast: {
      paddingRight: isMobile ? 16 : 16,
    },
    cellCenter: {
      alignItems: "center",
    },
    cellRight: {
      alignItems: "flex-end",
    },
    cellText: {
      fontSize: 14,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "nowrap",
      padding: isMobile ? 8 : 16,
      paddingHorizontal: isMobile ? 8 : 16,
      borderTopWidth: 1,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      gap: isMobile ? 8 : 16,
      flexShrink: 0,
      ...(theme && {
        backgroundColor: theme.colors.surfaceVariant,
        borderTopColor: theme.colors.border,
      }),
    },
    paginationInfo: {
      flex: 1,
      minWidth: isMobile ? 140 : 150,
    },
    /** En móvil: esquina izquierda (Showing X-Y of Z). */
    paginationInfoMobile: {
      flexShrink: 0,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    paginationControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: isMobile ? 8 : 16,
      flexWrap: "wrap",
      flexShrink: 1,
    },
    /** En móvil: al lado derecho (Page X of Y + botones). */
    paginationControlsMobile: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 8,
      flexShrink: 0,
    },
    limitSelector: {
      flexDirection: "row",
      alignItems: "center",
      gap: isMobile ? 4 : 8,
    },
    limitLabel: {
      fontSize: isMobile ? 12 : 14,
    },
    limitOptions: {
      flexDirection: "row",
      gap: 4,
    },
    limitOption: {
      paddingHorizontal: isMobile ? 8 : 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme?.colors.border,
      minWidth: isMobile ? 32 : 40,
      alignItems: "center",
    },
    pageButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: isMobile ? 4 : 8,
      flexShrink: 0,
    },
    pageButtonsMobile: {
      marginLeft: "auto",
    },
    pageButton: {
      padding: isMobile ? 6 : 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme?.colors.border,
      alignItems: "center",
      justifyContent: "center",
      minWidth: isMobile ? 32 : 36,
      minHeight: isMobile ? 32 : 36,
    },
    pageButtonDisabled: {
      opacity: 0.5,
    },
    pageIndicator: {
      paddingHorizontal: isMobile ? 8 : 12,
      minWidth: isMobile ? 80 : 100,
      alignItems: "center",
    },
    // Estilos para acciones
    actionsContainer: {
      flexDirection: "row",
      gap: isMobile ? 4 : 8,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    actionButton: {
      padding: isMobile ? 6 : 8,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
  });
