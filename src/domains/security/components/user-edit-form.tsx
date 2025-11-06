/**
 * Componente reutilizable para formulario de usuario (editar)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { RolesService, UsersService } from '@/src/domains/security';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { MultiCompanyService } from '@/src/domains/shared/services';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createUserFormStyles } from '@/src/styles/pages/user-form.styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

interface UserEditFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean; // Si false, no muestra el header (útil para modal)
  showFooter?: boolean; // Si false, no muestra los botones (útil para modal con footer fijo)
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void; // Callback para exponer funciones del formulario
}

export function UserEditForm({ userId, onSuccess, onCancel, showHeader = true, showFooter = true, onFormReady }: UserEditFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { company } = useMultiCompany();
  const styles = createUserFormStyles();

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyId: '',
    roleId: '',
    isActive: true,
  });
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  /**
   * Cargar opciones (empresas y roles)
   */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const multiCompanyService = MultiCompanyService.getInstance();
        const mockCompanies = multiCompanyService.getMockCompanies();
        setCompanies(mockCompanies);

        try {
          const rolesResponse = await RolesService.getRoles({
            page: 1,
            limit: 100,
            isActive: true,
          });
          setRoles(rolesResponse.data);
        } catch (error) {
          setRoles([]);
        }
      } catch (error) {
        // Silenciar errores
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  /**
   * Cargar datos del usuario
   */
  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        alert.showError('ID de usuario no válido');
        return;
      }

      try {
        setLoadingUser(true);
        const user = await UsersService.getUserById(userId);
        setFormData({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || '',
          companyId: user.companyId,
          roleId: user.roleId || '',
          isActive: user.isActive ?? true,
        });
      } catch (error: any) {
        alert.showError(error.message || 'Error al cargar usuario');
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, [userId, alert]);

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (changePassword && !password.trim()) {
      newErrors.password = t.auth.passwordRequired;
    } else if (changePassword && password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
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

    if (!userId) {
      alert.showError('ID de usuario no válido');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        companyId: formData.companyId,
        roleId: formData.roleId || undefined,
        isActive: formData.isActive,
      };

      if (changePassword && password.trim()) {
        updateData.password = password;
      }

      await UsersService.updateUser(userId, updateData);
      alert.showSuccess(t.security?.users?.edit || 'Usuario actualizado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar usuario';
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
    if (onFormReady && !loadingUser && !loadingOptions) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFormReady, loadingUser, loadingOptions, isLoading]);

  if (loadingUser || loadingOptions) {
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
        {/* Email */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.auth.email} *
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
              placeholder={t.auth.email}
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!isLoading}
            />
          </InputWithFocus>
          {errors.email && (
            <ThemedText type="caption" variant="error" style={styles.errorText}>
              {errors.email}
            </ThemedText>
          )}
        </View>

        {/* Change Password Toggle */}
        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <ThemedText type="body2" style={{ color: colors.text }}>
              Cambiar contraseña
            </ThemedText>
          </View>
          <Switch
            value={changePassword}
            onValueChange={setChangePassword}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={changePassword ? colors.primary : colors.textSecondary}
            disabled={isLoading}
          />
        </View>

        {/* Password (solo si changePassword es true) */}
        {changePassword && (
          <View style={styles.inputGroup}>
            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              {t.auth.password} *
            </ThemedText>
            <InputWithFocus
              containerStyle={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.password ? colors.error : colors.border,
                },
              ]}
              primaryColor={colors.primary}
              error={!!errors.password}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, flex: 1 }]}
                placeholder={t.auth.password}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                editable={!isLoading}
              />
            </InputWithFocus>
            {errors.password && (
              <ThemedText type="caption" variant="error" style={styles.errorText}>
                {errors.password}
              </ThemedText>
            )}
          </View>
        )}

        {/* First Name */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.users?.name || 'Nombre'} *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.firstName ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.firstName}
          >
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nombre"
              placeholderTextColor={colors.textSecondary}
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </InputWithFocus>
          {errors.firstName && (
            <ThemedText type="caption" variant="error" style={styles.errorText}>
              {errors.firstName}
            </ThemedText>
          )}
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            Apellido *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.lastName ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.lastName}
          >
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Apellido"
              placeholderTextColor={colors.textSecondary}
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </InputWithFocus>
          {errors.lastName && (
            <ThemedText type="caption" variant="error" style={styles.errorText}>
              {errors.lastName}
            </ThemedText>
          )}
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.users?.phone || 'Teléfono'}
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
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.users?.phone || 'Teléfono'}
              placeholderTextColor={colors.textSecondary}
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
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

        {/* Role */}
        {roles.length > 0 && (
          <View style={styles.inputGroup}>
            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              {t.security?.users?.role || 'Rol'}
            </ThemedText>
            <View
              style={[
                styles.selectContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.selectOptions}>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      !formData.roleId && {
                        backgroundColor: colors.primary,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleChange('roleId', '')}
                    disabled={isLoading}
                  >
                    <ThemedText
                      type="body2"
                      style={!formData.roleId ? { color: '#FFFFFF' } : { color: colors.text }}
                    >
                      Sin rol
                    </ThemedText>
                  </TouchableOpacity>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.selectOption,
                        formData.roleId === role.id && {
                          backgroundColor: colors.primary,
                        },
                        { borderColor: colors.border },
                      ]}
                      onPress={() => handleChange('roleId', role.id)}
                      disabled={isLoading}
                    >
                      <ThemedText
                        type="body2"
                        style={
                          formData.roleId === role.id
                            ? { color: '#FFFFFF' }
                            : { color: colors.text }
                        }
                      >
                        {role.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

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

