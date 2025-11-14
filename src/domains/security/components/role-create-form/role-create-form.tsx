/**
 * Componente reutilizable para formulario de rol (crear)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { RolesService, CompaniesService } from '@/src/domains/security';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
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
  const { currentCompany } = useMultiCompany();
  const styles = createRoleFormStyles();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    companyId: currentCompany?.id || '',
    status: 1, // Default: Activo
    isSystem: false,
  });
  
  // Refs para mantener los valores actualizados y evitar stale closures
  const nameRef = useRef<string>('');
  const codeRef = useRef<string>('');
  const descriptionRef = useRef<string>('');
  const companyIdRef = useRef<string>(currentCompany?.id || '');
  const statusRef = useRef<number>(1);
  const isSystemRef = useRef<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
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
            
            // Establecer companyId inicial si hay currentCompany y coincide con alguna empresa del backend
            if (currentCompany?.id) {
              const matchingCompany = backendCompanies.find((c) => c.id === currentCompany.id);
              if (matchingCompany) {
                companyIdRef.current = currentCompany.id;
                setFormData((prev) => ({ ...prev, companyId: currentCompany.id }));
              }
            }
          } else {
            // Fallback: usar currentCompany directamente si está disponible
            setCompanies([]);
            if (currentCompany?.id) {
              companyIdRef.current = currentCompany.id;
              setFormData((prev) => ({ ...prev, companyId: currentCompany.id }));
            }
          }
        } catch (backendError) {
          // Si falla el backend, usar currentCompany directamente si está disponible
          setCompanies([]);
          if (currentCompany?.id) {
            companyIdRef.current = currentCompany.id;
            setFormData((prev) => ({ ...prev, companyId: currentCompany.id }));
          }
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
  }, [currentCompany?.id]);

  const resetError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);


  const handleChange = useCallback((field: string, value: any) => {
    // Actualizar refs para evitar stale closures
    if (field === 'name') {
      nameRef.current = value;
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
    
    if (!nameRef.current.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (companies.length > 0 && !companyIdRef.current) {
      newErrors.companyId = 'La empresa es requerida';
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
      const createPayload = {
        name: nameRef.current.trim(),
        code: codeRef.current.trim() || undefined,
        description: descriptionRef.current.trim() || undefined,
        companyId: companyIdRef.current || undefined,
        status: statusRef.current,
        isSystem: isSystemRef.current,
      };
      
      await RolesService.createRole(createPayload);

      alert.showSuccess(t.security?.roles?.create || 'Rol creado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const message = error.message || 'Error al crear rol';
      const detail = (error as any)?.result?.details || '';
      alert.showError(message, false, undefined, detail);
    } finally {
      setIsLoading(false);
    }
  }, [alert, companies.length, onSuccess, t.security?.roles?.create]);

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

  const headerContent = showHeader ? (
    <View style={styles.formHeader}>
      <View style={styles.formHeaderTexts}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.roles?.create || 'Crear Rol'}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          Completa los datos para registrar un nuevo rol
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
      <Card variant="flat" style={styles.formCard}>
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            Código
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
              placeholder="Código (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={formData.code}
              onChangeText={(value) => {
                // Convertir a mayúsculas y reemplazar espacios por guiones bajos
                const processedValue = value.toUpperCase().replace(/\s+/g, '_');
                handleChange('code', processedValue);
              }}
              autoCapitalize="characters"
            />
          </InputWithFocus>
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

        {companies.length > 0 && (
          <View style={styles.inputGroup}>
            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              Empresa
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
                  {companies.map((company) => {
                    const isSelected = formData.companyId === company.id;
                    return (
                      <TouchableOpacity
                        key={company.id}
                        style={[
                          styles.selectOption,
                          isSelected && { backgroundColor: colors.primary },
                          { borderColor: colors.border },
                        ]}
                        onPress={() => handleChange('companyId', company.id)}
                      >
                        <ThemedText
                          type="body2"
                          style={{ color: isSelected ? '#FFFFFF' : colors.text }}
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
        )}

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
              Rol del sistema
            </ThemedText>
            <ThemedText type="caption" variant="secondary" style={styles.helpText}>
              Los roles del sistema no se pueden eliminar
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

