/**
 * Editor JSON reutilizable con números de línea, badge JSON y botón formatear
 */

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { createJsonEditorStyles } from "./json-editor.styles";
import type { JsonEditorProps } from "./json-editor.types";

export function JsonEditor({
  label,
  value,
  onChange,
  minHeight = 80,
  disabled = false,
  placeholder = "{}",
}: JsonEditorProps) {
  const { colors, borderRadius } = useTheme();
  const theme = useMemo(() => ({
    colors: {
      text: colors.text,
      textSecondary: colors.textSecondary,
      border: colors.border,
      filterInputBackground: colors.filterInputBackground,
      primary: colors.primary,
      surfaceVariant: colors.surfaceVariant,
    },
    borderRadius,
  }), [colors, borderRadius]);

  const styles = createJsonEditorStyles(theme);

  const [text, setText] = useState(() => JSON.stringify(value || {}, null, 2));
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Sincronizar cuando el valor externo cambia
  React.useEffect(() => {
    if (!isFocused) {
      setText(JSON.stringify(value || {}, null, 2));
    }
  }, [value, isFocused]);

  const handleChange = (v: string) => {
    setText(v);
    try {
      const parsed = JSON.parse(v);
      setIsValid(true);
      onChange(parsed);
    } catch {
      setIsValid(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      setText(formatted);
      setIsValid(true);
      onChange(parsed);
    } catch {}
  };

  // Calcular números de línea
  const lines = text.split("\n");
  const lineCount = lines.length;

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>{label}</ThemedText>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleFormat}>
              <Ionicons name="code-slash" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={[
        styles.editorContainer,
        { minHeight },
        isFocused && { borderColor: colors.primary, borderWidth: 2 },
        !isValid && { borderColor: colors.error },
      ]}>
        {/* Números de línea */}
        <View style={styles.lineNumbers}>
          {Array.from({ length: lineCount }, (_, i) => (
            <ThemedText key={i} style={styles.lineNumber}>{i + 1}</ThemedText>
          ))}
        </View>
        {/* Editor */}
        <TextInput
          style={[styles.textInput, { minHeight: minHeight - 24 }]}
          value={text}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary + "60"}
        />
      </View>
    </View>
  );
}
