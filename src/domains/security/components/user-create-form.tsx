import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { RolesService, UsersService, useBranchOptions, useCompanyOptions } from '@/src/domains/security';
import { useMultiCompany } from '@/src/domains/shared/hooks';
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
    branchIds: [] as string[],
    roleId: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { companies, loading: companiesLoading } = useCompanyOptions();
  const {
    branches,
    loading: branchesLoading,
    refresh: refreshBranches,
  } = useBranchOptions({ autoFetch: false, includeInactive: false, immediate: false });
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const resetErrors = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setRolesLoading(true);
        const rolesResponse = await RolesService.getRoles({
          page: 1,
          limit: 100,
          isActive: true,
        });
        setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
      } catch (error) {
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };

    loadRoles();
  }, []);

  useEffect(() => {
    if (currentCompany?.id && !formData.companyId) {
      setFormData((prev) => ({ ...prev, companyId: currentCompany.id }));
    }
  }, [currentCompany?.id, formData.companyId]);

  useEffect(() => {
    if (!formData.companyId) {
      return;
    }
    refreshBranches({ companyId: formData.companyId });
  }, [formData.companyId, refreshBranches]);

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

    if (!formData.branchIds.length) {
      newErrors.branchIds = 'Selecciona al menos una sucursal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t.auth.emailRequired, t.auth.passwordRequired]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => {
      if (field === 'companyId') {
        return {
          ...prev,
          companyId: value,
          branchIds: [],
        };
      }
      return { ...prev, [field]: value };
    });
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
        phone: formData.phone.trim(), // Enviar siempre, incluso si es cadena vacía
        companyId: formData.companyId,
        branchIds: formData.branchIds,
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

  const loadingOptions = companiesLoading || rolesLoading || (formData.companyId ? branchesLoading : false);

  const toggleBranchSelection = useCallback(
    (branchId: string) => {
      setFormData((prev) => {
        const exists = prev.branchIds.includes(branchId);
        const branchIds = exists
          ? prev.branchIds.filter((id) => id !== branchId)
          : [...prev.branchIds, branchId];
        return { ...prev, branchIds };
      });
      // Limpiar error de branchIds cuando el usuario selecciona al menos una sucursal
      resetErrors('branchIds');
    },
    [resetErrors]
  );

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
  const branchesOptions = branches;

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
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ padding: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
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
            onChangeText={(text) => {
              // Solo permitir números, espacios y algunos caracteres de teléfono
              const cleaned = text.replace(/[^\d\s+()-]/g, '');
              handleChange('phone', cleaned);
            }}
            keyboardType="phone-pad"
          />
        </InputWithFocus>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}
        >{t.security?.users?.company || 'Empresa'} *</ThemedText>
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
              {companiesOptions.map((company) => {
                const isSelected = formData.companyId === company.id;
                return (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.selectOption,
                      { borderColor: colors.border },
                      isSelected && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleChange('companyId', company.id)}
                  >
                    <ThemedText
                      type="body2"
                      style={isSelected ? { color: '#FFFFFF' } : { color: colors.text }}
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

      {formData.companyId ? (
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}
          >{t.security?.users?.branches || 'Sucursales'} *</ThemedText>
          {branchesOptions.length > 0 ? (
            <View
              style={[
                styles.selectContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.branchIds ? colors.error : colors.border,
                },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.selectOptions}>
                  {branchesOptions.map((branch) => {
                    const isSelected = formData.branchIds.includes(branch.id);
                    return (
                      <TouchableOpacity
                        key={branch.id}
                        style={[
                          styles.selectOption,
                          { borderColor: colors.border },
                          isSelected && {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => toggleBranchSelection(branch.id)}
                      >
                        <ThemedText
                          type="body2"
                          style={isSelected ? { color: '#FFFFFF' } : { color: colors.text }}
                        >
                          {branch.name}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : (
            <ThemedText type="caption" variant="secondary" style={{ marginTop: 8 }}>
              {t.security?.users?.noBranches || 'No hay sucursales disponibles para la empresa seleccionada'}
            </ThemedText>
          )}
          {errors.branchIds ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.branchIds}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}
        >{t.security?.users?.role || 'Rol'}</ThemedText>
        <View style={[styles.selectContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectOptions}>
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  { borderColor: colors.border },
                  !formData.roleId && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => handleChange('roleId', '')}
              >
                <ThemedText
                  type="body2"
                  style={!formData.roleId ? { color: '#FFFFFF' } : { color: colors.text }}
                >
                  {t.security?.users?.noRole || 'Sin rol'}
                </ThemedText>
              </TouchableOpacity>
              {rolesOptions.map((role) => {
                const isSelected = formData.roleId === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.selectOption,
                      { borderColor: colors.border },
                      isSelected && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleChange('roleId', role.id)}
                  >
                    <ThemedText
                      type="body2"
                      style={isSelected ? { color: '#FFFFFF' } : { color: colors.text }}
                    >
                      {role.name}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.switchGroup}>
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

