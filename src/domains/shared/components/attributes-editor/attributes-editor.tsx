/**
 * Editor genérico de atributos (pares clave-valor)
 * Reutilizable para properties, metadata u otros objetos flexibles
 *
 * Convenciones de claves:
 * - El usuario escribe nombres legibles (ej. "Nombre Archivo").
 * - Se eliminan tildes y caracteres especiales en tiempo real.
 * - Al enviar a BD se convierten a camelCase (ej. "nombreArchivo").
 * - Al recuperar de BD se convierten de camelCase a legible (ej. "Nombre Archivo").
 */

import { ThemedText } from "@/components/themed-text";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { createAttributesEditorStyles } from "./attributes-editor.styles";
import type { AttributesEditorProps } from "./attributes-editor.types";

/** Reemplaza caracteres acentuados por su equivalente sin tilde */
function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Elimina caracteres especiales, permite solo letras, números y espacios */
function sanitizeKey(str: string): string {
  return removeDiacritics(str).replace(/[^a-zA-Z0-9 ]/g, "");
}

/** Convierte texto legible a camelCase: "Nombre Archivo" → "nombreArchivo" */
function toCamelCase(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

/** Convierte camelCase a texto legible: "nombreArchivo" → "Nombre Archivo" */
function fromCamelCase(str: string): string {
  if (!str) return "";
  const spaced = str.replace(/([A-Z])/g, " $1");
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toEntries(obj: Record<string, unknown> | null): Array<{ key: string; value: string }> {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).map(([key, v]) => ({
    key: fromCamelCase(key),
    value: v === null || v === undefined ? "" : String(v),
  }));
}

function fromEntries(entries: Array<{ key: string; value: string }>): Record<string, unknown> | null {
  const obj: Record<string, unknown> = {};
  for (const { key, value } of entries) {
    const k = toCamelCase(key);
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
  addButtonLabel = "Agregar",
  keyPlaceholder = "Nombre",
  valuePlaceholder = "Valor",
  disabled = false,
  compact = false,
  error = false,
  suggestions,
  showTreeLine = false,
}: AttributesEditorProps) {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
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
  const styles = createAttributesEditorStyles(theme, compact);

  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>(() =>
    toEntries(value),
  );
  const isInternalChange = useRef(false);
  const [focusedKeyIndex, setFocusedKeyIndex] = useState<number | null>(null);
  const [focusedValueIndex, setFocusedValueIndex] = useState<number | null>(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null);
  const suggestionsScrollRef = useRef<ScrollView>(null);

  // Alturas de cada fila para calcular la línea vertical del árbol
  const [rowMidpoints, setRowMidpoints] = useState<number[]>([]);
  // Ancho real de la columna nombre para alinear sugerencias con la columna valor
  const [keyColWidth, setKeyColWidth] = useState(0);

  // Sincronizar cuando el padre carga nuevos datos
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
    setRowMidpoints([]);
    onChange(fromEntries(next));
  };

  const handleAdd = () => {
    notifyChange([...entries, { key: "", value: "" }]);
  };

  const handleChange = (index: number, field: "key" | "value", val: string) => {
    const next = [...entries];
    const sanitized = field === "key" ? sanitizeKey(val) : val;
    next[index] = { ...next[index], [field]: sanitized };
    notifyChange(next);
  };

  const handleRemove = (index: number) => {
    const next = entries.filter((_, i) => i !== index);
    notifyChange(next);
  };

  // Sugerencias: calcular cuáles aún no se han agregado
  const availableSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    const usedKeys = new Set(entries.map((e) => toCamelCase(e.key)));
    return suggestions.filter((s) => !usedKeys.has(toCamelCase(s)));
  }, [suggestions, entries]);

  // Agregar atributo desde sugerencia: inserta en el orden correcto y enfoca el valor
  const handleAddSuggestion = (suggestion: string) => {
    if (disabled) return;
    const sanitized = sanitizeKey(suggestion);
    // Determinar posición: respetar orden del array de sugerencias
    let insertIndex = entries.length;
    if (suggestions) {
      const suggestionOrder = suggestions.indexOf(suggestion);
      // Buscar la posición correcta entre los entries existentes
      for (let i = 0; i < entries.length; i++) {
        const entryKey = entries[i].key;
        const entrySuggestionIndex = suggestions.findIndex(
          (s) => toCamelCase(s) === toCamelCase(entryKey),
        );
        if (entrySuggestionIndex === -1 || entrySuggestionIndex > suggestionOrder) {
          insertIndex = i;
          break;
        }
      }
    }
    const next = [...entries];
    next.splice(insertIndex, 0, { key: sanitized, value: "" });
    notifyChange(next);
    // Enfocar el input de valor del nuevo atributo
    setTimeout(() => setFocusedValueIndex(insertIndex), 100);
  };

  const isEmpty = entries.length === 0;
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;

  // Estado del scroll para mostrar/ocultar flechas
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });
  const suggestionsContentWidth = useRef(0);
  const suggestionsViewWidth = useRef(0);
  const suggestionsScrollOffset = useRef(0);

  const updateArrows = () => {
    const canLeft = suggestionsScrollOffset.current > 2;
    const canRight = suggestionsContentWidth.current - suggestionsScrollOffset.current - suggestionsViewWidth.current > 2;
    setScrollState({ canScrollLeft: canLeft, canScrollRight: canRight });
  };

  // Renderizar botones de sugerencias
  const renderSuggestions = () => {
    if (availableSuggestions.length === 0) return null;

    return (
      <>
        {scrollState.canScrollLeft && (
          <TouchableOpacity
            style={styles.scrollArrow}
            onPress={() => {
              suggestionsScrollRef.current?.scrollTo({
                x: Math.max(0, suggestionsScrollOffset.current - 150),
                animated: true,
              });
            }}
          >
            <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <ScrollView
          ref={suggestionsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
          onScroll={(e) => {
            suggestionsScrollOffset.current = e.nativeEvent.contentOffset.x;
            updateArrows();
          }}
          scrollEventThrottle={16}
          onContentSizeChange={(w) => {
            suggestionsContentWidth.current = w;
            updateArrows();
          }}
          onLayout={(e) => {
            suggestionsViewWidth.current = e.nativeEvent.layout.width;
            updateArrows();
          }}
        >
          {availableSuggestions.map((s) => {
            const isHovered = hoveredSuggestion === s;
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.suggestionButton,
                  {
                    borderColor: isHovered ? colors.primary : colors.textSecondary + "60",
                    backgroundColor: isHovered ? colors.primary + "10" : "transparent",
                  },
                ]}
                onPress={() => handleAddSuggestion(s)}
                onPressIn={() => setHoveredSuggestion(s)}
                onPressOut={() => setHoveredSuggestion(null)}
                // @ts-ignore — web-only hover events
                onMouseEnter={() => setHoveredSuggestion(s)}
                // @ts-ignore
                onMouseLeave={() => setHoveredSuggestion(null)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={14}
                  color={isHovered ? colors.primary : colors.textSecondary}
                />
                <ThemedText
                  type="caption"
                  style={[
                    styles.suggestionText,
                    { color: isHovered ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {s}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {scrollState.canScrollRight && (
          <TouchableOpacity
            style={styles.scrollArrow}
            onPress={() => {
              suggestionsScrollRef.current?.scrollTo({
                x: suggestionsScrollOffset.current + 150,
                animated: true,
              });
            }}
          >
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {label}
        </ThemedText>
      ) : null}
      {renderBody()}
    </View>
  );

  function renderBody() {
    if (isEmpty) {
      return (
        <View>
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
          {availableSuggestions.length > 0 && (
            <View style={[styles.actionsRow, { marginTop: 8 }]}>
              {renderSuggestions()}
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
          {showTreeLine && entries.length > 0 && rowMidpoints.length === entries.length && (
            <>
              {/* Línea vertical entre items */}
              {entries.length > 1 && (
                <View
                  style={{
                    position: "absolute",
                    left: (compact ? 16 : 0) + 0.25,
                    top: rowMidpoints[0],
                    height: rowMidpoints[rowMidpoints.length - 1] - rowMidpoints[0],
                    width: 1,
                    backgroundColor: colors.textSecondary + "30",
                    pointerEvents: "none",
                  }}
                />
              )}
            </>
          )}
          {entries.map((e, i) => {
            const treeLineColor = colors.textSecondary + "40";
            return (
            <View
              key={i}
              style={[styles.row, { position: "relative" }]}
              onLayout={(ev) => {
                const { y, height } = ev.nativeEvent.layout;
                setRowMidpoints((prev) => {
                  const next = [...prev];
                  next[i] = y + height / 2;
                  return next;
                });
              }}
            >
              {showTreeLine && (
                <View style={{
                  position: "absolute",
                  left: (compact ? 16 : 0) + 0.75 - 3,
                  top: "50%",
                  marginTop: -3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.textSecondary + "40",
                  zIndex: 1,
                }} />
              )}
              <View style={[styles.rowInputs, { flex: 1, paddingLeft: showTreeLine ? ((compact ? 16 : 0) + 12) : (compact ? 16 : 0) }]}>
                <View
                  style={{ flex: 1 }}
                  onLayout={i === 0 ? (e) => setKeyColWidth(e.nativeEvent.layout.width) : undefined}
                >
                  <InputWithFocus
                    containerStyle={[
                      styles.keyInput,
                      focusedKeyIndex === i
                        ? {
                            backgroundColor: colors.filterInputBackground,
                            borderColor: colors.border,
                            borderWidth: 1,
                          }
                        : {
                            backgroundColor: "transparent",
                            borderColor: "transparent",
                            borderWidth: 0,
                          },
                    ]}
                    primaryColor={colors.primary}
                    error={false}
                  >
                    <TextInput
                      style={[styles.keyInputText, { color: colors.text }]}
                      placeholder={keyPlaceholder}
                      placeholderTextColor={colors.textSecondary}
                      value={e.key}
                      onChangeText={(v) => handleChange(i, "key", v)}
                      onFocus={() => setFocusedKeyIndex(i)}
                      onBlur={() => setFocusedKeyIndex(null)}
                      editable={!disabled}
                    />
                  </InputWithFocus>
                </View>
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
                  ref={focusedValueIndex === i ? (ref: any) => {
                    // Auto-focus el input de valor cuando se agrega desde sugerencia
                    if (ref && focusedValueIndex === i) {
                      setFocusedValueIndex(null);
                    }
                  } : undefined}
                >
                  <TextInput
                    style={[styles.valueInputText, { color: colors.text }]}
                    placeholder={valuePlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    value={e.value}
                    onChangeText={(v) => handleChange(i, "value", v)}
                    editable={!disabled}
                    autoFocus={focusedValueIndex === i}
                  />
                </InputWithFocus>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(i)}
                  disabled={disabled}
                >
                  <Ionicons
                    name="trash-outline"
                    size={compact ? 18 : 20}
                    color={actionIconColor}
                  />
                </TouchableOpacity>
              </View>
            </View>
            );
          })}
          {/* Fila de acciones: Agregar + Sugerencias */}
          <View style={{ marginTop: 6, paddingLeft: showTreeLine ? ((compact ? 16 : 0) + 12) : (compact ? 16 : 0), flexDirection: "row", alignItems: "center" }}>
            <Tooltip text={addButtonLabel} position="top">
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { borderColor: colors.primary },
                ]}
                onPress={handleAdd}
                disabled={disabled}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                {!isMobile && (
                  <ThemedText type="body2" style={{ color: colors.primary }}>
                    {addButtonLabel}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </Tooltip>
            {availableSuggestions.length > 0 && keyColWidth > 0 && (
              <View style={{ position: "absolute", left: (showTreeLine ? ((compact ? 16 : 0) + 12) : (compact ? 16 : 0)) + keyColWidth + 6, right: 0, flexDirection: "row", alignItems: "center" }}>
                {renderSuggestions()}
              </View>
            )}
          </View>
        </View>
      );
  }
}
