/**
 * Página para crear nuevo permiso
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { PermissionsService } from '@/src/domains/security';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createPermissionFormStyles } from '@/src/styles/pages/permission-form.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreatePermissionPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const alert = useAlert();
  const styles = createPermissionFormStyles();

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
  } = useRouteAccessGuard(pathname);

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

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    } else if (!/^[a-z]+\.[a-z]+$/.test(formData.code.trim())) {
      newErrors.code = 'El código debe tener el formato: módulo.acción (ej: users.view)';
    }

    if (!formData.module.trim()) {
      newErrors.module = 'El módulo es requerido';
    }

    if (!formData.action.trim()) {
      newErrors.action = 'La acción es requerida';
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

    // Auto-generar código si se modifica módulo o acción
    if ((field === 'module' || field === 'action') && formData.module && formData.action) {
      const newCode = `${field === 'module' ? value.toLowerCase() : formData.module.toLowerCase()}.${field === 'action' ? value.toLowerCase() : formData.action.toLowerCase()}`;
      setFormData((prev) => ({ ...prev, code: newCode }));
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
      await PermissionsService.createPermission({
        name: formData.name.trim(),
        code: formData.code.trim(),
        module: formData.module.trim(),
        action: formData.action.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      });

      alert.showSuccess(t.security?.permissions?.create || 'Permiso creado exitosamente');
      router.back();
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      const errorMessage = error.message || 'Error al crear permiso';
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

  if (accessLoading) {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
                {t.common?.loading || 'Cargando información...'}
              </ThemedText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  if (!hasAccess) {
    return null;
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
                {t.security?.permissions?.create || 'Crear Permiso'}
              </ThemedText>
              <ThemedText type="body2" variant="secondary">
                Completa los datos del nuevo permiso
              </ThemedText>
            </View>
          </View>

          {/* Formulario */}
          <Card style={styles.formCard}>
            {/* Name */}
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
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t.security?.permissions?.name || 'Nombre'}
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

            {/* Module */}
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
                <Ionicons name="grid-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t.security?.permissions?.module || 'Módulo (ej: users)'}
                  placeholderTextColor={colors.textSecondary}
                  value={formData.module}
                  onChangeText={(text) => handleChange('module', text)}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </InputWithFocus>
              {errors.module && (
                <ThemedText type="caption" variant="error" style={styles.errorText}>
                  {errors.module}
                </ThemedText>
              )}
            </View>

            {/* Action */}
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
                  placeholder={t.security?.permissions?.action || 'Acción (ej: view, create, edit, delete)'}
                  placeholderTextColor={colors.textSecondary}
                  value={formData.action}
                  onChangeText={(text) => handleChange('action', text)}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </InputWithFocus>
              {errors.action && (
                <ThemedText type="caption" variant="error" style={styles.errorText}>
                  {errors.action}
                </ThemedText>
              )}
            </View>

            {/* Code (generado automáticamente) */}
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
                <Ionicons name="code-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="módulo.acción (ej: users.view)"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.code}
                  onChangeText={(text) => handleChange('code', text)}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </InputWithFocus>
              {errors.code && (
                <ThemedText type="caption" variant="error" style={styles.errorText}>
                  {errors.code}
                </ThemedText>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Descripción
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
                  placeholder="Descripción del permiso"
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

