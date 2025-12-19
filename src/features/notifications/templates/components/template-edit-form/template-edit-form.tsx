import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { NotificationsService } from '@/src/domains/notifications/notifications.service';
import { RichTextEditorField } from '@/src/domains/shared/components';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { extractErrorInfo } from '@/src/infrastructure/messages/error-utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { createTemplateFormStyles } from './template-edit-form.styles';
import { TemplateEditFormProps, TemplateFormData } from './template-edit-form.types';

export function TemplateEditForm({
  templateId,
  initialData,
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: TemplateEditFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = createTemplateFormStyles();

  const [formData, setFormData] = useState<TemplateFormData>({
    code: '',
    lang: 'es',
    subject: '',
    body: '',
    channel: 'email',
    status: 1,
    companyId: null,
    replyTo: '',
    requiredVars: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!templateId && !initialData);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        lang: initialData.lang || 'es',
        subject: initialData.subject || '',
        body: initialData.body || '',
        channel: initialData.channel || 'email',
        status: initialData.status ?? 1,
        companyId: initialData.companyId || null,
        replyTo: initialData.replyTo || '',
        requiredVars: initialData.requiredVars || [],
      });
    }
  }, [initialData]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = 'El código es requerido';
    if (!formData.subject.trim()) newErrors.subject = 'El asunto es requerido';
    if (!formData.body.trim()) newErrors.body = 'El contenido es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const formatCode = (text: string) => {
    return text
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
  };

  const handleChange = (field: keyof TemplateFormData, value: any) => {
    let finalValue = value;
    if (field === 'code') {
      finalValue = formatCode(value);
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (templateId) {
        const updated = await NotificationsService.updateTemplate(templateId, formData);
        alert.showSuccess('Plantilla actualizada exitosamente');
        onSuccess?.(updated);
      } else {
        const created = await NotificationsService.createTemplate(formData);
        alert.showSuccess('Plantilla creada exitosamente');
        onSuccess?.(created);
      }
    } catch (error: any) {
      const { message, detail } = extractErrorInfo(error, 'Error al guardar plantilla');
      setGeneralError({ message, detail });
    } finally {
      setIsLoading(false);
    }
  }, [formData, templateId, validateForm, onSuccess, alert]);

  useEffect(() => {
    if (onFormReady) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel: () => onCancel?.(),
        generalError,
      });
    }
  }, [isLoading, handleSubmit, onCancel, generalError, onFormReady]);

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" style={styles.loadingText}>Cargando plantilla...</ThemedText>
      </View>
    );
  }

  const formContent = (
    <Card variant="flat" style={styles.formCard}>
      {/* Código */}
      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>Código *</ThemedText>
        <InputWithFocus
          containerStyle={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: errors.code ? colors.error : colors.border }
          ]}
          primaryColor={colors.primary}
          error={!!errors.code}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Ej. WELCOME_EMAIL"
            placeholderTextColor={colors.textSecondary}
            value={formData.code}
            onChangeText={(val) => handleChange('code', val)}
            editable={!isLoading && !templateId}
            autoCapitalize="characters"
          />
        </InputWithFocus>
        {errors.code && <ThemedText type="caption" variant="error">{errors.code}</ThemedText>}
      </View>

      {/* Asunto */}
      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>Asunto *</ThemedText>
        <InputWithFocus
          containerStyle={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: errors.subject ? colors.error : colors.border }
          ]}
          primaryColor={colors.primary}
          error={!!errors.subject}
        >
          <Ionicons name="chatbox-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Asunto del correo"
            placeholderTextColor={colors.textSecondary}
            value={formData.subject}
            onChangeText={(val) => handleChange('subject', val)}
            editable={!isLoading}
          />
        </InputWithFocus>
        {errors.subject && <ThemedText type="caption" variant="error">{errors.subject}</ThemedText>}
      </View>

      {/* Idioma */}
      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>Idioma</ThemedText>
        <View style={styles.selectOptions}>
          {['es', 'en'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.selectOption,
                { borderColor: colors.border },
                formData.lang === lang && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => handleChange('lang', lang)}
              disabled={isLoading}
            >
              <ThemedText type="caption" style={{ color: formData.lang === lang ? '#FFF' : colors.text }}>
                {lang === 'es' ? 'Español' : 'Inglés'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contenido (HTML) */}
      <RichTextEditorField
        label="Contenido (HTML) *"
        value={formData.body}
        onChange={(val) => handleChange('body', val)}
        error={errors.body}
        placeholder="Escribe el contenido HTML de la plantilla..."
        modalTitle="Editor de Plantilla"
      />

      {/* Estado */}
      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>Estado *</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.selectOptions}>
            {/* Activo */}
            <TouchableOpacity
              style={[
                styles.selectOption,
                { borderColor: colors.border },
                Number(formData.status) === 1 && { backgroundColor: '#10b981', borderColor: '#10b981' }
              ]}
              onPress={() => handleChange('status', 1)}
              disabled={isLoading}
            >
              <ThemedText type="caption" style={{ color: Number(formData.status) === 1 ? '#FFF' : colors.text }}>Activo</ThemedText>
            </TouchableOpacity>

            {/* Inactivo */}
            <TouchableOpacity
              style={[
                styles.selectOption,
                { borderColor: colors.border },
                Number(formData.status) === 0 && { backgroundColor: '#ef4444', borderColor: '#ef4444' }
              ]}
              onPress={() => handleChange('status', 0)}
              disabled={isLoading}
            >
              <ThemedText type="caption" style={{ color: Number(formData.status) === 0 ? '#FFF' : colors.text }}>Inactivo</ThemedText>
            </TouchableOpacity>

            {/* Pendiente */}
            <TouchableOpacity
              style={[
                styles.selectOption,
                { borderColor: colors.border },
                Number(formData.status) === 2 && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' }
              ]}
              onPress={() => handleChange('status', 2)}
              disabled={isLoading}
            >
              <ThemedText type="caption" style={{ color: Number(formData.status) === 2 ? '#FFF' : colors.text }}>Pendiente</ThemedText>
            </TouchableOpacity>

            {/* Suspendido */}
            <TouchableOpacity
              style={[
                styles.selectOption,
                { borderColor: colors.border },
                Number(formData.status) === 3 && { backgroundColor: '#f97316', borderColor: '#f97316' }
              ]}
              onPress={() => handleChange('status', 3)}
              disabled={isLoading}
            >
              <ThemedText type="caption" style={{ color: Number(formData.status) === 3 ? '#FFF' : colors.text }}>Suspendido</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Variables requeridas */}
      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>Variables requeridas (separadas por coma)</ThemedText>
        <InputWithFocus
          containerStyle={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
          primaryColor={colors.primary}
        >
          <Ionicons name="list-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Ej. name, code, expiry_date"
            placeholderTextColor={colors.textSecondary}
            value={formData.requiredVars?.join(', ')}
            onChangeText={(val) => handleChange('requiredVars', val.split(',').map(s => s.trim()).filter(Boolean))}
            editable={!isLoading}
          />
        </InputWithFocus>
      </View>

      {showFooter && (
        <View style={styles.actions}>
          <Button title="Cancelar" variant="outlined" onPress={() => onCancel?.()} disabled={isLoading} style={styles.cancelButton} />
          <Button title="Guardar" variant="primary" onPress={handleSubmit} loading={isLoading} style={styles.submitButton} />
        </View>
      )}
    </Card>
  );

  if (!showHeader) return formContent;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {formContent}
    </ScrollView>
  );
}
