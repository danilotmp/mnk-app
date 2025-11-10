import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { BranchType, BranchesService, useCompanyOptions } from '@/src/domains/security';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createBranchFormStyles } from '@/src/styles/pages/branch-form.styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

interface BranchEditFormProps {
  branchId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void;
}

interface BranchFormData {
  companyId: string;
  code: string;
  name: string;
  type: BranchType;
  description: string;
  isActive: boolean;
}

const BRANCH_TYPES: { label: string; value: BranchType }[] = [
  { label: 'Casa matriz', value: 'headquarters' },
  { label: 'Sucursal', value: 'branch' },
  { label: 'Bodega', value: 'warehouse' },
  { label: 'Tienda', value: 'store' },
];

export function BranchEditForm({
  branchId,
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: BranchEditFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = createBranchFormStyles();

  const { companies, loading: companiesLoading } = useCompanyOptions();

  const [formData, setFormData] = useState<BranchFormData>({
    companyId: '',
    code: '',
    name: '',
    type: 'branch',
    description: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<keyof BranchFormData | string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBranch, setLoadingBranch] = useState(true);

  const resetError = useCallback((field: keyof BranchFormData) => {
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
    (field: keyof BranchFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        resetError(field);
      }
    },
    [errors, resetError]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyId) {
      newErrors.companyId = 'La empresa es requerida';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const loadBranch = useCallback(async () => {
    if (!branchId) {
      alert.showError('ID de sucursal no válido');
      return;
    }

    try {
      setLoadingBranch(true);
      const branch = await BranchesService.getBranchById(branchId);
      setFormData({
        companyId: branch.companyId,
        code: branch.code,
        name: branch.name,
        type: branch.type || 'branch',
        description: branch.description || '',
        isActive: branch.isActive ?? true,
      });
    } catch (error: any) {
      alert.showError(error?.message || 'Error al cargar la sucursal');
    } finally {
      setLoadingBranch(false);
    }
  }, [alert, branchId]);

  useEffect(() => {
    loadBranch();
  }, [loadBranch]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!branchId) {
      alert.showError('ID de sucursal no válido');
      return;
    }

    setIsSubmitting(true);
    try {
      await BranchesService.updateBranch(branchId, {
        companyId: formData.companyId,
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      });
      alert.showSuccess(t.security?.branches?.editSuccess || 'Sucursal actualizada exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const message = error?.message || 'Error al actualizar la sucursal';
      const detail = (error as any)?.result?.details || '';
      alert.showError(message, false, undefined, detail);
    } finally {
      setIsSubmitting(false);
    }
  }, [alert, branchId, formData, onSuccess, t.security?.branches?.editSuccess, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (onFormReady && !loadingBranch && !companiesLoading) {
      onFormReady({
        isLoading: isSubmitting,
        handleSubmit,
        handleCancel,
      });
    }
    // Intencionalmente solo depende de isSubmitting, loadingBranch y companiesLoading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, loadingBranch, companiesLoading]);

  if (loadingBranch || companiesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
          {t.common?.loading || 'Cargando información...'}
        </ThemedText>
      </View>
    );
  }

  const companyOptions = useMemo(() => companies, [companies]);

  const header = showHeader ? (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.branches?.editTitle || 'Editar sucursal'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          {t.security?.branches?.editSubtitle || 'Actualiza la información de la sucursal seleccionada'}
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
            Empresa *
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectOptions}>
              {companyOptions.map((company) => {
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
                    <ThemedText type="body2" style={isSelected ? { color: '#FFFFFF' } : { color: colors.text }}>
                      {company.name}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          {errors.companyId ? (
            <ThemedText type="caption" style={[styles.errorText, { color: colors.error }]}>
              {errors.companyId}
            </ThemedText>
          ) : null}
        </View>

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
            <Ionicons name="barcode-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Código de la sucursal"
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
            <Ionicons name="storefront-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nombre de la sucursal"
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
            Tipo
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectOptions}>
              {BRANCH_TYPES.map((option) => {
                const isSelected = formData.type === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.selectOption,
                      isSelected && { backgroundColor: colors.primary },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleChange('type', option.value)}
                  >
                    <ThemedText type="body2" style={isSelected ? { color: '#FFFFFF' } : { color: colors.text }}>
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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
              placeholder="Descripción de la sucursal"
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
              {formData.isActive ? 'Sucursal activa' : 'Sucursal inactiva'}
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


