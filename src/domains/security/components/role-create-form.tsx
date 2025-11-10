import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { RolesService } from '@/src/domains/security';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { MultiCompanyService } from '@/src/domains/shared/services';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createRoleFormStyles } from '@/src/styles/pages/role-form.styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

interface RoleCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void;
}

export function RoleCreateForm({
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: RoleCreateFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { currentCompany } = useMultiCompany();
  const styles = createRoleFormStyles();

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    companyId: currentCompany?.id || '',
    isActive: true,
    isSystem: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingOptions(true);
        const multiCompanyService = MultiCompanyService.getInstance();
        const availableCompanies = multiCompanyService.getMockCompanies();
        setCompanies(availableCompanies);

        if (currentCompany?.id) {
          setFormData((prev) => ({ ...prev, companyId: currentCompany.id }));
        }
      } catch (error) {
        alert.showError('Error al cargar opciones de empresa');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadCompanies();
  }, [alert, currentCompany?.id]);

  const resetError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'La empresa es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      resetError(field);
    }
  }, [errors, resetError]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await RolesService.createRole({
        name: formData.name.trim(),
        displayName: formData.displayName.trim() || undefined,
        description: formData.description.trim() || undefined,
        companyId: formData.companyId,
        isActive: formData.isActive,
        isSystem: formData.isSystem,
      });

      alert.showSuccess(t.security?.roles?.create || 'Rol creado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const message = error.message || 'Error al crear rol';
      const detail = (error as any)?.result?.details || '';
      alert.showError(message, false, undefined, detail);
    } finally {
      setIsLoading(false);
    }
  }, [alert, formData, onSuccess, t.security?.roles?.create, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (onFormReady && !loadingOptions) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
      });
    }
    // Intencionalmente solo depende de isLoading y loadingOptions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingOptions]);

  if (loadingOptions) {
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
          {t.security?.roles?.create || 'Crear Rol'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          Completa los datos para registrar un nuevo rol
        </ThemedText>
      </View>
    </View>
  ) : null;

  const footerContent = showFooter ? (
    <View style={styles.actions}>
      <Button
        title={t.common.cancel}
        onPress={handleCancel}
        variant="outlined"
        size="md"
        style={styles.cancelButton}
        disabled={isLoading}
      />
      <Button
        title={t.common.save}
        onPress={handleSubmit}
        variant="primary"
        size="md"
        style={styles.submitButton}
        disabled={isLoading}
      />
    </View>
  ) : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: showFooter ? 0 : 24 }}>
      {headerContent}
      <Card variant="flat" style={styles.formCard}>
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.roles?.name || 'Nombre'} *
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
            <Ionicons name="key-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.roles?.name || 'Nombre'}
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              autoCapitalize="words"
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
            Código
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            primaryColor={colors.primary}
          >
            <Ionicons name="text-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Código (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={formData.displayName}
              onChangeText={(value) => handleChange('displayName', value)}
            />
          </InputWithFocus>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.roles?.description || 'Descripción'}
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
              placeholder={t.security?.roles?.description || 'Descripción'}
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </InputWithFocus>
        </View>

        {companies.length > 0 && (
          <View style={styles.inputGroup}>
            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              Empresa
            </ThemedText>
            <View
              style={[
                styles.selectContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.companyId ? colors.error : colors.border,
                },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.selectOptions}>
                  {companies.map((company) => {
                    const isSelected = formData.companyId === company.id;
                    return (
                      <TouchableOpacity
                        key={company.id}
                        style={[
                          styles.selectOption,
                          isSelected && { backgroundColor: colors.primary },
                          { borderColor: colors.border },
                        ]}
                        onPress={() => handleChange('companyId', company.id)}
                      >
                        <ThemedText
                          type="body2"
                          style={{ color: isSelected ? '#FFFFFF' : colors.text }}
                        >
                          {company.name}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
            {errors.companyId ? (
              <ThemedText type="caption" style={{ color: colors.error }}>
                {errors.companyId}
              </ThemedText>
            ) : null}
          </View>
        )}

        <View style={styles.switchGroup}>
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
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={formData.isActive ? colors.primary : colors.textSecondary}
          />
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <ThemedText type="body2" style={{ color: colors.text }}>
              Rol del sistema
            </ThemedText>
            <ThemedText type="caption" variant="secondary" style={styles.helpText}>
              Los roles del sistema no se pueden eliminar
            </ThemedText>
          </View>
          <Switch
            value={formData.isSystem}
            onValueChange={(value) => handleChange('isSystem', value)}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={formData.isSystem ? colors.primary : colors.textSecondary}
          />
        </View>
      </Card>
      {footerContent}
    </ScrollView>
  );
}

