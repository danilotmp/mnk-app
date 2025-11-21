/**
 * Página principal de administración de Permisos
 * Lista de permisos con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { SideModal } from '@/components/ui/side-modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { PermissionsService, RolesService, useCompanyOptions } from '@/src/domains/security';
import type { PermissionChange } from '@/src/domains/security/components';
import { PermissionCreateForm, PermissionEditForm, PermissionsFlowFilters, PermissionsManagementFlow } from '@/src/domains/security/components';
import { PermissionFilters, RoleFilters, SecurityPermission, SecurityRole } from '@/src/domains/security/types';
import type { TableColumn } from '@/src/domains/shared/components/data-table/data-table.types';
import { FilterConfig } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar.types';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { MenuItem } from '@/src/infrastructure/menu/types';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createPermissionsListStyles } from '@/src/styles/pages/permissions-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

export default function PermissionsListPage() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createPermissionsListStyles(isMobile);
  
  // Color para iconos de acción: primaryDark en dark theme, primary en light theme
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const [permissions, setPermissions] = useState<SecurityPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<SecurityPermission[]>([]); // Permisos del rol seleccionado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [formActions, setFormActions] = useState<{ isLoading: boolean; handleSubmit: () => void; handleCancel: () => void } | null>(null);
  const [localFilter, setLocalFilter] = useState(''); // Filtro local para la tabla
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<PermissionFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined, // Filtro de estado: -1, 0, 1, 2, 3
    module: undefined,
    action: undefined,
  });
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);
  const filtersSignatureRef = useRef<string>('');
  
  // Estado para rastrear cambios masivos de permisos
  const [permissionChanges, setPermissionChanges] = useState<PermissionChange[]>([]);
  const [savingChanges, setSavingChanges] = useState(false);
  
  // Estados para los selectores dependientes
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // Estados para filtros locales
  const [searchValue, setSearchValue] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [showDefaultOptions, setShowDefaultOptions] = useState(true); // Por defecto mostrar opciones por defecto
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Obtener empresas
  const { companies, loading: companiesLoading } = useCompanyOptions();

  const loadPermissions = useCallback(async (currentFilters: PermissionFilters) => {
    // Prevenir llamadas simultáneas
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await PermissionsService.getPermissions(currentFilters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setPermissions(Array.isArray(response.data) ? response.data : []);
        
        // Usar meta de la respuesta del backend
        if (response.meta) {
          setPagination({
            page: response.meta.page || currentFilters.page || 1,
            limit: response.meta.limit || currentFilters.limit || 10,
            total: response.meta.total || 0,
            totalPages: response.meta.totalPages || 0,
            hasNext: response.meta.hasNext || false,
            hasPrev: response.meta.hasPrev || false,
          });
        } else {
          setPagination({
            page: currentFilters.page || 1,
            limit: currentFilters.limit || 10,
            total: Array.isArray(response.data) ? response.data.length : 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          });
        }
      } else {
        setPermissions([]);
        setPagination({
          page: currentFilters.page || 1,
          limit: currentFilters.limit || 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        });
      }
      
      setHasError(false);
    } catch (error: any) {
      if (handleApiError(error)) {
        setHasError(true);
        return;
      }
      const errorMessage = error.message || t.security?.permissions?.loadError || 'Error al cargar permisos';
      setHasError(true);
      // Mostrar error con detalles
      alert.showError(errorMessage, error.details || error.response?.result?.details);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [alert, handleApiError, t]);

  /**
   * Efecto para cargar permisos cuando cambian los filtros
   * Solo se ejecuta cuando los filtros cambian, evitando llamadas infinitas
   */
  useEffect(() => {
    if (!isScreenFocused || !hasAccess || accessLoading || hasError) {
      return;
    }

    const signature = JSON.stringify(filters);
    if (filtersSignatureRef.current === signature) {
      return;
    }

    filtersSignatureRef.current = signature;
    loadPermissions(filters);
  }, [accessLoading, hasAccess, hasError, isScreenFocused, loadPermissions, filters]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  /**
   * Manejar cambio de filtro local (sin API, solo filtra en la tabla)
   */
  const handleLocalFilterChange = useCallback((value: string) => {
    setLocalFilter(value);
    setHasError(false);
  }, []);

  /**
   * Manejar búsqueda API (consulta al backend)
   */
  const handleSearchSubmit = (search: string) => {
    setHasError(false);
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  /**
   * Manejar cambio de filtros avanzados (consulta API)
   */
  const handleAdvancedFilterChange = (key: string, value: any) => {
    setHasError(false);
    // Convertir status de string a number si es necesario
    const processedValue = key === 'status' && value !== '' ? parseInt(value, 10) : value;
    setFilters((prev) => ({ ...prev, [key]: value === '' ? undefined : processedValue, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      status: undefined,
      module: undefined,
      action: undefined,
    });
    setLocalFilter(''); // Limpiar también el filtro local
    setHasError(false);
  };

  /**
   * Filtrar permisos localmente según el filtro local
   */
  const filteredPermissions = useMemo(() => {
    if (!localFilter.trim()) {
      return permissions;
    }
    
    const filterLower = localFilter.toLowerCase().trim();
    return permissions.filter((permission) => {
      const name = (permission.name || '').toLowerCase();
      const code = (permission.code || '').toLowerCase();
      const module = (permission.module || '').toLowerCase();
      const action = (permission.action || '').toLowerCase();
      
      return (
        name.includes(filterLower) ||
        code.includes(filterLower) ||
        module.includes(filterLower) ||
        action.includes(filterLower)
      );
    });
  }, [permissions, localFilter]);

  const handleCreatePermission = () => {
    setFormActions(null);
    setSelectedPermissionId(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  /**
   * Navegar a editar permiso
   * En web: abre modal lateral (1/3 del ancho)
   * En móvil: abre modal lateral (100% del ancho)
   */
  const handleEditPermission = (permission: SecurityPermission) => {
    setFormActions(null);
    setSelectedPermissionId(permission.id);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedPermissionId(null);
    setFormActions(null);
  };

  const handleFormSuccess = () => {
    filtersSignatureRef.current = JSON.stringify(filters);
    loadPermissions(filters);
    handleCloseModal();
  };

  const handleDeletePermission = async (permission: SecurityPermission) => {
    try {
      await PermissionsService.deletePermission(permission.id);
      await loadPermissions(filters);
      alert.showSuccess(t.security?.permissions?.delete || 'Permiso eliminado');
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      alert.showError(error.message || 'Error al eliminar permiso');
    }
  };

  /**
   * Guardar cambios masivos de permisos
   */
  const handleSaveChanges = async () => {
    if (permissionChanges.length === 0) {
      return;
    }

    try {
      setSavingChanges(true);
      await PermissionsService.updatePermissionsBulk(permissionChanges);
      await loadPermissions(filters);
      setPermissionChanges([]);
      alert.showSuccess(t.security?.permissions?.saveSuccess || 'Permisos actualizados correctamente');
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      alert.showError(error.message || 'Error al guardar permisos');
    } finally {
      setSavingChanges(false);
    }
  };

  /**
   * Cargar roles por empresa
   */
  const loadRolesByCompany = useCallback(async (companyId: string | undefined) => {
    if (!companyId) {
      setRoles([]);
      setSelectedRoleId(undefined);
      return;
    }

    try {
      setLoadingRoles(true);
      const roleFilters: RoleFilters = {
        page: 1,
        limit: 100, // Obtener todos los roles de la empresa
      };
      const response = await RolesService.getRoles(roleFilters);
      
      // Filtrar roles por companyId (ya que RoleFilters no tiene companyId)
      const companyRoles = (response.data || []).filter(role => role.companyId === companyId);
      setRoles(companyRoles);
      
      // Si había un rol seleccionado que ya no existe, limpiarlo
      if (selectedRoleId && !companyRoles.find(r => r.id === selectedRoleId)) {
        setSelectedRoleId(undefined);
      }
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      console.error('Error al cargar roles:', error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRoleId, handleApiError]);

  /**
   * Manejar cambio de empresa
   */
  const handleCompanyChange = (companyId: string | undefined) => {
    setSelectedCompanyId(companyId);
    setSelectedRoleId(undefined); // Limpiar rol seleccionado cuando cambia la empresa
    setPermissionChanges([]); // Limpiar cambios pendientes
    loadRolesByCompany(companyId);
  };

  /**
   * Manejar cambio de rol
   */
  const handleRoleChange = async (roleId: string | undefined) => {
    setSelectedRoleId(roleId);
    setPermissionChanges([]); // Limpiar cambios pendientes al cambiar de rol
    
    // Cargar permisos del rol seleccionado
    if (roleId) {
      try {
        setLoadingRolePermissions(true);
        const role = await RolesService.getRoleById(roleId);
        setRolePermissions(role.permissions || []);
      } catch (error: any) {
        if (handleApiError(error)) {
          return;
        }
        console.error('Error al cargar permisos del rol:', error);
        setRolePermissions([]);
      } finally {
        setLoadingRolePermissions(false);
      }
    } else {
      setRolePermissions([]);
    }
  };

  // Cargar roles cuando cambia la empresa seleccionada
  useEffect(() => {
    loadRolesByCompany(selectedCompanyId);
  }, [selectedCompanyId, loadRolesByCompany]);

  const columns: TableColumn<SecurityPermission>[] = [
    {
      key: 'name',
      label: t.security?.permissions?.name || 'Nombre',
      width: '23%',
    },
    {
      key: 'code',
      label: t.security?.permissions?.code || 'Código',
      width: '18%',
    },
    {
      key: 'module',
      label: t.security?.permissions?.module || 'Módulo',
      width: '13%',
    },
    {
      key: 'action',
      label: t.security?.permissions?.action || 'Acción',
      width: '13%',
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '15%',
      align: 'center',
      render: (permission) => (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: permission.status === 1
                ? colors.success + '20'
                : colors.error + '20',
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: permission.status === 1 ? colors.success : colors.error,
            }}
          >
            {permission.status === 1
              ? t.security?.users?.active || 'Activo'
              : t.security?.users?.inactive || 'Inactivo'}
          </ThemedText>
        </View>
      ),
    },
    {
      key: 'actions',
      label: t.common?.actions || 'Acciones',
      width: '18%',
      align: 'center',
      render: (permission) => (
        <View style={styles.actionsContainer}>
          <Tooltip text={t.security?.permissions?.editShort || 'Editar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditPermission(permission)}
            >
              <Ionicons name="pencil" size={18} color={actionIconColor} />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip text={t.security?.permissions?.deleteShort || 'Eliminar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePermission(permission)}
            >
              <Ionicons name="trash" size={18} color={actionIconColor} />
            </TouchableOpacity>
          </Tooltip>
        </View>
      ),
    },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      type: 'select',
      options: [
        { value: '', label: t.common?.all || 'Todos' },
        { value: '1', label: t.security?.users?.active || 'Activo' },
        { value: '0', label: t.security?.users?.inactive || 'Inactivo' },
        { value: '2', label: 'Pendiente' },
        { value: '3', label: 'Suspendido' },
        { value: '-1', label: 'Eliminado' },
      ],
    },
    {
      key: 'module',
      label: t.security?.permissions?.module || 'Módulo',
      type: 'text',
      placeholder: 'Filtrar por módulo...',
    },
    {
      key: 'action',
      label: t.security?.permissions?.action || 'Acción',
      type: 'text',
      placeholder: 'Filtrar por acción...',
    },
  ];

  if (accessLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 12 }}>{t.common?.loading || 'Cargando...'}</ThemedText>
      </ThemedView>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <ThemedText type="h3" style={styles.title}>
              {t.security?.permissions?.title || 'Administración de Permisos'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.permissions?.subtitle || 'Gestiona los permisos del sistema'}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? '' : (t.security?.permissions?.create || 'Crear Permiso')}
            onPress={handleCreatePermission}
            variant="primary"
            size="md"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={!isMobile ? { marginRight: 8 } : undefined} />
          </Button>
        </View>

        {/* Selectores dependientes: Empresa y Rol */}
        <View style={[styles.selectorsContainer, { gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <Select
              label="Empresa"
              placeholder="Selecciona una empresa"
              value={selectedCompanyId}
              options={companies.map(comp => ({ value: comp.id, label: comp.name }))}
              onSelect={(value) => handleCompanyChange(value as string)}
              searchable={companies.length > 5}
              required
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Select
              label="Rol"
              placeholder="Selecciona un rol"
              value={selectedRoleId}
              options={roles.map(role => ({ value: role.id, label: role.name }))}
              onSelect={(value) => handleRoleChange(value as string)}
              searchable={roles.length > 5}
              disabled={!selectedCompanyId || loadingRoles}
              required
            />
          </View>
        </View>

        {/* Filtros locales para PermissionsManagementFlow - Solo mostrar si hay un rol seleccionado */}
        {selectedRoleId && menuItems.length > 0 && (
          <PermissionsFlowFilters
            menuItems={menuItems}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            selectedModule={selectedModule}
            onModuleChange={setSelectedModule}
            selectedAction={selectedAction}
            onActionChange={setSelectedAction}
            showDefaultOptions={showDefaultOptions}
            onShowDefaultOptionsChange={setShowDefaultOptions}
            onClearFilters={() => {
              setSearchValue('');
              setSelectedModule('');
              setSelectedAction('');
              setShowDefaultOptions(true); // Restaurar a mostrar por defecto
            }}
          />
        )}

        {/* Componente de administración masiva de permisos - Solo mostrar si hay un rol seleccionado */}
        {selectedRoleId ? (
          <View style={styles.dataTableContainer}>
            {loadingRolePermissions ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText type="body2" variant="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
                  Cargando permisos del rol...
                </ThemedText>
              </View>
            ) : (
              <PermissionsManagementFlow
                permissions={rolePermissions}
                roleId={selectedRoleId}
                searchValue={searchValue}
                selectedModule={selectedModule}
                selectedAction={selectedAction}
                showDefaultOptions={showDefaultOptions}
                onChanges={(changes) => {
                  setPermissionChanges(changes);
                }}
                onMenuItemsLoaded={(items) => {
                  setMenuItems(items);
                }}
              />
            )}
          </View>
        ) : (
          <View style={[styles.dataTableContainer, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
            <ThemedText type="body1" variant="secondary" style={{ textAlign: 'center' }}>
              {!selectedCompanyId 
                ? 'Selecciona una empresa para comenzar'
                : 'Selecciona un rol para ver y gestionar sus permisos'}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Botón Guardar - solo aparece cuando hay cambios, fuera del content para que quede fijo abajo */}
      {permissionChanges.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button
            title={t.common?.save || 'Guardar'}
            onPress={handleSaveChanges}
            variant="primary"
            size="md"
            disabled={savingChanges}
          >
            {savingChanges && (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
          </Button>
        </View>
      )}

      {/* Modal de creación/edición */}
      {modalMode && (
          <SideModal
            visible={isModalVisible}
            onClose={handleCloseModal}
            title={
              modalMode === 'edit'
                ? t.security?.permissions?.edit || 'Editar Permiso'
                : t.security?.permissions?.create || 'Crear Permiso'
            }
            subtitle={
              modalMode === 'edit'
                ? 'Modifica los datos del permiso'
                : 'Completa los datos del nuevo permiso'
            }
            footer={
              formActions ? (
                <>
                  <Button
                    title={t.common.cancel}
                    onPress={formActions.handleCancel}
                    variant="outlined"
                    size="md"
                    disabled={formActions.isLoading}
                  />
                  <Button
                    title={
                      modalMode === 'edit'
                        ? t.common.save
                        : t.security?.permissions?.create || 'Crear Permiso'
                    }
                    onPress={formActions.handleSubmit}
                    variant="primary"
                    size="md"
                    disabled={formActions.isLoading}
                  />
                </>
              ) : null
            }
          >
            {modalMode === 'edit' && selectedPermissionId ? (
              <PermissionEditForm
                permissionId={selectedPermissionId}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseModal}
                showHeader={false}
                showFooter={false}
                onFormReady={setFormActions}
              />
            ) : null}
            {modalMode === 'create' ? (
              <PermissionCreateForm
                onSuccess={handleFormSuccess}
                onCancel={handleCloseModal}
                showHeader={false}
                showFooter={false}
                onFormReady={setFormActions}
              />
            ) : null}
          </SideModal>
        )}
    </ThemedView>
  );
}

