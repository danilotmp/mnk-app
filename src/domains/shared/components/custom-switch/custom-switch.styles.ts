/**
 * Estilos del componente CustomSwitch
 */

import { StyleSheet } from "react-native";

export const createCustomSwitchStyles = (colors: { border?: string }) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    label: {
      minWidth: 60,
    },
    switch: {
      width: 43,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      padding: 3,
      justifyContent: "center",
      position: "relative",
    },
    thumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
  });
