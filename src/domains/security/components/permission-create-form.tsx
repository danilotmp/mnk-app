import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { PermissionsService } from '@/src/domains/security';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createPermissionFormStyles } from '@/src/styles/pages/permission-form.styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, View } from 'react-native';

interface PermissionCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void;
}

export function PermissionCreateForm({
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: PermissionCreateFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = createPermissionFormStyles();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    module: '',
    action: '',
    description: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  const resetError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.module.trim()) {
      newErrors.module = 'El módulo es requerido';
    }

    if (!formData.action.trim()) {
      newErrors.action = 'La acción es requerida';
    }

    const codeValue = formData.code.trim();
    if (!codeValue) {
      newErrors.code = 'El código es requerido';
    } else if (!/^[a-z]+\.[a-z]+$/.test(codeValue)) {
      newErrors.code = 'El código debe tener el formato módulo.acción (ej: users.view)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'module' || field === 'action') {
        const moduleValue = field === 'module' ? value : updated.module;
        const actionValue = field === 'action' ? value : updated.action;
        if (moduleValue && actionValue) {
          updated.code = `${String(moduleValue).toLowerCase()}.${String(actionValue).toLowerCase()}`;
        }
      }

      return updated;
    });

    if (errors[field]) {
      resetError(field);
    }
    if ((field === 'module' || field === 'action') && errors.code) {
      resetError('code');
    }
  }, [errors, resetError]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await PermissionsService.createPermission({
        name: formData.name.trim(),
        code: formData.code.trim(),
        module: formData.module.trim(),
        action: formData.action.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      });

      alert.showSuccess(t.security?.permissions?.create || 'Permiso creado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const message = error.message || 'Error al crear permiso';
      const detail = (error as any)?.result?.details || '';
      alert.showError(message, false, undefined, detail);
    } finally {
      setIsLoading(false);
    }
  }, [alert, formData, onSuccess, t.security?.permissions?.create, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (onFormReady && !loadingInitial) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
      });
    }
    // Intencionalmente solo depende de isLoading y loadingInitial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingInitial]);

  if (loadingInitial) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
          {t.common?.loading || 'Cargando información...'}
        </ThemedText>
      </View>
    );
  }

  const headerContent = showHeader ? (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.permissions?.create || 'Crear Permiso'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          Completa los datos del nuevo permiso
        </ThemedText>
      </View>
    </View>
  ) : null;

  const footerContent = showFooter ? (
    <View style={styles.formFooter}>
      <Button title={t.common.cancel} onPress={handleCancel} variant="outlined" size="md" disabled={isLoading} />
      <Button title={t.common.save} onPress={handleSubmit} variant="primary" size="md" disabled={isLoading} />
    </View>
  ) : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: showFooter ? 0 : 24 }}>
      {headerContent}
      <Card style={styles.formCard}>
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.permissions?.name || 'Nombre'} *
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
            <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.permissions?.namePlaceholder || 'Nombre del permiso'}
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              autoCapitalize="sentences"
            />
          </InputWithFocus>
          {errors.name ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.name}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.permissions?.module || 'Módulo'} *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.module ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.module}
          >
            <Ionicons name="layers-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.permissions?.modulePlaceholder || 'Módulo (ej: users)'}
              placeholderTextColor={colors.textSecondary}
              value={formData.module}
              onChangeText={(value) => handleChange('module', value)}
              autoCapitalize="none"
            />
          </InputWithFocus>
          {errors.module ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.module}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.permissions?.action || 'Acción'} *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.action ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.action}
          >
            <Ionicons name="flash-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.permissions?.actionPlaceholder || 'Acción (ej: view)'}
              placeholderTextColor={colors.textSecondary}
              value={formData.action}
              onChangeText={(value) => handleChange('action', value)}
              autoCapitalize="none"
            />
          </InputWithFocus>
          {errors.action ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.action}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.permissions?.code || 'Código'} *
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
            <Ionicons name="barcode-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="módulo.acción"
              placeholderTextColor={colors.textSecondary}
              value={formData.code}
              onChangeText={(value) => handleChange('code', value)}
              autoCapitalize="none"
            />
          </InputWithFocus>
          {errors.code ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.code}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.permissions?.description || 'Descripción'}
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                minHeight: 100,
              },
            ]}
            primaryColor={colors.primary}
          >
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text }]}
              placeholder={t.security?.permissions?.descriptionPlaceholder || 'Descripción del permiso'}
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </InputWithFocus>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <ThemedText type="body2" style={{ color: colors.text }}>
              {formData.isActive
                ? t.security?.users?.active || 'Activo'
                : t.security?.users?.inactive || 'Inactivo'}
            </ThemedText>
          </View>
          <Switch
            value={formData.isActive}
            onValueChange={(value) => handleChange('isActive', value)}
            thumbColor={formData.isActive ? colors.primary : colors.textSecondary}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </Card>
      {footerContent}
    </ScrollView>
  );
}

