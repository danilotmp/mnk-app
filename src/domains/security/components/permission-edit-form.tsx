/**
 * Componente reutilizable para formulario de permiso (editar)
 * Puede usarse tanto en página independiente como en modal
 */

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
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, View } from 'react-native';

interface PermissionEditFormProps {
  permissionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean; // Si false, no muestra el header (útil para modal)
  showFooter?: boolean; // Si false, no muestra los botones (útil para modal con footer fijo)
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void; // Callback para exponer funciones del formulario
}

export function PermissionEditForm({ permissionId, onSuccess, onCancel, showHeader = true, showFooter = true, onFormReady }: PermissionEditFormProps) {
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
  const [loadingPermission, setLoadingPermission] = useState(true);

  /**
   * Cargar datos del permiso
   */
  useEffect(() => {
    const loadPermission = async () => {
      if (!permissionId) {
        alert.showError('ID de permiso no válido');
        return;
      }

      try {
        setLoadingPermission(true);
        const permission = await PermissionsService.getPermissionById(permissionId);
        setFormData({
          name: permission.name,
          code: permission.code,
          module: permission.module,
          action: permission.action,
          description: permission.description || '',
          isActive: permission.isActive ?? true,
        });
      } catch (error: any) {
        alert.showError(error.message || 'Error al cargar permiso');
      } finally {
        setLoadingPermission(false);
      }
    };

    loadPermission();
  }, [permissionId, alert]);

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
    if (field === 'module' || field === 'action') {
      const module = field === 'module' ? value : formData.module;
      const action = field === 'action' ? value : formData.action;
      if (module && action) {
        const newCode = `${module.toLowerCase()}.${action.toLowerCase()}`;
        setFormData((prev) => ({ ...prev, code: newCode }));
      }
    }
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!permissionId) {
      alert.showError('ID de permiso no válido');
      return;
    }

    setIsLoading(true);
    try {
      await PermissionsService.updatePermission(permissionId, {
        name: formData.name.trim(),
        code: formData.code.trim(),
        module: formData.module.trim(),
        action: formData.action.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      });

      alert.showSuccess(t.security?.permissions?.edit || 'Permiso actualizado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar permiso';
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
    onCancel?.();
  };

  /**
   * Exponer funciones del formulario cuando está listo (para footer externo)
   */
  useEffect(() => {
    if (onFormReady && !loadingPermission) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFormReady, loadingPermission, isLoading]);

  if (loadingPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
          Cargando datos...
        </ThemedText>
      </View>
    );
  }

  // Renderizar contenido del formulario (sin ScrollView si está en modal)
  const formContent = (
    <>
      {/* Formulario */}
      <Card variant="flat" style={styles.formCard}>
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

        {/* Code */}
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

        {/* Botones (solo si showFooter es true) */}
        {showFooter && (
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
        )}
      </Card>
    </>
  );

  // Si está en modal (showHeader=false), no usar ScrollView propio (el modal lo maneja)
  if (!showHeader) {
    return <>{formContent}</>;
  }

  // Si está en página independiente, usar ScrollView propio
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {formContent}
    </ScrollView>
  );
}

