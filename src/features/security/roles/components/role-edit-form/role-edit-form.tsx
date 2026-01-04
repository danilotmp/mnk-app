/**
 * Componente reutilizable para formulario de rol (editar)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Select } from '@/components/ui/select';
import { useTheme } from '@/hooks/use-theme';
import { RolesService } from '../../services';
import { CompaniesService } from '@/src/features/security/companies';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { CustomSwitch } from '@/src/domains/shared/components/custom-switch/custom-switch';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { extractErrorInfo } from '@/src/infrastructure/messages/error-utils';
import { processCodeAndName } from '@/src/infrastructure/utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { createRoleFormStyles } from '../role-create-form/role-create-form.styles';
import { RoleEditFormProps } from './role-edit-form.types';

export function RoleEditForm({ roleId, onSuccess, onCancel, showHeader = true, showFooter = true, onFormReady }: RoleEditFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { company } = useMultiCompany();
  const styles = createRoleFormStyles();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    companyId: '',
    status: 1, // Default: Activo
    isSystem: false,
  });
  
  // Refs para mantener los valores actualizados y evitar stale closures
  const codeRef = useRef<string>('');
  const nameRef = useRef<string>('');
  const descriptionRef = useRef<string>('');
  const companyIdRef = useRef<string>('');
  const statusRef = useRef<number>(1);
  const isSystemRef = useRef<boolean>(false);
  
  // Ref para rastrear si el nombre fue modificado manualmente (no sincronizado desde código)
  const nameManuallyEditedRef = useRef<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  /**
   * Cargar opciones (empresas)
   */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        
        // Intentar cargar empresas del backend
        try {
          const response = await CompaniesService.getCompanies({ page: 1, limit: 100, status: 1 });
          const backendCompanies = response.data || [];
          
          if (backendCompanies.length > 0) {
            setCompanies(backendCompanies);
          } else {
            setCompanies([]);
          }
        } catch (backendError) {
          // Si falla el backend, no cargar empresas
          setCompanies([]);
        }
      } catch (error) {
        // Silenciar errores - simplemente no cargar empresas
        setCompanies([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  /**
   * Cargar datos del rol
   */
  useEffect(() => {
    const loadRole = async () => {
      if (!roleId) {
        alert.showError('ID de rol no válido');
        return;
      }

      try {
        setLoadingRole(true);
        const role = await RolesService.getRoleById(roleId);
        const roleStatus = role.status ?? 1;
        statusRef.current = roleStatus;
        
        const roleCode = role.code || '';
        const roleName = role.name || '';
        const roleDescription = role.description || '';
        const roleCompanyId = role.companyId || ''; // Obtener companyId del rol
        const roleIsSystem = role.isSystem ?? false;
        
        // Actualizar refs
        codeRef.current = roleCode;
        nameRef.current = roleName;
        descriptionRef.current = roleDescription;
        companyIdRef.current = roleCompanyId;
        statusRef.current = roleStatus;
        isSystemRef.current = roleIsSystem;
        
        // Resetear el flag de edición manual del nombre cuando se carga un rol
        nameManuallyEditedRef.current = false;
        
        // Establecer formData con el companyId del rol
        // Si hay empresas cargadas y el companyId del rol existe en ellas, se preseleccionará
        setFormData((prev) => ({
          name: roleName,
          code: roleCode,
          description: roleDescription,
          companyId: roleCompanyId, // Establecer companyId del rol
          status: roleStatus,
          isSystem: roleIsSystem,
        }));
      } catch (error: any) {
        const { message: errorMessage, detail: detailString } = extractErrorInfo(error, 'Error al cargar rol');
        alert.showError(errorMessage, false, undefined, detailString, error);
      } finally {
        setLoadingRole(false);
      }
    };

    loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  /**
   * Validar formulario
   */
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Usar ref para evitar stale closure
    if (!nameRef.current.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  /**
   * Manejar cambio de campo
   */
  const handleChange = useCallback((field: string, value: any) => {
    // Actualizar refs para evitar stale closures
    if (field === 'code') {
      codeRef.current = value;
    } else if (field === 'name') {
      nameRef.current = value;
      // Marcar que el nombre fue editado manualmente
      nameManuallyEditedRef.current = true;
    } else if (field === 'description') {
      descriptionRef.current = value;
    } else if (field === 'companyId') {
      companyIdRef.current = value;
    } else if (field === 'status') {
      statusRef.current = value;
    } else if (field === 'isSystem') {
      isSystemRef.current = value;
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    // Limpiar error general cuando el usuario empieza a editar
    if (generalError) {
      setGeneralError(null);
    }
  }, [errors, generalError]);

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!roleId) {
      alert.showError('ID de rol no válido');
      return;
    }

    setIsLoading(true);
    try {
      // Usar refs para obtener los valores más recientes y evitar stale closures
      const updatePayload = {
        name: nameRef.current.trim(),
        code: codeRef.current.trim() || undefined,
        description: descriptionRef.current.trim() || undefined,
        companyId: companyIdRef.current || undefined,
        status: statusRef.current,
        isSystem: isSystemRef.current,
      };
      
      await RolesService.updateRole(roleId, updatePayload);

      alert.showSuccess(t.security?.roles?.edit || 'Rol actualizado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(error, 'Error al actualizar rol');
      
      // Mostrar error en Toast con detalle si existe
      alert.showError(errorMessage, false, undefined, detailString, error);
      
      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsLoading(false);
    }
  }, [alert, onSuccess, roleId, t.security?.roles?.edit, validateForm]);

  /**
   * Manejar cancelar
   */
  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  /**
   * Exponer funciones del formulario cuando está listo (para footer externo)
   */
  useEffect(() => {
    if (onFormReady && !loadingRole && !loadingOptions) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isLoading, loadingRole, loadingOptions y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingRole, loadingOptions, generalError]);

  if (loadingRole || loadingOptions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
          {t.common?.loading || 'Cargando datos...'}
        </ThemedText>
      </View>
    );
  }

  // Renderizar contenido del formulario (sin ScrollView si está en modal)
  const formContent = (
    <>
      {/* InlineAlert para mostrar errores dentro del modal - debajo del subtítulo */}
      {generalError && (
        <InlineAlert
          type="error"
          message={generalError.message}
          detail={generalError.detail}
          onDismiss={() => setGeneralError(null)}
        />
      )}
      {/* Formulario */}
      <Card variant="flat" style={styles.formCard}>
        {/* Code */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.roles?.code || 'Código'}
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
              placeholder={t.security?.roles?.codePlaceholderOptional || 'Código (opcional)'}
              placeholderTextColor={colors.textSecondary}
              value={formData.code}
              onChangeText={(text) => {
                // Usar utilidades centralizadas para formatear código y nombre
                const { code: processedCode, name: processedName } = processCodeAndName(text);
                
                // Actualizar código con el valor procesado
                handleChange('code', processedCode);
                
                // Sincronizar nombre solo si no fue editado manualmente
                if (!nameManuallyEditedRef.current) {
                  nameRef.current = processedName;
                  setFormData((prev) => ({ ...prev, name: processedName }));
                }
              }}
              autoCapitalize="characters"
              editable={!isLoading}
            />
          </InputWithFocus>
        </View>

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
        {companies.length > 0 && (
          <View style={styles.inputGroup}>
            <Select
              label={t.security?.roles?.company || 'Empresa'}
              placeholder={t.security?.roles?.selectCompany || 'Selecciona una empresa'}
              value={formData.companyId || undefined}
              options={companies.map((comp) => ({
                value: comp.id,
                label: comp.name,
              }))}
              onSelect={(value) => handleChange('companyId', value as string)}
              disabled={isLoading}
              searchable={true}
            />
          </View>
        )}

        {/* Estado */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.users?.status || 'Estado'}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectOptions}>
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
                  Pendiente
                </ThemedText>
              </TouchableOpacity>
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
                  Suspendido
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Is System */}
        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <ThemedText type="body2" style={{ color: colors.text }}>
              {t.security?.roles?.systemRole || 'Rol del sistema'}
            </ThemedText>
            <ThemedText type="caption" variant="secondary" style={styles.helpText}>
              {t.security?.roles?.systemRoleDescription || 'Los roles del sistema están protegidos contra eliminación'}
            </ThemedText>
          </View>
          <CustomSwitch
            value={formData.isSystem}
            onValueChange={(value) => handleChange('isSystem', value)}
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

