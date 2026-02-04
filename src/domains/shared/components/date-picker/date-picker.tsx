/**
 * Componente DatePicker genérico multiplataforma
 * Web: usa input type="date" nativo
 * Mobile: usa input de texto con formato manual
 */

import { ThemedText } from "@/components/themed-text";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { datePickerStyles } from "./date-picker.styles";
import type { DatePickerProps } from "./date-picker.types";

/**
 * Convierte fecha ISO (YYYY-MM-DD) a formato de visualización (DD/MM/YYYY o MM/DD/YYYY)
 */
function formatDateForDisplay(
  isoDate: string | null | undefined,
  format: string = "DD/MM/YYYY",
): string {
  if (!isoDate) return "";

  try {
    const date = new Date(isoDate + "T00:00:00");
    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    if (format === "MM/DD/YYYY") {
      return `${month}/${day}/${year}`;
    }
    // Por defecto DD/MM/YYYY
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

/**
 * Convierte fecha en formato de visualización a ISO (YYYY-MM-DD)
 */
function parseDateFromDisplay(
  displayDate: string,
  format: string = "DD/MM/YYYY",
): string | null {
  if (!displayDate || !displayDate.trim()) return null;

  // Remover caracteres no numéricos excepto / y -
  const cleaned = displayDate.replace(/[^\d/\-]/g, "");

  try {
    let day: string, month: string, year: string;

    if (format === "MM/DD/YYYY") {
      const parts = cleaned.split("/");
      if (parts.length !== 3) return null;
      month = parts[0].padStart(2, "0");
      day = parts[1].padStart(2, "0");
      year = parts[2];
    } else {
      // DD/MM/YYYY por defecto
      const parts = cleaned.split("/");
      if (parts.length !== 3) return null;
      day = parts[0].padStart(2, "0");
      month = parts[1].padStart(2, "0");
      year = parts[2];
    }

    // Validar que los valores sean válidos
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return null;
    if (dayNum < 1 || dayNum > 31) return null;
    if (monthNum < 1 || monthNum > 12) return null;
    if (yearNum < 1900 || yearNum > 2100) return null;

    // Crear fecha y validar que sea válida
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    if (isNaN(date.getTime())) return null;

    // Validar que la fecha coincida (para detectar 31/02 por ejemplo)
    if (
      date.getDate() !== dayNum ||
      date.getMonth() + 1 !== monthNum ||
      date.getFullYear() !== yearNum
    ) {
      return null;
    }

    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

/**
 * Formatea el texto mientras se escribe para mantener formato DD/MM/YYYY
 */
function formatInputWhileTyping(
  text: string,
  format: string = "DD/MM/YYYY",
): string {
  // Remover todo excepto números
  const numbers = text.replace(/\D/g, "");

  if (numbers.length === 0) return "";

  if (format === "MM/DD/YYYY") {
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4)
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }

  // DD/MM/YYYY por defecto
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
}

export function DatePicker({
  value,
  onChange,
  displayFormat = "DD/MM/YYYY",
  placeholder,
  error = false,
  errorMessage,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  style,
}: DatePickerProps) {
  const { colors } = useTheme();
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Actualizar displayValue cuando cambia value
  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateForDisplay(value, displayFormat));
    } else {
      setDisplayValue("");
    }
  }, [value, displayFormat]);

  const handleChange = (text: string) => {
    // Formatear mientras se escribe
    const formatted = formatInputWhileTyping(text, displayFormat);
    setDisplayValue(formatted);

    // Intentar parsear la fecha
    const isoDate = parseDateFromDisplay(formatted, displayFormat);

    // Validar min/max si están definidos
    if (isoDate) {
      if (minDate && isoDate < minDate) {
        return; // No actualizar si es menor que minDate
      }
      if (maxDate && isoDate > maxDate) {
        return; // No actualizar si es mayor que maxDate
      }
    }

    onChange(isoDate);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Validar y formatear al perder foco
    if (displayValue) {
      const isoDate = parseDateFromDisplay(displayValue, displayFormat);
      if (isoDate) {
        setDisplayValue(formatDateForDisplay(isoDate, displayFormat));
      } else {
        // Si no es válida, limpiar
        setDisplayValue("");
        onChange(null);
      }
    }
  };
  return (
    <View style={style}>
      <InputWithFocus
        containerStyle={[
          datePickerStyles.inputContainer,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        primaryColor={colors.primary}
        error={error}
      >
        <View style={datePickerStyles.inputWrapper}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={colors.textSecondary}
            style={datePickerStyles.icon}
          />
          <TextInput
            style={[datePickerStyles.input, { color: colors.text }]}
            value={displayValue}
            onChangeText={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder || displayFormat}
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
      </InputWithFocus>
      {error && errorMessage && (
        <ThemedText
          type="caption"
          style={[datePickerStyles.errorText, { color: colors.error }]}
        >
          {errorMessage}
        </ThemedText>
      )}
    </View>
  );
}
