/**
 * Estilos del componente DatePicker
 */

import { StyleSheet } from "react-native";

export const datePickerStyles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 40,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
  },
});
