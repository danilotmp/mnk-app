import { ThemedText } from '@/components/themed-text';
import { Tooltip } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { RichTextEditorModal } from './rich-text-editor-modal';

export interface RichTextEditorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  modalTitle?: string;
}

export function RichTextEditorField({
  label,
  value,
  onChange,
  error,
  placeholder,
  modalTitle,
}: RichTextEditorFieldProps) {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Función para previsualizar el texto sin etiquetas HTML (opcional)
  const getPreviewText = (html: string) => {
    if (!html) return placeholder || 'Sin contenido';
    // Eliminar etiquetas HTML y decodificar entidades básicas
    const stripped = html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    return stripped.length > 100 ? stripped.substring(0, 100) + '...' : stripped;
  };

  return (
    <View style={styles.container}>
      <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
        {label}
      </ThemedText>
      
      <View style={styles.inputRow}>
        <View 
          style={[
            styles.previewContainer, 
            { 
              backgroundColor: colors.surface, 
              borderColor: error ? colors.error : colors.border 
            }
          ]}
        >
          <ThemedText 
            type="caption" 
            numberOfLines={2} 
            style={[styles.previewText, { color: value ? colors.text : colors.textSecondary }]}
          >
            {getPreviewText(value)}
          </ThemedText>
        </View>

        <Tooltip text="Editar contenido" position="top">
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </Tooltip>
      </View>

      {error && (
        <ThemedText type="caption" variant="error" style={styles.errorText}>
          {error}
        </ThemedText>
      )}

      <RichTextEditorModal
        visible={isModalVisible}
        value={value}
        title={modalTitle || label}
        onClose={() => setIsModalVisible(false)}
        onSave={onChange}
      />
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
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  previewText: {
    lineHeight: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  errorText: {
    marginTop: 4,
  },
});
