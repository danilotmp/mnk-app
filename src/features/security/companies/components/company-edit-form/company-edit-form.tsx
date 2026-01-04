/**
 * Componente reutilizable para formulario de empresa (editar)
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
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { CompaniesService } from '../../services';
import { createCompanyFormStyles } from '../company-create-form/company-create-form.styles';
import { CompanyEditFormProps, CompanyFormData } from './company-edit-form.types';

export function CompanyEditForm({
  companyId,
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: CompanyEditFormProps) {
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
  const [loadingCompany, setLoadingCompany] = useState(true);
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
        const updated = { ...prev, [field]: value };
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

  const loadCompany = useCallback(async () => {
    if (!companyId) {
      alert.showError('ID de empresa no válido');
      return;
    }
    try {
      setLoadingCompany(true);
      const company = await CompaniesService.getCompanyById(companyId);
      const companyStatus = company.status ?? 1;
      statusRef.current = companyStatus;
      const loadedData = {
        code: company.code,
        name: company.name,
        email: company.email,
        phone: company.phone || '',
        description: company.description || '',
        status: companyStatus,
      };
      formDataRef.current = loadedData;
      setFormData(loadedData);
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(error, 'Error al cargar la empresa');
      alert.showError(errorMessage, false, undefined, detailString, error);
    } finally {
      setLoadingCompany(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!companyId) {
      alert.showError('ID de empresa no válido');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentFormData = formDataRef.current;
      await CompaniesService.updateCompany(companyId, {
        code: currentFormData.code.trim(),
        name: currentFormData.name.trim(),
        email: currentFormData.email.trim(),
        phone: currentFormData.phone.trim() || undefined,
        description: currentFormData.description.trim() || undefined,
        status: statusRef.current, // Usar ref para evitar stale closure
      });

      alert.showSuccess(t.security?.companies?.editSuccess || 'Empresa actualizada exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(error, 'Error al actualizar la empresa');
      
      // Mostrar error en Toast con detalle si existe
      alert.showError(errorMessage, false, undefined, detailString, error);
      
      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsSubmitting(false);
    }
  }, [alert, companyId, onSuccess, t.security?.companies?.editSuccess, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (onFormReady && !loadingCompany) {
      onFormReady({
        isLoading: isSubmitting,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isSubmitting, loadingCompany y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, loadingCompany, generalError]);

  if (loadingCompany) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
          {t.common?.loading || 'Cargando información...'}
        </ThemedText>
      </View>
    );
  }

  const header = showHeader ? (
    <View style={styles.formHeader}>
      <View style={styles.formHeaderTexts}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.companies?.editTitle || 'Editar Empresa'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          {t.security?.companies?.editSubtitle || 'Actualiza la información de la empresa seleccionada'}
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
              editable={!isSubmitting}
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
              editable={!isSubmitting}
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
            disabled={isSubmitting}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.companies?.phone || 'Teléfono'}
          </ThemedText>
          <PhoneInput
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            placeholder={t.security?.companies?.phonePlaceholder || 'Teléfono de contacto'}
            error={!!errors.phone}
            errorMessage={errors.phone}
            disabled={isSubmitting}
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
              editable={!isSubmitting}
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
            disabled={isSubmitting}
          />
        </View>
      </Card>
      {footer}
    </ScrollView>
  );
}

