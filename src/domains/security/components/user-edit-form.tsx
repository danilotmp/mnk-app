/**
 * Componente reutilizable para formulario de usuario (editar)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { RolesService, UsersService, useBranchOptions, useCompanyOptions } from '@/src/domains/security';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createUserFormStyles } from '@/src/styles/pages/user-form.styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

interface UserEditFormProps {
  userId: string;
  onSuccess?: (updatedUser?: any) => void; // Pasar el usuario actualizado para optimización
  onCancel?: () => void;
  showHeader?: boolean; // Si false, no muestra el header (útil para modal)
  showFooter?: boolean; // Si false, no muestra los botones (útil para modal con footer fijo)
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void; // Callback para exponer funciones del formulario
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyId: string;
  branchIds: string[];
  roleId: string;
  isActive: boolean;
}

export function UserEditForm({ userId, onSuccess, onCancel, showHeader = true, showFooter = true, onFormReady }: UserEditFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = createUserFormStyles();

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyId: '',
    branchIds: [] as string[],
    roleId: '',
    isActive: true,
  });
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const isInitialLoadRef = useRef(true); // Flag para controlar carga inicial (useRef para evitar re-renders)
  const loadedCompanyIdRef = useRef<string | null>(null); // Guardar el companyId ya cargado
  const phoneRef = useRef<string>(''); // Ref para mantener el teléfono actualizado
  const { companies, loading: companiesLoading } = useCompanyOptions();
  const {
    branches,
    loading: branchesLoading,
    refresh: refreshBranches,
  } = useBranchOptions({ autoFetch: false, includeInactive: false, immediate: false });
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  /**
   * Cargar opciones (empresas y roles)
   */
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
        isInitialLoadRef.current = true;
        const user = await UsersService.getUserById(userId);
        
        // Primero cargar las sucursales si hay companyId
        if (user.companyId) {
          await refreshBranches({ companyId: user.companyId });
          loadedCompanyIdRef.current = user.companyId; // Guardar el companyId cargado
        }
        
        // Extraer branchIds correctamente
        // El backend puede devolver branchIds (string[]) o availableBranches (objeto[])
        let userBranchIds: string[] = [];
        
        if (Array.isArray(user.branchIds) && user.branchIds.length > 0) {
          // Si viene branchIds directamente como array de strings
          userBranchIds = user.branchIds;
        } else if (Array.isArray((user as any).availableBranches) && (user as any).availableBranches.length > 0) {
          // Si viene availableBranches como array de objetos, extraer los IDs
          // Manejar ambos formatos: {id: "..."} o {branchId: "..."}
          userBranchIds = (user as any).availableBranches.map((branch: any) => {
            // Priorizar branchId, luego id (manejar ambos formatos)
            return branch.branchId || branch.id;
          }).filter((id: any) => id); // Filtrar valores nulos/undefined
        }
        
        // Guardar el phone en la ref
        phoneRef.current = user.phone || '';
        
        // Luego establecer los datos del formulario, incluyendo branchIds
        // Esto asegura que las sucursales ya estén cargadas cuando se establezcan los branchIds
        setFormData({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || '',
          companyId: user.companyId,
          branchIds: userBranchIds,
          roleId: user.roleId || '',
          isActive: user.isActive ?? true,
        });
        
        // Marcar como no inicial inmediatamente DESPUÉS de cargar
        isInitialLoadRef.current = false;
      } catch (error: any) {
        alert.showError(error.message || 'Error al cargar usuario');
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /**
   * Efecto para cargar sucursales cuando el usuario cambia manualmente la empresa
   * (no durante la carga inicial para evitar llamadas duplicadas)
   */
  useEffect(() => {
    // No ejecutar durante la carga inicial o si el companyId no cambió
    if (isInitialLoadRef.current || !formData.companyId || loadedCompanyIdRef.current === formData.companyId) {
      return;
    }
    refreshBranches({ companyId: formData.companyId });
    loadedCompanyIdRef.current = formData.companyId; // Actualizar el companyId cargado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.companyId]);


  /**
   * Validar formulario
   */
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t.auth?.emailRequired || 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (changePassword && !password.trim()) {
      newErrors.password = t.auth?.passwordRequired || 'La contraseña es requerida';
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

    if (!formData.branchIds || formData.branchIds.length === 0) {
      newErrors.branchIds = 'Selecciona al menos una sucursal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, changePassword, password, t.auth]);

  /**
   * Manejar cambio de campo
   */
  const handleChange = useCallback((field: string, value: any) => {
    // Si es el campo phone, guardar en la ref también
    if (field === 'phone') {
      phoneRef.current = value;
    }
    
    setFormData((prev) => {
      if (field === 'companyId') {
        if (prev.companyId === value) {
          return prev;
        }
        return { ...prev, companyId: value, branchIds: [] };
      }
      return { ...prev, [field]: value };
    });
    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

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
      setErrors((prev) => ({ ...prev, branchIds: '' }));
    },
    []
  );

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!userId) {
      alert.showError('ID de usuario no válido');
      return;
    }

    setIsLoading(true);
    try {
      // Usar phoneRef.current en lugar de formData.phone para asegurar el último valor
      const updateData: any = {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: phoneRef.current.trim(),
        companyId: formData.companyId,
        roleId: formData.roleId || undefined,
        branchIds: formData.branchIds,
        isActive: formData.isActive,
      };

      if (changePassword && password.trim()) {
        updateData.password = password;
      }

      const updatedUser = await UsersService.updateUserComplete(userId, updateData);
      // No mostrar alert aquí, el componente padre lo maneja
      // Pasar el usuario actualizado al componente padre para optimización
      onSuccess?.(updatedUser);
    } catch (error: any) {
      const errorMessage = error.message || 'Error al actualizar usuario';
      const errorDetail = (error as any)?.result?.details || '';
      alert.showError(errorMessage, false, undefined, errorDetail);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, formData, changePassword, password, userId, alert, onSuccess]);

  /**
   * Manejar cancelar
   */
  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  /**
   * Exponer funciones del formulario cuando está listo (para footer externo)
   */
  const loadingOptions = companiesLoading || rolesLoading || (formData.companyId ? branchesLoading : false);

  // Llamar onFormReady solo cuando el componente está listo o cuando isLoading cambia
  useEffect(() => {
    if (onFormReady && !loadingUser && !loadingOptions) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
      });
    }
    // Intencionalmente solo depende de isLoading, loadingUser y loadingOptions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingUser, loadingOptions]);

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
            {t.auth?.email || 'Email'} *
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
              placeholder={t.auth?.email || 'Email'}
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
              {t.auth?.password || 'Contraseña'} *
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
                placeholder={t.auth?.password || 'Contraseña'}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                editable={!isLoading}
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
            <Ionicons name="call-outline" size={20} color={colors.textSecondary || '#999'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.users?.phone || 'Teléfono'}
              placeholderTextColor={colors.textSecondary || '#999'}
              value={formData.phone}
              onChangeText={(text) => {
                // Solo permitir números, espacios y algunos caracteres de teléfono
                const cleaned = text.replace(/[^\d\s+()-]/g, '');
                handleChange('phone', cleaned);
              }}
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

        {/* Branches */}
        {formData.companyId ? (
          <View style={styles.inputGroup}>
            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              Sucursales *
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
                  {branches.map((branch) => {
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
                        disabled={isLoading}
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
            {errors.branchIds && (
              <ThemedText type="caption" variant="error" style={styles.errorText}>
                {errors.branchIds}
              </ThemedText>
            )}
          </View>
        ) : null}

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
              title={t.common?.cancel || 'Cancelar'}
              onPress={handleCancel}
              variant="outlined"
              size="md"
              style={styles.cancelButton}
              disabled={isLoading}
            />
            <Button
              title={t.common?.save || 'Guardar'}
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

