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
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

interface UserCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void;
}

export function UserCreateForm({
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: UserCreateFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { currentCompany } = useMultiCompany();
  const styles = createUserFormStyles();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyId: currentCompany?.id || '',
    roleId: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const resetErrors = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

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
          setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
        } catch (error) {
          setRoles([]);
        }

        if (currentCompany?.id) {
          setFormData((prev) => ({ ...prev, companyId: currentCompany.id }));
        }
      } catch (error) {
        // silenciar errores de opciones
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [currentCompany?.id]);

  const validateForm = useCallback(() => {
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
  }, [formData, t.auth.emailRequired, t.auth.passwordRequired]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      resetErrors(field);
    }
  }, [errors, resetErrors]);

  const handleSubmit = useCallback(async () => {
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
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al crear usuario';
      const errorDetail = (error as any)?.result?.details || '';
      alert.showError(errorMessage, false, undefined, errorDetail);
    } finally {
      setIsLoading(false);
    }
  }, [alert, formData, onSuccess, t.security?.users?.create, validateForm]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFormReady, loadingOptions, isLoading, handleSubmit, handleCancel]);

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

  const formHeader = showHeader ? (
    <View style={styles.formHeader}>
      <View style={styles.formHeaderTexts}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.users?.create || 'Crear Usuario'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          {t.security?.users?.createSubtitle || 'Completa los datos para registrar un nuevo usuario'}
        </ThemedText>
      </View>
    </View>
  ) : null;

  const footerButtons = showFooter ? (
    <View style={styles.formFooter}>
      <Button title={t.common.cancel} onPress={handleCancel} variant="outlined" size="md" disabled={isLoading} />
      <Button title={t.common.save} onPress={handleSubmit} variant="primary" size="md" disabled={isLoading} />
    </View>
  ) : null;

  const companiesOptions = companies;
  const rolesOptions = roles;

  const formContent = (
    <Card variant="flat" style={styles.formCard}>
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
            onChangeText={(value) => handleChange('email', value)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </InputWithFocus>
        {errors.email ? (
          <ThemedText type="caption" style={{ color: colors.error }}>
            {errors.email}
          </ThemedText>
        ) : null}
      </View>

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
            style={[styles.input, { color: colors.text }]}
            placeholder={t.auth.password}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
          />
        </InputWithFocus>
        {errors.password ? (
          <ThemedText type="caption" style={{ color: colors.error }}>
            {errors.password}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.inlineInputs}>
        <View style={[styles.inlineInput, styles.inlineInputLeft]}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.users?.firstName || 'Nombre'} *
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
              placeholder={t.security?.users?.firstNamePlaceholder || 'Nombre del usuario'}
              placeholderTextColor={colors.textSecondary}
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              autoCapitalize="words"
            />
          </InputWithFocus>
          {errors.firstName ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.firstName}
            </ThemedText>
          ) : null}
        </View>

        <View style={[styles.inlineInput, styles.inlineInputRight]}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.users?.lastName || 'Apellido'} *
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
            <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.users?.lastNamePlaceholder || 'Apellido del usuario'}
              placeholderTextColor={colors.textSecondary}
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              autoCapitalize="words"
            />
          </InputWithFocus>
          {errors.lastName ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.lastName}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {t.security?.users?.phone || 'Teléfono'}
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
            placeholder={t.security?.users?.phonePlaceholder || 'Teléfono de contacto'}
            placeholderTextColor={colors.textSecondary}
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            keyboardType="phone-pad"
          />
        </InputWithFocus>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {t.security?.users?.company || 'Empresa'} *
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={styles.tagList}>
            {companiesOptions.map((company) => {
              const isSelected = formData.companyId === company.id;
              return (
                <TouchableOpacity
                  key={company.id}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleChange('companyId', company.id)}
                >
                  <ThemedText type="body2" style={{ color: isSelected ? '#FFFFFF' : colors.text }}>
                    {company.name}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        {errors.companyId ? (
          <ThemedText type="caption" style={{ color: colors.error }}>
            {errors.companyId}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {t.security?.users?.role || 'Rol'}
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={styles.tagList}>
            {rolesOptions.map((role) => {
              const isSelected = formData.roleId === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleChange('roleId', role.id)}
                >
                  <ThemedText type="body2" style={{ color: isSelected ? '#FFFFFF' : colors.text }}>
                    {role.name}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <ThemedText type="body2" style={{ color: colors.text }}>
            {t.security?.users?.status || 'Estado'}
          </ThemedText>
          <ThemedText type="caption" variant="secondary">
            {formData.isActive ? (t.security?.users?.active || 'Activo') : (t.security?.users?.inactive || 'Inactivo')}
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
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: showFooter ? 0 : 24 }}>
      {formHeader}
      {formContent}
      {footerButtons}
    </ScrollView>
  );
}

