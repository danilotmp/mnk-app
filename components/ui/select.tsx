/**
 * Componente Select/Dropdown reutilizable
 * Soporta selección simple y múltiple
 */

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T = string> {
  value?: T | T[];
  options: SelectOption<T>[];
  onSelect: (value: T | T[]) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  required?: boolean;
}

export function Select<T = string>({
  value,
  options,
  onSelect,
  placeholder = 'Selecciona una opción',
  label,
  error = false,
  errorMessage,
  disabled = false,
  multiple = false,
  searchable = false,
  required = false,
}: SelectProps<T>) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = searchable && searchQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const getSelectedLabel = (): string => {
    if (!value) return placeholder;

    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const selected = options.find((opt) => opt.value === value[0]);
        return selected?.label || placeholder;
      }
      return `${value.length} opciones seleccionadas`;
    }

    const selected = options.find((opt) => opt.value === value);
    return selected?.label || placeholder;
  };

  const handleSelect = (optionValue: T) => {
    if (multiple) {
      const currentValues = (Array.isArray(value) ? value : []) as T[];
      const isSelected = currentValues.includes(optionValue);

      if (isSelected) {
        onSelect(currentValues.filter((v) => v !== optionValue));
      } else {
        onSelect([...currentValues, optionValue]);
      }
    } else {
      onSelect(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const isSelected = (optionValue: T): boolean => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {label} {required && <ThemedText style={{ color: colors.error }}>*</ThemedText>}
        </ThemedText>
      )}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        style={[
          styles.select,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
          disabled && styles.disabled,
        ]}
        disabled={disabled}
      >
        <ThemedText
          type="body2"
          style={[
            styles.selectText,
            { color: value ? colors.text : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {getSelectedLabel()}
        </ThemedText>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
      {error && errorMessage && (
        <ThemedText type="caption" style={[styles.errorText, { color: colors.error }]}>
          {errorMessage}
        </ThemedText>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, { backgroundColor: colors.background }]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText type="h4" style={[styles.modalTitle, { color: colors.text }]}>
                {label || 'Seleccionar opción'}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {searchable && options.length > 5 && (
              <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Buscar..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={true}>
              {filteredOptions.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText type="body2" variant="secondary" style={styles.emptyText}>
                    No hay opciones disponibles
                  </ThemedText>
                </View>
              ) : (
                filteredOptions.map((option) => {
                  const selected = isSelected(option.value);
                  const optionDisabled = option.disabled || disabled;

                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      onPress={() => !optionDisabled && handleSelect(option.value)}
                      style={[
                        styles.option,
                        {
                          backgroundColor: selected ? colors.primary : 'transparent',
                          opacity: optionDisabled ? 0.5 : 1,
                        },
                        selected && styles.selectedOption,
                      ]}
                      disabled={optionDisabled}
                    >
                      <ThemedText
                        type="body2"
                        style={[
                          styles.optionText,
                          { color: selected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                      {selected && (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {multiple && Array.isArray(value) && value.length > 0 && (
              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    onSelect([]);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="refresh" size={16} color={colors.textSecondary || '#999'} />
                  <ThemedText type="body2" style={{ color: colors.textSecondary || '#999' }}>
                    Limpiar selección
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  style={[styles.doneButton, { backgroundColor: colors.primary }]} 
                >
                  <ThemedText type="body2" style={{ color: '#FFFFFF' }}>
                    Aceptar
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  selectText: {
    flex: 1,
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  errorText: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  clearSearchButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 400,
    paddingBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedOption: {
    // Estilo adicional para opción seleccionada si es necesario
  },
  optionText: {
    flex: 1,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

