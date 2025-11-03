/**
 * Página para crear nuevo rol
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateRolePage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const { company } = useMultiCompany();
  const styles = createRoleFormStyles();

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    companyId: company?.id || '',
    isActive: true,
    isSystem: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  /**
   * Cargar opciones (empresas)
   */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const multiCompanyService = MultiCompanyService.getInstance();
        const mockCompanies = multiCompanyService.getMockCompanies();
        setCompanies(mockCompanies);

        if (company?.id) {
          setFormData((prev) => ({ ...prev, companyId: company.id }));
        }
      } catch (error) {
        // Silenciar errores
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [company]);

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'La empresa es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Manejar cambio de campo
   */
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async () => {
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
      router.back();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al crear rol';
      const errorDetail = (error as any)?.result?.details || '';
      alert.showError(errorMessage, false, undefined, errorDetail);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manejar cancelar
   */
  const handleCancel = () => {
    router.back();
  };

  if (loadingOptions) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
            Cargando opciones...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <ThemedText type="h2" style={styles.title}>
                {t.security?.roles?.create || 'Crear Rol'}
              </ThemedText>
              <ThemedText type="body2" variant="secondary">
                Completa los datos del nuevo rol
              </ThemedText>
            </View>
          </View>

          {/* Formulario */}
          <Card style={styles.formCard}>
            {/* Name */}
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
                  onChangeText={(text) => handleChange('name', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </InputWithFocus>
              {errors.name && (
                <ThemedText type="caption" variant="error" style={styles.errorText}>
                  {errors.name}
                </ThemedText>
              )}
            </View>

            {/* Display Name */}
            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Nombre para mostrar
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
                  placeholder="Nombre para mostrar (opcional)"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.displayName}
                  onChangeText={(text) => handleChange('displayName', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </InputWithFocus>
            </View>

            {/* Description */}
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
                  style={[
                    styles.input,
                    styles.textArea,
                    { color: colors.text },
                  ]}
                  placeholder={t.security?.roles?.description || 'Descripción'}
                  placeholderTextColor={colors.textSecondary}
                  value={formData.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isLoading}
                />
              </InputWithFocus>
            </View>

            {/* Company */}
            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Empresa *
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
                    {companies.map((comp) => (
                      <TouchableOpacity
                        key={comp.id}
                        style={[
                          styles.selectOption,
                          formData.companyId === comp.id && {
                            backgroundColor: colors.primary,
                          },
                          { borderColor: colors.border },
                        ]}
                        onPress={() => handleChange('companyId', comp.id)}
                        disabled={isLoading}
                      >
                        <ThemedText
                          type="body2"
                          style={
                            formData.companyId === comp.id
                              ? { color: '#FFFFFF' }
                              : { color: colors.text }
                          }
                        >
                          {comp.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {errors.companyId && (
                <ThemedText type="caption" variant="error" style={styles.errorText}>
                  {errors.companyId}
                </ThemedText>
              )}
            </View>

            {/* Is Active */}
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
                disabled={isLoading}
              />
            </View>

            {/* Is System */}
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
                disabled={isLoading}
              />
            </View>

            {/* Botones */}
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
                loading={isLoading}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

