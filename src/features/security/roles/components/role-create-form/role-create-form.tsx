/**
 * Componente reutilizable para formulario de rol (crear)
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
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { processCodeAndName } from '@/src/infrastructure/utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { createRoleFormStyles } from './role-create-form.styles';
import { RoleCreateFormProps } from './role-create-form.types';

export function RoleCreateForm({
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: RoleCreateFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = createRoleFormStyles();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    companyId: '', // NO establecer automáticamente, el usuario debe seleccionar
    status: 2, // Default: Pendiente
    isSystem: false,
  });
  
  // Refs para mantener los valores actualizados y evitar stale closures
  const nameRef = useRef<string>('');
  const codeRef = useRef<string>('');
  const descriptionRef = useRef<string>('');
  const companyIdRef = useRef<string>(''); // NO establecer automáticamente
  const statusRef = useRef<number>(2); // Default: Pendiente
  const isSystemRef = useRef<boolean>(false);
  
  // Ref para rastrear si el nombre fue modificado manualmente (no sincronizado desde código)
  const nameManuallyEditedRef = useRef<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingOptions(true);
        
        // Intentar cargar empresas del backend
        try {
          const response = await CompaniesService.getCompanies({ page: 1, limit: 100, status: 1 });
          const backendCompanies = response.data || [];
          
          if (backendCompanies.length > 0) {
            setCompanies(backendCompanies);
            // NO establecer companyId automáticamente, el usuario debe seleccionarlo
          } else {
            setCompanies([]);
            // NO establecer companyId automáticamente, el usuario debe seleccionarlo
          }
        } catch (backendError) {
          // Si falla el backend, no cargar empresas
          setCompanies([]);
          // NO establecer companyId automáticamente, el usuario debe seleccionarlo
        }
      } catch (error) {
        // Silenciar errores - simplemente no cargar empresas
        setCompanies([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Cargar empresas solo una vez, sin depender de currentCompany

  const resetError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
    // Limpiar error general cuando el usuario empieza a editar
    if (generalError) {
      setGeneralError(null);
    }
  }, [generalError]);


  const handleChange = useCallback((field: string, value: any) => {
    // Actualizar refs para evitar stale closures
    if (field === 'name') {
      nameRef.current = value;
      // Marcar que el nombre fue editado manualmente
      nameManuallyEditedRef.current = true;
    } else if (field === 'code') {
      codeRef.current = value;
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
      resetError(field);
    }
  }, [errors, resetError]);

  const handleSubmit = useCallback(async () => {
    // Validar usando los valores actuales de los refs
    const newErrors: Record<string, string> = {};
    
    // Validar código (obligatorio)
    if (!codeRef.current.trim()) {
      newErrors.code = 'El código es requerido';
    }
    
    // Validar nombre (obligatorio)
    if (!nameRef.current.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    // Validar empresa (obligatorio)
    // Validar que el companyId existe, no está vacío y está en la lista de empresas disponibles
    const companyIdValue = companyIdRef.current?.trim() || '';
    
    if (!companyIdValue) {
      newErrors.companyId = 'La empresa es requerida';
    } else if (companies.length > 0) {
      // Verificar que el companyId seleccionado esté en la lista de empresas disponibles
      const isValidCompany = companies.some((c) => c.id === companyIdValue);
      if (!isValidCompany) {
        newErrors.companyId = 'La empresa seleccionada no es válida';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Limpiar errores si la validación pasa
    setErrors({});

    setIsLoading(true);
    try {
      // Usar refs para obtener los valores más recientes y evitar stale closures
      // Obtener el valor del companyId del ref
      const companyIdValue = companyIdRef.current?.trim() || '';
      
      // Validación adicional de seguridad (la validación principal ya lo verificó)
      if (!companyIdValue) {
        setErrors({ companyId: 'La empresa es requerida' });
        setIsLoading(false);
        return;
      }
      
      // Verificar que el companyId esté en la lista de empresas disponibles
      if (companies.length > 0) {
        const isValidCompany = companies.some((c) => c.id === companyIdValue);
        if (!isValidCompany) {
          setErrors({ companyId: 'La empresa seleccionada no es válida' });
          setIsLoading(false);
          return;
        }
      }
      
      // Construir payload solo con valores validados
      const createPayload = {
        name: nameRef.current.trim(),
        code: codeRef.current.trim(), // Código es obligatorio
        description: descriptionRef.current.trim() || undefined,
        companyId: companyIdValue, // Solo incluir si está validado y existe en la lista
        status: statusRef.current,
        isSystem: isSystemRef.current,
      };
      
      await RolesService.createRole(createPayload);

      alert.showSuccess(t.security?.roles?.create || 'Rol creado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const message = error.message || 'Error al crear rol';
      const detail = (error as any)?.result?.details || '';
      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message, detail });
    } finally {
      setIsLoading(false);
    }
  }, [alert, companies, onSuccess, t.security?.roles?.create]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

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

  const headerContent = showHeader ? (
    <View style={styles.formHeader}>
      <View style={styles.formHeaderTexts}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.roles?.create || 'Crear Rol'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          {t.security?.roles?.createSubtitle || 'Completa los datos para registrar un nuevo rol'}
        </ThemedText>
      </View>
    </View>
  ) : null;

  const footerContent = showFooter ? (
    <View style={styles.formFooter}>
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
  ) : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: showFooter ? 0 : 24 }}>
      {headerContent}
      {/* InlineAlert para mostrar errores dentro del modal - debajo del subtítulo */}
      {generalError && (
        <InlineAlert
          type="error"
          message={generalError.message}
          detail={generalError.detail}
          onDismiss={() => setGeneralError(null)}
        />
      )}
      <Card variant="flat" style={styles.formCard}>
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.roles?.code || 'Código'} *
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
            <Ionicons name="text-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.roles?.codePlaceholder || 'Código'}
              placeholderTextColor={colors.textSecondary}
              value={formData.code}
              onChangeText={(value) => {
                // Usar utilidades centralizadas para formatear código y nombre
                const { code: processedCode, name: processedName } = processCodeAndName(value);
                
                // Actualizar código con el valor procesado
                handleChange('code', processedCode);
                
                // Limpiar error de código si existe
                if (errors.code) {
                  resetError('code');
                }
                
                // Sincronizar nombre solo si no fue editado manualmente
                if (!nameManuallyEditedRef.current) {
                  nameRef.current = processedName;
                  setFormData((prev) => ({ ...prev, name: processedName }));
                }
              }}
              autoCapitalize="characters"
            />
          </InputWithFocus>
          {errors.code ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.code}
            </ThemedText>
          ) : null}
        </View>

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
              onChangeText={(value) => handleChange('name', value)}
              autoCapitalize="words"
            />
          </InputWithFocus>
          {errors.name ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.name}
            </ThemedText>
          ) : null}
        </View>

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
              style={[styles.input, styles.textArea, { color: colors.text }]}
              placeholder={t.security?.roles?.description || 'Descripción'}
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </InputWithFocus>
        </View>

        <View style={styles.inputGroup}>
          <Select
            label={t.security?.roles?.company || 'Empresa'}
            placeholder={loadingOptions ? (t.security?.roles?.loadingCompanies || 'Cargando empresas...') : (t.security?.roles?.selectCompany || 'Selecciona una empresa')}
            value={formData.companyId || undefined}
            options={companies.map((company) => ({
              value: company.id,
              label: company.name,
            }))}
            onSelect={(value) => handleChange('companyId', value as string)}
            error={!!errors.companyId}
            errorMessage={errors.companyId}
            required
            disabled={isLoading || loadingOptions || companies.length === 0}
            searchable={true}
          />
          {companies.length === 0 && !loadingOptions && (
            <ThemedText type="caption" variant="secondary" style={{ marginTop: 8 }}>
              {t.security?.roles?.noCompaniesAvailable || 'No hay empresas disponibles'}
            </ThemedText>
          )}
        </View>

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

        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <ThemedText type="body2" style={{ color: colors.text }}>
              {t.security?.roles?.systemRole || 'Rol del sistema'}
            </ThemedText>
            <ThemedText type="caption" variant="secondary" style={styles.helpText}>
              {t.security?.roles?.systemRoleDescription || 'Los roles del sistema están protegidos contra eliminación'}
            </ThemedText>
          </View>
          <Switch
            value={formData.isSystem}
            onValueChange={(value) => handleChange('isSystem', value)}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={formData.isSystem ? colors.primary : colors.textSecondary}
          />
        </View>
      </Card>
      {footerContent}
    </ScrollView>
  );
}

