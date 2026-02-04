/**
 * Componente de input para moneda/precio
 * Muestra la moneda a la izquierda, el valor alineado a la derecha,
 * y separa visualmente enteros de decimales (siempre 2 decimales)
 */

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import React, { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { createCurrencyInputStyles } from "./currency-input.styles";
import type { CurrencyInputProps } from "./currency-input.types";

export function CurrencyInput({
  value,
  onChangeText,
  currency = "USD",
  placeholder = "0.00",
  disabled = false,
  error = false,
  containerStyle,
}: CurrencyInputProps) {
  const { colors } = useTheme();
  const styles = createCurrencyInputStyles();
  const [focused, setFocused] = useState(false);
  const integerInputRef = useRef<TextInput>(null);
  const decimalInputRef = useRef<TextInput>(null);

  // Obtener color del prefijo de moneda desde las variables del tema
  // rgb(21, 27, 46, 0.5) = rgba con opacidad 0.5 del background del tema
  // colors.background en dark es #151b2e = rgb(21, 27, 46)
  const getCurrencyPrefixColor = (): string | undefined => {
    const bgColor = colors.background;
    if (!bgColor) return undefined;

    // Convertir hex a RGB si es necesario
    if (bgColor.startsWith("#")) {
      const hex = bgColor.replace("#", "");
      const r = Number.parseInt(hex.substring(0, 2), 16);
      const g = Number.parseInt(hex.substring(2, 4), 16);
      const b = Number.parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.5)`;
    }

    // Si ya es rgba, extraer RGB y aplicar opacidad 0.5
    if (bgColor.startsWith("rgba")) {
      const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.5)`;
      }
    }

    return undefined;
  };

  // Normalizar el valor: siempre mantener como string con formato numérico
  const normalizedValue = value || "";

  // Separar parte entera y decimal
  const parts = normalizedValue.split(".");
  const integerPart = parts[0] || "";
  const decimalPart = parts[1] || "";

  // Formatear decimales para mostrar (siempre 2 dígitos)
  const displayDecimal = decimalPart.slice(0, 2).padEnd(2, "0");

  const handleIntegerChange = (text: string) => {
    // Solo permitir números
    const cleaned = text.replace(/\D/g, "");

    // Si hay decimales, mantenerlos
    if (decimalPart) {
      onChangeText(cleaned + "." + decimalPart);
    } else if (cleaned) {
      onChangeText(cleaned + ".00");
    } else {
      onChangeText("");
    }
  };

  const handleDecimalChange = (text: string) => {
    // Solo permitir números, máximo 2 dígitos
    const cleaned = text.replace(/\D/g, "").slice(0, 2);

    const currentInteger = integerPart || "0";
    if (cleaned) {
      onChangeText(currentInteger + "." + cleaned.padEnd(2, "0"));
    } else {
      onChangeText(currentInteger + ".00");
    }
  };

  const handleBlur = () => {
    setFocused(false);

    // Asegurar formato correcto al perder el foco
    if (normalizedValue && normalizedValue !== "") {
      const numValue = Number.parseFloat(normalizedValue);
      if (!Number.isNaN(numValue)) {
        onChangeText(numValue.toFixed(2));
      } else if (integerPart) {
        // Si solo hay parte entera, agregar .00
        onChangeText(integerPart + ".00");
      }
    } else if (integerPart) {
      // Si hay parte entera pero no decimal, agregar .00
      onChangeText(integerPart + ".00");
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: focused
            ? colors.primary
            : error
              ? colors.error
              : colors.border,
          borderWidth: focused ? 2 : 1,
        },
        containerStyle,
        disabled && styles.disabled,
      ]}
    >
      {/* Prefijo: Moneda - más oscuro que el resto del input */}
      <View
        style={[
          styles.currencyPrefix,
          {
            backgroundColor: getCurrencyPrefixColor(),
            borderRightColor: colors.border,
          },
        ]}
      >
        <ThemedText
          type="body1"
          style={[styles.currencyText, { color: colors.textSecondary }]}
        >
          {currency}
        </ThemedText>
      </View>

      {/* Área de input principal */}
      <View style={styles.inputArea}>
        {/* Parte entera - alineada a la derecha */}
        <TextInput
          ref={integerInputRef}
          style={[
            styles.integerInput,
            {
              color: colors.text,
              backgroundColor: "transparent",
            },
            disabled && { color: colors.textSecondary },
          ]}
          value={integerPart}
          onChangeText={handleIntegerChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={integerPart === "" ? "0" : undefined}
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          editable={!disabled}
          selectTextOnFocus={true}
        />

        {/* Separador decimal */}
        <ThemedText
          type="body1"
          style={[styles.decimalSeparator, { color: colors.text }]}
        >
          .
        </ThemedText>

        {/* Parte decimal - siempre 2 dígitos */}
        <View
          style={[styles.decimalSuffix, { backgroundColor: "transparent" }]}
        >
          <TextInput
            ref={decimalInputRef}
            style={[
              styles.decimalInput,
              {
                color: colors.text,
                backgroundColor: "transparent",
              },
              disabled && { color: colors.textSecondary },
            ]}
            value={displayDecimal}
            onChangeText={handleDecimalChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            editable={!disabled}
            maxLength={2}
            selectTextOnFocus={true}
          />
        </View>
      </View>
    </View>
  );
}
