/**
 * Componente unificado para seleccionar familia de icono y nombre del icono
 * Combina un dropdown de familia con un input de nombre en un solo componente visual
 */

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { DynamicIcon, getIconFamilies } from '@/src/domains/shared/components/dynamic-icon/dynamic-icon';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { IconInputProps } from './icon-input.types';

/**
 * Parsea el valor del icono para extraer familia y nombre
 */
function parseIconValue(value: string): { family: string; name: string } {
  if (!value) {
    return { family: 'Ionicons', name: '' };
  }
  
  const parts = value.split(':');
  if (parts.length === 2) {
    return {
      family: parts[0].trim(),
      name: parts[1].trim(),
    };
  }
  
  // Si no tiene formato "Familia:Nombre", asumir Ionicons
  return {
    family: 'Ionicons',
    name: value.trim(),
  };
}

export function IconInput({
  value,
  onChange,
  placeholder = 'Nombre del icono',
  disabled = false,
  error = false,
}: IconInputProps) {
  const { colors } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);
  const { family, name } = parseIconValue(value);
  
  const iconFamilies = getIconFamilies();
  const selectedFamilyIndex = iconFamilies.findIndex(f => f === family);
  const currentFamily = iconFamilies[selectedFamilyIndex >= 0 ? selectedFamilyIndex : 0];

  const handleFamilySelect = (selectedFamily: string) => {
    const newValue = name.trim() ? `${selectedFamily}:${name.trim()}` : '';
    onChange(newValue);
    setIsDropdownOpen(false);
    // Enfocar el input después de seleccionar familia
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleNameChange = (newName: string) => {
    const newValue = newName.trim() ? `${currentFamily}:${newName.trim()}` : '';
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const styles = createIconInputStyles(colors);

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
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
      }

      return () => {
        clearInterval(interval);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
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
          isFocused && !error && { borderColor: colors.primary, borderWidth: 2 },
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
            name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>

        {/* Separador visual */}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* Input de nombre del icono con preview */}
        <View style={styles.iconInputContainer}>
          <DynamicIcon
            name={name.trim() ? `${currentFamily}:${name.trim()}` : 'image-outline'}
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
              Platform.OS === 'web' && ({
                outline: 'none',
                outlineWidth: 0,
                outlineColor: 'transparent',
                WebkitAppearance: 'none',
                appearance: 'none',
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
              }
            ]}
          >
            <View 
              style={[
                styles.dropdown, 
                { 
                  backgroundColor: colors.background, // Fondo sólido (surface es transparente en dark theme)
                  borderColor: colors.border,
                }
              ]}
            >
              <ScrollView 
                style={[styles.dropdownScroll, { backgroundColor: colors.background }]} // Fondo sólido (surface es transparente en dark theme)
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {iconFamilies.map((fam) => (
                  <Pressable
                    key={fam}
                    style={[
                      styles.dropdownItem,
                      { backgroundColor: 'transparent' },
                      fam === currentFamily && { backgroundColor: colors.primary + '20' },
                    ]}
                    onPress={() => handleFamilySelect(fam)}
                  >
                    <ThemedText
                      type="body2"
                      style={[
                        styles.dropdownItemText,
                        { color: fam === currentFamily ? colors.primary : colors.text },
                      ]}
                    >
                      {fam}
                    </ThemedText>
                    {fam === currentFamily && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
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

const createIconInputStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      position: 'relative',
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      minHeight: 48,
      overflow: 'visible', // Cambiar a 'visible' para que el dropdown se vea correctamente
    },
    inputGroupError: {
      borderColor: colors.error,
    },
    familySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 12,
      minWidth: 120,
      borderRightWidth: 0,
    },
    familyText: {
      flex: 1,
      marginRight: 8,
      fontSize: 14,
    },
    separator: {
      width: 1,
      height: 24,
      marginVertical: 8,
    },
    iconInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 8,
      minWidth: 0, // Prevenir que el input se salga del contenedor
      borderWidth: 0, // Sin borde interno
      backgroundColor: 'transparent', // Sin fondo que pueda crear borde visual
    },
    iconPreview: {
      marginRight: 4,
    },
    input: {
      flex: 1,
      fontSize: 14,
      padding: 0,
      margin: 0,
      minWidth: 0, // Prevenir que el input se salga del contenedor
      borderWidth: 0, // Eliminar cualquier borde del input
      borderColor: 'transparent', // Sin color de borde
      backgroundColor: 'transparent', // Sin fondo
      // Estilos web para eliminar outline completamente
      ...(Platform.OS === 'web' && {
        outline: 'none',
        outlineWidth: 0,
        outlineStyle: 'none',
        outlineColor: 'transparent',
        WebkitAppearance: 'none',
        appearance: 'none',
        border: 'none',
        boxShadow: 'none',
      }),
    },
    disabled: {
      opacity: 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalContent: {
      position: 'absolute',
      borderRadius: 8,
      maxHeight: 200,
      ...Platform.select({
        web: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.25)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        },
      }),
    },
    dropdown: {
      borderRadius: 8,
      borderWidth: 1,
      maxHeight: 200,
      backgroundColor: colors.background, // Fondo sólido
      overflow: 'hidden', // Para que el contenido no se salga
      opacity: 1, // Asegurar opacidad completa
    },
    dropdownScroll: {
      maxHeight: 200,
      backgroundColor: colors.background, // Fondo sólido para el ScrollView
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
    },
    dropdownItemText: {
      flex: 1,
      fontSize: 14,
    },
  });
};

