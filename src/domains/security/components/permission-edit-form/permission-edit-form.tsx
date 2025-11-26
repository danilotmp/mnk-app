/**
 * Componente reutilizable para formulario de permiso (editar)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { APP_CONFIG } from '@/src/config/app.config';
import { PermissionsService } from '@/src/domains/security';
import { IconInput } from '@/src/domains/security/components/shared/icon-input/icon-input';
import { MenuItemSelectorModal } from '@/src/domains/security/components/shared/menu-item-selector-modal/menu-item-selector-modal';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import { openBrowserAsync } from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { createPermissionFormStyles } from '../permission-create-form/permission-create-form.styles';
import { PermissionEditFormProps } from './permission-edit-form.types';

export function PermissionEditForm({ permissionId, onSuccess, onCancel, showHeader = true, showFooter = true, onFormReady }: PermissionEditFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = createPermissionFormStyles();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    action: '',
    description: '',
    icon: '',
    status: 1, // Default: Activo
  });
  
  const [menuItemIds, setMenuItemIds] = useState<string[]>([]);
  const [isMenuItemSelectorVisible, setIsMenuItemSelectorVisible] = useState(false);
  
  // Ref para mantener el status actualizado y evitar stale closure
  const statusRef = useRef<number>(1);
  // Ref para mantener menuItemIds actualizado y evitar stale closure
  const menuItemIdsRef = useRef<string[]>([]);
  // Ref para mantener formData actualizado y evitar stale closure
  const formDataRef = useRef(formData);
  
  // Wrapper para setMenuItemIds que también actualiza el ref
  const handleMenuItemIdsChange = useCallback((newMenuItemIds: string[]) => {
    setMenuItemIds(newMenuItemIds);
    menuItemIdsRef.current = newMenuItemIds; // Actualizar ref inmediatamente
  }, []);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPermission, setLoadingPermission] = useState(true);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);

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
        const permissionStatus = permission.status ?? 1;
        statusRef.current = permissionStatus;
        
        const initialFormData = {
          name: permission.name,
          code: permission.code,
          action: permission.action,
          description: permission.description || '',
          icon: permission.icon || '',
          status: permissionStatus,
        };
        setFormData(initialFormData);
        formDataRef.current = initialFormData; // Actualizar ref
        
        // Mapear menuItemIds - el servicio ya debería haber normalizado el campo
        // pero verificamos por si acaso
        const permissionAny = permission as any;
        let menuItemIdsValue: string[] = permission.menuItemIds || [];
        
        // Si no está en menuItemIds, intentar otras variantes
        if (!menuItemIdsValue || menuItemIdsValue.length === 0) {
          if (permissionAny.MenuItemIds) {
            menuItemIdsValue = permissionAny.MenuItemIds;
          } else if (permissionAny.menuItems) {
            // Si viene como array de objetos, extraer los IDs
            menuItemIdsValue = Array.isArray(permissionAny.menuItems) 
              ? permissionAny.menuItems.map((item: any) => item.id || item)
              : [];
          }
        }
        
        // Asegurar que sea un array válido
        if (!Array.isArray(menuItemIdsValue)) {
          menuItemIdsValue = [];
        }
        
        // Filtrar valores nulos, undefined o strings vacíos
        menuItemIdsValue = menuItemIdsValue.filter((id: any) => 
          id != null && id !== '' && typeof id === 'string' && id.trim().length > 0
        );
        
        handleMenuItemIdsChange(menuItemIdsValue);
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

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
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
  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      formDataRef.current = updated; // Actualizar ref inmediatamente
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    
    // Actualizar ref para status
    if (field === 'status') {
      statusRef.current = value;
    }
  }, [errors]);

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
      // Asegurar que menuItems sea un array limpio
      const currentMenuItemIds = Array.isArray(menuItemIdsRef.current) 
        ? [...menuItemIdsRef.current] // Crear una copia del array
        : [];
      
      // Usar valores del ref para asegurar que son los más recientes
      const currentFormData = formDataRef.current;
      
      const payload: {
        name: string;
        code: string;
        action: string;
        description?: string;
        icon?: string;
        status: number;
        menuItems: string[];
      } = {
        name: (currentFormData.name || '').trim(),
        code: (currentFormData.code || '').trim(),
        action: (currentFormData.action || '').trim(),
        description: (currentFormData.description || '').trim() || undefined,
        icon: (currentFormData.icon || '').trim() || undefined,
        status: statusRef.current, // Usar ref para evitar stale closure
        menuItems: currentMenuItemIds, // Siempre incluir menuItems (el backend espera este campo)
      };

      await PermissionsService.updatePermission(permissionId, payload);

      alert.showSuccess(t.security?.permissions?.edit || 'Permiso actualizado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      const backendResult = error?.result || error?.response?.data || error;
      const rawDetails = backendResult?.details ?? error?.details;
      const detailString =
        typeof rawDetails === 'string'
          ? rawDetails
          : rawDetails?.message
          ? String(rawDetails.message)
          : undefined;

      const errorMessage =
        backendResult?.description || error?.message || 'Error al actualizar permiso';

      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message: errorMessage, detail: detailString });
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

  // El ref se actualiza directamente en handleMenuItemIdsChange y handleChange, pero mantenemos estos useEffect como respaldo
  useEffect(() => {
    menuItemIdsRef.current = menuItemIds;
  }, [menuItemIds]);
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  /**
   * Exponer funciones del formulario cuando está listo (para footer externo)
   */
  useEffect(() => {
    if (onFormReady && !loadingPermission) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isLoading, loadingPermission y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingPermission, generalError]);

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
              placeholder={t.security?.permissions?.code || 'Código'}
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

        {/* Icon */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.permissions?.icon || 'Icono'}
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <IconInput
                value={formData.icon}
                onChange={(value) => handleChange('icon', value)}
                placeholder={t.security?.permissions?.iconPlaceholder || 'Nombre del icono (ej: payment, home-outline)'}
                disabled={isLoading}
                error={!!errors.icon}
              />
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 48,
              }}
              onPress={async () => {
                try {
                  const iconsUrl = APP_CONFIG.EXTERNAL_URLS.ICONS_DOCUMENTATION;
                  
                  // En web, abrir en una nueva pestaña
                  if (Platform.OS === 'web') {
                    window.open(iconsUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    // En móviles, usar el navegador in-app
                    await openBrowserAsync(iconsUrl);
                  }
                } catch (error) {
                  // Error al abrir URL de iconos - se maneja con setGeneralError
                  setGeneralError({ message: 'No se pudo abrir la página de iconos' });
                }
              }}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items Selector */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            {t.security?.permissions?.menuItems || 'Items del Menú'}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
            onPress={() => {
              if (!isLoading && !loadingPermission) {
                setIsMenuItemSelectorVisible(true);
              }
            }}
            activeOpacity={0.7}
            disabled={isLoading || loadingPermission}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
              <Ionicons name="menu" size={20} color={colors.textSecondary} />
              <ThemedText type="body2" style={{ color: menuItemIds.length > 0 ? colors.text : colors.textSecondary }}>
                {menuItemIds.length > 0 
                  ? `${menuItemIds.length} ${menuItemIds.length === 1 ? 'item seleccionado' : 'items seleccionados'}`
                  : t.security?.permissions?.selectMenuItems || 'Seleccionar items del menú'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
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
    return (
      <>
        {formContent}
        {/* Modal de selección de items del menú */}
        <MenuItemSelectorModal
          visible={isMenuItemSelectorVisible}
          onClose={() => setIsMenuItemSelectorVisible(false)}
          selectedMenuItemIds={menuItemIds}
          onSelectionChange={handleMenuItemIdsChange}
        />
      </>
    );
  }

  // Si está en página independiente, usar ScrollView propio
  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {formContent}
      </ScrollView>
      
      {/* Modal de selección de items del menú */}
      <MenuItemSelectorModal
        visible={isMenuItemSelectorVisible}
        onClose={() => setIsMenuItemSelectorVisible(false)}
        selectedMenuItemIds={menuItemIds}
        onSelectionChange={handleMenuItemIdsChange}
      />
    </>
  );
}

