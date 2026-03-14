/**
 * Editor genérico de atributos (pares clave-valor)
 * Reutilizable para properties, metadata u otros objetos flexibles
 */

import { ThemedText } from "@/components/themed-text";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createAttributesEditorStyles } from "./attributes-editor.styles";
import type { AttributesEditorProps } from "./attributes-editor.types";

function toEntries(obj: Record<string, unknown> | null): Array<{ key: string; value: string }> {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).map(([key, v]) => ({
    key,
    value: v === null || v === undefined ? "" : String(v),
  }));
}

function fromEntries(entries: Array<{ key: string; value: string }>): Record<string, unknown> | null {
  const obj: Record<string, unknown> = {};
  for (const { key, value } of entries) {
    const k = key.trim();
    if (!k) continue;
    const num = Number(value);
    obj[k] = value.trim() === "" ? "" : !Number.isNaN(num) ? num : value;
  }
  return Object.keys(obj).length > 0 ? obj : null;
}

export function AttributesEditor({
  value,
  onChange,
  label,
  placeholder = "Sin atributos",
  addButtonLabel = "Agregar atributo",
  keyPlaceholder = "Clave",
  valuePlaceholder = "Valor",
  disabled = false,
  error = false,
}: AttributesEditorProps) {
  const { colors } = useTheme();
  const theme = useMemo(
    () => ({
      colors: {
        text: colors.text,
        textSecondary: colors.textSecondary,
        border: error ? (colors.error ?? "#ef4444") : colors.border,
        background: colors.background,
        filterInputBackground: colors.filterInputBackground,
        primary: colors.primary,
      },
    }),
    [colors, error],
  );
  const styles = createAttributesEditorStyles(theme);

  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>(() =>
    toEntries(value),
  );
  const isInternalChange = useRef(false);

  // Sincronizar cuando el padre carga nuevos datos (ej. al expandir otra oferta)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    setEntries(toEntries(value));
  }, [value]);

  const notifyChange = (next: Array<{ key: string; value: string }>) => {
    isInternalChange.current = true;
    setEntries(next);
    onChange(fromEntries(next));
  };

  const handleAdd = () => {
    notifyChange([...entries, { key: "", value: "" }]);
  };

  const handleChange = (index: number, field: "key" | "value", val: string) => {
    const next = [...entries];
    next[index] = { ...next[index], [field]: val };
    notifyChange(next);
  };

  const handleRemove = (index: number) => {
    const next = entries.filter((_, i) => i !== index);
    notifyChange(next);
  };

  const isEmpty = entries.length === 0;

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {label}
        </ThemedText>
      ) : null}
      {isEmpty ? (
        <TouchableOpacity
          style={[
            styles.emptyState,
            {
              borderColor: colors.border,
              backgroundColor: colors.filterInputBackground + "40",
            },
          ]}
          onPress={disabled ? undefined : handleAdd}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <ThemedText
            type="body2"
            style={[styles.emptyStateText, { color: colors.textSecondary }]}
          >
            {placeholder}
          </ThemedText>
          <ThemedText
            type="caption"
            style={{ color: colors.primary, marginTop: 4 }}
          >
            + {addButtonLabel}
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={styles.listContainer}>
          {entries.map((e, i) => (
            <View key={i} style={styles.row}>
              <InputWithFocus
                containerStyle={[
                  styles.keyInput,
                  {
                    backgroundColor: colors.filterInputBackground,
                    borderColor: error ? (colors.error ?? "#ef4444") : colors.border,
                  },
                ]}
                primaryColor={colors.primary}
                error={error}
              >
                <TextInput
                  style={[styles.keyInputText, { color: colors.text }]}
                  placeholder={keyPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  value={e.key}
                  onChangeText={(v) => handleChange(i, "key", v)}
                  editable={!disabled}
                />
              </InputWithFocus>
              <InputWithFocus
                containerStyle={[
                  styles.valueInput,
                  {
                    backgroundColor: colors.filterInputBackground,
                    borderColor: error ? (colors.error ?? "#ef4444") : colors.border,
                  },
                ]}
                primaryColor={colors.primary}
                error={error}
              >
                <TextInput
                  style={[styles.valueInputText, { color: colors.text }]}
                  placeholder={valuePlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  value={e.value}
                  onChangeText={(v) => handleChange(i, "value", v)}
                  editable={!disabled}
                />
              </InputWithFocus>
              <TouchableOpacity
                style={[
                  styles.removeButton,
                  { backgroundColor: (colors.error ?? "#ef4444") + "20" },
                ]}
                onPress={() => handleRemove(i)}
                disabled={disabled}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.error ?? "#ef4444"}
                />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                borderColor: colors.primary,
              },
            ]}
            onPress={handleAdd}
            disabled={disabled}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
            <ThemedText type="body2" style={{ color: colors.primary }}>
              {addButtonLabel}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
