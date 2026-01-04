/**
 * Componente reutilizable para formulario de usuario (editar)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Select } from '@/components/ui/select';
import { useTheme } from '@/hooks/use-theme';
import { useBranchOptions, useCompanyOptions } from '@/src/domains/security/hooks';
import { PasswordInput } from '@/src/domains/shared/components';
import { CustomSwitch } from '@/src/domains/shared/components/custom-switch/custom-switch';
import { BranchesService } from '@/src/features/security/branches';
import { RolesService } from '@/src/features/security/roles';
import { apiClient } from '@/src/infrastructure/api/api.client';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { extractErrorInfo } from '@/src/infrastructure/messages/error-utils';
import { Ionicons } from '@expo/vector-icons';
import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { UsersService } from '../../services';
import { UserUpdatePayload } from '../../types/domain';
import { CompanyConfigCarousel } from '../company-config-carousel/company-config-carousel';
import { createUserFormStyles } from '../user-create-form/user-create-form.styles';
import { UserEditFormProps, UserFormData } from './user-edit-form.types';

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
    companyId: '', // Mantener para compatibilidad
    branchIds: [] as string[], // Mantener para compatibilidad
    companyBranches: {} as Record<string, string[]>, // Nueva estructura: { [companyId]: [branchIds] }
    companyRoles: {} as Record<string, string[]>, // Nueva estructura: { [companyId]: [roleIds] }
    roleId: '', // Mantener para compatibilidad
    status: 1, // Default: Activo
  });
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);
  const isInitialLoadRef = useRef(true); // Flag para controlar carga inicial (useRef para evitar re-renders)
  const loadedCompanyIdRef = useRef<string | null>(null); // Guardar el companyId ya cargado
  const phoneRef = useRef<string>(''); // Ref para mantener el teléfono actualizado
  const branchIdsRef = useRef<string[]>([]); // Ref para mantener los branchIds actualizados
  const companyBranchesRef = useRef<Record<string, string[]>>({}); // Ref para mantener companyBranches actualizado
  const companyRolesRef = useRef<Record<string, string[]>>({}); // Ref para mantener companyRoles actualizado
  const roleIdRef = useRef<string>(''); // Ref para mantener el roleId actualizado (compatibilidad)
  const statusRef = useRef<number>(1); // Ref para mantener el status actualizado
  const formDataRef = useRef(formData); // Ref para mantener el formData actualizado y evitar stale closure
  const selectedCompanyIdsRef = useRef<string[]>([]); // Ref para mantener selectedCompanyIds actualizado
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]); // Empresas seleccionadas
  const [branchesByCompany, setBranchesByCompany] = useState<Record<string, any[]>>({}); // Sucursales por empresa
  const [rolesByCompany, setRolesByCompany] = useState<Record<string, any[]>>({}); // Roles por empresa
  
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
        
        // Obtener datos directamente de la API para preservar companies (antes del adapter)
        const response = await apiClient.request<any>({
          endpoint: `/security/users/${userId}`,
          method: 'GET',
        });
        
        if (response.result?.statusCode !== SUCCESS_STATUS_CODE || !response.data) {
          throw new Error(response.result?.description || 'Error al obtener usuario');
        }
        
        // Extraer companies directamente de la respuesta de la API (antes del adapter)
        const apiUserData = response.data;
        
        // Obtener usuario adaptado para campos básicos
        const user = await UsersService.getUserById(userId);
        
        // Extraer empresas del usuario desde companies[]
        let userCompanyIds: string[] = [];
        if (Array.isArray(apiUserData?.companies) && apiUserData.companies.length > 0) {
          userCompanyIds = apiUserData.companies.map((c: any) => c.id).filter((id: any) => id);
        } else if (apiUserData?.companyIdDefault) {
          // Usar companyIdDefault en lugar de companyId
          userCompanyIds = [apiUserData.companyIdDefault];
        } else if (user.companyId) {
          // Fallback para compatibilidad con estructura antigua
          userCompanyIds = [user.companyId];
        }
        
        setSelectedCompanyIds(userCompanyIds);
        selectedCompanyIdsRef.current = userCompanyIds;
        
        // Extraer sucursales agrupadas por empresa
        // El backend ahora devuelve companies[] con branches[] dentro
        const companyBranchesMap: Record<string, string[]> = {};
        let allBranchIds: string[] = [];
        
        // Usar la nueva estructura: companies[].branches[] desde la respuesta de la API
        if (Array.isArray(apiUserData?.companies) && apiUserData.companies.length > 0) {
          apiUserData.companies.forEach((company: any) => {
            const companyId = company.id;
            if (companyId && Array.isArray(company.branches) && company.branches.length > 0) {
              const branchIds = company.branches.map((branch: any) => branch.id).filter((id: any) => id);
              companyBranchesMap[companyId] = branchIds;
              allBranchIds.push(...branchIds);
            }
          });
        } else if (Array.isArray((user as any).branches) && (user as any).branches.length > 0) {
          // Compatibilidad con estructura antigua: branches (fallback)
          (user as any).branches.forEach((branchAccess: any) => {
            const branchId = branchAccess.branchId || branchAccess.branch?.id || branchAccess.id;
            const branchCompanyId = branchAccess.branch?.companyId || (userCompanyIds.length > 0 ? userCompanyIds[0] : null);
            
            if (branchId && branchCompanyId) {
              if (!companyBranchesMap[branchCompanyId]) {
                companyBranchesMap[branchCompanyId] = [];
              }
              companyBranchesMap[branchCompanyId].push(branchId);
              allBranchIds.push(branchId);
            }
          });
        } else if (Array.isArray(user.branchIds) && user.branchIds.length > 0) {
          // Si solo viene branchIds, asignarlos a la primera empresa (fallback)
          allBranchIds = user.branchIds;
          if (userCompanyIds.length > 0) {
            companyBranchesMap[userCompanyIds[0]] = user.branchIds;
          }
        }
        
        // Cargar sucursales para cada empresa
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const branchesMap: Record<string, any[]> = {};
        
        for (const companyId of userCompanyIds) {
          if (uuidRegex.test(companyId)) {
            try {
              const companyBranches = await BranchesService.getBranchesByCompany(companyId);
              branchesMap[companyId] = companyBranches || [];
            } catch (error) {
              console.error(`Error al cargar sucursales para empresa ${companyId}:`, error);
              branchesMap[companyId] = [];
            }
          }
        }
        
        setBranchesByCompany(branchesMap);
        
        // Cargar roles para cada empresa
        const rolesMap: Record<string, any[]> = {};
        for (const companyId of userCompanyIds) {
          if (uuidRegex.test(companyId)) {
            try {
              const rolesResponse = await RolesService.getRoles({
                page: 1,
                limit: 100,
                status: 1, // Solo roles activos
                companyId: companyId, // Filtrar por empresa
              });
              rolesMap[companyId] = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
            } catch (error) {
              console.error(`Error al cargar roles para empresa ${companyId}:`, error);
              rolesMap[companyId] = [];
            }
          }
        }
        setRolesByCompany(rolesMap);
        
        // Guardar el phone en la ref
        phoneRef.current = user.phone || '';
        
        // Guardar branchIds y companyBranches en las refs para evitar stale closure
        branchIdsRef.current = allBranchIds;
        companyBranchesRef.current = companyBranchesMap;
        
        // Extraer roles agrupados por empresa
        // Nueva estructura: companies[].roles[] (similar a branches)
        const companyRolesMap: Record<string, string[]> = {};
        let allRoleIds: string[] = [];
        
        // Usar la nueva estructura: companies[].roles[] desde la respuesta de la API
        if (Array.isArray(apiUserData?.companies) && apiUserData.companies.length > 0) {
          apiUserData.companies.forEach((company: any) => {
            const companyId = company.id;
            if (companyId && Array.isArray(company.roles) && company.roles.length > 0) {
              const roleIds = company.roles.map((role: any) => role.id).filter((id: any) => id);
              companyRolesMap[companyId] = roleIds;
              allRoleIds.push(...roleIds);
            }
          });
        } else if (user.roles && user.roles.length > 0) {
          // Compatibilidad con estructura antigua: roles plano (fallback)
          // Asignar todos los roles a la primera empresa
          const roleIds = user.roles.map((role: any) => role.id || role).filter((id: any) => id);
          allRoleIds = roleIds;
          if (userCompanyIds.length > 0) {
            companyRolesMap[userCompanyIds[0]] = roleIds;
          }
        } else if (user.roleId) {
          // Si solo viene roleId, asignarlo a la primera empresa (fallback)
          allRoleIds = [user.roleId];
          if (userCompanyIds.length > 0) {
            companyRolesMap[userCompanyIds[0]] = [user.roleId];
          }
        }
        
        // Guardar companyRoles en la ref
        companyRolesRef.current = companyRolesMap;
        
        // Mantener roleId para compatibilidad (primer rol de la primera empresa)
        let userRoleId = '';
        if (allRoleIds.length > 0) {
          userRoleId = allRoleIds[0];
        }
        
        // Guardar roleId y status en las refs para evitar stale closure
        roleIdRef.current = userRoleId;
        statusRef.current = user.status ?? 1;
        
        // Luego establecer los datos del formulario
        setFormData({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || '',
          companyId: userCompanyIds[0] || '',
          branchIds: allBranchIds,
          companyBranches: companyBranchesMap,
          companyRoles: companyRolesMap,
          roleId: userRoleId, // Mantener para compatibilidad
          status: user.status ?? 1, // Default: Activo
        });
        
        // Marcar como no inicial inmediatamente DESPUÉS de cargar
        isInitialLoadRef.current = false;
      } catch (error: any) {
        const { message: errorMessage, detail: detailString } = extractErrorInfo(error, 'Error al cargar usuario');
        alert.showError(errorMessage, false, undefined, detailString, error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Sincronizar el ref cuando cambia selectedCompanyIds
  useEffect(() => {
      selectedCompanyIdsRef.current = selectedCompanyIds;
  }, [selectedCompanyIds]);



  /**
   * Validar formulario
   */
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Email no se valida porque no es editable

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

    // Validar que haya al menos una empresa seleccionada
    if (selectedCompanyIdsRef.current.length === 0) {
      newErrors.companyId = 'Selecciona al menos una empresa';
    }

    // Validar que cada empresa tenga al menos una sucursal seleccionada
    const companiesWithoutBranches = selectedCompanyIdsRef.current.filter(companyId => {
      const branchIds = companyBranchesRef.current[companyId] || [];
      return branchIds.length === 0;
    });
    if (companiesWithoutBranches.length > 0) {
      newErrors.branchIds = 'Selecciona al menos una sucursal para cada empresa';
    }

    // Validar que cada empresa tenga al menos un rol seleccionado
    const companiesWithoutRoles = selectedCompanyIdsRef.current.filter(companyId => {
      const roleIds = companyRolesRef.current[companyId] || [];
      return roleIds.length === 0;
    });
    if (companiesWithoutRoles.length > 0) {
      newErrors.roleId = 'Selecciona al menos un rol para cada empresa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, changePassword, password, t.auth]);

  /**
   * Manejar cambio de campo
   */
  const handleChange = useCallback((field: string, value: any) => {
    // Guardar en refs para evitar stale closure
    if (field === 'phone') {
      phoneRef.current = value;
    }
    if (field === 'roleId') {
      roleIdRef.current = value;
    }
    if (field === 'status') {
      statusRef.current = value;
    }
    
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      formDataRef.current = updated;
      return updated;
    });
    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
    // Limpiar error general cuando el usuario empieza a editar
    if (generalError) {
      setGeneralError(null);
    }
  }, [generalError]);

  // Manejar selección de empresas (múltiple)
  const handleCompanySelect = useCallback((selectedIds: string[]) => {
    // Actualizar selectedCompanyIds primero (esto actualiza el Select sin cerrar el modal)
    setSelectedCompanyIds(selectedIds);
    selectedCompanyIdsRef.current = selectedIds;
    
    // Actualizar companyBranches, companyRoles y formData dentro de startTransition para evitar re-renders que cierren el modal
    startTransition(() => {
      setFormData((prev) => {
        const updatedCompanyBranches: Record<string, string[]> = {};
        const updatedCompanyRoles: Record<string, string[]> = {};
        selectedIds.forEach(companyId => {
          updatedCompanyBranches[companyId] = prev.companyBranches?.[companyId] || [];
          updatedCompanyRoles[companyId] = prev.companyRoles?.[companyId] || [];
        });
        
        const updated = {
          ...prev,
          companyBranches: updatedCompanyBranches,
          companyRoles: updatedCompanyRoles,
          companyId: selectedIds[0] || '', // Mantener primera empresa para compatibilidad
        };
        
        companyBranchesRef.current = updatedCompanyBranches;
        companyRolesRef.current = updatedCompanyRoles;
        formDataRef.current = updated;
        
        return updated;
      });
      
      if (errors.companyId) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.companyId;
          return newErrors;
        });
      }
    });
    
    // Cargar sucursales y roles para nuevas empresas seleccionadas
    selectedIds.forEach(async (companyId) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(companyId)) {
        // Cargar sucursales
        if (!branchesByCompany[companyId]) {
          try {
            const companyBranches = await BranchesService.getBranchesByCompany(companyId);
            setBranchesByCompany((prev) => ({
              ...prev,
              [companyId]: companyBranches || [],
            }));
          } catch (error) {
            console.error(`Error al cargar sucursales para empresa ${companyId}:`, error);
          }
        }
        
        // Cargar roles por empresa
        if (!rolesByCompany[companyId]) {
          try {
            // Asegurar que se pase el companyId correcto para cada empresa
            const rolesResponse = await RolesService.getRoles({
              page: 1,
              limit: 100,
              status: 1, // Solo roles activos
              companyId: companyId, // Filtrar por empresa específica
            });
            const rolesData = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
            // Actualizar el estado con los roles específicos de esta empresa
            setRolesByCompany((prev) => {
              const updated = {
                ...prev,
                [companyId]: rolesData,
              };
              return updated;
            });
          } catch (error) {
            console.error(`Error al cargar roles para empresa ${companyId}:`, error);
            setRolesByCompany((prev) => ({
              ...prev,
              [companyId]: [],
            }));
          }
        }
      }
    });
  }, [branchesByCompany, rolesByCompany, errors]);

  // Manejar selección de sucursales para una empresa específica
  const handleBranchSelect = useCallback((companyId: string, selectedBranchIds: string[]) => {
    setFormData((prev) => {
      const updatedCompanyBranches = {
        ...prev.companyBranches || {},
        [companyId]: selectedBranchIds,
      };
      
      // Calcular todos los branchIds para compatibilidad
      const allBranchIds = Object.values(updatedCompanyBranches).flat();
      
      const updated = {
        ...prev,
        companyBranches: updatedCompanyBranches,
        branchIds: allBranchIds, // Mantener para compatibilidad
      };
      
      companyBranchesRef.current = updatedCompanyBranches;
      branchIdsRef.current = allBranchIds;
      formDataRef.current = updated;
      
      return updated;
    });
    
    if (errors.branchIds) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.branchIds;
        return newErrors;
      });
    }
  }, [errors]);

  // Manejar selección de roles para una empresa específica
  const handleRoleSelect = useCallback((companyId: string, selectedRoleIds: string[]) => {
    setFormData((prev) => {
      const updatedCompanyRoles = {
        ...prev.companyRoles || {},
        [companyId]: selectedRoleIds,
      };
      
      // Calcular todos los roleIds para compatibilidad
      const allRoleIds = Object.values(updatedCompanyRoles).flat();
      
      const updated = {
        ...prev,
        companyRoles: updatedCompanyRoles,
        roleId: allRoleIds[0] || '', // Mantener para compatibilidad (primer rol)
      };
      
      companyRolesRef.current = updatedCompanyRoles;
      roleIdRef.current = allRoleIds[0] || '';
      formDataRef.current = updated;
      
      return updated;
    });
    
    // Limpiar error de roles si se seleccionó al menos un rol para esta empresa
    if (selectedRoleIds.length > 0 && errors.roleId) {
      // Verificar si todas las empresas tienen al menos un rol
      const allCompaniesHaveRoles = selectedCompanyIdsRef.current.every(cId => {
        if (cId === companyId) {
          return selectedRoleIds.length > 0;
        }
        const roleIds = companyRolesRef.current[cId] || [];
        return roleIds.length > 0;
      });
      
      if (allCompaniesHaveRoles) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.roleId;
          return newErrors;
        });
      }
    }
  }, [errors]);

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
      // Construir payload con estructura anidada: companies[] con branchIds[] y roleIds[] dentro
      const companies = selectedCompanyIdsRef.current.map(companyId => ({
        id: companyId,
        branchIds: companyBranchesRef.current[companyId] || [], // Array de UUIDs directamente
        roleIds: companyRolesRef.current[companyId] || [], // Array de UUIDs de roles por empresa
      }));
      
      const updateData: UserUpdatePayload = {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: phoneRef.current.trim(),
        companies,
        status: statusRef.current, // Usar status (número) directamente
      };
      
      // Mantener roleId para compatibilidad (primer rol de la primera empresa si existe)
      if (roleIdRef.current && roleIdRef.current.trim()) {
        updateData.roleId = roleIdRef.current.trim();
      }

      if (changePassword && password.trim()) {
        updateData.password = password;
      }

      const updatedUser = await UsersService.updateUserComplete(userId, updateData);
      // Pasar el usuario actualizado al componente padre para optimización
      onSuccess?.(updatedUser);
      onCancel?.();
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(error, 'Error al actualizar usuario');
      
      // Mostrar error solo en InlineAlert dentro del modal (no mostrar Toast en modales)
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, formData, changePassword, password, userId, alert, onSuccess, onCancel]);

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
        generalError,
      });
    }
    // Intencionalmente solo depende de isLoading, loadingUser, loadingOptions y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingUser, loadingOptions, generalError]);

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
                backgroundColor: colors.surfaceVariant || colors.surface,
                borderColor: colors.border,
                opacity: 0.6,
              },
            ]}
            primaryColor={colors.primary}
            error={false}
          >
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textSecondary }]}
              placeholder={t.auth?.email || 'Email'}
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              editable={false}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </InputWithFocus>
        </View>

        {/* Change Password Toggle */}
        <View style={styles.switchGroup}>
          <ThemedText type="body2" style={[styles.switchLabel, { color: colors.text }]}>
            {t.auth?.changePassword || 'Cambiar contraseña'}
          </ThemedText>
          <CustomSwitch
            value={changePassword}
            onValueChange={setChangePassword}
            disabled={isLoading}
          />
        </View>

        {/* Password (solo si changePassword es true) */}
        {changePassword && (
          <View style={styles.inputGroup}>
            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              {t.auth?.password || 'Contraseña'} *
            </ThemedText>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder={t.auth?.password || 'Contraseña'}
              required
              error={!!errors.password}
              errorMessage={errors.password}
              disabled={isLoading}
            />
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
              placeholder={t.security?.users?.firstNamePlaceholder || 'Nombre del usuario'}
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
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.users?.lastNamePlaceholder || 'Apellido del usuario'}
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

        {/* Companies */}
        <View style={styles.inputGroup}>
          <Select
              label="Empresas"
              placeholder="Selecciona una o más empresas"
            value={selectedCompanyIds}
            options={companies.map((comp) => ({
              value: comp.id,
              label: comp.name,
            }))}
            onSelect={(value) => handleCompanySelect(value as string[])}
            error={!!errors.companyId}
            errorMessage={errors.companyId}
            required
            multiple={true}
            disabled={isLoading}
            searchable={true}
          />
        </View>

        {/* Carrusel de configuración por empresa */}
        {selectedCompanyIds.length > 0 && (
          <CompanyConfigCarousel
            selectedCompanyIds={selectedCompanyIds}
            companies={companies}
            branchesByCompany={branchesByCompany}
            rolesByCompany={rolesByCompany}
            companyBranches={formData.companyBranches || {}}
            companyRoles={formData.companyRoles || {}}
            onBranchSelect={handleBranchSelect}
            onRoleSelect={handleRoleSelect}
            branchErrors={errors.branchIds}
            roleErrors={errors.roleId}
            isLoading={isLoading}
            t={t}
          />
        )}

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

