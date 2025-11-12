import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { CompaniesService } from '@/src/domains/security/services';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createCompanyFormStyles } from '@/src/styles/pages/company-form.styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

interface CompanyCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void;
}

interface CompanyFormData {
  code: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  status: number;
}

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
  
  const statusRef = useRef<number>(1);
  const [errors, setErrors] = useState<Record<keyof CompanyFormData | string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetError = useCallback((field: keyof CompanyFormData) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleChange = useCallback(
    (field: keyof CompanyFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        resetError(field);
      }
    },
    [errors, resetError]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t.auth.emailRequired]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await CompaniesService.createCompany({
        code: formData.code.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      });

      alert.showSuccess(t.security?.companies?.createSuccess || 'Empresa creada exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const message = error?.message || 'Error al crear la empresa';
      const detail = (error as any)?.result?.details || '';
      alert.showError(message, false, undefined, detail);
    } finally {
      setIsSubmitting(false);
    }
  }, [alert, formData, onSuccess, t.security?.companies?.createSuccess, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (onFormReady) {
      onFormReady({
        isLoading: isSubmitting,
        handleSubmit,
        handleCancel,
      });
    }
    // Intencionalmente solo depende de isSubmitting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting]);

  const header = showHeader ? (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.companies?.createTitle || 'Crear empresa'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          {t.security?.companies?.createSubtitle || 'Completa la información para registrar una nueva empresa'}
        </ThemedText>
      </View>
    </View>
  ) : null;

  const footer = showFooter ? (
    <View style={styles.actions}>
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
            Código *
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
              placeholder="Código único"
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
            Nombre *
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
              placeholder="Nombre de la empresa"
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

        <View style={styles.inlineInputs}>
          <View style={styles.inlineInput}>
            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              Email *
            </ThemedText>
            <InputWithFocus
              containerStyle={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.email ? colors.error : colors.border,
                },
              ]}
              primaryColor={colors.primary}
              error={!!errors.email}
            >
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Correo de contacto"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </InputWithFocus>
            {errors.email ? (
              <ThemedText type="caption" style={[styles.errorText, { color: colors.error }]}>
                {errors.email}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.inlineInput}>
            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              Teléfono
            </ThemedText>
            <InputWithFocus
              containerStyle={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.phone ? colors.error : colors.border,
                },
              ]}
              primaryColor={colors.primary}
              error={!!errors.phone}
            >
              <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Teléfono de contacto"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
              />
            </InputWithFocus>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            Descripción
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
              placeholder="Descripción de la empresa"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              multiline
            />
          </InputWithFocus>
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <ThemedText type="body2" style={{ color: colors.text }}>
              Estado
            </ThemedText>
            <ThemedText type="caption" variant="secondary">
              {formData.isActive ? 'Empresa activa' : 'Empresa inactiva'}
            </ThemedText>
          </View>
          <Switch
            value={formData.isActive}
            onValueChange={(value) => handleChange('isActive', value)}
            thumbColor={formData.isActive ? colors.primary : colors.border}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </Card>
      {footer}
    </ScrollView>
  );
}


