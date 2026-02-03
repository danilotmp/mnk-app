/**
 * Componente unificado para seleccionar familia de icono y nombre del icono
 * Combina un dropdown de familia con un input de nombre en un solo componente visual
 */

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import {
    DynamicIcon,
    getIconFamilies,
} from "@/src/domains/shared/components/dynamic-icon/dynamic-icon";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    LayoutChangeEvent,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { createIconInputStyles } from "./icon-input.styles";
import type { IconInputProps } from "./icon-input.types";

/**
 * Parsea el valor del icono para extraer familia y nombre
 */
function parseIconValue(value: string): { family: string; name: string } {
  if (!value) {
    return { family: "Ionicons", name: "" };
  }

  const parts = value.split(":");
  if (parts.length === 2) {
    return {
      family: parts[0].trim(),
      name: parts[1].trim(),
    };
  }

  // Si no tiene formato "Familia:Nombre", asumir Ionicons
  return {
    family: "Ionicons",
    name: value.trim(),
  };
}

export function IconInput({
  value,
  onChange,
  placeholder = "Nombre del icono",
  disabled = false,
  error = false,
}: IconInputProps) {
  const { colors, shadows } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [containerLayout, setContainerLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);
  const { family, name } = parseIconValue(value);

  const iconFamilies = getIconFamilies();
  const selectedFamilyIndex = iconFamilies.findIndex((f) => f === family);
  const currentFamily =
    iconFamilies[selectedFamilyIndex >= 0 ? selectedFamilyIndex : 0];

  const handleFamilySelect = (selectedFamily: string) => {
    const newValue = name.trim() ? `${selectedFamily}:${name.trim()}` : "";
    onChange(newValue);
    setIsDropdownOpen(false);
    // Enfocar el input después de seleccionar familia
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleNameChange = (newName: string) => {
    const newValue = newName.trim() ? `${currentFamily}:${newName.trim()}` : "";
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const styles = createIconInputStyles({ colors, shadows });

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setContainerLayout({ x: pageX, y: pageY, width, height });
    });
  };

  // Actualizar posición del dropdown cuando hay scroll o cambios de layout
  useEffect(() => {
    if (isDropdownOpen) {
      const updatePosition = () => {
        containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setContainerLayout({ x: pageX, y: pageY, width, height });
        });
      };

      // Actualizar posición periódicamente mientras el dropdown está abierto
      const interval = setInterval(updatePosition, 100);

      // También actualizar en eventos de scroll
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
      }

      return () => {
        clearInterval(interval);
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.removeEventListener("scroll", updatePosition, true);
          window.removeEventListener("resize", updatePosition);
        }
      };
    }
  }, [isDropdownOpen]);

  return (
    <View style={styles.container}>
      <View
        ref={containerRef}
        onLayout={handleContainerLayout}
        style={[
          styles.inputGroup,
          error && styles.inputGroupError,
          isFocused &&
            !error && { borderColor: colors.primary, borderWidth: 2 },
        ]}
      >
        {/* Dropdown de familia */}
        <Pressable
          style={[styles.familySelector, disabled && styles.disabled]}
          onPress={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
        >
          <ThemedText
            type="body2"
            style={[styles.familyText, { color: colors.text }]}
            numberOfLines={1}
          >
            {currentFamily}
          </ThemedText>
          <Ionicons
            name={isDropdownOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>

        {/* Separador visual */}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* Input de nombre del icono con preview */}
        <View style={styles.iconInputContainer}>
          <DynamicIcon
            name={
              name.trim() ? `${currentFamily}:${name.trim()}` : "image-outline"
            }
            size={20}
            color={name.trim() ? colors.primary : colors.textSecondary}
            style={styles.iconPreview}
          />
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { color: colors.text },
              // Estilos web para eliminar outline
              Platform.OS === "web" &&
                ({
                  outline: "none",
                  outlineWidth: 0,
                  outlineColor: "transparent",
                  WebkitAppearance: "none",
                  appearance: "none",
                } as any),
            ]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={handleNameChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCapitalize="none"
            editable={!disabled}
          />
        </View>
      </View>

      {/* Dropdown de familias (se abre debajo del selector usando Modal para estar encima) */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsDropdownOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContent,
              {
                top: containerLayout.y + containerLayout.height + 4,
                left: containerLayout.x,
                width: containerLayout.width || 200, // Fallback si aún no se ha medido
                backgroundColor: colors.background, // Fondo sólido para el contenedor (surface es transparente en dark theme)
              },
            ]}
          >
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.background, // Fondo sólido (surface es transparente en dark theme)
                  borderColor: colors.border,
                },
              ]}
            >
              <ScrollView
                style={[
                  styles.dropdownScroll,
                  { backgroundColor: colors.background },
                ]} // Fondo sólido (surface es transparente en dark theme)
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {iconFamilies.map((fam) => (
                  <Pressable
                    key={fam}
                    style={[
                      styles.dropdownItem,
                      { backgroundColor: "transparent" },
                      fam === currentFamily && {
                        backgroundColor: colors.primary + "20",
                      },
                    ]}
                    onPress={() => handleFamilySelect(fam)}
                  >
                    <ThemedText
                      type="body2"
                      style={[
                        styles.dropdownItemText,
                        {
                          color:
                            fam === currentFamily
                              ? colors.primary
                              : colors.text,
                        },
                      ]}
                    >
                      {fam}
                    </ThemedText>
                    {fam === currentFamily && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
