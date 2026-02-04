/**
 * Estilos adicionales para el componente VerticalMenu
 * (complementa los estilos de src/styles/components/vertical-menu.styles.ts)
 */

import { BaseTheme } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const createVerticalMenuAdditionalStyles = (
  colors: BaseTheme["colors"],
) =>
  StyleSheet.create({
    // Estilos para el contenedor del buscador y bloqueo
    searchContainer: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    lockButton: {
      padding: 12,
    },
    searchInputContainer: {
      flex: 1,
      position: "relative",
    },
    searchIcon: {
      position: "absolute",
      left: 10,
      top: 10,
      zIndex: 1,
    },
    clearButton: {
      position: "absolute",
      right: 10,
      top: 8,
      zIndex: 1,
      padding: 4,
    },
    searchInputWrapper: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      backgroundColor: colors.background,
      paddingLeft: 36,
      height: 36,
    },
    searchInput: {
      padding: 8,
      fontSize: 14,
    },
    scrollContainerWithHeight: {
      overflow: "hidden",
    },
    submenuMargin: {
      marginLeft: 16,
    },
    chevronMargin: {
      marginLeft: 4,
    },
    // Mismo fondo que el header (surfaceVariant) en ambos temas
    animatedContainer: {
      backgroundColor: colors.surfaceVariant,
      borderRightColor: colors.border,
    },
  });
