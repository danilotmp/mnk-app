/**
 * Estilos para el componente SearchInput.
 * Altura alineada con SearchFilterBar (minHeight 40 móvil / 44 desktop).
 */

import { StyleSheet } from "react-native";

export const createSearchInputStyles = (isMobile: boolean = false) =>
  StyleSheet.create({
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 10 : 12,
      minHeight: isMobile ? 40 : 44,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
    },
    searchIcon: {
      marginRight: 4,
    },
    searchInput: {
      flex: 1,
      fontSize: isMobile ? 14 : 16,
      paddingVertical: 0,
    },
    clearButton: {
      padding: 4,
    },
  });
