/**
 * Componente StatusSelector genérico multiplataforma
 * Selector de estado con opciones configurables
 */

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { RecordStatus, getStatusColor } from '@/src/domains/shared/types/status.types';
import React from 'react';
import { ScrollView, TouchableOpacity, View, ViewStyle } from 'react-native';
import { createStatusSelectorStyles } from './status-selector.styles';
import type { StatusOption, StatusSelectorProps } from './status-selector.types';

// Opciones por defecto (sin colores hardcoded - se obtienen del theme)
const DEFAULT_OPTIONS: Omit<StatusOption, 'color'>[] = [
  { value: RecordStatus.ACTIVE, label: 'Activo' },
  { value: RecordStatus.INACTIVE, label: 'Inactivo' },
  { value: RecordStatus.PENDING, label: 'Pendiente' },
  { value: RecordStatus.SUSPENDED, label: 'Suspendido' },
];

// Opciones simples (solo Activo e Inactivo)
const SIMPLE_OPTIONS: Omit<StatusOption, 'color'>[] = [
  { value: RecordStatus.ACTIVE, label: 'Activo' },
  { value: RecordStatus.INACTIVE, label: 'Inactivo' },
];

export function StatusSelector({
  value,
  onChange,
  options,
  simple = false,
  label,
  required = false,
  disabled = false,
  containerStyle,
  optionsContainerStyle,
}: StatusSelectorProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStatusSelectorStyles();

  // Determinar qué opciones usar y añadir colores del theme
  const baseOptions = options || (simple ? SIMPLE_OPTIONS : DEFAULT_OPTIONS);
  const statusOptions: StatusOption[] = baseOptions.map((opt) => ({
    ...opt,
    color: opt.color || getStatusColor(opt.value, colors),
  }));

  // Mapear labels con traducciones
  const getLabel = (optionValue: number, defaultLabel: string): string => {
    switch (optionValue) {
      case 1:
        return t.security?.users?.active || defaultLabel;
      case 0:
        return t.security?.users?.inactive || defaultLabel;
      case 2:
        return t.security?.users?.pending || defaultLabel;
      case 3:
        return t.security?.users?.suspended || defaultLabel;
      default:
        return defaultLabel;
    }
  };

  const finalContainerStyle: ViewStyle | ViewStyle[] = [
    styles.container,
    containerStyle,
  ];

  const finalOptionsContainerStyle: ViewStyle | ViewStyle[] = [
    styles.optionsContainer,
    optionsContainerStyle,
  ];

  return (
    <View style={finalContainerStyle}>
      {label && (
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {label} {required && '*'}
        </ThemedText>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={finalOptionsContainerStyle}>
          {statusOptions.map((option) => {
            const isSelected = value === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  { borderColor: colors.border },
                  isSelected && {
                    backgroundColor: option.color,
                    borderColor: option.color,
                  },
                ]}
                onPress={() => onChange(option.value)}
                disabled={disabled}
              >
                <ThemedText
                  type="caption"
                  style={[
                    styles.optionText,
                    isSelected ? { color: colors.contrastText } : { color: colors.text },
                  ]}
                >
                  {getLabel(option.value, option.label)}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
