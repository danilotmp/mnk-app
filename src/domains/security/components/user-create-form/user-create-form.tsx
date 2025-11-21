/**
 * Componente reutilizable para formulario de usuario (crear)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Select } from '@/components/ui/select';
import { useTheme } from '@/hooks/use-theme';
import { RolesService, UsersService, useBranchOptions, useCompanyOptions } from '@/src/domains/security';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { createUserFormStyles } from './user-create-form.styles';
import { UserCreateFormProps } from './user-create-form.types';

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

  const initialFormData = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyId: currentCompany?.id || '',
    branchIds: [] as string[],
    roleId: '',
    status: 1, // Default: Activo
  };
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);
  const branchIdsRef = useRef<string[]>([]); // Ref para mantener los branchIds actualizados
  const roleIdRef = useRef<string>(''); // Ref para mantener el roleId actualizado
  const statusRef = useRef<number>(1); // Ref para mantener el status actualizado
  const formDataRef = useRef(initialFormData); // Ref para mantener el formData actualizado y evitar stale closure
  
  // Sincronizar el ref cuando cambia el formData desde efectos externos
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
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
    // Limpiar error general cuando el usuario empieza a editar
    if (generalError) {
      setGeneralError(null);
    }
  }, [generalError]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setRolesLoading(true);
        const rolesResponse = await RolesService.getRoles({
          page: 1,
          limit: 100,
          status: 1, // ✅ Solo roles activos
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
    
    // Validar que companyId sea un UUID válido antes de hacer la llamada
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(formData.companyId)) {
      // No hacer la llamada si el ID no es válido (ej: "company-1")
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

    // Usar branchIdsRef.current para evitar stale closure
    if (!branchIdsRef.current.length) {
      newErrors.branchIds = 'Selecciona al menos una sucursal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t.auth.emailRequired, t.auth.passwordRequired]);

  const handleChange = useCallback((field: string, value: any) => {
    // Guardar en refs para evitar stale closure
    if (field === 'roleId') {
      roleIdRef.current = value;
    }
    if (field === 'status') {
      statusRef.current = value;
    }
    
    setFormData((prev) => {
      const updated = field === 'companyId'
        ? {
            ...prev,
            companyId: value,
            branchIds: [], // Resetear branchIds cuando cambia la empresa
          }
        : { ...prev, [field]: value };
      
      // Actualizar el ref con el estado más reciente para evitar stale closure
      formDataRef.current = updated;
      
      if (field === 'companyId') {
        // Resetear branchIds cuando cambia la empresa
        branchIdsRef.current = [];
      }
      
      return updated;
    });
    if (errors[field]) {
      resetErrors(field);
    }
  }, [errors, resetErrors]);

  const handleSubmit = useCallback(async () => {
    // Usar el ref para obtener el estado más reciente y evitar stale closure
    const currentFormData = formDataRef.current;
    
    // Validar con el estado actual
    const newErrors: Record<string, string> = {};
    if (!currentFormData.email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentFormData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!currentFormData.password.trim()) {
      newErrors.password = t.auth.passwordRequired;
    } else if (currentFormData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!currentFormData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    if (!currentFormData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    if (!currentFormData.companyId) {
      newErrors.companyId = 'La empresa es requerida';
    }
    if (!branchIdsRef.current.length) {
      newErrors.branchIds = 'Selecciona al menos una sucursal';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Construir payload usando el ref para obtener los valores más recientes
      const payload: any = {
        email: currentFormData.email.trim(),
        password: currentFormData.password,
        firstName: currentFormData.firstName.trim(),
        lastName: currentFormData.lastName.trim(),
        phone: currentFormData.phone.trim(),
        companyId: currentFormData.companyId,
        branchIds: branchIdsRef.current,
        status: statusRef.current, // Usar ref para evitar stale closure
      };
      
      // Solo incluir roleId si tiene un valor válido
      if (roleIdRef.current && roleIdRef.current.trim()) {
        payload.roleId = roleIdRef.current.trim();
      }
      
      // ✅ Usar createUser() - el endpoint POST /users acepta roleId y branchIds
      await UsersService.createUser(payload);

      alert.showSuccess(t.security?.users?.create || 'Usuario creado exitosamente');
      onSuccess?.();
      onCancel?.();
    } catch (error: any) {
      const backendResult = (error as any)?.result;
      const rawDetails = backendResult?.details ?? error?.details;
      const detailString =
        typeof rawDetails === 'string'
          ? rawDetails
          : rawDetails?.message
          ? String(rawDetails.message)
          : undefined;

      const errorMessage =
        backendResult?.description || error?.message || 'Error al crear usuario';

      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsLoading(false);
    }
  }, [alert, onCancel, onSuccess, t.auth.emailRequired, t.auth.passwordRequired, t.security?.users?.create]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const loadingOptions = companiesLoading || rolesLoading || (formData.companyId ? branchesLoading : false);


  useEffect(() => {
    if (onFormReady && !loadingOptions) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isLoading, loadingOptions y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingOptions, generalError]);

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

      <View style={styles.inputGroup}>
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

      <View style={styles.inputGroup}>
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
        <Select
          label={t.security?.users?.company || 'Empresa'}
          placeholder={t.security?.users?.selectCompany || 'Selecciona una empresa'}
          value={formData.companyId}
          options={companiesOptions.map((company) => ({
            value: company.id,
            label: company.name,
          }))}
          onSelect={(value) => handleChange('companyId', value as string)}
          error={!!errors.companyId}
          errorMessage={errors.companyId}
          required
          searchable={true}
        />
      </View>

      {formData.companyId ? (
        <View style={styles.inputGroup}>
          <Select
            label={t.security?.users?.branches || 'Sucursales'}
            placeholder={t.security?.users?.selectBranches || 'Selecciona una o más sucursales'}
            value={formData.branchIds}
            options={
              branchesOptions.length > 0
                ? branchesOptions.map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  }))
                : []
            }
            onSelect={(value) => {
              const selectedIds = value as string[];
              setFormData((prev) => {
                const updated = { ...prev, branchIds: selectedIds };
                branchIdsRef.current = selectedIds;
                formDataRef.current = updated;
                return updated;
              });
              if (selectedIds.length > 0) {
                resetErrors('branchIds');
              }
            }}
            error={!!errors.branchIds}
            errorMessage={errors.branchIds}
            multiple={true}
            required
            disabled={branchesOptions.length === 0}
            searchable={true}
          />
          {branchesOptions.length === 0 && (
            <ThemedText type="caption" variant="secondary" style={{ marginTop: 8 }}>
              {t.security?.users?.noBranches || 'No hay sucursales disponibles para la empresa seleccionada'}
            </ThemedText>
          )}
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <Select
          label={t.security?.users?.role || 'Rol'}
          placeholder={t.security?.users?.noRole || 'Sin rol'}
          value={formData.roleId || undefined}
          options={[
            { value: '', label: t.security?.users?.noRole || 'Sin rol' },
            ...rolesOptions.map((role) => ({
              value: role.id,
              label: role.name,
            })),
          ]}
          onSelect={(value) => handleChange('roleId', value as string)}
          searchable={true}
        />
      </View>

      {/* Estado */}
      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
          {t.security?.users?.status || 'Estado'} *
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.selectOptions}>
              {/* Activo */}
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  { borderColor: colors.border },
                  formData.status === 1 && {
                    backgroundColor: '#10b981',
                    borderColor: '#10b981',
                  },
                ]}
                onPress={() => handleChange('status', 1)}
                disabled={isLoading}
              >
                <ThemedText
                  type="caption"
                  style={formData.status === 1 ? { color: '#FFFFFF' } : { color: colors.text }}
                >
                  {t.security?.users?.active || 'Activo'}
                </ThemedText>
              </TouchableOpacity>

              {/* Inactivo */}
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  { borderColor: colors.border },
                  formData.status === 0 && {
                    backgroundColor: '#ef4444',
                    borderColor: '#ef4444',
                  },
                ]}
                onPress={() => handleChange('status', 0)}
                disabled={isLoading}
              >
                <ThemedText
                  type="caption"
                  style={formData.status === 0 ? { color: '#FFFFFF' } : { color: colors.text }}
                >
                  {t.security?.users?.inactive || 'Inactivo'}
                </ThemedText>
              </TouchableOpacity>

              {/* Pendiente */}
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  { borderColor: colors.border },
                  formData.status === 2 && {
                    backgroundColor: '#f59e0b',
                    borderColor: '#f59e0b',
                  },
                ]}
                onPress={() => handleChange('status', 2)}
                disabled={isLoading}
              >
                <ThemedText
                  type="caption"
                  style={formData.status === 2 ? { color: '#FFFFFF' } : { color: colors.text }}
                >
                  {t.security?.users?.pending || 'Pendiente'}
                </ThemedText>
              </TouchableOpacity>

              {/* Suspendido */}
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  { borderColor: colors.border },
                  formData.status === 3 && {
                    backgroundColor: '#f97316',
                    borderColor: '#f97316',
                  },
                ]}
                onPress={() => handleChange('status', 3)}
                disabled={isLoading}
              >
                <ThemedText
                  type="caption"
                  style={formData.status === 3 ? { color: '#FFFFFF' } : { color: colors.text }}
                >
                  {t.security?.users?.suspended || 'Suspendido'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
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

