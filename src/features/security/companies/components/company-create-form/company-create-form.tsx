/**
 * Componente reutilizable para formulario de empresa (crear)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { EmailInput, PhoneInput, StatusSelector } from '@/src/domains/shared/components';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { extractErrorInfo } from '@/src/infrastructure/messages/error-utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { CompaniesService } from '../../services';
import { createCompanyFormStyles } from './company-create-form.styles';
import { CompanyCreateFormProps, CompanyFormData } from './company-create-form.types';

export function CompanyCreateForm({
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: CompanyCreateFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = createCompanyFormStyles();

  const [formData, setFormData] = useState<CompanyFormData>({
    code: '',
    name: '',
    email: '',
    phone: '',
    description: '',
    status: 1,
  });
  const formDataRef = useRef<CompanyFormData>({
    code: '',
    name: '',
    email: '',
    phone: '',
    description: '',
    status: 1,
  });
  const statusRef = useRef<number>(1);
  const [errors, setErrors] = useState<Record<keyof CompanyFormData | string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);

  const resetError = useCallback((field: keyof CompanyFormData) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
    // Limpiar error general cuando el usuario empieza a editar
    if (generalError) {
      setGeneralError(null);
    }
  }, [generalError]);

  const handleChange = useCallback(
    (field: keyof CompanyFormData, value: string | number) => {
      setFormData((prev) => {
        let updated = { ...prev, [field]: value };
        
        // Si se está cambiando el código, aplicar transformaciones
        if (field === 'code' && typeof value === 'string') {
          // Convertir a mayúsculas y reemplazar espacios con guiones bajos
          const processedCode = value.toUpperCase().replace(/\s+/g, '_');
          updated.code = processedCode;
          
          // Generar nombre automáticamente solo si está vacío o coincide con el nombre generado anteriormente
          const previousCode = prev.code || '';
          const previousName = prev.name || '';
          
          // Calcular el nombre que se generaría a partir del código anterior
          const previousGeneratedName = previousCode
            .toLowerCase()
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          // Solo generar nombre si está vacío o si coincide exactamente con el nombre generado anteriormente
          if (!previousName || previousName === previousGeneratedName) {
            // Generar nombre: convertir guiones bajos a espacios y capitalizar primera letra de cada palabra
            const generatedName = processedCode
              .toLowerCase()
              .replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            updated.name = generatedName;
          }
        }
        
        // Sincronizar ref inmediatamente
        formDataRef.current = updated;
        return updated;
      });
      if (errors[field]) {
        resetError(field);
      }
      // Actualizar ref para status
      if (field === 'status') {
        statusRef.current = value as number;
      }
    },
    [errors, resetError]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const currentFormData = formDataRef.current;

    if (!currentFormData.code.trim()) {
      newErrors.code = t.security?.companies?.codeRequired || 'El código es requerido';
    }
    if (!currentFormData.name.trim()) {
      newErrors.name = t.security?.companies?.nameRequired || 'El nombre es requerido';
    }
    if (!currentFormData.email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentFormData.email.trim())) {
      newErrors.email = t.security?.companies?.emailInvalid || 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [t.auth.emailRequired, t.security?.companies]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const currentFormData = formDataRef.current;
      await CompaniesService.createCompany({
        code: currentFormData.code.trim(),
        name: currentFormData.name.trim(),
        email: currentFormData.email.trim(),
        phone: currentFormData.phone.trim() || undefined,
        description: currentFormData.description.trim() || undefined,
        status: statusRef.current, // Usar ref para evitar stale closure
      });

      alert.showSuccess(t.security?.companies?.createSuccess || 'Empresa creada exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(error, 'Error al crear la empresa');
      
      // Mostrar error en Toast con detalle si existe
      alert.showError(errorMessage, false, undefined, detailString, error);
      
      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsSubmitting(false);
    }
  }, [alert, onSuccess, t.security?.companies?.createSuccess, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (onFormReady) {
      onFormReady({
        isLoading: isSubmitting,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isSubmitting y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, generalError]);

  const header = showHeader ? (
    <View style={styles.formHeader}>
      <View style={styles.formHeaderTexts}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.companies?.createTitle || 'Crear Empresa'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          {t.security?.companies?.createSubtitle || 'Completa la información para registrar una nueva empresa'}
        </ThemedText>
      </View>
    </View>
  ) : null;

  const footer = showFooter ? (
    <View style={styles.formFooter}>
      <Button
        title={t.common.cancel}
        onPress={handleCancel}
        variant="outlined"
        size="md"
        disabled={isSubmitting}
        style={styles.cancelButton}
      />
      <Button
        title={t.common.save}
        onPress={handleSubmit}
        variant="primary"
        size="md"
        disabled={isSubmitting}
        style={styles.submitButton}
      />
    </View>
  ) : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: showFooter ? 0 : 16 }}>
      {header}
      <Card variant="flat" style={styles.formCard}>
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.companies?.code || 'Código'} *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.code ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.code}
          >
            <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.companies?.codePlaceholder || 'Código único'}
              placeholderTextColor={colors.textSecondary}
              value={formData.code}
              onChangeText={(value) => handleChange('code', value)}
              autoCapitalize="characters"
            />
          </InputWithFocus>
          {errors.code ? (
            <ThemedText type="caption" style={[styles.errorText, { color: colors.error }]}>
              {errors.code}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.companies?.name || 'Nombre'} *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.name ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.name}
          >
            <Ionicons name="business-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.companies?.namePlaceholder || 'Nombre de la empresa'}
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
            />
          </InputWithFocus>
          {errors.name ? (
            <ThemedText type="caption" style={[styles.errorText, { color: colors.error }]}>
              {errors.name}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.companies?.email || 'Email'} *
          </ThemedText>
          <EmailInput
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder={t.security?.companies?.emailPlaceholder || 'Correo de contacto'}
            required
            error={!!errors.email}
            errorMessage={errors.email}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.companies?.phone || 'Teléfono / WhatsApp'}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>
            Número de WhatsApp para Chat IA (opcional pero recomendado)
          </ThemedText>
          <PhoneInput
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            placeholder={t.security?.companies?.phonePlaceholder || 'Teléfono de contacto'}
            error={!!errors.phone}
            errorMessage={errors.phone}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.companies?.description || 'Descripción'}
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                alignItems: 'flex-start',
              },
            ]}
            primaryColor={colors.primary}
          >
            <TextInput
              style={[styles.input, { color: colors.text, height: 96 }]}
              placeholder={t.security?.companies?.descriptionPlaceholder || 'Descripción de la empresa'}
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              multiline
            />
          </InputWithFocus>
        </View>

        {/* Estado */}
        <View style={styles.inputGroup}>
          <StatusSelector
            value={formData.status}
            onChange={(value) => handleChange('status', value)}
            label={t.security?.users?.status || 'Estado'}
            required
          />
        </View>
      </Card>
      {footer}
    </ScrollView>
  );
}

