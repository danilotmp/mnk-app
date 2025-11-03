/**
 * Página para crear nuevo usuario
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateUserPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const { company } = useMultiCompany();
  const styles = createUserFormStyles();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyId: company?.id || '',
    roleId: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
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
        // Obtener empresas desde el servicio mock (en producción sería desde el backend)
        const multiCompanyService = MultiCompanyService.getInstance();
        const mockCompanies = multiCompanyService.getMockCompanies();
        setCompanies(mockCompanies);

        // Cargar roles disponibles
        try {
          const rolesResponse = await RolesService.getRoles({
            page: 1,
            limit: 100, // Obtener todos los roles disponibles
            isActive: true, // Solo roles activos
          });
          setRoles(rolesResponse.data);
        } catch (error) {
          // Si falla, continuar sin roles
          setRoles([]);
        }

        // Si hay una empresa seleccionada, usarla por defecto
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

    if (!formData.email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password.trim()) {
      newErrors.password = t.auth.passwordRequired;
    } else if (formData.password.length < 6) {
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

    setIsLoading(true);
    try {
      await UsersService.createUser({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        companyId: formData.companyId,
        roleId: formData.roleId || undefined,
        isActive: formData.isActive,
      });

      alert.showSuccess(t.security?.users?.create || 'Usuario creado exitosamente');
      router.back();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al crear usuario';
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
                {t.security?.users?.create || 'Crear Usuario'}
              </ThemedText>
              <ThemedText type="body2" variant="secondary">
                Completa los datos del nuevo usuario
              </ThemedText>
            </View>
          </View>

          {/* Formulario */}
          <Card style={styles.formCard}>
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

            {/* Password */}
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
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
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

