/**
 * Estilos para el componente CurrencyInput
 */

import { StyleSheet } from "react-native";

export const createCurrencyInputStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 8,
      overflow: "hidden",
      minHeight: 48,
    },
    disabled: {
      opacity: 0.65,
    },
    currencyPrefix: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRightWidth: 1,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 60,
    },
    currencyText: {
      fontWeight: "600",
      fontSize: 14,
    },
    inputArea: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingRight: 12,
      gap: 4,
    },
    integerInput: {
      flex: 1,
      textAlign: "right",
      fontSize: 18,
      fontWeight: "600",
      paddingVertical: 12,
      minWidth: 60,
      borderWidth: 0,
      outlineStyle: "none",
    },
    decimalSeparator: {
      fontSize: 20,
      fontWeight: "700",
      paddingVertical: 12,
    },
    decimalSuffix: {
      paddingHorizontal: 0,
      paddingVertical: 12,
      justifyContent: "left",
      alignItems: "left ",
      minWidth: 40,
    },
    decimalInput: {
      textAlign: "left",
      fontSize: 18,
      fontWeight: "600",
      width: 30,
      borderWidth: 0,
      outlineStyle: "none",
    },
  });
